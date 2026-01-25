
import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import { 
  LayoutDashboard, Settings, BarChart3, Shield, LogOut, RefreshCw, 
  Users, Search, Trash2, ExternalLink, Grid, Menu, X, Database, 
  Loader2, MapPin, ClipboardList, Copy, ShieldCheck, Link as LinkIcon, 
  CheckCircle2, Plus, UserCog, AlertTriangle, Monitor, Landmark, Contact, Upload, Download,
  Edit, Tablet, MessageSquare, Map as MapIcon, Crosshair, Briefcase, TrendingUp, Clock, AlertCircle, Info, Star,
  DollarSign, Activity, Calendar, Phone, Mail, Globe, Layers, Lock,
  Calculator, FileText, PieChart, PenTool, Box, MousePointerClick, Layout,
  Palette, ToggleLeft, Hash, Share2, Eye, Filter, ArrowUpRight, ArrowDownRight, Wallet, Save,
  FileCheck, Receipt
} from 'lucide-react';
import { collection, doc, deleteDoc, onSnapshot, query, orderBy, limit, addDoc, serverTimestamp, updateDoc, where, getDocs, writeBatch } from 'firebase/firestore';
import { getAuth } from "firebase/auth";
import { db } from '../../lib/firebase';
import { ExternalApp, PropertyRecord, ContactRecord, SurveyRecord, SiteConfig } from '../../types';
import SurveyPad from '../survey/SurveyPad';
import SecureChat from '../chat/SecureChat';
import FinanceModule from './FinanceModule';
import { useSite } from '../../contexts/SiteContext';

// --- Dashboard Command Center ---

const DashboardHome = ({ onNavigate }: { onNavigate: (tab: string) => void }) => {
    const [stats, setStats] = useState({
        pendingRevenue: 0,
        pendingInvoices: 0,
        activeStaff: 0,
        todaySurveys: 0
    });
    const [staffLocations, setStaffLocations] = useState<any[]>([]);
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const mapRef = useRef<HTMLDivElement>(null);
    const leafletMap = useRef<L.Map | null>(null);
    const markersRef = useRef<L.LayerGroup | null>(null);

    useEffect(() => {
        // 1. Fetch Financials (Pending Bills)
        const invQ = query(collection(db, 'invoices'), where('status', '!=', 'Paid'));
        const unsubInv = onSnapshot(invQ, {
            next: (snap) => {
                let total = 0;
                snap.forEach(d => {
                    const data = d.data();
                    total += (data.balance !== undefined ? data.balance : data.amount) || 0;
                });
                setStats(prev => ({ ...prev, pendingRevenue: total, pendingInvoices: snap.size }));
            },
            error: (err) => console.error("Stats inv error", err)
        });

        // 2. Fetch Today's Surveys & Active Staff
        const today = new Date();
        today.setHours(0,0,0,0);
        
        const logQ = query(collection(db, 'daily_work_logs'), orderBy('timestamp', 'desc'), limit(50));
        const unsubLogs = onSnapshot(logQ, {
            next: (snap) => {
                const uniqueStaff = new Set();
                const locs: any[] = [];
                const activities: any[] = [];

                snap.forEach(d => {
                    const data = d.data();
                    if (data.userId) uniqueStaff.add(data.userId);
                    
                    // Collect latest location for each user
                    if (data.location?.lat && !locs.find(l => l.userId === data.userId)) {
                        locs.push({
                            userId: data.userId,
                            name: data.name,
                            lat: data.location.lat,
                            lng: data.location.lng,
                            time: data.timestamp
                        });
                    }

                    activities.push({
                        id: d.id,
                        type: 'log',
                        title: `${data.name} - ${data.category}`,
                        desc: data.reason || data.place,
                        time: data.timestamp
                    });
                });

                setStats(prev => ({ ...prev, activeStaff: uniqueStaff.size }));
                setStaffLocations(locs);
                setRecentActivity(activities.slice(0, 10));
            },
            error: (err) => console.error("Stats logs error", err)
        });

        const survQ = query(collection(db, 'surveys'), orderBy('createdAt', 'desc'), limit(20));
        const unsubSurv = onSnapshot(survQ, {
            next: (snap) => {
                let todayCount = 0;
                snap.forEach(d => {
                    const date = d.data().createdAt?.toDate();
                    if (date >= today) todayCount++;
                });
                setStats(prev => ({ ...prev, todaySurveys: todayCount }));
            },
            error: (err) => console.error("Stats surv error", err)
        });

        return () => { unsubInv(); unsubLogs(); unsubSurv(); };
    }, []);

    // Map Initialization
    useEffect(() => {
        if (mapRef.current && !leafletMap.current) {
            leafletMap.current = L.map(mapRef.current).setView([29.2104, 78.9619], 10);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap'
            }).addTo(leafletMap.current);
            markersRef.current = L.layerGroup().addTo(leafletMap.current);
        }

        if (markersRef.current && staffLocations.length > 0) {
            markersRef.current.clearLayers();
            const bounds = L.latLngBounds([]);
            
            staffLocations.forEach(staff => {
                const icon = L.divIcon({
                    className: 'custom-div-icon',
                    html: `<div style="background-color:#2563eb; color:white; width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold; border:2px solid white; box-shadow:0 4px 6px rgba(0,0,0,0.1);">${staff.name?.[0]}</div>`,
                    iconSize: [30, 30],
                    iconAnchor: [15, 15]
                });
                
                L.marker([staff.lat, staff.lng], { icon })
                    .bindPopup(`<b>${staff.name}</b><br/>${staff.time?.toDate().toLocaleTimeString()}`)
                    .addTo(markersRef.current!);
                
                bounds.extend([staff.lat, staff.lng]);
            });

            if (leafletMap.current && bounds.isValid()) {
                 leafletMap.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
            }
        }
    }, [staffLocations]);

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div 
                    onClick={() => onNavigate('finance')}
                    className="bg-slate-900 text-white p-6 rounded-[2rem] relative overflow-hidden shadow-xl cursor-pointer hover:scale-[1.02] transition-transform"
                >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-10 -mt-10"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-white/10 rounded-xl"><DollarSign size={20} /></div>
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Receivables</span>
                        </div>
                        <div className="text-3xl font-black mb-1">₹{(stats.pendingRevenue / 1000).toFixed(1)}k</div>
                        <div className="text-[10px] font-medium text-slate-400">{stats.pendingInvoices} Invoices Pending</div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Tablet size={20} /></div>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Surveys</span>
                    </div>
                    <div className="text-3xl font-black text-slate-900 mb-1">{stats.todaySurveys}</div>
                    <div className="text-[10px] font-medium text-slate-400">Submitted Today</div>
                </div>

                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><Users size={20} /></div>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Field Force</span>
                    </div>
                    <div className="text-3xl font-black text-slate-900 mb-1">{stats.activeStaff}</div>
                    <div className="text-[10px] font-medium text-slate-400">Active in last 24h</div>
                </div>

                <div 
                    onClick={() => onNavigate('chat')}
                    className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white p-6 rounded-[2rem] cursor-pointer hover:scale-[1.02] transition-transform shadow-lg shadow-indigo-200"
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="p-2 bg-white/20 w-fit rounded-xl mb-4"><MessageSquare size={20} /></div>
                            <div className="font-bold text-lg">Secure Chat</div>
                        </div>
                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-xs font-black animate-pulse">!</div>
                    </div>
                    <div className="text-[10px] font-medium opacity-80 mt-2">Open Communications</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[600px]">
                {/* Live Operations Map */}
                <div className="lg:col-span-2 bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col relative">
                    <div className="absolute top-6 left-6 z-[400] bg-white/90 backdrop-blur px-4 py-2 rounded-xl shadow-lg border border-slate-100">
                        <div className="flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            <span className="text-xs font-bold text-slate-700">Live Field Operations</span>
                        </div>
                    </div>
                    <div ref={mapRef} className="flex-1 bg-slate-100 z-0" />
                </div>

                {/* Activity Feed */}
                <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm p-8 flex flex-col">
                    <h3 className="font-black text-xl text-slate-900 mb-6 flex items-center gap-2">
                        <Activity size={20} className="text-indigo-500" /> Recent Activity
                    </h3>
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-2">
                        {recentActivity.map((item, i) => (
                            <div key={i} className="flex gap-4 group">
                                <div className="flex flex-col items-center">
                                    <div className="w-2 h-2 rounded-full bg-slate-300 group-hover:bg-primary transition-colors"></div>
                                    <div className="w-px h-full bg-slate-200 my-1 group-hover:bg-slate-300"></div>
                                </div>
                                <div className="pb-2">
                                    <div className="text-xs font-bold text-slate-400 mb-0.5">
                                        {item.time?.toDate().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                    </div>
                                    <div className="text-sm font-bold text-slate-800">{item.title}</div>
                                    <div className="text-xs text-slate-500 line-clamp-1">{item.desc}</div>
                                </div>
                            </div>
                        ))}
                        {recentActivity.length === 0 && <div className="text-center text-slate-400 text-xs italic">No recent activity.</div>}
                    </div>
                    <button onClick={() => onNavigate('work-logs')} className="mt-4 w-full py-3 bg-slate-50 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-100 transition-colors">
                        View Full Ledger
                    </button>
                </div>
            </div>
        </div>
    );
};

