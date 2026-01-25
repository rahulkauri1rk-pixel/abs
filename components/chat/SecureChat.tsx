import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Paperclip, Image as ImageIcon, X, Search, MoreVertical, 
  Phone, Video, Check, CheckCheck, FileText, ArrowLeft, Loader2,
  Lock, MessageSquare, Briefcase, Reply, CornerDownLeft, Maximize2,
  Plus, Users, User, Clock, Tablet
} from 'lucide-react';
import { useSite } from '../../contexts/SiteContext';
import { db, storage } from '../../lib/firebase';
import { 
  collection, query, where, orderBy, onSnapshot, addDoc, 
  updateDoc, doc, serverTimestamp, getDocs, limit, arrayUnion, 
  setDoc, increment, Timestamp, writeBatch
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ChatRoom, ChatMessageData, UserProfile, SurveyRecord } from '../../types';

interface SecureChatProps {
  initialCaseId?: string; // If provided, opens/creates chat for this case
  onClose?: () => void; // If provided, shows as modal with close button
}

interface UserStatus {
    isOnline: boolean;
    lastSeen: any;
    text: string;
}

const SecureChat: React.FC<SecureChatProps> = ({ initialCaseId, onClose }) => {
  const { user, userRole } = useSite();
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [inputText, setInputText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [replyTo, setReplyTo] = useState<ChatMessageData | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  // New Chat & Search State
  const [isNewChatMode, setIsNewChatMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [availableUsers, setAvailableUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  // Manual Room Creation State
  const [showCreateCase, setShowCreateCase] = useState(false);
  const [newCaseId, setNewCaseId] = useState('');

  // Survey Attachment State
  const [isSurveyPickerOpen, setIsSurveyPickerOpen] = useState(false);
  const [recentSurveys, setRecentSurveys] = useState<SurveyRecord[]>([]);

  // Partner status
  const [partnerStatus, setPartnerStatus] = useState<UserStatus | null>(null);
  
  // Mobile View State: 'list' | 'chat'
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Helper: Resolve robust sender name
  const getSenderName = () => {
    if (user?.displayName && user.displayName !== 'User' && user.displayName !== 'guest') return user.displayName;
    if (['admin', 'super_admin'].includes(userRole || '')) return 'Administrator';
    return user?.email?.split('@')[0] || 'User';
  };

  const createCaseRoom = async (caseId: string) => {
      if (!user) return;
      try {
          // Check if it already exists
          // Note: This check relies on the client knowing about the room. 
          // For a robust check, we should query the DB, but since we subscribe to 'rooms', we can check local state or do a quick query.
          // Since our subscription handles "where participants contains user", if the room exists but we aren't in it, we won't see it.
          // For Case Rooms, we usually want to search globally if we are admin, or creating a new one.
          
          const q = query(collection(db, 'chatRooms'), where('caseId', '==', caseId), limit(1));
          const snap = await getDocs(q);

          if (!snap.empty) {
              const room = snap.docs[0];
              const roomData = room.data();
              // Ensure we are a participant
              if (!roomData.participants.includes(user.uid)) {
                  await updateDoc(doc(db, 'chatRooms', room.id), {
                      participants: arrayUnion(user.uid),
                      [`participantNames.${user.uid}`]: getSenderName()
                  });
              }
              setActiveRoomId(room.id);
              setMobileView('chat');
          } else {
              // Create new case room
              const roomRef = await addDoc(collection(db, 'chatRooms'), {
                  type: 'case',
                  caseId: caseId,
                  caseName: `Case #${caseId}`,
                  participants: [user.uid],
                  participantNames: { [user.uid]: getSenderName() },
                  lastMessage: 'Case chat initialized',
                  lastMessageTime: serverTimestamp(),
                  unreadCounts: { [user.uid]: 0 },
                  createdAt: serverTimestamp(),
                  createdBy: user.uid
              });
              setActiveRoomId(roomRef.id);
              setMobileView('chat');
          }
      } catch (err) {
          console.error("Error creating case room", err);
      }
  };

  // --- Room List Sync ---
  useEffect(() => {
    if (!user) return;
    
    // Listen for rooms where user is a participant
    const q = query(
      collection(db, 'chatRooms'),
      where('participants', 'array-contains', user.uid),
      orderBy('lastMessageTime', 'desc')
    );

    const unsub = onSnapshot(q, {
      next: (snapshot) => {
        const roomList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as ChatRoom));

        setRooms(roomList);
        setLoadingRooms(false);

        // Handle Initial Case Link
        if (initialCaseId) {
          const existingRoom = roomList.find(r => r.caseId === initialCaseId);
          if (existingRoom) {
            // Only set if not already set to avoid loop
             setActiveRoomId(prev => {
                 if (prev !== existingRoom.id) {
                     setMobileView('chat');
                     return existingRoom.id;
                 }
                 return prev;
             });
          } else {
              // Only try to create once
              // We rely on the initial call or user action, but here we can try trigger if loaded
              // Ideally createCaseRoom is called once on mount if needed, but since we need to check existence first:
              // We moved createCaseRoom inside component scope to access it here.
              // However, creating inside a listener might cause loops if not careful.
              // Better to trigger this in a separate useEffect that depends on `initialCaseId` and `loadingRooms`
          }
        }
      },
      error: (err) => console.error("Chat rooms sync error", err)
    });

    return () => unsub();
  }, [user]);

  // Handle Initial Case Creation/Selection
  useEffect(() => {
      if (initialCaseId && !loadingRooms) {
          const existingRoom = rooms.find(r => r.caseId === initialCaseId);
          if (existingRoom) {
              setActiveRoomId(existingRoom.id);
              setMobileView('chat');
          } else {
              createCaseRoom(initialCaseId);
          }
      }
  }, [initialCaseId, loadingRooms]);

  // --- Messages Sync ---
  useEffect(() => {
      if (!activeRoomId || !user) return;

      const q = query(
          collection(db, 'chatRooms', activeRoomId, 'messages'),
          orderBy('timestamp', 'asc'),
          limit(100)
      );

      const unsub = onSnapshot(q, {
          next: async (snap) => {
              const msgs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessageData));
              setMessages(msgs);
              
              // Mark as read logic
              // We check the last few messages. If !readBy.includes(user.uid), we update it.
              // Also update unreadCounts in parent room doc.
              const batch = writeBatch(db);
              let needsUpdate = false;

              msgs.forEach(msg => {
                  if (!msg.readBy?.includes(user.uid)) {
                      const msgRef = doc(db, 'chatRooms', activeRoomId, 'messages', msg.id);
                      batch.update(msgRef, { readBy: arrayUnion(user.uid) });
                      needsUpdate = true;
                  }
              });

              if (needsUpdate) {
                  const roomRef = doc(db, 'chatRooms', activeRoomId);
                  batch.update(roomRef, { [`unreadCounts.${user.uid}`]: 0 });
                  await batch.commit();
              }
              
              setTimeout(scrollToBottom, 100);
          },
          error: (err) => console.error("Messages sync error", err)
      });

      return () => unsub();
  }, [activeRoomId, user]);

  const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // --- Partner Status Sync (Direct Chats) ---
  useEffect(() => {
      if (!activeRoomId || !user) return;
      
      const currentRoom = rooms.find(r => r.id === activeRoomId);
      if (!currentRoom || currentRoom.type === 'case') {
          setPartnerStatus(null);
          return;
      }

      // For direct chat, find the other participant
      const otherUid = currentRoom.participants.find(p => p !== user.uid);
      if (!otherUid) return;

      // Listen to their permission doc for status
      // We assume user_permissions doc ID is email, but here we have UID. 
      // We need to query by UID since we don't have their email handy in the room data usually.
      // Alternatively, update user_permissions to use UID as doc ID or have a UID field we can query.
      // Based on previous code: `doc(db, 'user_permissions', email)`
      // We'll try to find the doc with this UID.
      
      const q = query(collection(db, 'user_permissions'), where('uid', '==', otherUid), limit(1));
      const unsub = onSnapshot(q, {
          next: (snap) => {
              if (!snap.empty) {
                  const data = snap.docs[0].data();
                  const isOnline = data.isOnline;
                  const lastSeen = data.lastSeen;
                  let text = 'Offline';
                  if (isOnline) text = 'Online';
                  else if (lastSeen) {
                      // format last seen
                      text = `Last seen ${lastSeen.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
                  }
                  setPartnerStatus({ isOnline, lastSeen, text });
              }
          }
      });

      return () => unsub();
  }, [activeRoomId, user, rooms]);

  // --- Fetch Users for New Chat ---
  useEffect(() => {
    if (isNewChatMode && availableUsers.length === 0) {
        setLoadingUsers(true);
        const fetchUsers = async () => {
            try {
                const q = query(collection(db, 'user_permissions'), limit(100));
                const snap = await getDocs(q);
                
                const users = snap.docs
                    .map(d => {
                        const data = d.data() as UserProfile;
                        let displayName = data.displayName;
                        if (!displayName || displayName.trim() === '' || displayName === 'User') {
                             if (['admin', 'super_admin'].includes(data.role)) {
                                 displayName = 'Administrator';
                             } else {
                                 displayName = data.email?.split('@')[0] || 'User';
                             }
                        }
                        return { ...data, displayName };
                    })
                    .filter(u => u.uid !== user?.uid); // Exclude self
                
                users.sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''));
                setAvailableUsers(users);
            } catch (err) {
                console.error("Error fetching users:", err);
            } finally {
                setLoadingUsers(false);
            }
        };
        fetchUsers();
    }
  }, [isNewChatMode, availableUsers.length, user]);

  // --- Load Surveys for Picker ---
  const loadSurveys = async () => {
    if (!user) return;
    try {
        let q;
        if (['admin', 'super_admin'].includes(userRole || '')) {
             q = query(collection(db, 'surveys'), orderBy('createdAt', 'desc'), limit(20));
        } else {
             q = query(collection(db, 'surveys'), where('employeeId', '==', user.uid), limit(20));
        }
        const snap = await getDocs(q);
        const list = snap.docs.map(d => ({id: d.id, ...d.data()} as SurveyRecord));
        list.sort((a,b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
        setRecentSurveys(list);
    } catch (err) {
        console.error("Error loading surveys", err);
    }
  };

  useEffect(() => {
      if (isSurveyPickerOpen && recentSurveys.length === 0) {
          loadSurveys();
      }
  }, [isSurveyPickerOpen]);

  const handleSendMessage = async () => {
      if ((!inputText.trim() && !previewImage) || !activeRoomId || !user) return;

      const textToSend = inputText.trim();
      const imageToSend = previewImage; // In real app, this would be a URL after upload
      
      // Clear input immediately
      setInputText('');
      setPreviewImage(null);
      setReplyTo(null);

      try {
          // If there is a preview image that is dataUrl (not http), we need to upload it first
          let mediaUrl = undefined;
          let type: ChatMessageData['type'] = 'text';

          if (imageToSend && imageToSend.startsWith('data:')) {
              // Upload base64
              const response = await fetch(imageToSend);
              const blob = await response.blob();
              const storageRef = ref(storage, `chat-media/${activeRoomId}/${Date.now()}`);
              const snap = await uploadBytes(storageRef, blob);
              mediaUrl = await getDownloadURL(snap.ref);
              type = 'image';
          }

          const messageData: Partial<ChatMessageData> = {
              senderId: user.uid,
              senderName: getSenderName(),
              text: textToSend,
              type,
              mediaUrl,
              timestamp: serverTimestamp(),
              readBy: [user.uid],
              replyTo: replyTo ? {
                  id: replyTo.id,
                  senderName: replyTo.senderName,
                  text: replyTo.text || 'Attachment'
              } : undefined
          };

          // Add to subcollection
          await addDoc(collection(db, 'chatRooms', activeRoomId, 'messages'), messageData);

          // Update Room Metadata
          // Increment unread counts for all OTHER participants
          const currentRoom = rooms.find(r => r.id === activeRoomId);
          const updateData: any = {
              lastMessage: type === 'image' ? '📷 Image' : textToSend,
              lastMessageTime: serverTimestamp()
          };
          
          if (currentRoom) {
              const unreadUpdates: Record<string, any> = {};
              currentRoom.participants.forEach(uid => {
                  if (uid !== user.uid) {
                      unreadUpdates[`unreadCounts.${uid}`] = increment(1);
                  }
              });
              // Merge unread updates
              Object.assign(updateData, unreadUpdates);
          }

          await updateDoc(doc(db, 'chatRooms', activeRoomId), updateData);

      } catch (err) {
          console.error("Failed to send message", err);
          alert("Failed to send message.");
      }
  };

  const startDirectChat = async (otherUser: UserProfile) => {
      if (!user) return;
      
      // Check for existing direct chat
      const existing = rooms.find(r => 
          r.type === 'direct' && 
          r.participants.includes(user.uid) && 
          r.participants.includes(otherUser.uid) &&
          r.participants.length === 2
      );

      if (existing) {
          setActiveRoomId(existing.id);
          setMobileView('chat');
          setIsNewChatMode(false);
          return;
      }

      // Create new
      try {
          const roomRef = await addDoc(collection(db, 'chatRooms'), {
              type: 'direct',
              participants: [user.uid, otherUser.uid],
              participantNames: { 
                  [user.uid]: getSenderName(),
                  [otherUser.uid]: otherUser.displayName || 'User'
              },
              lastMessage: 'Chat started',
              lastMessageTime: serverTimestamp(),
              unreadCounts: { [user.uid]: 0, [otherUser.uid]: 0 },
              createdAt: serverTimestamp(),
              createdBy: user.uid
          });
          setActiveRoomId(roomRef.id);
          setMobileView('chat');
          setIsNewChatMode(false);
      } catch (err) {
          console.error("Error creating direct chat", err);
      }
  };

  const sendSurveyCard = async (survey: SurveyRecord) => {
      if (!activeRoomId || !user) return;
      
      try {
          const messageData: Partial<ChatMessageData> = {
            senderId: user.uid,
            senderName: getSenderName(),
            type: 'survey',
            surveyId: survey.id,
            surveyCaseId: survey.caseId,
            text: `Shared Survey: ${survey.caseId} (${survey.bankName})`,
            timestamp: serverTimestamp(),
            readBy: [user.uid]
          };

          await addDoc(collection(db, 'chatRooms', activeRoomId, 'messages'), messageData);
          
          await updateDoc(doc(db, 'chatRooms', activeRoomId), {
              lastMessage: `📊 Shared Survey: ${survey.caseId}`,
              lastMessageTime: serverTimestamp()
          });

          setIsSurveyPickerOpen(false);
      } catch (err) {
          console.error("Error sharing survey", err);
      }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setPreviewImage(reader.result as string);
          };
          reader.readAsDataURL(file);
      }
  };

  return (
    <div className={`flex h-full bg-slate-50 overflow-hidden ${onClose ? 'rounded-2xl shadow-2xl' : ''}`}>
      {/* Sidebar / Room List */}
      <div className={`w-full md:w-80 bg-white border-r border-slate-200 flex flex-col ${mobileView === 'chat' ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-slate-100 flex justify-between items-center shrink-0 h-16">
              <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
                  <Lock size={18} className="text-emerald-500" /> Secure Chat
              </h3>
              <div className="flex gap-2">
                  <button onClick={() => setShowCreateCase(true)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 text-slate-600" title="Create Case Room"><Briefcase size={18} /></button>
                  <button onClick={() => setIsNewChatMode(true)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 text-slate-600" title="New Direct Message"><Plus size={18} /></button>
                  {onClose && <button onClick={onClose} className="p-2 bg-slate-100 rounded-full hover:bg-red-50 text-slate-600 hover:text-red-500"><X size={18} /></button>}
              </div>
          </div>
          
          <div className="p-3">
              <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                      placeholder="Search..." 
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-400 transition-colors"
                  />
              </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
              {loadingRooms ? (
                  <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto text-slate-300" /></div>
              ) : rooms.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-sm">No active chats.<br/>Start a new conversation.</div>
              ) : (
                  rooms.map(room => {
                      const isCase = room.type === 'case';
                      const otherName = isCase ? room.caseName : Object.values(room.participantNames).find((n, i) => Object.keys(room.participantNames)[i] !== user?.uid) || 'Unknown';
                      const isActive = room.id === activeRoomId;
                      const unread = room.unreadCounts?.[user?.uid || ''] || 0;

                      return (
                          <div 
                              key={room.id}
                              onClick={() => { setActiveRoomId(room.id); setMobileView('chat'); }}
                              className={`p-4 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors ${isActive ? 'bg-indigo-50/50 border-l-4 border-l-indigo-500' : ''}`}
                          >
                              <div className="flex justify-between items-start mb-1">
                                  <div className="font-bold text-slate-800 text-sm truncate max-w-[180px] flex items-center gap-1.5">
                                      {isCase ? <Briefcase size={14} className="text-orange-500 shrink-0" /> : <User size={14} className="text-blue-500 shrink-0" />}
                                      {otherName}
                                  </div>
                                  <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                                      {room.lastMessageTime?.toDate().toLocaleDateString([], {month:'short', day:'numeric'})}
                                  </span>
                              </div>
                              <div className="flex justify-between items-center">
                                  <p className={`text-xs truncate max-w-[190px] ${unread > 0 ? 'font-bold text-slate-700' : 'text-slate-500'}`}>
                                      {room.lastMessage || 'No messages'}
                                  </p>
                                  {unread > 0 && (
                                      <span className="bg-indigo-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                          {unread}
                                      </span>
                                  )}
                              </div>
                          </div>
                      )
                  })
              )}
          </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col bg-slate-50 ${mobileView === 'list' ? 'hidden md:flex' : 'flex'}`}>
          {activeRoomId ? (
              <>
                  {/* Chat Header */}
                  <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0 shadow-sm">
                      <div className="flex items-center gap-3">
                          <button onClick={() => setMobileView('list')} className="md:hidden p-2 text-slate-500"><ArrowLeft size={20} /></button>
                          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
                              {rooms.find(r => r.id === activeRoomId)?.type === 'case' ? <Briefcase size={20} /> : <User size={20} />}
                          </div>
                          <div>
                              <h3 className="font-bold text-slate-900 leading-tight">
                                  {rooms.find(r => r.id === activeRoomId)?.caseName || 
                                   Object.values(rooms.find(r => r.id === activeRoomId)?.participantNames || {}).find((n, i) => Object.keys(rooms.find(r => r.id === activeRoomId)?.participantNames || {})[i] !== user?.uid)}
                              </h3>
                              {partnerStatus ? (
                                  <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                                      <span className={`w-1.5 h-1.5 rounded-full ${partnerStatus.isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                                      {partnerStatus.text}
                                  </p>
                              ) : (
                                  <p className="text-xs text-slate-400">Secure encrypted channel</p>
                              )}
                          </div>
                      </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[#f8fafc]">
                      {messages.map((msg, idx) => {
                          const isMe = msg.senderId === user?.uid;
                          const showAvatar = idx === 0 || messages[idx-1].senderId !== msg.senderId;
                          
                          return (
                              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}>
                                  <div className={`flex max-w-[85%] md:max-w-[70%] ${isMe ? 'flex-row-reverse' : 'flex-row'} gap-2`}>
                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${isMe ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-600'} ${showAvatar ? 'opacity-100' : 'opacity-0'}`}>
                                          {msg.senderName?.[0]}
                                      </div>
                                      
                                      <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                          {showAvatar && !isMe && <span className="text-[10px] text-slate-400 ml-1 mb-1">{msg.senderName}</span>}
                                          
                                          {/* Reply Context */}
                                          {msg.replyTo && (
                                              <div className={`mb-1 px-3 py-2 rounded-lg text-xs border-l-4 ${isMe ? 'bg-indigo-50 border-indigo-300 text-indigo-800' : 'bg-slate-100 border-slate-300 text-slate-600'}`}>
                                                  <div className="font-bold opacity-75">{msg.replyTo.senderName}</div>
                                                  <div className="truncate max-w-[200px]">{msg.replyTo.text}</div>
                                              </div>
                                          )}

                                          <div 
                                              className={`relative px-4 py-3 text-sm shadow-sm ${
                                                  isMe 
                                                  ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-sm' 
                                                  : 'bg-white text-slate-800 border border-slate-100 rounded-2xl rounded-tl-sm'
                                              }`}
                                          >
                                              {/* Content Type Handling */}
                                              {msg.type === 'image' && msg.mediaUrl && (
                                                  <img src={msg.mediaUrl} alt="Attachment" className="rounded-lg max-w-full max-h-[300px] object-cover mb-2 cursor-pointer" onClick={() => window.open(msg.mediaUrl, '_blank')} />
                                              )}

                                              {msg.type === 'survey' && (
                                                  <div className={`p-3 rounded-lg border flex items-center gap-3 mb-1 ${isMe ? 'bg-indigo-700/50 border-indigo-500' : 'bg-slate-50 border-slate-200'}`}>
                                                      <div className="p-2 bg-white rounded-lg text-indigo-600"><Tablet size={20} /></div>
                                                      <div>
                                                          <div className="font-bold">Survey Report</div>
                                                          <div className="text-xs opacity-80">{msg.text}</div>
                                                      </div>
                                                  </div>
                                              )}

                                              {msg.text && (msg.type === 'text' || msg.type === 'image') && <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>}

                                              <div className={`flex items-center gap-1 justify-end mt-1 text-[10px] ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}>
                                                  <span>{msg.timestamp?.toDate().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                                                  {isMe && (
                                                      msg.readBy && msg.readBy.length > 1 ? <CheckCheck size={12} /> : <Check size={12} />
                                                  )}
                                              </div>
                                              
                                              {/* Message Actions */}
                                              <button 
                                                  onClick={() => setReplyTo(msg)}
                                                  className={`absolute top-2 ${isMe ? '-left-8' : '-right-8'} p-1.5 rounded-full bg-slate-100 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm`}
                                              >
                                                  <Reply size={14} />
                                              </button>
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          )
                      })}
                      <div ref={messagesEndRef} />
                  </div>

                  {/* Input Area */}
                  <div className="p-4 bg-white border-t border-slate-200">
                      {/* Reply Preview */}
                      {replyTo && (
                          <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg mb-2 border-l-4 border-indigo-500">
                              <div className="text-sm text-slate-600">
                                  <span className="font-bold text-indigo-600 block text-xs">Replying to {replyTo.senderName}</span>
                                  <span className="truncate block max-w-xs">{replyTo.text}</span>
                              </div>
                              <button onClick={() => setReplyTo(null)} className="p-1 hover:bg-slate-200 rounded-full"><X size={14} /></button>
                          </div>
                      )}

                      {/* Image Preview */}
                      {previewImage && (
                          <div className="relative inline-block mb-2">
                              <img src={previewImage} alt="Preview" className="h-20 w-20 object-cover rounded-lg border border-slate-200" />
                              <button onClick={() => setPreviewImage(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md"><X size={12} /></button>
                          </div>
                      )}

                      <div className="flex items-end gap-2">
                          <button onClick={() => setIsSurveyPickerOpen(true)} className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors" title="Attach Survey">
                              <Briefcase size={20} />
                          </button>
                          <button onClick={() => fileInputRef.current?.click()} className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors">
                              <Paperclip size={20} />
                          </button>
                          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                          
                          <div className="flex-1 bg-slate-100 rounded-2xl flex items-center px-4 py-2 border border-transparent focus-within:border-indigo-300 focus-within:bg-white transition-all">
                              <textarea
                                  ref={inputRef}
                                  value={inputText}
                                  onChange={(e) => setInputText(e.target.value)}
                                  placeholder="Type a secure message..."
                                  className="w-full bg-transparent outline-none text-sm resize-none max-h-32 py-2"
                                  rows={1}
                                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                              />
                          </div>
                          
                          <button 
                              onClick={handleSendMessage} 
                              disabled={!inputText.trim() && !previewImage}
                              className="p-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95"
                          >
                              <Send size={20} />
                          </button>
                      </div>
                  </div>
              </>
          ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
                  <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                      <Lock size={40} className="text-slate-300" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-400">Secure Workspace Chat</h3>
                  <p className="max-w-xs text-center mt-2 text-sm">Select a conversation or create a new case room to start collaborating securely.</p>
              </div>
          )}
      </div>

      {/* New Chat Modal */}
      {isNewChatMode && (
          <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                      <h3 className="font-bold text-lg">New Message</h3>
                      <button onClick={() => setIsNewChatMode(false)} className="p-2 hover:bg-slate-100 rounded-full"><X size={20} /></button>
                  </div>
                  <div className="p-4 border-b border-slate-100">
                      <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <input 
                              autoFocus
                              placeholder="Search users..." 
                              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 transition-colors"
                              onChange={(e) => setSearchTerm(e.target.value)}
                          />
                      </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2">
                      {loadingUsers ? <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto text-indigo-500" /></div> : 
                       availableUsers.filter(u => u.displayName.toLowerCase().includes(searchTerm.toLowerCase())).map(u => (
                          <button key={u.uid} onClick={() => startDirectChat(u)} className="w-full p-4 hover:bg-slate-50 rounded-xl flex items-center gap-4 text-left transition-colors">
                              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">{u.displayName[0]}</div>
                              <div>
                                  <div className="font-bold text-slate-800">{u.displayName}</div>
                                  <div className="text-xs text-slate-500 capitalize">{u.role.replace('_', ' ')}</div>
                              </div>
                          </button>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {/* Create Case Modal */}
      {showCreateCase && (
          <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6">
                  <h3 className="font-bold text-xl mb-4">Create Case Room</h3>
                  <input 
                      placeholder="Enter Case ID (e.g. VAL/2024/101)" 
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold mb-4 outline-none focus:border-indigo-500"
                      value={newCaseId}
                      onChange={e => setNewCaseId(e.target.value)}
                  />
                  <div className="flex gap-3">
                      <button onClick={() => setShowCreateCase(false)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold text-slate-600">Cancel</button>
                      <button 
                          onClick={() => { createCaseRoom(newCaseId); setShowCreateCase(false); setNewCaseId(''); }}
                          disabled={!newCaseId.trim()}
                          className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg disabled:opacity-50"
                      >
                          Create
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Survey Picker Modal */}
      {isSurveyPickerOpen && (
          <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                      <h3 className="font-bold text-lg">Attach Survey</h3>
                      <button onClick={() => setIsSurveyPickerOpen(false)} className="p-2 hover:bg-slate-100 rounded-full"><X size={20} /></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 space-y-2">
                      {recentSurveys.length === 0 && <div className="p-8 text-center text-slate-400">No recent surveys found.</div>}
                      {recentSurveys.map(survey => (
                          <button key={survey.id} onClick={() => sendSurveyCard(survey)} className="w-full p-4 bg-slate-50 hover:bg-white hover:shadow-md border border-slate-100 rounded-xl text-left transition-all group">
                              <div className="flex justify-between items-start mb-1">
                                  <span className="font-black text-slate-800">{survey.caseId || 'Draft'}</span>
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${survey.status === 'submitted' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>{survey.status}</span>
                              </div>
                              <div className="text-xs text-slate-500">{survey.bankName} • {survey.details?.city}</div>
                          </button>
                      ))}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default SecureChat;