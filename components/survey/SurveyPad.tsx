
import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, Save, Send, Camera, MapPin, Ruler, FileText, 
  CheckCircle2, AlertTriangle, Plus, Trash2, ChevronRight, 
  ChevronLeft, Upload, Loader2, Image as ImageIcon, Crosshair, MessageSquare, Compass 
} from 'lucide-react';
import { useSite } from '../../contexts/SiteContext';
import { db, storage } from '../../lib/firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import L from 'leaflet';
import { SurveyRecord, SurveyMedia, FloorMeasurement, RoomMeasurement } from '../../types';
import SecureChat from '../chat/SecureChat';

interface SurveyPadProps {
  onBack: () => void;
  surveyId?: string; // If editing an existing draft
  initialData?: SurveyRecord;
}

const STEPS = [
  { id: 'info', label: 'Case Info', icon: FileText },
  { id: 'property', label: 'Property', icon: MapPin },
  { id: 'location', label: 'GPS', icon: Crosshair },
  { id: 'media', label: 'Photos', icon: Camera },
  { id: 'measure', label: 'Areas', icon: Ruler },
  { id: 'remarks', label: 'Remarks', icon: CheckCircle2 },
];

const SurveyPad: React.FC<SurveyPadProps> = ({ onBack, surveyId, initialData }) => {
  const { user, config } = useSite();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showChat, setShowChat] = useState(false);
  
  // Data State
  const [formData, setFormData] = useState<Partial<SurveyRecord>>(() => {
    const defaultData = {
        status: 'draft',
        propertyType: 'Residential',
        details: {
            ownerName: '', customerPhone: '', address: '', locality: '', city: '', state: 'Uttarakhand', pincode: '',
            purpose: 'Loan', occupancy: 'Self Occupied', ageOfProperty: '', constructionType: 'RCC Frame'
        },
        landDetails: {
            rate: 0,
            area: 0,
            length: 0,
            width: 0,
            boundaries: { north: '', south: '', east: '', west: '' },
            dimensions: { north: 0, south: 0, east: 0, west: 0 }
        },
        measurements: { unit: 'sqft', floors: [], totalBuiltUpArea: 0 },
        media: [],
        observations: { constructionQuality: 'Good', surroundings: '', legalIssues: 'None', negativeFactors: 'None', overallRemarks: '' }
    };

    if (initialData) {
        return {
            ...defaultData,
            ...initialData,
            landDetails: {
                ...defaultData.landDetails,
                ...(initialData.landDetails || {}),
                dimensions: initialData.landDetails?.dimensions || defaultData.landDetails.dimensions
            }
        };
    }
    return defaultData as Partial<SurveyRecord>;
  });

  // Map Refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // --- Auto-Save Effect ---
  useEffect(() => {
    // In a real app, you might want to debounce this or save only on step change
    if (surveyId && formData) {
       // Logic to auto-save draft to Firestore could go here
    }
  }, [formData, surveyId]);

  // --- Calculations ---
  useEffect(() => {
    if (!formData.measurements) return;
    
    const floors = formData.measurements.floors.map(floor => {
        const totalFloorArea = floor.rooms.reduce((acc, room) => acc + (room.length * room.width), 0);
        return { ...floor, totalArea: totalFloorArea };
    });

    const totalBuiltUp = floors.reduce((acc, floor) => acc + floor.totalArea, 0);
    
    setFormData(prev => ({
        ...prev,
        measurements: {
            ...prev.measurements!,
            floors: floors,
            totalBuiltUpArea: totalBuiltUp
        }
    }));
  }, [JSON.stringify(formData.measurements?.floors)]); // Deep dependency check needed

  // Calculation Effect for Land Area
  useEffect(() => {
    if (!formData.landDetails) return;
    const { length, width } = formData.landDetails;
    if (length && width) {
        const area = length * width;
        if (area !== formData.landDetails.area) {
             setFormData(prev => ({
                ...prev,
                landDetails: { ...prev.landDetails!, area }
            }));
        }
    }
  }, [formData.landDetails?.length, formData.landDetails?.width]);

  // --- Handlers ---

  const handleDetailChange = (field: string, value: string) => {
    setFormData(prev => ({
        ...prev,
        details: { ...prev.details!, [field]: value }
    }));
  };

  const handleLandChange = (field: string, value: string | number) => {
    setFormData(prev => ({
        ...prev,
        landDetails: { ...prev.landDetails!, [field]: value }
    }));
  };

  const handleBoundaryChange = (dir: string, value: string) => {
    setFormData(prev => ({
        ...prev,
        landDetails: { 
            ...prev.landDetails!, 
            boundaries: { ...prev.landDetails!.boundaries, [dir]: value } 
        }
    }));
  };

  const handleDimensionChange = (dir: string, value: number) => {
    setFormData(prev => {
        const currentLand = prev.landDetails || { 
            rate: 0, area: 0, length: 0, width: 0, 
            boundaries: { north: '', south: '', east: '', west: '' },
            dimensions: { north: 0, south: 0, east: 0, west: 0 }
        };
        const currentDims = currentLand.dimensions || { north: 0, south: 0, east: 0, west: 0 };
        
        return {
            ...prev,
            landDetails: { 
                ...currentLand, 
                dimensions: { ...currentDims, [dir]: value } 
            }
        };
    });
  };

  const handleObservationChange = (field: string, value: string) => {
    setFormData(prev => ({
        ...prev,
        observations: { ...prev.observations!, [field]: value }
    }));
  };

  const captureLocation = () => {
    if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser.");
        return;
    }
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            setFormData(prev => ({
                ...prev,
                location: {
                    lat: latitude,
                    lng: longitude,
                    capturedAt: new Date().toISOString()
                }
            }));
            
            // Update Map
            if (mapRef.current) {
                const latLng: L.LatLngExpression = [latitude, longitude];
                mapRef.current.setView(latLng, 18);
                if (markerRef.current) markerRef.current.setLatLng(latLng);
                else {
                    markerRef.current = L.marker(latLng).addTo(mapRef.current)
                        .bindPopup("Property Location").openPopup();
                }
            }
        },
        (error) => alert(`Error capturing location: ${error.message}`),
        { enableHighAccuracy: true }
    );
  };

  // Map Initialization
  useEffect(() => {
    if (currentStep === 2 && mapContainerRef.current && !mapRef.current) {
        const initialLat = formData.location?.lat || 29.2104;
        const initialLng = formData.location?.lng || 78.9619;
        
        mapRef.current = L.map(mapContainerRef.current).setView([initialLat, initialLng], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: 'OpenStreetMap'
        }).addTo(mapRef.current);

        if (formData.location) {
            markerRef.current = L.marker([formData.location.lat, formData.location.lng]).addTo(mapRef.current);
        }
    }
  }, [currentStep]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: SurveyMedia['type']) => {
    if (!e.target.files?.length || !user) return;
    const file = e.target.files[0];
    setUploading(true);

    try {
        // Create a reference
        const timestamp = Date.now();
        const storagePath = `survey-media/${surveyId || 'temp'}/${type}/${timestamp}_${file.name}`;
        const storageRef = ref(storage, storagePath);

        // Upload
        const snapshot = await uploadBytes(storageRef, file);
        const url = await getDownloadURL(snapshot.ref);

        const newMedia: SurveyMedia = {
            id: timestamp.toString(),
            url,
            type,
            timestamp: new Date().toISOString(),
            // If we had GPS from the image EXIF, we'd extract it here. 
            // For now, we use the current form location if available.
            lat: formData.location?.lat,
            lng: formData.location?.lng
        };

        setFormData(prev => ({
            ...prev,
            media: [...(prev.media || []), newMedia]
        }));

    } catch (error) {
        console.error("Upload failed", error);
        alert("Failed to upload photo. Check connection.");
    } finally {
        setUploading(false);
    }
  };

  // Measurement Helpers
  const addFloor = () => {
    const newFloor: FloorMeasurement = {
        id: Date.now().toString(),
        name: `Floor ${formData.measurements!.floors.length + 1}`,
        rooms: [],
        totalArea: 0
    };
    setFormData(prev => ({
        ...prev,
        measurements: {
            ...prev.measurements!,
            floors: [...prev.measurements!.floors, newFloor]
        }
    }));
  };

  const addRoom = (floorIndex: number) => {
    const newRoom: RoomMeasurement = {
        id: Date.now().toString(),
        name: 'New Room',
        length: 0,
        width: 0,
        area: 0
    };
    const updatedFloors = [...formData.measurements!.floors];
    updatedFloors[floorIndex].rooms.push(newRoom);
    setFormData(prev => ({
        ...prev,
        measurements: { ...prev.measurements!, floors: updatedFloors }
    }));
  };

  const updateRoom = (floorIndex: number, roomIndex: number, field: keyof RoomMeasurement, value: string | number) => {
    const updatedFloors = [...formData.measurements!.floors];
    const room = updatedFloors[floorIndex].rooms[roomIndex];
    // @ts-ignore
    room[field] = value;
    // Auto calc area
    room.area = room.length * room.width;
    
    setFormData(prev => ({
        ...prev,
        measurements: { ...prev.measurements!, floors: updatedFloors }
    }));
  };

  const saveSurvey = async (status: 'draft' | 'submitted' = 'draft') => {
    if (!user) return;
    setLoading(true);

    try {
        const dataToSave = {
            ...formData,
            employeeId: user.uid,
            employeeName: user.displayName || user.email,
            updatedAt: serverTimestamp(),
            status
        };

        if (status === 'submitted') {
            dataToSave.submittedAt = serverTimestamp();
        }

        if (surveyId) {
            await updateDoc(doc(db, 'surveys', surveyId), dataToSave);
        } else {
            // New doc
            const docRef = await addDoc(collection(db, 'surveys'), {
                ...dataToSave,
                createdAt: serverTimestamp()
            });
            // Ideally redirect or update ID here
        }
        
        if (status === 'submitted') {
            alert("Survey Submitted Successfully!");
            onBack();
        } else {
            alert("Draft Saved.");
        }

    } catch (error) {
        console.error("Save error", error);
        alert("Error saving survey. Please try again.");
    } finally {
        setLoading(false);
    }
  };

  // --- Render Steps ---

  const renderStepContent = () => {
    switch(currentStep) {
        case 0: // Case Info
            return (
                <div className="space-y-6 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Bank / Client</label>
                            <select 
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                                value={formData.bankName}
                                onChange={e => setFormData({...formData, bankName: e.target.value})}
                            >
                                <option value="">Select Bank...</option>
                                {config.banks.map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Case Reference ID</label>
                            <input 
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                                placeholder="e.g. VAL/2024/001"
                                value={formData.caseId}
                                onChange={e => setFormData({...formData, caseId: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Property Type</label>
                            <select 
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                                value={formData.propertyType}
                                onChange={e => setFormData({...formData, propertyType: e.target.value as any})}
                            >
                                <option>Residential</option>
                                <option>Commercial</option>
                                <option>Industrial</option>
                                <option>Land</option>
                            </select>
                        </div>
                    </div>
                </div>
            );
        case 1: // Property Details
            return (
                <div className="space-y-6 animate-fade-in pb-20">
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input placeholder="Owner Name" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-medium" value={formData.details?.ownerName} onChange={e => handleDetailChange('ownerName', e.target.value)} />
                            <input placeholder="Customer Phone" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-medium" value={formData.details?.customerPhone} onChange={e => handleDetailChange('customerPhone', e.target.value)} />
                        </div>
                        
                        <textarea placeholder="Full Address" rows={3} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-medium" value={formData.details?.address} onChange={e => handleDetailChange('address', e.target.value)} />
                        <div className="grid grid-cols-2 gap-4">
                            <input placeholder="Locality" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-medium" value={formData.details?.locality} onChange={e => handleDetailChange('locality', e.target.value)} />
                            <input placeholder="City" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-medium" value={formData.details?.city} onChange={e => handleDetailChange('city', e.target.value)} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <input placeholder="Pincode" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-medium" value={formData.details?.pincode} onChange={e => handleDetailChange('pincode', e.target.value)} />
                            <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-medium" value={formData.details?.occupancy} onChange={e => handleDetailChange('occupancy', e.target.value)}>
                                <option>Self Occupied</option><option>Tenant</option><option>Vacant</option><option>Under Construction</option>
                            </select>
                        </div>
                    </div>

                    {/* Boundaries Section */}
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-2 mb-4 text-slate-500 font-bold uppercase text-xs tracking-wider">
                            <Compass size={16} /> Site Boundaries
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col">
                                <label className="text-[10px] font-bold text-slate-400 mb-1 ml-1">North</label>
                                <input placeholder="e.g. Road 20ft wide" className="w-full p-3 bg-white border border-slate-200 rounded-xl font-medium text-sm" value={formData.landDetails?.boundaries.north} onChange={e => handleBoundaryChange('north', e.target.value)} />
                            </div>
                            <div className="flex flex-col">
                                <label className="text-[10px] font-bold text-slate-400 mb-1 ml-1">South</label>
                                <input placeholder="e.g. Other's Property" className="w-full p-3 bg-white border border-slate-200 rounded-xl font-medium text-sm" value={formData.landDetails?.boundaries.south} onChange={e => handleBoundaryChange('south', e.target.value)} />
                            </div>
                            <div className="flex flex-col">
                                <label className="text-[10px] font-bold text-slate-400 mb-1 ml-1">East</label>
                                <input placeholder="e.g. Park" className="w-full p-3 bg-white border border-slate-200 rounded-xl font-medium text-sm" value={formData.landDetails?.boundaries.east} onChange={e => handleBoundaryChange('east', e.target.value)} />
                            </div>
                            <div className="flex flex-col">
                                <label className="text-[10px] font-bold text-slate-400 mb-1 ml-1">West</label>
                                <input placeholder="e.g. House No. 12" className="w-full p-3 bg-white border border-slate-200 rounded-xl font-medium text-sm" value={formData.landDetails?.boundaries.west} onChange={e => handleBoundaryChange('west', e.target.value)} />
                            </div>
                        </div>
                    </div>
                </div>
            );
        case 2: // GPS
            return (
                <div className="space-y-6 animate-fade-in h-full flex flex-col">
                    <div className="bg-slate-100 rounded-2xl p-6 text-center">
                        {formData.location ? (
                            <div className="text-green-600 font-bold flex flex-col items-center gap-2">
                                <CheckCircle2 size={32} />
                                <div>
                                    <div className="text-lg">Location Captured</div>
                                    <div className="text-xs opacity-70">{formData.location.lat.toFixed(6)}, {formData.location.lng.toFixed(6)}</div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-slate-400 font-medium">No GPS Data</div>
                        )}
                        <button onClick={captureLocation} className="mt-4 bg-primary text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 w-full active:scale-95 transition-transform">
                            <Crosshair size={20} /> {formData.location ? 'Update Location' : 'Capture Current Location'}
                        </button>
                    </div>
                    <div ref={mapContainerRef} className="flex-1 min-h-[300px] bg-slate-200 rounded-2xl overflow-hidden shadow-inner border border-slate-300 relative z-0" />
                </div>
            );
        case 3: // Media
            const photoTypes: SurveyMedia['type'][] = ['front', 'rear', 'left', 'right', 'interior', 'road'];
            return (
                <div className="space-y-6 animate-fade-in pb-20">
                    <div className="grid grid-cols-2 gap-4">
                        {photoTypes.map(type => {
                            const existing = formData.media?.find(m => m.type === type);
                            return (
                                <div key={type} className="relative aspect-square bg-slate-100 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center overflow-hidden hover:border-primary transition-colors group">
                                    {existing ? (
                                        <>
                                            <img src={existing.url} alt={type} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <button 
                                                    onClick={() => setFormData(prev => ({ ...prev, media: prev.media?.filter(m => m.id !== existing.id) }))}
                                                    className="p-2 bg-white rounded-full text-red-500"
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
                                            {uploading ? <Loader2 className="animate-spin text-primary" /> : <Camera className="text-slate-400 mb-2" size={24} />}
                                            <span className="text-xs font-bold text-slate-500 uppercase">{type}</span>
                                            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handlePhotoUpload(e, type)} disabled={uploading} />
                                        </label>
                                    )}
                                    <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-[10px] text-white font-bold uppercase">{type}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        case 4: // Measurements
            return (
                <div className="space-y-6 animate-fade-in pb-20">
                    {/* Land Details Section */}
                    <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 mb-6">
                        <div className="flex justify-between items-center mb-4">
                            <span className="font-bold text-indigo-900 text-sm uppercase tracking-wide">Plot / Land Details</span>
                            <span className="text-xl font-black text-indigo-600">{formData.landDetails?.area?.toFixed(2)} <span className="text-xs font-bold text-indigo-400">sq.ft</span></span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-bold text-indigo-400 mb-1 ml-1 uppercase">Approx Dimensions</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <input type="number" placeholder="Length" className="p-3 bg-white border border-indigo-200 rounded-xl font-bold text-sm text-indigo-900" value={formData.landDetails?.length} onChange={e => handleLandChange('length', parseFloat(e.target.value) || 0)} />
                                    <input type="number" placeholder="Width" className="p-3 bg-white border border-indigo-200 rounded-xl font-bold text-sm text-indigo-900" value={formData.landDetails?.width} onChange={e => handleLandChange('width', parseFloat(e.target.value) || 0)} />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-indigo-400 mb-1 ml-1 uppercase">Market Rate (₹)</label>
                                <input type="number" placeholder="₹ Rate / sqft" className="w-full p-3 bg-white border border-indigo-200 rounded-xl font-bold text-sm text-indigo-900" value={formData.landDetails?.rate} onChange={e => handleLandChange('rate', parseFloat(e.target.value) || 0)} />
                            </div>
                        </div>

                        {/* Side Dimensions Grid */}
                        <div className="mt-4 pt-4 border-t border-indigo-200/50">
                            <label className="text-[10px] font-bold text-indigo-400 mb-2 ml-1 uppercase block">Side Dimensions (ft)</label>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-indigo-400">N</span>
                                    <input type="number" placeholder="0.00" className="w-full pl-8 p-2.5 bg-white border border-indigo-200 rounded-lg text-sm font-bold text-indigo-900 outline-none focus:border-indigo-400" value={formData.landDetails?.dimensions?.north} onChange={e => handleDimensionChange('north', parseFloat(e.target.value) || 0)} />
                                </div>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-indigo-400">S</span>
                                    <input type="number" placeholder="0.00" className="w-full pl-8 p-2.5 bg-white border border-indigo-200 rounded-lg text-sm font-bold text-indigo-900 outline-none focus:border-indigo-400" value={formData.landDetails?.dimensions?.south} onChange={e => handleDimensionChange('south', parseFloat(e.target.value) || 0)} />
                                </div>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-indigo-400">E</span>
                                    <input type="number" placeholder="0.00" className="w-full pl-8 p-2.5 bg-white border border-indigo-200 rounded-lg text-sm font-bold text-indigo-900 outline-none focus:border-indigo-400" value={formData.landDetails?.dimensions?.east} onChange={e => handleDimensionChange('east', parseFloat(e.target.value) || 0)} />
                                </div>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-indigo-400">W</span>
                                    <input type="number" placeholder="0.00" className="w-full pl-8 p-2.5 bg-white border border-indigo-200 rounded-lg text-sm font-bold text-indigo-900 outline-none focus:border-indigo-400" value={formData.landDetails?.dimensions?.west} onChange={e => handleDimensionChange('west', parseFloat(e.target.value) || 0)} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between items-center bg-slate-100 p-4 rounded-xl">
                        <span className="font-bold text-slate-700">Total Built-up Area</span>
                        <span className="text-2xl font-black text-primary">{formData.measurements?.totalBuiltUpArea} <span className="text-sm font-medium text-slate-500">{formData.measurements?.unit}</span></span>
                    </div>
                    
                    {formData.measurements?.floors.map((floor, fIdx) => (
                        <div key={floor.id} className="border border-slate-200 rounded-2xl overflow-hidden">
                            <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
                                <input 
                                    className="bg-transparent font-bold text-slate-700 outline-none" 
                                    value={floor.name}
                                    onChange={e => {
                                        const newFloors = [...formData.measurements!.floors];
                                        newFloors[fIdx].name = e.target.value;
                                        setFormData(prev => ({...prev, measurements: {...prev.measurements!, floors: newFloors}}));
                                    }}
                                />
                                <span className="text-xs font-bold bg-blue-100 text-blue-600 px-2 py-1 rounded">{floor.totalArea} {formData.measurements?.unit}</span>
                            </div>
                            <div className="p-4 space-y-4">
                                {floor.rooms.map((room, rIdx) => (
                                    <div key={room.id} className="grid grid-cols-12 gap-2 items-center">
                                        <input className="col-span-4 p-2 bg-slate-50 rounded border border-slate-200 text-sm font-medium" placeholder="Room Name" value={room.name} onChange={e => updateRoom(fIdx, rIdx, 'name', e.target.value)} />
                                        <input type="number" className="col-span-3 p-2 bg-slate-50 rounded border border-slate-200 text-sm" placeholder="L" value={room.length} onChange={e => updateRoom(fIdx, rIdx, 'length', parseFloat(e.target.value) || 0)} />
                                        <input type="number" className="col-span-3 p-2 bg-slate-50 rounded border border-slate-200 text-sm" placeholder="W" value={room.width} onChange={e => updateRoom(fIdx, rIdx, 'width', parseFloat(e.target.value) || 0)} />
                                        <div className="col-span-2 text-right text-xs font-bold text-slate-500">{room.area}</div>
                                    </div>
                                ))}
                                <button onClick={() => addRoom(fIdx)} className="w-full py-2 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 font-bold text-xs hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-1">+ Add Room</button>
                            </div>
                        </div>
                    ))}
                    
                    <button onClick={addFloor} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-lg active:scale-95 transition-transform">Add New Floor</button>
                </div>
            );
        case 5: // Remarks
            return (
                <div className="space-y-6 animate-fade-in pb-20">
                    <div>
                        <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Construction Quality</label>
                        <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-medium" value={formData.observations?.constructionQuality} onChange={e => handleObservationChange('constructionQuality', e.target.value)}>
                            <option>Excellent</option><option>Good</option><option>Average</option><option>Poor</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Surroundings / Development</label>
                        <textarea rows={3} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-medium" value={formData.observations?.surroundings} onChange={e => handleObservationChange('surroundings', e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Overall Remarks</label>
                        <textarea rows={4} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-medium" value={formData.observations?.overallRemarks} onChange={e => handleObservationChange('overallRemarks', e.target.value)} />
                    </div>
                </div>
            );
        default: return null;
    }
  };

  return (
    <>
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
        {/* Header */}
        <div className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-4 shrink-0 shadow-sm z-20">
            <div className="flex items-center gap-3">
                <button onClick={onBack} className="p-2 text-slate-500 hover:bg-slate-50 rounded-full"><ArrowLeft size={24} /></button>
                <h2 className="font-bold text-lg text-slate-900">Survey Pad</h2>
            </div>
            <div className="flex gap-2">
                <button 
                  onClick={() => setShowChat(true)}
                  className="p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-full flex items-center gap-2 px-3"
                  title="Open Case Chat"
                >
                    <MessageSquare size={20} /> <span className="text-xs font-bold hidden sm:inline">Case Chat</span>
                </button>
                <button onClick={() => saveSurvey('draft')} className="p-2 text-blue-600 hover:bg-blue-50 rounded-full" disabled={loading}><Save size={24} /></button>
            </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-slate-100 w-full shrink-0">
            <div className="h-full bg-primary transition-all duration-300" style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }} />
        </div>

        {/* Step Navigation Tabs (Scrollable) */}
        <div className="h-14 bg-slate-50 border-b border-slate-200 flex items-center overflow-x-auto px-4 gap-4 shrink-0 no-scrollbar">
            {STEPS.map((step, idx) => {
                const Icon = step.icon;
                const isActive = currentStep === idx;
                const isCompleted = currentStep > idx;
                
                return (
                    <button 
                        key={step.id} 
                        onClick={() => setCurrentStep(idx)}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-all ${isActive ? 'bg-primary text-white shadow-md' : isCompleted ? 'bg-green-100 text-green-700' : 'text-slate-400'}`}
                    >
                        <Icon size={14} /> {step.label}
                    </button>
                )
            })}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-white custom-scrollbar">
            {renderStepContent()}
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-slate-100 bg-white shrink-0 flex justify-between items-center safe-area-pb">
            <button 
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
                className="px-6 py-3 rounded-xl font-bold text-slate-500 disabled:opacity-30 hover:bg-slate-50 transition-colors"
            >
                Back
            </button>
            
            {currentStep === STEPS.length - 1 ? (
                <button 
                    onClick={() => saveSurvey('submitted')}
                    disabled={loading}
                    className="px-8 py-3 bg-green-600 text-white rounded-xl font-bold shadow-lg shadow-green-200 active:scale-95 transition-all flex items-center gap-2"
                >
                    {loading ? <Loader2 className="animate-spin" /> : <Send size={18} />} Submit Survey
                </button>
            ) : (
                <button 
                    onClick={() => setCurrentStep(Math.min(STEPS.length - 1, currentStep + 1))}
                    className="px-8 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-blue-200 active:scale-95 transition-all flex items-center gap-2"
                >
                    Next <ChevronRight size={18} />
                </button>
            )}
        </div>
    </div>
    
    {/* Chat Overlay */}
    {showChat && (
        <div className="fixed inset-0 z-[60] bg-white">
            <SecureChat 
                initialCaseId={formData.caseId || 'DRAFT-CASE'} 
                onClose={() => setShowChat(false)} 
            />
        </div>
    )}
    </>
  );
};

export default SurveyPad;