const ContactManager = () => {
    const { user } = useSite();
    const [contacts, setContacts] = useState<ContactRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'list' | 'form'>('list');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterState, setFilterState] = useState('');
    const initialFormState = { state: '', city: '', bank: '', branch: '', branch_code: '', contact_person: '', primary_phone: '', alternate_phone: '', email: '', address: '', notes: '' };
    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        const q = query(collection(db, 'directory_contacts'), orderBy('created_at', 'desc'), limit(500));
        const unsub = onSnapshot(q, {
            next: (snap) => { 
                setContacts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ContactRecord))); 
                setLoading(false); 
            },
            error: (err) => {
                console.error("Contacts load error", err);
                setLoading(false);
            }
        });
        return () => unsub();
    }, []);

    const uniqueStates = useMemo(() => Array.from(new Set(contacts.map(c => c.state).filter(Boolean))).sort(), [contacts]);
    const filteredContacts = contacts.filter(c => {
        const matchesSearch = searchTerm === '' || Object.values(c).some(val => String(val).toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesSearch && (filterState === '' || c.state === filterState);
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const data = { ...formData, updated_at: serverTimestamp(), created_by: user?.email };
            if (editingId) await updateDoc(doc(db, 'directory_contacts', editingId), data);
            else await addDoc(collection(db, 'directory_contacts'), { ...data, created_at: serverTimestamp() });
            setView('list'); setEditingId(null); setFormData(initialFormState);
        } catch (error) { alert("Failed to save."); }
    };

    const handleEdit = (contact: ContactRecord) => {
        setFormData({
            state: contact.state || '', city: contact.city || '', bank: contact.bank || '', branch: contact.branch || '', branch_code: contact.branch_code || '',
            contact_person: contact.contact_person || '', primary_phone: contact.primary_phone || '', alternate_phone: contact.alternate_phone || '', email: contact.email || '', address: contact.address || '', notes: contact.notes || ''
        });
        setEditingId(contact.id); setView('form');
    };

    const handleDelete = async (id: string) => { if (confirm("Delete contact?")) await deleteDoc(doc(db, 'directory_contacts', id)); };

    if (view === 'form') {
        return (
            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm p-12 animate-fade-in">
                <div className="flex justify-between items-center mb-8"><h3 className="text-3xl font-black text-slate-900">{editingId ? 'Edit Branch' : 'New Branch Record'}</h3><button onClick={() => setView('list')} className="p-3 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200"><X size={24} /></button></div>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4"><input required placeholder="State" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} className="w-full px-6 py-4 rounded-2xl border border-slate-200 font-bold" /><input required placeholder="City" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full px-6 py-4 rounded-2xl border border-slate-200 font-bold" /><textarea placeholder="Full Address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full px-6 py-4 rounded-2xl border border-slate-200 font-medium" rows={3} /></div>
                    <div className="space-y-4"><input required placeholder="Bank Name" value={formData.bank} onChange={e => setFormData({...formData, bank: e.target.value})} className="w-full px-6 py-4 rounded-2xl border border-slate-200 font-bold" /><div className="grid grid-cols-2 gap-4"><input required placeholder="Branch Name" value={formData.branch} onChange={e => setFormData({...formData, branch: e.target.value})} className="w-full px-6 py-4 rounded-2xl border border-slate-200 font-bold" /><input placeholder="IFSC Code" value={formData.branch_code} onChange={e => setFormData({...formData, branch_code: e.target.value})} className="w-full px-6 py-4 rounded-2xl border border-slate-200 font-bold uppercase" /></div></div>
                    <div className="space-y-4"><input placeholder="Contact Person" value={formData.contact_person} onChange={e => setFormData({...formData, contact_person: e.target.value})} className="w-full px-6 py-4 rounded-2xl border border-slate-200 font-medium" /><div className="grid grid-cols-2 gap-4"><input placeholder="Primary Phone" value={formData.primary_phone} onChange={e => setFormData({...formData, primary_phone: e.target.value})} className="w-full px-6 py-4 rounded-2xl border border-slate-200 font-medium" /><input placeholder="Email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-6 py-4 rounded-2xl border border-slate-200 font-medium" /></div></div>
                    <div className="col-span-full flex gap-4 pt-4"><button type="submit" className="px-10 py-4 bg-primary text-white rounded-2xl font-black shadow-xl hover:bg-primary-dark transition-all">Save Record</button></div>
                </form>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex justify-between items-center"><div className="flex items-center gap-4"><div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl"><Contact size={32} /></div><div><h3 className="text-3xl font-black text-slate-900 tracking-tighter">Directory</h3><p className="text-slate-400 font-medium">Manage institutional contacts</p></div></div><button onClick={() => { setEditingId(null); setFormData(initialFormState); setView('form'); }} className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-colors flex items-center gap-2"><Plus size={20} /> Add Branch</button></div>
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm"><div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"><input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search..." className="w-full pl-4 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none" /><select value={filterState} onChange={e => setFilterState(e.target.value)} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none"><option value="">All States</option>{uniqueStates.map(s => <option key={s} value={s}>{s}</option>)}</select></div><div className="overflow-x-auto"><table className="w-full text-left"><thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-black tracking-widest"><tr><th className="px-6 py-4">Bank</th><th className="px-6 py-4">Location</th><th className="px-6 py-4">Contact</th><th className="px-6 py-4 text-right">Actions</th></tr></thead><tbody className="divide-y divide-slate-50">{filteredContacts.map(contact => (<tr key={contact.id} className="group hover:bg-slate-50 transition-colors"><td className="px-6 py-4"><div className="font-black text-slate-900">{contact.bank}</div></td><td className="px-6 py-4"><div className="text-sm font-bold text-slate-700">{contact.city}</div></td><td className="px-6 py-4"><div className="text-sm font-medium text-slate-700">{contact.contact_person || 'N/A'}</div></td><td className="px-6 py-4 text-right"><div className="flex justify-end gap-2"><button onClick={() => handleEdit(contact)} className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg"><Edit size={16} /></button><button onClick={() => handleDelete(contact.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 size={16} /></button></div></td></tr>))}</tbody></table></div></div>
        </div>
    );
};

const SurveyManager = () => {
    const [surveys, setSurveys] = useState<SurveyRecord[]>([]);
    const [selectedSurvey, setSelectedSurvey] = useState<SurveyRecord | null>(null);
    const [error, setError] = useState<string | null>(null);

    const refreshUserToken = async () => {
        const auth = getAuth();
        if (auth.currentUser) {
            await auth.currentUser.getIdToken(true);
            window.location.reload();
        }
    };

    useEffect(() => {
        const q = query(collection(db, 'surveys'), orderBy('createdAt', 'desc'), limit(50));
        const unsub = onSnapshot(q, {
            next: (snap) => {
                setSurveys(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as SurveyRecord)));
                setError(null);
            },
            error: (err) => {
                if (err.code === 'permission-denied') {
                    setError("Permission Denied: Ensure you are logged in as an Admin and security rules are updated.");
                } else {
                    setError("Unable to sync surveys.");
                }
            }
        });
        return () => unsub();
    }, []);

    if (selectedSurvey) {
        return <SurveyPad onBack={() => setSelectedSurvey(null)} initialData={selectedSurvey} surveyId={selectedSurvey.id} />;
    }

    return (
        <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden animate-fade-in">
            <div className="p-10 border-b border-slate-100 bg-slate-50/30 flex justify-between items-center">
                <div>
                    <h3 className="font-black text-slate-900 text-3xl tracking-tighter">Submitted Surveys</h3>
                    <p className="text-slate-500 text-sm font-medium">Review field reports from valuers</p>
                </div>
                <div className="p-4 bg-teal-50 text-teal-600 rounded-2xl"><Tablet size={28} /></div>
            </div>
            
            {error ? (
                <div className="p-10 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-full font-bold text-sm mb-4">
                        <AlertTriangle size={16} /> {error}
                    </div>
                    <p className="text-slate-400 mb-6">Please check the Security Kernel for rule updates.</p>
                    <button onClick={refreshUserToken} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-black transition-all flex items-center gap-2 mx-auto shadow-lg">
                        <RefreshCw size={14} /> Refresh Permissions
                    </button>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-black tracking-widest border-b border-slate-100">
                            <tr><th className="px-10 py-6">Case ID</th><th className="px-8 py-6">Bank</th><th className="px-8 py-6">Status</th><th className="px-8 py-6">Surveyor</th><th className="px-10 py-6 text-right">Action</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {surveys.map(survey => (
                                <tr key={survey.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-10 py-6 font-bold text-slate-900">{survey.caseId || 'N/A'}</td>
                                    <td className="px-8 py-6 font-medium text-slate-600">{survey.bankName}</td>
                                    <td className="px-8 py-6">
                                        <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase ${survey.status === 'submitted' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {survey.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-sm text-slate-500">{survey.employeeName}</td>
                                    <td className="px-10 py-6 text-right">
                                        <button onClick={() => setSelectedSurvey(survey)} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-black">Review</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

const PerformanceMonitor = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPerformanceData = async () => {
            setLoading(true);
            try {
                const userQ = query(collection(db, 'user_permissions'), where('role', 'in', ['admin', 'employee']));
                const userSnap = await getDocs(userQ);
                const staffData = [];

                for (const doc of userSnap.docs) {
                    const u = doc.data();
                    const uid = u.uid;
                    
                    const surveyQ = query(collection(db, 'surveys'), where('employeeId', '==', uid));
                    const surveySnap = await getDocs(surveyQ);
                    
                    let submittedCount = 0;
                    let pendingCount = 0;
                    
                    surveySnap.forEach(s => {
                        const sData = s.data();
                        if (sData.status === 'submitted' || sData.status === 'reviewed') submittedCount++;
                        else pendingCount++;
                    });

                    const todayStr = new Date().toISOString().split('T')[0];
                    const attQ = query(collection(db, 'attendance'), where('userId', '==', uid), where('date', '==', todayStr));
                    const attSnap = await getDocs(attQ);
                    const isPresent = !attSnap.empty;

                    staffData.push({
                        id: doc.id,
                        name: u.displayName || u.email,
                        role: u.role,
                        completed: submittedCount,
                        pending: pendingCount,
                        isPresent
                    });
                }
                setUsers(staffData);
            } catch (err) {
                console.error("Perf fetch error", err);
            } finally {
                setLoading(false);
            }
        };
        fetchPerformanceData();
    }, []);

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-10 border-b border-slate-100 bg-slate-50/30 flex justify-between items-center">
                    <div>
                        <h3 className="font-black text-slate-900 text-3xl tracking-tighter">Performance Monitor</h3>
                        <p className="text-slate-500 text-sm font-medium">Real-time team productivity</p>
                    </div>
                    <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl"><TrendingUp size={28} /></div>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-black tracking-widest border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-6">Staff Member</th>
                                <th className="px-4 py-6">Status</th>
                                <th className="px-4 py-6">Completed Surveys</th>
                                <th className="px-4 py-6">Drafts / Pending</th>
                                <th className="px-6 py-6 text-right">Activity</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? <tr><td colSpan={5} className="p-10 text-center"><Loader2 className="animate-spin inline" /></td></tr> :
                            users.map(s => (
                                <tr key={s.id} className="hover:bg-slate-50 transition-colors text-sm">
                                    <td className="px-6 py-6">
                                        <div className="font-bold text-slate-900">{s.name}</div>
                                        <div className="text-slate-500 text-[10px] font-bold uppercase">{s.role}</div>
                                    </td>
                                    <td className="px-4 py-6">
                                        {s.isPresent ? 
                                            <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-xs"><CheckCircle2 size={14} /> Online</span> : 
                                            <span className="text-slate-400 font-bold text-xs">Offline</span>
                                        }
                                    </td>
                                    <td className="px-4 py-6 font-black text-lg text-slate-800">{s.completed}</td>
                                    <td className="px-4 py-6 font-bold text-amber-500">{s.pending}</td>
                                    <td className="px-6 py-6 text-right">
                                        <div className="w-full bg-slate-100 rounded-full h-1.5 max-w-[100px] ml-auto overflow-hidden">
                                            <div className="h-full bg-primary" style={{ width: `${Math.min((s.completed / (s.completed + s.pending || 1)) * 100, 100)}%` }}></div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const SecurityKernel = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, 'user_permissions'), orderBy('lastSeen', 'desc'));
        const unsub = onSnapshot(q, {
            next: (snap) => {
                setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                setLoading(false);
            },
            error: (err) => {
                console.error("Security Kernel Error", err);
                setLoading(false);
            }
        });
        return () => unsub();
    }, []);

    const adminCount = users.filter(u => ['admin', 'super_admin'].includes(u.role)).length;
    const onlineCount = users.filter(u => u.isOnline).length;
    const recentLogins = users.filter(u => {
        if (!u.lastLogin) return false;
        const diff = Date.now() - u.lastLogin.toDate().getTime();
        return diff < 24 * 60 * 60 * 1000;
    }).length;

    const rulesSnippet = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAdmin() {
      return request.auth != null && 
        exists(/databases/$(database)/documents/user_permissions/$(request.auth.token.email.lower())) &&
        get(/databases/$(database)/documents/user_permissions/$(request.auth.token.email.lower())).data.role in ['admin', 'super_admin'];
    }
    match /{document=**} {
      allow read, write: if isAdmin();
    }
  }
}`;

    const copyRules = () => { navigator.clipboard.writeText(rulesSnippet); alert("Rules copied to clipboard"); };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl"><ShieldCheck size={24} /></div>
                    <div>
                        <div className="text-3xl font-black text-slate-900">{adminCount}</div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Privileged Accounts</div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl"><Users size={24} /></div>
                    <div>
                        <div className="text-3xl font-black text-slate-900">{onlineCount}</div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Sessions</div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl"><Clock size={24} /></div>
                    <div>
                        <div className="text-3xl font-black text-slate-900">{recentLogins}</div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Logins (24h)</div>
                    </div>
                </div>
                <div className="bg-slate-900 p-6 rounded-[2rem] shadow-xl text-white flex flex-col justify-center cursor-pointer hover:bg-black transition-colors" onClick={copyRules}>
                    <div className="text-xs font-bold uppercase tracking-wider mb-2 text-slate-400 flex items-center gap-2"><Copy size={12}/> Copy Rules</div>
                    <div className="text-lg font-black">Firestore Policy</div>
                </div>
            </div>
            
            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm p-10">
                <h3 className="font-black text-2xl text-slate-900 mb-6">Audit Log</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">
                            <tr><th className="pb-4">User</th><th className="pb-4">Role</th><th className="pb-4">Last IP/Login</th><th className="pb-4 text-right">Status</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {users.map(u => (
                                <tr key={u.id} className="group hover:bg-slate-50">
                                    <td className="py-4 font-bold text-slate-900">{u.email}</td>
                                    <td className="py-4 text-xs font-bold text-slate-500 uppercase">{u.role}</td>
                                    <td className="py-4 text-xs font-mono text-slate-400">{u.lastLogin?.toDate().toLocaleString()}</td>
                                    <td className="py-4 text-right">
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${u.isOnline ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                            {u.isOnline ? 'Active' : 'Offline'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const SiteEditor = () => {
    const { config, updateConfig } = useSite();
    const [activeTab, setActiveTab] = useState<'branding' | 'contact' | 'seo' | 'features'>('branding');
    const [newBank, setNewBank] = useState('');

    const handleHeroChange = (key: string, value: string) => { updateConfig('hero', { [key]: value }); };
    const handleContactChange = (key: string, value: string) => { updateConfig('contact', { [key]: value }); };
    const handleSeoChange = (key: string, value: string) => { updateConfig('seo', { [key]: value }); };
    
    const addBank = () => {
        if (newBank.trim()) {
            updateConfig('banks', [...config.banks, newBank.trim()]);
            setNewBank('');
        }
    };

    const removeBank = (bank: string) => {
        updateConfig('banks', config.banks.filter(b => b !== bank));
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="bg-white p-4 rounded-[2.5rem] border border-slate-100 shadow-sm flex gap-2 overflow-x-auto no-scrollbar">
                {['branding', 'contact', 'seo', 'features'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`px-6 py-3 rounded-2xl font-bold text-sm capitalize whitespace-nowrap transition-all ${activeTab === tab ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <div className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-sm">
                {activeTab === 'branding' && (
                    <div className="space-y-8">
                        <h3 className="text-2xl font-black mb-6">Hero Section</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2"><label className="text-xs font-bold uppercase text-slate-400">Badge Text</label><input value={config.hero.badge} onChange={e => handleHeroChange('badge', e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" /></div>
                            <div className="space-y-2"><label className="text-xs font-bold uppercase text-slate-400">Title Line 1</label><input value={config.hero.titleLine1} onChange={e => handleHeroChange('titleLine1', e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" /></div>
                            <div className="space-y-2"><label className="text-xs font-bold uppercase text-slate-400">Title Line 2</label><input value={config.hero.titleLine2} onChange={e => handleHeroChange('titleLine2', e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" /></div>
                            <div className="space-y-2"><label className="text-xs font-bold uppercase text-slate-400">Image URL</label><input value={config.hero.backgroundImage} onChange={e => handleHeroChange('backgroundImage', e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-medium text-sm" /></div>
                        </div>
                        <div className="space-y-2"><label className="text-xs font-bold uppercase text-slate-400">Description</label><textarea value={config.hero.description} onChange={e => handleHeroChange('description', e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-medium" rows={3} /></div>
                    </div>
                )}

                {activeTab === 'contact' && (
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2"><label className="text-xs font-bold uppercase text-slate-400">Phone</label><input value={config.contact.phone} onChange={e => handleContactChange('phone', e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" /></div>
                            <div className="space-y-2"><label className="text-xs font-bold uppercase text-slate-400">Email</label><input value={config.contact.email} onChange={e => handleContactChange('email', e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" /></div>
                        </div>
                        <div className="space-y-2"><label className="text-xs font-bold uppercase text-slate-400">Address</label><textarea value={config.contact.address} onChange={e => handleContactChange('address', e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-medium" rows={3} /></div>
                        
                        <div className="pt-8 border-t border-slate-100">
                            <h3 className="text-xl font-black mb-4">Empanelled Banks</h3>
                            <div className="flex gap-2 mb-4">
                                <input value={newBank} onChange={e => setNewBank(e.target.value)} placeholder="Add new bank..." className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm" />
                                <button onClick={addBank} className="p-3 bg-slate-900 text-white rounded-xl"><Plus size={20} /></button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {config.banks.map(bank => (
                                    <span key={bank} className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-700 flex items-center gap-2">
                                        {bank}
                                        <button onClick={() => removeBank(bank)} className="text-slate-400 hover:text-red-500"><X size={14} /></button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'seo' && (
                    <div className="space-y-6">
                        <div className="space-y-2"><label className="text-xs font-bold uppercase text-slate-400">Site Title</label><input value={config.seo.title} onChange={e => handleSeoChange('title', e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" /></div>
                        <div className="space-y-2"><label className="text-xs font-bold uppercase text-slate-400">Meta Description</label><textarea value={config.seo.description} onChange={e => handleSeoChange('description', e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-medium" rows={3} /></div>
                        <div className="space-y-2"><label className="text-xs font-bold uppercase text-slate-400">Keywords</label><input value={config.seo.keywords} onChange={e => handleSeoChange('keywords', e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-medium text-sm" /></div>
                    </div>
                )}
            </div>
        </div>
    );
};

const AppDirectory = () => {
    const [apps, setApps] = useState<ExternalApp[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({ name: '', url: '', description: '', category: 'Utility', iconName: 'LinkIcon', color: 'blue' });

    useEffect(() => {
        const unsub = onSnapshot(query(collection(db, 'external_apps'), orderBy('createdAt', 'desc')), snap => {
            setApps(snap.docs.map(d => ({ id: d.id, ...d.data() } as ExternalApp)));
        });
        return () => unsub();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await addDoc(collection(db, 'external_apps'), { ...formData, createdAt: serverTimestamp(), clicks: 0, isEmbeddable: false });
        setIsEditing(false);
        setFormData({ name: '', url: '', description: '', category: 'Utility', iconName: 'LinkIcon', color: 'blue' });
    };

    const handleDelete = async (id: string) => {
        if(confirm('Delete app?')) await deleteDoc(doc(db, 'external_apps', id));
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-center">
                <h3 className="text-3xl font-black text-slate-900">App Directory</h3>
                <button onClick={() => setIsEditing(!isEditing)} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center gap-2"><Plus size={18}/> New App</button>
            </div>

            {isEditing && (
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl mb-8">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <input required placeholder="App Name" className="p-3 bg-slate-50 rounded-xl font-bold" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                            <input required placeholder="URL" className="p-3 bg-slate-50 rounded-xl font-medium" value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})} />
                        </div>
                        <textarea required placeholder="Description" className="w-full p-3 bg-slate-50 rounded-xl font-medium" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                        <div className="grid grid-cols-3 gap-4">
                            <select className="p-3 bg-slate-50 rounded-xl font-bold" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}><option>Utility</option><option>Reference</option><option>Government</option></select>
                            <select className="p-3 bg-slate-50 rounded-xl font-bold" value={formData.iconName} onChange={e => setFormData({...formData, iconName: e.target.value})}><option value="LinkIcon">Link</option><option value="Globe">Globe</option><option value="Calculator">Calc</option><option value="FileText">File</option></select>
                            <select className="p-3 bg-slate-50 rounded-xl font-bold" value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})}><option value="blue">Blue</option><option value="emerald">Green</option><option value="purple">Purple</option><option value="orange">Orange</option></select>
                        </div>
                        <button type="submit" className="w-full py-3 bg-emerald-500 text-white rounded-xl font-bold shadow-lg">Deploy App</button>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {apps.map(app => (
                    <div key={app.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-lg transition-all group relative">
                        <button onClick={() => handleDelete(app.id)} className="absolute top-4 right-4 p-2 bg-slate-50 text-slate-400 hover:text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16} /></button>
                        <div className={`w-12 h-12 rounded-xl bg-${app.color || 'blue'}-600 text-white flex items-center justify-center mb-4 font-bold shadow-lg`}>{app.name[0]}</div>
                        <h4 className="font-bold text-lg mb-1">{app.name}</h4>
                        <p className="text-xs text-slate-500 mb-4 line-clamp-2">{app.description}</p>
                        <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                            <span className="uppercase">{app.category}</span>
                            <span className="flex items-center gap-1"><MousePointerClick size={12}/> {app.clicks || 0}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const StaffActivityLedger = () => {
    const [workLogs, setWorkLogs] = useState<any[]>([]);
    const [surveys, setSurveys] = useState<any[]>([]);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [attendance, setAttendance] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 1. Work Logs
        const qLogs = query(collection(db, 'daily_work_logs'), orderBy('timestamp', 'desc'), limit(50));
        const unsubLogs = onSnapshot(qLogs, snap => {
            setWorkLogs(snap.docs.map(d => ({ 
                id: d.id, 
                source: 'log', 
                rawTime: d.data().timestamp, 
                ...d.data() 
            })));
        });

        // 2. Surveys
        const qSurveys = query(collection(db, 'surveys'), orderBy('createdAt', 'desc'), limit(50));
        const unsubSurveys = onSnapshot(qSurveys, snap => {
            setSurveys(snap.docs.map(d => ({ 
                id: d.id, 
                source: 'survey', 
                rawTime: d.data().createdAt, 
                ...d.data() 
            })));
        });

        // 3. Invoices
        const qInvoices = query(collection(db, 'invoices'), orderBy('createdAt', 'desc'), limit(50));
        const unsubInvoices = onSnapshot(qInvoices, snap => {
            setInvoices(snap.docs.map(d => ({ 
                id: d.id, 
                source: 'invoice', 
                rawTime: d.data().createdAt, 
                ...d.data() 
            })));
        });

        // 4. Attendance
        const qAttendance = query(collection(db, 'attendance'), orderBy('checkIn', 'desc'), limit(50));
        const unsubAttendance = onSnapshot(qAttendance, snap => {
            setAttendance(snap.docs.map(d => ({ 
                id: d.id, 
                source: 'attendance', 
                rawTime: d.data().checkIn, 
                ...d.data() 
            })));
        });

        setLoading(false);

        return () => { unsubLogs(); unsubSurveys(); unsubInvoices(); unsubAttendance(); };
    }, []);

    const allActivities = useMemo(() => {
        const combined = [
            ...workLogs.map(l => ({
                id: l.id,
                time: l.rawTime,
                user: l.name,
                type: 'Work Log',
                action: l.category,
                desc: `${l.place || ''} ${l.reason || ''}`,
                status: l.status,
                icon: ClipboardList,
                color: 'blue'
            })),
            ...surveys.map(s => ({
                id: s.id,
                time: s.rawTime,
                user: s.employeeName,
                type: 'Survey',
                action: 'Submitted Report',
                desc: `${s.caseId || 'Ref N/A'} - ${s.bankName}`,
                status: s.status,
                icon: FileCheck,
                color: 'teal'
            })),
            ...invoices.map(i => ({
                id: i.id,
                time: i.rawTime,
                user: 'Finance System', // Invoices often don't have creator name directly stored
                type: 'Invoice',
                action: 'Generated Bill',
                desc: `INV-${i.invoiceNo} • ₹${i.amount?.toLocaleString()}`,
                status: i.status,
                icon: Receipt,
                color: 'purple'
            })),
            ...attendance.map(a => ({
                id: a.id,
                time: a.rawTime,
                user: a.userName,
                type: 'Attendance',
                action: a.status === 'Late' ? 'Late Check-in' : 'Punched In',
                desc: a.date,
                status: a.status,
                icon: Clock,
                color: a.status === 'Late' ? 'amber' : 'emerald'
            }))
        ];

        return combined.sort((a, b) => {
            const tA = a.time?.toMillis ? a.time.toMillis() : 0;
            const tB = b.time?.toMillis ? b.time.toMillis() : 0;
            return tB - tA;
        });
    }, [workLogs, surveys, invoices, attendance]);

    return (
        <div className="space-y-6 animate-fade-in relative">
            <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-10 border-b border-slate-100 bg-slate-50/30 flex justify-between items-center">
                    <div>
                        <h3 className="font-black text-slate-900 text-3xl tracking-tighter">Unified Activity Ledger</h3>
                        <p className="text-slate-500 text-sm font-medium">Real-time stream of all system events</p>
                    </div>
                    <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl"><Layers size={28} /></div>
                </div>

                {loading ? <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto" /></div> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-black tracking-widest border-b border-slate-100">
                                <tr>
                                    <th className="px-8 py-6">User / Source</th>
                                    <th className="px-6 py-6">Activity Type</th>
                                    <th className="px-6 py-6">Details</th>
                                    <th className="px-6 py-6 text-center">Status</th>
                                    <th className="px-8 py-6 text-right">Time</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {allActivities.map(act => (
                                    <tr key={act.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="font-bold text-slate-900">{act.user}</div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{act.type}</div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-${act.color}-50 text-${act.color}-700 border border-${act.color}-100`}>
                                                <act.icon size={14} />
                                                <span className="text-xs font-bold">{act.action}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="text-sm font-medium text-slate-600">{act.desc}</div>
                                        </td>
                                        <td className="px-6 py-6 text-center">
                                            <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-500 text-[10px] font-bold uppercase">{act.status}</span>
                                        </td>
                                        <td className="px-8 py-6 text-right text-xs font-mono text-slate-400">
                                            {act.time?.toDate().toLocaleString([], { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })}
                                        </td>
                                    </tr>
                                ))}
                                {allActivities.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-10 text-center text-slate-400 italic">No activity recorded yet.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

const UsersManager = () => {
    const [users, setUsers] = useState<any[]>([]);
    
    useEffect(() => {
        const q = query(collection(db, 'user_permissions'), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, snap => {
            setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => unsub();
    }, []);

    const updateRole = async (email: string, newRole: string) => {
        if(confirm(`Change role to ${newRole}?`)) {
            await updateDoc(doc(db, 'user_permissions', email), { role: newRole });
        }
    };

    return (
        <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden animate-fade-in">
            <h3 className="font-black text-slate-900 text-3xl tracking-tighter p-10 border-b border-slate-100">Access Matrix</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-black tracking-widest border-b border-slate-100">
                        <tr><th className="px-8 py-6">User</th><th className="px-6 py-6">Current Role</th><th className="px-6 py-6">Last Active</th><th className="px-8 py-6 text-right">Action</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {users.map(u => (
                            <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-8 py-6">
                                    <div className="font-bold text-slate-900">{u.displayName || 'Unknown'}</div>
                                    <div className="text-xs text-slate-500">{u.email}</div>
                                </td>
                                <td className="px-6 py-6"><span className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-bold uppercase">{u.role}</span></td>
                                <td className="px-6 py-6 text-xs text-slate-500">{u.lastSeen?.toDate().toLocaleString()}</td>
                                <td className="px-8 py-6 text-right">
                                    <select 
                                        className="bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold p-2 outline-none"
                                        value={u.role}
                                        onChange={(e) => updateRole(u.id, e.target.value)}
                                    >
                                        <option value="client">Client</option>
                                        <option value="employee">Employee</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const MarketIntelligenceDashboard = () => {
    const [records, setRecords] = useState<PropertyRecord[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('All');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const markerLayerRef = useRef<L.LayerGroup | null>(null);

    useEffect(() => {
        const q = query(collection(db, 'market_intelligence'), orderBy('timestamp', 'desc'), limit(500));
        const unsub = onSnapshot(q, snap => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as PropertyRecord));
            setRecords(data);
        });
        return () => unsub();
    }, []);

    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return;
        const map = L.map(mapContainerRef.current).setView([29.2104, 78.9619], 12);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
             attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);
        markerLayerRef.current = L.layerGroup().addTo(map);
        mapRef.current = map;
        return () => { map.remove(); mapRef.current = null; };
    }, []);

    // Filter Logic
    const filteredRecords = useMemo(() => {
        return records.filter(r => {
            const matchesSearch = (r.areaName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                                  (r.city || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchesType = filterType === 'All' || r.type === filterType;
            const price = Number(r.rate);
            const matchesMin = !minPrice || price >= Number(minPrice);
            const matchesMax = !maxPrice || price <= Number(maxPrice);
            return matchesSearch && matchesType && matchesMin && matchesMax;
        });
    }, [records, searchTerm, filterType, minPrice, maxPrice]);

    // Update Map Markers
    useEffect(() => {
        if(!mapRef.current || !markerLayerRef.current) return;
        markerLayerRef.current.clearLayers();

        filteredRecords.forEach(r => {
            const color = r.type === 'Commercial' ? '#3b82f6' : r.type === 'Industrial' ? '#f59e0b' : '#10b981';
            L.circleMarker([r.lat, r.lng], { radius: 8, fillColor: color, color: '#fff', weight: 2, fillOpacity: 0.9 })
                .bindPopup(`
                    <div class="font-sans">
                        <div class="text-xs font-bold uppercase text-slate-500 mb-1">${r.type}</div>
                        <div class="text-lg font-black text-slate-900">₹${r.rate}/unit</div>
                        <div class="text-sm font-medium text-slate-600">${r.areaName}</div>
                    </div>
                `)
                .addTo(markerLayerRef.current!);
        });
    }, [filteredRecords]);

    const averageRate = useMemo(() => {
        if (filteredRecords.length === 0) return 0;
        const total = filteredRecords.reduce((acc, curr) => acc + (Number(curr.rate) || 0), 0);
        return Math.round(total / filteredRecords.length);
    }, [filteredRecords]);

    const handleExport = () => {
        const headers = ['Type', 'Rate', 'Area', 'City', 'Recorded By', 'Date'];
        const csvContent = [
            headers.join(','),
            ...filteredRecords.map(r => [
                r.type,
                r.rate,
                `"${r.areaName}"`,
                `"${r.city}"`,
                r.recordedBy,
                r.timestamp?.toDate ? r.timestamp.toDate().toLocaleDateString() : ''
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `market_data_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleFlyTo = (lat: number, lng: number) => {
        if(mapRef.current) {
            mapRef.current.flyTo([lat, lng], 18, { animate: true, duration: 1.5 });
            mapContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Map Section */}
            <div className="bg-white rounded-[3rem] border border-slate-200 shadow-2xl overflow-hidden h-[600px] relative z-0">
                <div ref={mapContainerRef} className="w-full h-full z-0" />
                <div className="absolute top-6 right-6 z-[400] bg-white/90 backdrop-blur-md px-6 py-4 rounded-2xl shadow-xl border border-white/20">
                    <div className="text-4xl font-black text-slate-900">{filteredRecords.length}</div>
                    <div className="text-xs font-bold uppercase text-slate-500 tracking-wider">Data Points</div>
                </div>
            </div>

            {/* Analytics & Controls Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Stats Card */}
                <div className="bg-slate-900 text-white p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col justify-center">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 pointer-events-none"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-white/10 rounded-2xl"><TrendingUp size={24} /></div>
                            <span className="text-sm font-bold uppercase tracking-widest text-slate-400">Avg Market Rate</span>
                        </div>
                        <div className="text-5xl font-black mb-2 tracking-tight">₹{averageRate.toLocaleString()}</div>
                        <div className="text-sm font-medium text-slate-400">Per Unit (Filtered Area)</div>
                    </div>
                </div>

                {/* Control Center */}
                <div className="lg:col-span-2 bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-center space-y-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input 
                                placeholder="Search area, city..." 
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:border-primary transition-colors"
                            />
                        </div>
                        <select 
                            value={filterType} 
                            onChange={e => setFilterType(e.target.value)}
                            className="px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:border-primary transition-colors cursor-pointer"
                        >
                            <option value="All">All Types</option>
                            <option value="Residential">Residential</option>
                            <option value="Commercial">Commercial</option>
                            <option value="Industrial">Industrial</option>
                            <option value="Land">Land</option>
                        </select>
                    </div>
                    
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                        <div className="flex-1 grid grid-cols-2 gap-4 w-full">
                            <input 
                                type="number" 
                                placeholder="Min Price" 
                                value={minPrice}
                                onChange={e => setMinPrice(e.target.value)}
                                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:border-primary transition-colors"
                            />
                            <input 
                                type="number" 
                                placeholder="Max Price" 
                                value={maxPrice}
                                onChange={e => setMaxPrice(e.target.value)}
                                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:border-primary transition-colors"
                            />
                        </div>
                        <button 
                            onClick={handleExport}
                            className="w-full md:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2"
                        >
                            <Download size={20} /> Export CSV
                        </button>
                    </div>
                </div>
            </div>

            {/* Data Grid */}
            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden p-10">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="font-black text-2xl text-slate-900">Market Data Entries</h3>
                    <span className="bg-slate-100 text-slate-600 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide">{filteredRecords.length} Rows</span>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-black tracking-widest">
                            <tr>
                                <th className="px-6 py-4 rounded-l-xl">Type</th>
                                <th className="px-6 py-4">Rate</th>
                                <th className="px-6 py-4">Area</th>
                                <th className="px-6 py-4">City</th>
                                <th className="px-6 py-4">Recorded By</th>
                                <th className="px-6 py-4 text-right">Date</th>
                                <th className="px-6 py-4 rounded-r-xl text-center">Locate</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredRecords.slice(0, 50).map((r) => (
                                <tr key={r.id} className="group hover:bg-slate-50/80 transition-colors">
                                    <td className="px-6 py-5">
                                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${
                                            r.type === 'Commercial' ? 'bg-blue-100 text-blue-700' :
                                            r.type === 'Industrial' ? 'bg-amber-100 text-amber-700' :
                                            'bg-emerald-100 text-emerald-700'
                                        }`}>
                                            {r.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 font-black text-slate-900">₹{r.rate.toLocaleString()}</td>
                                    <td className="px-6 py-5 font-bold text-slate-700">{r.areaName}</td>
                                    <td className="px-6 py-5 text-sm font-medium text-slate-500">{r.city}</td>
                                    <td className="px-6 py-5 text-sm font-medium text-slate-500">{r.recordedBy}</td>
                                    <td className="px-6 py-5 text-right text-xs font-mono text-slate-400">
                                        {r.timestamp?.toDate ? r.timestamp.toDate().toLocaleDateString() : ''}
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <button 
                                            onClick={() => handleFlyTo(r.lat, r.lng)}
                                            className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-95"
                                            title="Fly to Location"
                                        >
                                            <Crosshair size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredRecords.length > 50 && (
                        <div className="text-center mt-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Showing top 50 of {filteredRecords.length} records</div>
                    )}
                </div>
            </div>
        </div>
    );
};

const AdminPanel: React.FC = () => {
  const { logout, user } = useSite();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'finance' | 'market-entries' | 'work-logs' | 'users' | 'security' | 'app-directory' | 'site-settings' | 'contact-directory' | 'surveys' | 'chat' | 'performance'>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Command Center', icon: LayoutDashboard },
    { id: 'finance', label: 'Financials', icon: DollarSign }, 
    { id: 'performance', label: 'Performance', icon: TrendingUp },
    { id: 'surveys', label: 'Surveys', icon: Tablet },
    { id: 'chat', label: 'Secure Chat', icon: MessageSquare },
    { id: 'contact-directory', label: 'Contact Directory', icon: Contact },
    { id: 'site-settings', label: 'Site Editor', icon: Settings },
    { id: 'market-entries', label: 'Market Intelligence', icon: Database },
    { id: 'work-logs', label: 'Activity Ledger', icon: ClipboardList },
    { id: 'users', label: 'Access Matrix', icon: UserCog }, 
    { id: 'app-directory', label: 'App Manager', icon: LinkIcon },
    { id: 'security', label: 'Security Kernel', icon: ShieldCheck },
  ];

  const renderContent = () => {
      switch(activeTab) {
          case 'dashboard': return <DashboardHome onNavigate={(tab: any) => setActiveTab(tab)} />;
          case 'finance': return <FinanceModule />;
          case 'surveys': return <SurveyManager />;
          case 'chat': return <SecureChat />;
          case 'performance': return <PerformanceMonitor />;
          case 'contact-directory': return <ContactManager />;
          case 'site-settings': return <SiteEditor />;
          case 'work-logs': return <StaffActivityLedger />;
          case 'users': return <UsersManager />;
          case 'app-directory': return <AppDirectory />;
          case 'security': return <SecurityKernel />;
          case 'market-entries': return <MarketIntelligenceDashboard />;
          default: return <div className="text-center py-20 text-slate-400 font-bold">Synchronizing Terminal...</div>;
      }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans relative overflow-hidden">
      {isMobileMenuOpen && <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />}
      <aside className={`w-72 bg-slate-900 text-slate-400 fixed md:static inset-y-0 left-0 transform ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'} md:translate-x-0 transition-transform duration-500 z-50 flex flex-col border-r border-white/5`}>
        <div className="p-10 border-b border-white/5 flex flex-col gap-1"><h2 className="text-white text-2xl font-black tracking-tighter">ABS <span className="text-primary font-normal">Panel</span></h2><div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Institutional Console</div></div>
        <nav className="flex-1 p-6 space-y-2 overflow-y-auto custom-scrollbar">
            {navItems.map((item) => (
                <button key={item.id} onClick={() => { setActiveTab(item.id as any); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-4 px-6 py-4.5 rounded-[1.5rem] transition-all group ${activeTab === item.id ? 'bg-primary text-white shadow-2xl' : 'hover:bg-white/5 hover:text-white'}`}>
                    <item.icon size={18} className={activeTab === item.id ? 'opacity-100' : 'opacity-40 group-hover:opacity-100'} />
                    <span className="font-bold text-sm tracking-tight">{item.label}</span>
                </button>
            ))}
        </nav>
        <div className="p-6 border-t border-white/5"><button onClick={logout} className="w-full flex items-center gap-4 px-6 py-4.5 rounded-[1.5rem] hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 font-bold text-sm transition-all"><LogOut size={18} /><span>End Workspace</span></button></div>
      </aside>
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="h-24 bg-white border-b border-slate-200 flex items-center justify-between px-10 shrink-0 z-30 shadow-sm">
            <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-3 bg-slate-100 rounded-2xl text-slate-600"><Menu size={24} /></button>
            <h1 className="text-3xl font-black text-slate-900 capitalize tracking-tighter">{activeTab.replace('-', ' ')}</h1>
            <div className="w-14 h-14 rounded-[1.5rem] bg-gradient-to-br from-primary to-blue-800 flex items-center justify-center text-white font-black text-xl shadow-2xl border-4 border-white">
                {user?.email?.[0].toUpperCase() || 'A'}
            </div>
        </header>
        <div className="flex-1 overflow-y-auto p-8 md:p-12 bg-slate-50/50 relative custom-scrollbar"><div className="max-w-7xl mx-auto pb-20">{renderContent()}</div></div>
      </main>
    </div>
  );
};

export default AdminPanel;
