
import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import { 
  LayoutDashboard, FileText, User, LogOut, Search, RefreshCw, X, ArrowLeft, 
  MapPin, ClipboardList, Send, Loader2, Grid, Wrench, Landmark, StickyNote, 
  ShieldCheck, ExternalLink, Map as MapIcon, Plus, BarChart3, 
  Contact, Tablet, MessageSquare, Car, Building, Users, CheckCircle2, Clock, Menu, Filter, Crosshair, Save, Layers, Calendar, Navigation, Compass,
  TrendingUp, AlertCircle, Banknote, Timer, Award, UserCheck, Phone, CheckSquare, ArrowUpRight, ArrowDownRight, Wallet,
  Globe, Calculator, PieChart, PenTool, Box, Briefcase, Link as LinkIcon, Star, Layout, Fingerprint
} from 'lucide-react';
import { useSite } from '../../contexts/SiteContext';
import { collection, addDoc, query, where, limit, orderBy, onSnapshot, serverTimestamp, getDocs, updateDoc, doc, increment } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { ExternalApp, PropertyRecord, ContactRecord, AttendanceRecord, InvoiceRecord, PerformanceMetrics } from '../../types';
import SurveyPad from '../survey/SurveyPad';
import SecureChat from '../chat/SecureChat';

// --- Utility Components ---

const UnitConverterTool = ({ onBack }: { onBack: () => void }) => {
  const [amount, setAmount] = useState<string>('');
  const [fromUnit, setFromUnit] = useState<string>('Square Feet');
  const [toUnit, setToUnit] = useState<string>('Square Meter');
  const [result, setResult] = useState<string | null>(null);

  const conversionFactors: Record<string, number> = {
    'Square Feet': 1, 'Square Yard': 9, 'Square Meter': 10.76, 'Acre': 43560,
    'Hectare': 107639, 'Gaj': 9, 'Bigha (Pucca)': 27225, 'Ground': 2400
  };

  const handleConvert = () => {
    const val = parseFloat(amount);
    if (isNaN(val)) return;
    const res = (val * conversionFactors[fromUnit]) / conversionFactors[toUnit];
    setResult(`${val} ${fromUnit} = ${res.toLocaleString('en-IN', { maximumFractionDigits: 4 })} ${toUnit}`);
  };

  return (
    <div className="max-w-2xl animate-fade-in mx-auto">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-6 font-bold uppercase text-[10px] tracking-widest group"><ArrowLeft size={18} /> Back to Hub</button>
        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl">
            <h3 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-4"><div className="p-3 bg-orange-50 text-orange-600 rounded-2xl shadow-sm"><RefreshCw size={24} /></div> Area Dimension Converter</h3>
            <div className="space-y-6">
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Input Value</label>
                    <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="w-full px-6 py-5 rounded-2xl border border-slate-200 outline-none focus:ring-4 focus:ring-primary/10 transition-all text-2xl font-black bg-slate-50" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <select value={fromUnit} onChange={(e) => setFromUnit(e.target.value)} className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-white font-bold text-slate-700 outline-none">{Object.keys(conversionFactors).map(u => <option key={u} value={u}>{u}</option>)}</select>
                    <select value={toUnit} onChange={(e) => setToUnit(e.target.value)} className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-white font-bold text-slate-700 outline-none">{Object.keys(conversionFactors).map(u => <option key={u} value={u}>{u}</option>)}</select>
                </div>
                <button onClick={handleConvert} className="w-full bg-slate-900 text-white font-black py-5 rounded-[1.5rem] hover:bg-black transition-all shadow-xl active:scale-95">Scale Geometry</button>
                {result && <div className="p-8 bg-primary text-white rounded-[2rem] font-black text-xl text-center shadow-2xl animate-fade-in">{result}</div>}
            </div>
        </div>
    </div>
  );
};

const MortgageTool = ({ onBack }: { onBack: () => void }) => {
    const [loan, setLoan] = useState('5000000');
    const [rate, setRate] = useState('8.5');
    const [tenure, setTenure] = useState('20');
    const [emi, setEmi] = useState<number | null>(null);

    const calculateEMI = () => {
        const p = parseFloat(loan);
        const r = parseFloat(rate) / 12 / 100;
        const n = parseFloat(tenure) * 12;
        const e = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
        setEmi(Math.round(e));
    };

    return (
        <div className="max-w-2xl animate-fade-in mx-auto">
            <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-6 font-bold uppercase text-[10px] tracking-widest group"><ArrowLeft size={18} /> Back</button>
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl">
                <h3 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-4"><div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl shadow-sm"><Landmark size={24} /></div> Institutional EMI Estimator</h3>
                <div className="space-y-6">
                    <input type="number" value={loan} onChange={e => setLoan(e.target.value)} className="w-full px-6 py-4 rounded-2xl border border-slate-200 outline-none font-black text-xl bg-slate-50" placeholder="Loan Amount" />
                    <div className="grid grid-cols-2 gap-4">
                        <input type="number" value={rate} onChange={e => setRate(e.target.value)} className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none font-black bg-slate-50" placeholder="Interest %" step="0.1" />
                        <input type="number" value={tenure} onChange={e => setTenure(e.target.value)} className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none font-black bg-slate-50" placeholder="Years" />
                    </div>
                    <button onClick={calculateEMI} className="w-full bg-primary text-white font-black py-5 rounded-[1.5rem] hover:bg-primary-dark transition-all shadow-2xl active:scale-95">Calculate Payment</button>
                    {emi !== null && (
                        <div className="p-10 bg-slate-900 text-white rounded-[2rem] text-center border-b-8 border-primary shadow-2xl">
                            <div className="text-[10px] uppercase font-black text-slate-500 tracking-[0.4em] mb-1">Monthly Installment</div>
                            <div className="text-5xl font-black text-primary-light">₹{emi.toLocaleString('en-IN')}</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const NotesTool = ({ onBack }: { onBack: () => void }) => {
    const [note, setNote] = useState('');
    const [savedNotes, setSavedNotes] = useState<string[]>(() => {
        const saved = localStorage.getItem('abs_survey_pad');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => { localStorage.setItem('abs_survey_pad', JSON.stringify(savedNotes)); }, [savedNotes]);

    const handleSave = () => { if (!note.trim()) return; setSavedNotes([note, ...savedNotes]); setNote(''); };

    return (
        <div className="max-w-2xl animate-fade-in mx-auto">
            <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-6 font-bold uppercase text-[10px] tracking-widest group"><ArrowLeft size={18} /> Back</button>
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl">
                <h3 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-4"><div className="p-3 bg-purple-50 text-purple-600 rounded-2xl shadow-sm"><StickyNote size={26} /></div> Digital Survey Pad</h3>
                <textarea placeholder="Quick observations from the field..." rows={4} className="w-full px-6 py-5 rounded-[1.5rem] border border-slate-200 bg-slate-50 outline-none font-medium mb-4" value={note} onChange={e => setNote(e.target.value)} />
                <button onClick={handleSave} className="w-full bg-slate-900 text-white py-5 rounded-[1.5rem] font-black shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all"><Plus size={20} /> Save Site Note</button>
                <div className="mt-8 space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    {savedNotes.map((n, i) => <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-600">{n}</div>)}
                    {savedNotes.length === 0 && <p className="text-center text-slate-400 py-4 text-xs italic">No site notes captured.</p>}
                </div>
            </div>
        </div>
    );
};

// --- Performance & Attendance Components ---

const AttendanceWidget = () => {
    // ... same as before
    const { user } = useSite();
    const [status, setStatus] = useState<'checked-out' | 'checked-in'>('checked-out');
    const [loading, setLoading] = useState(false);
    const [todayLog, setTodayLog] = useState<AttendanceRecord | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (!user) return;
        const todayStr = new Date().toISOString().split('T')[0];
        const q = query(collection(db, 'attendance'), where('userId', '==', user.uid), where('date', '==', todayStr), limit(1));
        const unsub = onSnapshot(q, {
            next: (snap) => {
                if (!snap.empty) {
                    const log = { id: snap.docs[0].id, ...snap.docs[0].data() } as AttendanceRecord;
                    setTodayLog(log);
                    setStatus(log.checkOut ? 'checked-out' : 'checked-in');
                } else {
                    setTodayLog(null);
                    setStatus('checked-out');
                }
            },
            error: (err) => {
                if (err.code !== 'permission-denied') {
                    console.error("Attendance error", err);
                }
            }
        });
        return () => unsub();
    }, [user]);

    const handlePunch = async () => {
        if (!user) return;
        setLoading(true);
        if (!navigator.geolocation) {
            alert("Geolocation required for attendance.");
            setLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(async (pos) => {
            const todayStr = new Date().toISOString().split('T')[0];
            try {
                if (status === 'checked-out' && !todayLog) {
                    const isLate = new Date().getHours() >= 10;
                    await addDoc(collection(db, 'attendance'), {
                        userId: user.uid,
                        userName: user.displayName || user.email,
                        date: todayStr,
                        checkIn: serverTimestamp(),
                        status: isLate ? 'Late' : 'Present',
                        location: { lat: pos.coords.latitude, lng: pos.coords.longitude }
                    });
                } else if (status === 'checked-in' && todayLog) {
                    await updateDoc(doc(db, 'attendance', todayLog.id), { checkOut: serverTimestamp() });
                }
            } catch (err: any) { 
                if (err.code !== 'permission-denied') {
                    console.error("Attendance Error", err); 
                    alert("Failed to mark attendance."); 
                } else {
                    alert("Attendance access restricted.");
                }
            } finally { setLoading(false); }
        }, (err) => { alert("Location access denied."); setLoading(false); });
    };

    return (
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
            <div className="relative z-10 flex flex-col items-center text-center">
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">Attendance</div>
                <div className="text-4xl font-black mb-1 font-mono">{currentTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                <div className="text-sm text-slate-400 font-medium mb-8">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
                <button 
                    onClick={handlePunch}
                    disabled={loading || (status === 'checked-out' && todayLog !== null)}
                    className={`w-40 h-40 rounded-full border-8 flex flex-col items-center justify-center transition-all active:scale-95 shadow-2xl ${
                        loading ? 'border-slate-600 bg-slate-700' :
                        status === 'checked-out' && !todayLog ? 'border-emerald-500/30 bg-emerald-500 hover:bg-emerald-400 text-white' :
                        status === 'checked-in' ? 'border-rose-500/30 bg-rose-500 hover:bg-rose-400 text-white' :
                        'border-slate-700 bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                >
                    {loading ? <Loader2 className="animate-spin" size={32} /> : 
                     status === 'checked-out' && !todayLog ? <><Fingerprint size={40} /><span className="text-xs font-black mt-2 uppercase tracking-wide">Punch In</span></> :
                     status === 'checked-in' ? <><LogOut size={40} /><span className="text-xs font-black mt-2 uppercase tracking-wide">Punch Out</span></> :
                     <><CheckCircle2 size={40} /><span className="text-xs font-black mt-2 uppercase tracking-wide">Done</span></>
                    }
                </button>
            </div>
        </div>
    );
};

const BillingWidget = () => {
    // ... same as before
    const { user } = useSite();
    const [bills, setBills] = useState<InvoiceRecord[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [newBill, setNewBill] = useState({ clientName: '', amount: '', invoiceNo: '', invoiceDate: new Date().toISOString().split('T')[0] });

    useEffect(() => {
        if(!user) return;
        // Removed orderBy to prevent permission denied errors on compound queries without index
        const q = query(collection(db, 'invoices'), where('userId', '==', user.uid));
        const unsub = onSnapshot(q, {
            next: (snap) => {
                const fetchedBills = snap.docs.map(doc => ({id: doc.id, ...doc.data()} as InvoiceRecord));
                // Sort client side
                fetchedBills.sort((a, b) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime());
                setBills(fetchedBills);
            },
            error: (err) => console.error("Billing fetch error", err)
        });
        return () => unsub();
    }, [user]);

    const handleRaiseBill = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!user) return;
        await addDoc(collection(db, 'invoices'), {
            userId: user.uid,
            ...newBill,
            amount: parseFloat(newBill.amount),
            status: 'Draft', 
            dueDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0]
        });
        setShowForm(false);
        setNewBill({ clientName: '', amount: '', invoiceNo: '', invoiceDate: new Date().toISOString().split('T')[0] });
    };

    const pendingAmount = bills.filter(b => b.status !== 'Paid').reduce((acc, curr) => acc + curr.amount, 0);

    return (
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col h-full">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="font-black text-xl text-slate-900">Billing</h3>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Outstanding: ₹{pendingAmount.toLocaleString()}</p>
                </div>
                <button onClick={() => setShowForm(!showForm)} className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors">
                    {showForm ? <X size={20} /> : <Plus size={20} />}
                </button>
            </div>

            {showForm ? (
                <form onSubmit={handleRaiseBill} className="space-y-4 animate-fade-in">
                    <input required placeholder="Invoice #" className="w-full p-3 bg-slate-50 rounded-xl text-sm font-bold border border-slate-200" value={newBill.invoiceNo} onChange={e => setNewBill({...newBill, invoiceNo: e.target.value})} />
                    <input required placeholder="Client / Bank" className="w-full p-3 bg-slate-50 rounded-xl text-sm font-bold border border-slate-200" value={newBill.clientName} onChange={e => setNewBill({...newBill, clientName: e.target.value})} />
                    <input required type="number" placeholder="Amount (₹)" className="w-full p-3 bg-slate-50 rounded-xl text-sm font-bold border border-slate-200" value={newBill.amount} onChange={e => setNewBill({...newBill, amount: e.target.value})} />
                    <input required type="date" className="w-full p-3 bg-slate-50 rounded-xl text-sm font-bold border border-slate-200" value={newBill.invoiceDate} onChange={e => setNewBill({...newBill, invoiceDate: e.target.value})} />
                    <button type="submit" className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-wider">Create Invoice</button>
                </form>
            ) : (
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
                    {bills.length === 0 ? <p className="text-center text-slate-400 text-xs italic py-10">No pending bills.</p> :
                        bills.map(bill => (
                            <div key={bill.id} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-100 group hover:border-indigo-100 transition-colors">
                                <div>
                                    <div className="font-bold text-slate-800 text-sm">{bill.clientName}</div>
                                    <div className="text-[10px] text-slate-400 font-bold">INV-{bill.invoiceNo} • {bill.status}</div>
                                </div>
                                <div className="text-right">
                                    <div className="font-black text-slate-900 text-sm">₹{bill.amount.toLocaleString()}</div>
                                    <div className="text-[10px] text-red-400 font-bold">{bill.dueDate < new Date().toISOString().split('T')[0] && bill.status !== 'Paid' ? 'Overdue' : ''}</div>
                                </div>
                            </div>
                        ))
                    }
                </div>
            )}
        </div>
    );
};

const PerformanceMeter = ({ metrics }: { metrics: any }) => {
    // ... same as before
    const score = React.useMemo(() => {
        const attendanceScore = Math.min(metrics.attendance, 100);
        const workScore = metrics.completedCases > 0 ? (metrics.completedCases / (metrics.completedCases + metrics.pendingCases)) * 100 : 0;
        const timeScore = metrics.timelyReports;
        const total = (attendanceScore * 0.2) + (workScore * 0.4) + (timeScore * 0.4);
        return Math.round(total) || 0;
    }, [metrics]);

    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (score / 100) * circumference;
    const scoreColor = score >= 80 ? 'text-emerald-500' : score >= 60 ? 'text-amber-500' : 'text-rose-500';
    const strokeColor = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#f43f5e';
    const ratingLabel = score >= 90 ? 'Outstanding' : score >= 80 ? 'Excellent' : score >= 70 ? 'Good' : score >= 60 ? 'At Risk' : 'Critical';

    return (
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center relative overflow-hidden h-full group">
            <h3 className="font-black text-xl text-slate-900 mb-6 z-10">Performance Score</h3>
            <div className="relative z-10 mb-8 transform group-hover:scale-105 transition-transform duration-500">
                <svg className="transform -rotate-90 w-48 h-48 drop-shadow-xl">
                    <circle cx="96" cy="96" r={radius} stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100" />
                    <circle 
                        cx="96" cy="96" r={radius} stroke={strokeColor} strokeWidth="12" fill="transparent" 
                        strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round"
                        className="transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(0,0,0,0.2)]"
                    />
                </svg>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                    <span className={`text-5xl font-black ${scoreColor}`}>{score}</span>
                    <span className={`block text-[10px] font-bold uppercase tracking-widest mt-1 ${scoreColor}`}>{ratingLabel}</span>
                </div>
            </div>
            <div className="grid grid-cols-3 gap-4 w-full text-center z-10">
                <div><div className="text-xs text-slate-400 font-bold uppercase">Attendance</div><div className="font-black text-slate-800">{Math.round(metrics.attendance)}%</div></div>
                <div><div className="text-xs text-slate-400 font-bold uppercase">Timeliness</div><div className="font-black text-slate-800">{Math.round(metrics.timelyReports)}%</div></div>
                <div><div className="text-xs text-slate-400 font-bold uppercase">Work</div><div className="font-black text-slate-800">{(metrics.completedCases > 0 ? (metrics.completedCases / (metrics.completedCases + metrics.pendingCases)) * 100 : 0).toFixed(0)}%</div></div>
            </div>
        </div>
    );
};

// --- Performance Dashboard View ---

const PerformanceView = ({ onBack }: { onBack: () => void }) => {
    // ... same as before
    const { user } = useSite();
    const [metrics, setMetrics] = useState({
        pendingBillsCount: 0, pendingBillsAmount: 0, paidBillsCount: 0, paidBillsAmount: 0,
        pendingCases: 0, completedCases: 0, timelyReports: 0, siteVisits: 0, bankVisits: 0, attendance: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        const fetchData = async () => {
            try {
                // Remove order by to prevent index issues
                const invQ = query(collection(db, 'invoices'), where('userId', '==', user.uid));
                const invSnap = await getDocs(invQ);
                let pendingBillsCount = 0, pendingBillsAmount = 0, paidBillsCount = 0, paidBillsAmount = 0;
                invSnap.forEach(doc => { const d = doc.data(); const amt = d.amount || 0; if (d.status === 'Paid') { paidBillsCount++; paidBillsAmount += amt; } else { pendingBillsCount++; pendingBillsAmount += amt; } });

                const survQ = query(collection(db, 'surveys'), where('employeeId', '==', user.uid));
                const survSnap = await getDocs(survQ);
                let pendingCases = 0, completedCases = 0, timelyCount = 0, totalSubmitted = 0;
                survSnap.forEach(doc => { const d = doc.data(); if (d.status === 'draft') { pendingCases++; } else if (d.status === 'submitted' || d.status === 'reviewed') { completedCases++; totalSubmitted++; timelyCount++; } });
                const timelyReports = totalSubmitted > 0 ? (timelyCount / totalSubmitted) * 100 : 100;

                const logQ = query(collection(db, 'daily_work_logs'), where('userId', '==', user.uid));
                const logSnap = await getDocs(logQ);
                let siteVisits = 0, bankVisits = 0;
                logSnap.forEach(doc => { const d = doc.data(); if (d.category === 'Site Visit') siteVisits++; if (d.bank || d.category === 'Meeting') bankVisits++; });

                const attQ = query(collection(db, 'attendance'), where('userId', '==', user.uid));
                const attSnap = await getDocs(attQ);
                const distinctDays = new Set();
                attSnap.forEach(doc => { if (doc.data().date) distinctDays.add(doc.data().date); });
                const attendance = Math.min((distinctDays.size / 26) * 100, 100);

                setMetrics({ pendingBillsCount, pendingBillsAmount, paidBillsCount, paidBillsAmount, pendingCases, completedCases, timelyReports, siteVisits, bankVisits, attendance });
            } catch (err: any) { 
                if (err.code !== 'permission-denied') {
                    console.error("Error fetching performance data", err);
                }
                // Optionally handle error state
            } finally { 
                setLoading(false); 
            }
        };
        fetchData();
    }, [user]);

    if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin text-primary mx-auto" /></div>;

    const cards = [
        { label: 'Pending Bills', mainVal: `₹${(metrics.pendingBillsAmount/1000).toFixed(1)}k`, subVal: `${metrics.pendingBillsCount} Invoices`, icon: Banknote, percent: 100, color: 'rose' },
        { label: 'Paid Bills', mainVal: `₹${(metrics.paidBillsAmount/1000).toFixed(1)}k`, subVal: `${metrics.paidBillsCount} Invoices`, icon: Wallet, percent: 100, color: 'emerald' },
        { label: 'Pending Cases', mainVal: metrics.pendingCases, subVal: 'Drafts', icon: Clock, percent: (metrics.pendingCases / (metrics.pendingCases + metrics.completedCases || 1)) * 100, color: 'amber' },
        { label: 'Completed Cases', mainVal: metrics.completedCases, subVal: 'Submitted', icon: CheckSquare, percent: 100, color: 'blue' },
        { label: 'Timeliness', mainVal: `${Math.round(metrics.timelyReports)}%`, subVal: 'Within SLA', icon: Timer, percent: metrics.timelyReports, color: metrics.timelyReports > 90 ? 'emerald' : 'rose' },
        { label: 'Site Visits', mainVal: metrics.siteVisits, subVal: 'This Month', icon: MapPin, percent: Math.min((metrics.siteVisits / 30) * 100, 100), color: 'teal' },
        { label: 'Bank Visits', mainVal: metrics.bankVisits, subVal: 'Liaisoning', icon: Landmark, percent: Math.min((metrics.bankVisits / 10) * 100, 100), color: 'purple' },
        { label: 'Attendance', mainVal: `${Math.round(metrics.attendance)}%`, subVal: 'Monthly', icon: UserCheck, percent: metrics.attendance, color: metrics.attendance > 90 ? 'emerald' : 'orange' },
    ];

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex items-center gap-4">
                <button onClick={onBack} className="p-3 bg-white text-slate-500 hover:text-slate-800 rounded-xl shadow-sm"><ArrowLeft size={20} /></button>
                <div><h2 className="text-3xl font-black text-slate-900 tracking-tighter">My Performance</h2><p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Live Metrics & Analysis</p></div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 h-96"><PerformanceMeter metrics={metrics} /></div>
                <div className="lg:col-span-1 h-96"><AttendanceWidget /></div>
                <div className="lg:col-span-1 h-96"><BillingWidget /></div>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <h3 className="font-black text-xl text-slate-900 mb-6 flex items-center gap-2"><TrendingUp size={24} className="text-primary" /> Key Performance Indicators</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {cards.map((item, idx) => (
                        <div key={idx} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-200 transition-all hover:-translate-y-1 hover:shadow-lg group">
                            <div className="flex justify-between mb-4">
                                <div className={`p-3 bg-white rounded-xl shadow-sm text-${item.color}-500`}><item.icon size={20} /></div>
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg h-fit bg-${item.color}-50 text-${item.color}-600`}>{item.subVal}</span>
                            </div>
                            <div className="text-3xl font-black text-slate-900 mb-1">{item.mainVal}</div>
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">{item.label}</div>
                            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden"><div className={`h-full rounded-full bg-${item.color}-500 transition-all duration-1000`} style={{ width: `${item.percent}%` }}></div></div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// --- Survey Map Tool (Leaflet Implementation) ---

const MarketDataTool = ({ onBack }: { onBack?: () => void }) => {
  const { user, userRole } = useSite();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [activeSheet, setActiveSheet] = useState(false);
  const [currentCoords, setCurrentCoords] = useState<{lat: number, lng: number} | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [records, setRecords] = useState<PropertyRecord[]>([]);
  const [permissionError, setPermissionError] = useState(false);
  
  // Updated FormData with boundaries
  const [formData, setFormData] = useState({ 
      type: 'Residential', 
      rate: '', 
      areaName: '', 
      city: '',
      boundaries: { north: '', south: '', east: '', west: '' }
  });
  
  const [isMapReady, setIsMapReady] = useState(false);
  const markerLayerRef = useRef<L.LayerGroup | null>(null);
  const [filterTerm, setFilterTerm] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  
  // New State for Advanced Filtering and Searching
  const [filterType, setFilterType] = useState('All');
  const [filterDays, setFilterDays] = useState('All');
  const [searchLocationQuery, setSearchLocationQuery] = useState('');
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const selectionMarkerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Define Layers
    const streets = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
    });
    const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri'
    });

    const map = L.map(mapContainerRef.current, {
        center: [29.2104, 78.9619],
        zoom: 13,
        layers: [streets] // Default layer
    });

    // Add Layer Control
    L.control.layers({ "Street Map": streets, "Satellite": satellite }, undefined, { position: 'bottomright' }).addTo(map);

    markerLayerRef.current = L.layerGroup().addTo(map);

    // Map Click - Draggable Marker Logic
    map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        setCurrentCoords({ lat, lng });
        setActiveSheet(true);
        
        // Remove existing selection marker if any
        if (selectionMarkerRef.current) {
            selectionMarkerRef.current.setLatLng(e.latlng);
        } else {
            // Create draggable marker
            const marker = L.marker(e.latlng, { draggable: true, autoPan: true });
            
            marker.on('dragend', (evt) => {
                const newPos = evt.target.getLatLng();
                setCurrentCoords({ lat: newPos.lat, lng: newPos.lng });
            });
            
            marker.addTo(map);
            selectionMarkerRef.current = marker;
        }
    });

    mapRef.current = map;
    setIsMapReady(true);

    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, []);

  useEffect(() => {
    const isStaff = ['admin', 'super_admin', 'employee'].includes(userRole || '');
    // Removing orderBy from user query to prevent index error
    const q = isStaff 
        ? query(collection(db, 'market_intelligence'), orderBy('timestamp', 'desc'), limit(1000)) 
        : query(collection(db, 'market_intelligence'), where('userId', '==', user?.uid), limit(1000));
        
    const unsub = onSnapshot(q, {
        next: (snapshot) => {
            const fetchedRecords = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PropertyRecord));
            // Client side sort for user query
            if (!isStaff) {
                fetchedRecords.sort((a,b) => {
                    const tA = a.timestamp?.toMillis ? a.timestamp.toMillis() : 0;
                    const tB = b.timestamp?.toMillis ? b.timestamp.toMillis() : 0;
                    return tB - tA;
                });
            }
            setRecords(fetchedRecords);
            setPermissionError(false);
        },
        error: (err) => { 
            if (err.code === 'permission-denied') {
                setPermissionError(true);
            } else {
                console.error("Market data fetch error", err);
            }
        }
    });
    return () => unsub();
  }, [user, userRole]);

  // Derived filtered records with advanced filters
  const filteredRecords = useMemo(() => {
      let res = records;

      // Text Search
      if (filterTerm) {
          const term = filterTerm.toLowerCase();
          res = res.filter(r => 
              (r.areaName || '').toLowerCase().includes(term) || 
              (r.city || '').toLowerCase().includes(term)
          );
      }

      // Type Filter
      if (filterType !== 'All') {
          res = res.filter(r => r.type === filterType);
      }

      // Date Filter
      if (filterDays !== 'All') {
          const days = parseInt(filterDays);
          const now = new Date();
          const cutoff = new Date(now.setDate(now.getDate() - days));
          res = res.filter(r => {
              // Handle Firestore timestamp or JS Date
              const rDate = r.timestamp?.toDate ? r.timestamp.toDate() : new Date(r.timestamp);
              return rDate >= cutoff;
          });
      }

      return res;
  }, [records, filterTerm, filterType, filterDays]);

  useEffect(() => {
    if (!isMapReady || !mapRef.current || !markerLayerRef.current) return;
    markerLayerRef.current.clearLayers();
    filteredRecords.forEach(data => {
        const color = data.type === 'Commercial' ? '#3b82f6' : '#10b981';
        L.circleMarker([data.lat, data.lng], { radius: 8, fillColor: color, color: '#fff', weight: 2, opacity: 1, fillOpacity: 0.8 })
        .bindPopup(`
            <div style="font-family: sans-serif;">
                <b style="font-size:14px;">${data.type}</b><br/>
                <span style="font-size:16px; font-weight:bold; color:#2563eb;">₹${data.rate}</span><br/>
                <span style="font-size:11px; color:#666; font-weight:600;">${data.areaName}</span>
                ${data.boundaries && (data.boundaries.north || data.boundaries.south || data.boundaries.east || data.boundaries.west) ? `
                    <div style="margin-top:6px; padding-top:6px; border-top:1px solid #eee; font-size:10px; color:#444; line-height:1.4;">
                        ${data.boundaries.north ? `<div><b style="color:#888;">N:</b> ${data.boundaries.north}</div>` : ''}
                        ${data.boundaries.south ? `<div><b style="color:#888;">S:</b> ${data.boundaries.south}</div>` : ''}
                        ${data.boundaries.east ? `<div><b style="color:#888;">E:</b> ${data.boundaries.east}</div>` : ''}
                        ${data.boundaries.west ? `<div><b style="color:#888;">W:</b> ${data.boundaries.west}</div>` : ''}
                    </div>
                ` : ''}
            </div>
        `)
        .addTo(markerLayerRef.current!);
    });
  }, [isMapReady, filteredRecords]);

  // Clean up selection marker when sheet closes
  useEffect(() => {
      if (!activeSheet && selectionMarkerRef.current && mapRef.current) {
          selectionMarkerRef.current.remove();
          selectionMarkerRef.current = null;
      }
  }, [activeSheet]);

  const handleLocationSearch = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!searchLocationQuery.trim() || !mapRef.current) return;
      setIsSearchingLocation(true);
      
      try {
          const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchLocationQuery)}`);
          const data = await response.json();
          
          if (data && data.length > 0) {
              const { lat, lon } = data[0];
              mapRef.current.flyTo([parseFloat(lat), parseFloat(lon)], 16);
          } else {
              alert("Location not found");
          }
      } catch (err) {
          console.error(err);
      } finally {
          setIsSearchingLocation(false);
      }
  };

  const saveRecord = async () => {
    if (!user || !currentCoords || !formData.rate || !formData.areaName) {
        alert("Please fill in Rate and Area Name.");
        return;
    }
    setIsSaving(true);
    try {
        await addDoc(collection(db, 'market_intelligence'), {
            lat: currentCoords.lat,
            lng: currentCoords.lng,
            type: formData.type,
            rate: parseFloat(formData.rate),
            areaName: formData.areaName,
            city: formData.city,
            boundaries: formData.boundaries, // Save boundaries
            userId: user.uid,
            recordedBy: user.email?.split('@')[0] || 'Staff',
            timestamp: serverTimestamp()
        });
        setActiveSheet(false);
        setFormData({ type: 'Residential', rate: '', areaName: '', city: '', boundaries: { north: '', south: '', east: '', west: '' } });
        alert("Market Rate Recorded Successfully");
    } catch (err) {
        console.error("Error saving market data:", err);
        alert("Failed to record data. Check permissions.");
    } finally {
        setIsSaving(false);
    }
  };

  const handleGetCurrentLocation = () => {
    setIsLocating(true);
    if (!navigator.geolocation) {
        alert("Geolocation is not supported.");
        setIsLocating(false);
        return;
    }
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            const { latitude, longitude } = pos.coords;
            if (mapRef.current) {
                mapRef.current.setView([latitude, longitude], 16);
                L.circleMarker([latitude, longitude], {
                    radius: 8,
                    fillColor: '#3b82f6',
                    color: '#fff',
                    weight: 3,
                    opacity: 1,
                    fillOpacity: 1
                }).addTo(mapRef.current).bindPopup("You are here").openPopup();
            }
            setIsLocating(false);
        },
        (err) => {
            console.error(err);
            alert("Location access denied or unavailable.");
            setIsLocating(false);
        },
        { enableHighAccuracy: true }
    );
  };

  return (
    <div className="relative w-full h-[600px] md:h-[calc(100vh-200px)] bg-slate-900 rounded-[3rem] overflow-hidden shadow-2xl border border-slate-200 animate-fade-in">
      <div className="absolute top-6 left-6 z-[6000] flex flex-wrap gap-2 pointer-events-none">
        <div className="pointer-events-auto flex gap-2">
            {onBack && <button onClick={onBack} className="p-3 bg-white text-slate-800 rounded-xl shadow-xl transition-all hover:bg-slate-50"><ArrowLeft size={20} /></button>}
            <div className="bg-white/95 backdrop-blur-md px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-slate-100">
                <BarChart3 className="text-primary" size={20} />
                <span className="font-extrabold text-slate-800 text-xs uppercase tracking-widest hidden sm:inline">Survey Terminal</span>
            </div>
        </div>
      </div>
      
      {/* Search & Filter Toolbar */}
      <div className="absolute top-6 right-6 z-[6000] flex flex-col items-end gap-3 max-w-[90vw]">
          {/* Location Search Bar */}
          <form onSubmit={handleLocationSearch} className="bg-white/95 backdrop-blur-md p-1.5 rounded-xl shadow-xl border border-slate-100 flex items-center gap-2 w-full sm:w-80">
              <Search size={16} className="text-slate-400 ml-2" />
              <input 
                  value={searchLocationQuery}
                  onChange={e => setSearchLocationQuery(e.target.value)}
                  placeholder="Fly to location..."
                  className="w-full bg-transparent outline-none text-xs font-bold text-slate-700 py-2"
              />
              <button type="submit" disabled={isSearchingLocation} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors">
                  {isSearchingLocation ? <Loader2 size={14} className="animate-spin" /> : <Navigation size={14} />}
              </button>
          </form>

          {/* Filters Bar */}
          <div className="flex flex-wrap justify-end gap-2">
              <div className="bg-white/95 backdrop-blur-md p-1 rounded-xl shadow-xl border border-slate-100 flex items-center">
                  <div className="px-3 py-2 border-r border-slate-100 flex items-center gap-2">
                      <Filter size={14} className="text-slate-400" />
                      <select 
                          value={filterType} 
                          onChange={(e) => setFilterType(e.target.value)}
                          className="bg-transparent outline-none text-[10px] font-bold text-slate-700 uppercase tracking-wider cursor-pointer"
                      >
                          <option value="All">All Types</option>
                          <option value="Residential">Residential</option>
                          <option value="Commercial">Commercial</option>
                          <option value="Industrial">Industrial</option>
                          <option value="Agricultural">Agricultural</option>
                      </select>
                  </div>
                  <div className="px-3 py-2 flex items-center gap-2">
                      <Calendar size={14} className="text-slate-400" />
                      <select 
                          value={filterDays} 
                          onChange={(e) => setFilterDays(e.target.value)}
                          className="bg-transparent outline-none text-[10px] font-bold text-slate-700 uppercase tracking-wider cursor-pointer"
                      >
                          <option value="All">All Time</option>
                          <option value="30">Last 30 Days</option>
                          <option value="90">Last 90 Days</option>
                      </select>
                  </div>
              </div>
          </div>
      </div>

      {/* Location Control */}
      <div className="absolute bottom-8 right-6 z-[5000]">
        <button 
            onClick={handleGetCurrentLocation}
            disabled={isLocating}
            className="p-4 bg-white text-slate-800 rounded-full shadow-xl transition-all hover:bg-slate-50 hover:scale-110 active:scale-95 disabled:opacity-70"
            title="My Location"
        >
            {isLocating ? <Loader2 className="animate-spin text-primary" size={24} /> : <Crosshair size={24} className="text-slate-700" />}
        </button>
      </div>

      {/* Data Entry Sheet */}
      {activeSheet && currentCoords && (
        <div className="absolute bottom-6 left-6 right-6 z-[6000] bg-white/95 backdrop-blur-xl p-6 rounded-[2rem] shadow-2xl border border-slate-100 animate-slide-up max-h-[80vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h4 className="text-lg font-black text-slate-900">Record Land Rate</h4>
                    <p className="text-xs font-bold text-slate-400 flex items-center gap-1">
                        <MapPin size={12} /> {currentCoords.lat.toFixed(6)}, {currentCoords.lng.toFixed(6)}
                        <span className="ml-1 text-primary text-[10px] uppercase tracking-wider">(Draggable)</span>
                    </p>
                </div>
                <button onClick={() => setActiveSheet(false)} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200"><X size={20} /></button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Property Type</label>
                    <select 
                        value={formData.type} 
                        onChange={e => setFormData({...formData, type: e.target.value})}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none"
                    >
                        <option>Residential</option>
                        <option>Commercial</option>
                        <option>Industrial</option>
                        <option>Agricultural</option>
                    </select>
                </div>
                <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Rate (₹/unit)</label>
                    <input 
                        type="number" 
                        value={formData.rate} 
                        onChange={e => setFormData({...formData, rate: e.target.value})}
                        placeholder="0.00"
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none"
                    />
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Area Name</label>
                    <input 
                        value={formData.areaName} 
                        onChange={e => setFormData({...formData, areaName: e.target.value})}
                        placeholder="Locality..."
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none"
                    />
                </div>
                <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">City</label>
                    <input 
                        value={formData.city} 
                        onChange={e => setFormData({...formData, city: e.target.value})}
                        placeholder="City..."
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none"
                    />
                </div>
            </div>

            {/* Boundary Inputs */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
                <div className="flex items-center gap-2 mb-3">
                    <Compass size={14} className="text-slate-400" />
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Plot Boundaries / Dimensions</label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-[9px] font-bold text-slate-400 ml-1 mb-1 block">North</label>
                        <input 
                            placeholder="e.g. Road 30ft" 
                            className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-medium outline-none focus:border-primary/50"
                            value={formData.boundaries.north}
                            onChange={e => setFormData({...formData, boundaries: {...formData.boundaries, north: e.target.value}})}
                        />
                    </div>
                    <div>
                        <label className="text-[9px] font-bold text-slate-400 ml-1 mb-1 block">South</label>
                        <input 
                            placeholder="e.g. Plot No 5" 
                            className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-medium outline-none focus:border-primary/50"
                            value={formData.boundaries.south}
                            onChange={e => setFormData({...formData, boundaries: {...formData.boundaries, south: e.target.value}})}
                        />
                    </div>
                    <div>
                        <label className="text-[9px] font-bold text-slate-400 ml-1 mb-1 block">East</label>
                        <input 
                            placeholder="e.g. Park" 
                            className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-medium outline-none focus:border-primary/50"
                            value={formData.boundaries.east}
                            onChange={e => setFormData({...formData, boundaries: {...formData.boundaries, east: e.target.value}})}
                        />
                    </div>
                    <div>
                        <label className="text-[9px] font-bold text-slate-400 ml-1 mb-1 block">West</label>
                        <input 
                            placeholder="e.g. House" 
                            className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-medium outline-none focus:border-primary/50"
                            value={formData.boundaries.west}
                            onChange={e => setFormData({...formData, boundaries: {...formData.boundaries, west: e.target.value}})}
                        />
                    </div>
                </div>
            </div>
            
            <button 
                onClick={saveRecord} 
                disabled={isSaving}
                className="w-full py-4 bg-primary text-white rounded-xl font-black shadow-lg shadow-blue-200 active:scale-95 transition-transform flex items-center justify-center gap-2"
            >
                {isSaving ? <Loader2 className="animate-spin" /> : <Save size={18} />} Save Market Data
            </button>
        </div>
      )}

      <div ref={mapContainerRef} className="w-full h-full z-0 relative" style={{ isolation: 'isolate' }} />
    </div>
  );
};

// --- Views ---

const WorkLogView = ({ onBack }: { onBack: () => void }) => {
    // ... same as before
    const { user } = useSite();
    const [logs, setLogs] = useState<any[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [formData, setFormData] = useState({
        category: 'Site Visit',
        status: 'Completed',
        bank: '',
        branch: '',
        customerName: '',
        place: '',
        reason: ''
    });

    useEffect(() => {
        if (!user) return;
        // Removed orderBy to prevent permission denied / index errors on user queries
        const q = query(collection(db, 'daily_work_logs'), where('userId', '==', user.uid), limit(50));
        const unsub = onSnapshot(q, {
            next: (snap) => {
                const fetchedLogs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                // Sort client side
                fetchedLogs.sort((a: any, b: any) => {
                    const tA = a.timestamp?.toMillis ? a.timestamp.toMillis() : 0;
                    const tB = b.timestamp?.toMillis ? b.timestamp.toMillis() : 0;
                    return tB - tA;
                });
                setLogs(fetchedLogs);
            },
            error: (err) => {
                if (err.code !== 'permission-denied') {
                    console.error("WorkLog load error", err);
                }
            }
        });
        return () => unsub();
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        
        try {
            await addDoc(collection(db, 'daily_work_logs'), {
                ...formData,
                userId: user.uid,
                name: user.displayName || user.email,
                timestamp: serverTimestamp(),
                location: { lat: 0, lng: 0 } 
            });
            setIsAdding(false);
            setFormData({ category: 'Site Visit', status: 'Completed', bank: '', branch: '', customerName: '', place: '', reason: '' });
        } catch (error) {
            console.error("Error adding log", error);
            alert("Failed to add log.");
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
             <div className="flex items-center gap-4 mb-4">
                <button onClick={onBack} className="p-3 bg-white text-slate-500 hover:text-slate-800 rounded-xl shadow-sm"><ArrowLeft size={20} /></button>
                <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Daily Work Log</h2>
            </div>
            
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-xl text-slate-900">New Entry</h3>
                    <button onClick={() => setIsAdding(!isAdding)} className="p-2 bg-slate-100 rounded-full">{isAdding ? <X size={20}/> : <Plus size={20}/>}</button>
                </div>
                
                {isAdding && (
                    <form onSubmit={handleSubmit} className="space-y-4 mb-8">
                        <div className="grid grid-cols-2 gap-4">
                            <select className="p-3 bg-slate-50 rounded-xl font-bold text-sm outline-none" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                                <option>Site Visit</option><option>Travel</option><option>Office Work</option><option>Meeting</option>
                            </select>
                            <select className="p-3 bg-slate-50 rounded-xl font-bold text-sm outline-none" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                                <option>Completed</option><option>In Progress</option><option>Pending</option>
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <input placeholder="Bank Name" className="p-3 bg-slate-50 rounded-xl font-medium text-sm outline-none" value={formData.bank} onChange={e => setFormData({...formData, bank: e.target.value})} />
                            <input placeholder="Customer Name" className="p-3 bg-slate-50 rounded-xl font-medium text-sm outline-none" value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} />
                        </div>
                         <input placeholder="Location / Place" className="w-full p-3 bg-slate-50 rounded-xl font-medium text-sm outline-none" value={formData.place} onChange={e => setFormData({...formData, place: e.target.value})} />
                        <textarea placeholder="Description of work..." className="w-full p-3 bg-slate-50 rounded-xl font-medium text-sm outline-none" rows={2} value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} />
                        <button type="submit" className="w-full py-3 bg-primary text-white rounded-xl font-bold shadow-lg">Submit Log</button>
                    </form>
                )}

                <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
                    {logs.map(log => (
                        <div key={log.id} className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center border border-slate-100">
                            <div>
                                <div className="font-bold text-slate-900 text-sm">{log.category} <span className="text-slate-400 font-normal">| {log.status}</span></div>
                                <div className="text-xs text-slate-500">{log.place || 'No Location'} - {log.bank || log.customerName || 'General'}</div>
                                <div className="text-[10px] text-slate-400 mt-1">{log.timestamp?.toDate().toLocaleString()}</div>
                            </div>
                        </div>
                    ))}
                    {logs.length === 0 && <p className="text-center text-slate-400 text-sm py-4">No recent logs.</p>}
                </div>
            </div>
        </div>
    );
};

const BankDirectoryTool = ({ onBack }: { onBack: () => void }) => {
    // ... same as before
    const [contacts, setContacts] = useState<ContactRecord[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    
    useEffect(() => {
        const q = query(collection(db, 'directory_contacts'), orderBy('bank', 'asc'), limit(100));
        const unsub = onSnapshot(q, {
            next: (snap) => {
                setContacts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ContactRecord)));
            },
            error: (err) => {
                if (err.code !== 'permission-denied') {
                    console.error("Bank directory fetch error", err);
                }
            }
        });
        return () => unsub();
    }, []);

    const filtered = contacts.filter(c => 
        (c.bank || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (c.city || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-fade-in">
             <div className="flex items-center gap-4 mb-4">
                <button onClick={onBack} className="p-3 bg-white text-slate-500 hover:text-slate-800 rounded-xl shadow-sm"><ArrowLeft size={20} /></button>
                <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Bank Directory</h2>
            </div>
            
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <div className="relative mb-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 rounded-xl font-medium outline-none border border-slate-200 focus:border-primary" 
                        placeholder="Search banks or cities..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto custom-scrollbar">
                    {filtered.map(c => (
                        <div key={c.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-colors">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-indigo-600 shadow-sm"><Landmark size={20} /></div>
                                <div>
                                    <div className="font-black text-slate-900 text-sm">{c.bank}</div>
                                    <div className="text-xs font-bold text-slate-400 uppercase">{c.branch}</div>
                                </div>
                            </div>
                            <div className="space-y-1 text-xs text-slate-600 ml-1">
                                <div className="flex items-center gap-2"><MapPin size={12}/> {c.city}, {c.state}</div>
                                {c.contact_person && <div className="flex items-center gap-2"><User size={12}/> {c.contact_person}</div>}
                                {c.primary_phone && <div className="flex items-center gap-2"><Phone size={12}/> <a href={`tel:${c.primary_phone}`} className="hover:text-primary">{c.primary_phone}</a></div>}
                            </div>
                        </div>
                    ))}
                    {filtered.length === 0 && <p className="col-span-full text-center text-slate-400 py-10">No contacts found.</p>}
                </div>
            </div>
        </div>
    );
};

const UserAppsView = ({ onLaunch }: { onLaunch: (id: string) => void }) => {
    const { userRole } = useSite();
    const [externalApps, setExternalApps] = useState<ExternalApp[]>([]);
    const [permissionError, setPermissionError] = useState(false);
    const [favorites, setFavorites] = useState<string[]>(() => {
        return JSON.parse(localStorage.getItem('abs_fav_apps') || '[]');
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [viewingApp, setViewingApp] = useState<ExternalApp | null>(null); // For embed modal

    const isStaff = ['super_admin', 'admin', 'employee'].includes(userRole || '');
    
    // Icons mapping for selection (User side must match Admin side keys)
    const iconOptions: Record<string, any> = {
        'LinkIcon': LinkIcon, 'Globe': Globe, 'Calculator': Calculator,
        'FileText': FileText, 'PieChart': PieChart, 'PenTool': PenTool,
        'Box': Box, 'Briefcase': Briefcase, 'Layers': Layers
    };

    const colorClasses: Record<string, string> = {
        'blue': 'bg-blue-600', 'emerald': 'bg-emerald-600',
        'purple': 'bg-purple-600', 'orange': 'bg-orange-600',
        'rose': 'bg-rose-600', 'indigo': 'bg-indigo-600',
        'slate': 'bg-slate-600'
    };
    
    useEffect(() => {
        const q = query(collection(db, 'external_apps'), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, {
            next: (snap) => {
                setExternalApps(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExternalApp)));
                setPermissionError(false);
            },
            error: (err) => {
                if (err.code === 'permission-denied') setPermissionError(true);
            }
        });
        return () => unsub();
    }, []);

    const toggleFavorite = (e: React.MouseEvent, appId: string) => {
        e.stopPropagation();
        const newFavs = favorites.includes(appId) ? favorites.filter(id => id !== appId) : [...favorites, appId];
        setFavorites(newFavs);
        localStorage.setItem('abs_fav_apps', JSON.stringify(newFavs));
    };

    const handleAppClick = async (app: ExternalApp) => {
        try {
            await updateDoc(doc(db, 'external_apps', app.id), {
                clicks: increment(1)
            });
        } catch (err: any) { 
            // Silently handle permission errors for analytics
            if (err.code !== 'permission-denied') {
                console.error("Tracking error", err); 
            }
        }

        if (app.isEmbeddable) {
            setViewingApp(app);
        } else {
            window.open(app.url, '_blank');
        }
    };

    const sortedApps = useMemo(() => {
        let apps = [...externalApps];
        if (searchTerm) {
            apps = apps.filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        return apps.sort((a, b) => {
            const aFav = favorites.includes(a.id);
            const bFav = favorites.includes(b.id);
            if (aFav && !bFav) return -1;
            if (!aFav && bFav) return 1;
            return 0;
        });
    }, [externalApps, favorites, searchTerm]);

    const systemApps = [{ id: 'work-log', name: 'Activity Log', icon: ClipboardList, color: 'bg-blue-600', desc: 'Institutional log for site visits.' }];
    if (isStaff) {
        systemApps.push({ id: 'performance', name: 'Performance', icon: TrendingUp, color: 'bg-rose-600', desc: 'Personal scores, attendance, and billing.' });
        systemApps.push({ id: 'market-data', name: 'Intelligence', icon: BarChart3, color: 'bg-primary', desc: 'Real-time property rate mapping.' });
        systemApps.push({ id: 'survey-pad', name: 'Digital Survey', icon: Tablet, color: 'bg-teal-600', desc: 'On-site property survey pad with offline support.' });
        systemApps.push({ id: 'chat', name: 'Secure Chat', icon: MessageSquare, color: 'bg-green-600', desc: 'Encrypted case communication.' });
    }
    systemApps.push({ id: 'bank-directory', name: 'Bank Directory', icon: Contact, color: 'bg-indigo-600', desc: 'Branch contact directory.' });

    if (viewingApp) {
        return (
            <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-fade-in">
                <div className="h-16 bg-slate-900 flex items-center justify-between px-6 shadow-md shrink-0">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setViewingApp(null)} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"><ArrowLeft size={24} /></button>
                        <div className="text-white">
                            <h3 className="font-bold text-lg leading-tight">{viewingApp.name}</h3>
                            <p className="text-[10px] text-white/50 truncate max-w-xs">{viewingApp.url}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <a href={viewingApp.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold transition-colors">
                            <ExternalLink size={14} /> Open in Browser
                        </a>
                        <button onClick={() => setViewingApp(null)} className="p-2 text-white hover:bg-rose-500 rounded-full transition-colors"><X size={24} /></button>
                    </div>
                </div>
                <div className="flex-1 bg-slate-100 relative">
                    <iframe 
                        src={viewingApp.url} 
                        className="w-full h-full border-0" 
                        title={viewingApp.name} 
                        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                    />
                    <div className="absolute inset-0 -z-10 flex items-center justify-center text-slate-400 font-bold">
                        <Loader2 className="animate-spin mr-2" /> Loading content...
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-12 animate-fade-in pb-20">
            {/* System Apps */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {systemApps.map(app => (
                    <div key={app.id} className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all group overflow-hidden">
                        <div className={`w-16 h-16 rounded-[1.25rem] ${app.color} text-white flex items-center justify-center mb-8 shadow-xl group-hover:rotate-6 transition-transform`}><app.icon size={32} /></div>
                        <h4 className="text-2xl font-black text-slate-900 mb-3 tracking-tighter">{app.name}</h4>
                        <p className="text-slate-500 text-sm mb-10 leading-relaxed font-medium">{app.desc}</p>
                        <button onClick={() => onLaunch(app.id)} className="w-full py-4 bg-slate-900 text-white rounded-[1.5rem] text-xs font-bold uppercase tracking-widest hover:bg-black transition-all">Open Module</button>
                    </div>
                ))}
            </div>

            {/* External Apps */}
            <div className="pt-8 border-t border-slate-200">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <h3 className="text-xl font-black text-slate-900 flex items-center gap-2"><Globe size={20} /> External Tools</h3>
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="Find an app..."
                            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
                        />
                    </div>
                </div>

                {externalApps.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {sortedApps.map(app => {
                            const IconComponent = iconOptions[app.iconName || 'LinkIcon'] || LinkIcon;
                            const bgColor = colorClasses[app.color || 'blue'] || 'bg-blue-600';
                            const isFav = favorites.includes(app.id);
                            
                            return (
                                <div key={app.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative">
                                    <button 
                                        onClick={(e) => toggleFavorite(e, app.id)}
                                        className={`absolute top-8 right-8 p-2 rounded-full transition-all ${isFav ? 'text-amber-400 bg-amber-50' : 'text-slate-300 hover:text-amber-400'}`}
                                    >
                                        <Star size={20} fill={isFav ? "currentColor" : "none"} />
                                    </button>

                                    <div className="flex justify-between items-start mb-6">
                                        <div className={`w-12 h-12 rounded-2xl ${bgColor} text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                                            <IconComponent size={24} />
                                        </div>
                                    </div>
                                    <h4 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                                        {app.name}
                                        {app.isEmbeddable && <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider"><Layout size={10} className="inline mr-1"/> App</span>}
                                    </h4>
                                    <p className="text-slate-500 text-xs mb-6 line-clamp-2 min-h-[2.5em]">{app.description}</p>
                                    <button onClick={() => handleAppClick(app)} className="w-full py-3 bg-slate-50 text-slate-700 rounded-xl text-xs font-bold uppercase tracking-wide hover:bg-primary hover:text-white transition-all">
                                        {app.isEmbeddable ? 'Launch App' : 'Visit Website'}
                                    </button>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="p-12 text-center bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
                        <p className="text-slate-400 font-bold">No external apps deployed yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// ... UserToolsView and UserDashboard remain unchanged ...
const UserToolsView = ({ onLaunch }: { onLaunch: (id: string) => void }) => {
    const tools = [
        { id: 'converter', name: 'Unit Converter', icon: RefreshCw, color: 'bg-orange-500', desc: 'Precision land area scaling utility.' },
        { id: 'mortgage', name: 'EMI Estimator', icon: Landmark, color: 'bg-emerald-600', desc: 'Institutional loan calculation tool.' },
        { id: 'notes', name: 'Survey Pad', icon: StickyNote, color: 'bg-purple-600', desc: 'Rapid field observation documentation.' }
    ];
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-in">
            {tools.map(t => (
                <div key={t.id} className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all group overflow-hidden">
                    <div className={`w-16 h-16 rounded-[1.25rem] ${t.color} text-white flex items-center justify-center mb-8 shadow-xl`}><t.icon size={32} /></div>
                    <h4 className="text-2xl font-black text-slate-900 mb-3 tracking-tighter">{t.name}</h4>
                    <p className="text-slate-500 text-sm mb-10 leading-relaxed font-medium">{t.desc}</p>
                    <button onClick={() => onLaunch(t.id)} className="w-full py-4 bg-slate-100 text-slate-700 rounded-[1.5rem] text-xs font-bold uppercase tracking-widest border border-slate-200 hover:bg-slate-900 hover:text-white transition-all">Launch Utility</button>
                </div>
            ))}
        </div>
    );
};

const UserDashboard: React.FC = () => {
    const { logout, user, userRole } = useSite();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [activeApp, setActiveApp] = useState<string | null>(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const isStaff = ['super_admin', 'admin', 'employee'].includes(userRole || '');

    const renderContent = () => {
        if (activeTab === 'market-intelligence') return <MarketDataTool onBack={() => setActiveTab('dashboard')} />;
        if (activeTab === 'chat') return <SecureChat />; // Added
        if (activeTab === 'apps') {
            if (activeApp === 'work-log') return <WorkLogView onBack={() => setActiveApp(null)} />;
            if (activeApp === 'performance') return <PerformanceView onBack={() => setActiveApp(null)} />;
            if (activeApp === 'market-data') return <MarketDataTool onBack={() => setActiveApp(null)} />;
            if (activeApp === 'bank-directory') return <BankDirectoryTool onBack={() => setActiveApp(null)} />;
            if (activeApp === 'survey-pad') return <SurveyPad onBack={() => setActiveApp(null)} />;
            if (activeApp === 'chat') return <SecureChat onClose={() => setActiveApp(null)} />;
            return <UserAppsView onLaunch={setActiveApp} />;
        }
        if (activeTab === 'tools') {
            if (activeApp === 'converter') return <UnitConverterTool onBack={() => setActiveApp(null)} />;
            if (activeApp === 'mortgage') return <MortgageTool onBack={() => setActiveApp(null)} />;
            if (activeApp === 'notes') return <NotesTool onBack={() => setActiveApp(null)} />;
            return <UserToolsView onLaunch={setActiveApp} />;
        }
        switch (activeTab) {
            case 'dashboard': return (
                <div className="space-y-8 animate-fade-in relative">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="bg-slate-900 p-16 rounded-[4.5rem] text-white shadow-2xl col-span-1 lg:col-span-2 relative overflow-hidden">
                            <div className="relative z-10">
                                <h3 className="text-5xl font-black mb-6 tracking-tighter">Welcome, {user?.displayName?.split(' ')[0] || 'Professional'}</h3>
                                <p className="text-slate-400 mb-12 text-xl font-light leading-relaxed max-w-lg">Institutional workspace active. Property intelligence and activity logs are synchronized.</p>
                                <div className="flex flex-wrap gap-4">
                                    <button onClick={() => { setActiveTab('apps'); setActiveApp('work-log'); }} className="bg-primary text-white px-10 py-5 rounded-[2rem] font-bold shadow-2xl text-sm flex items-center gap-2 hover:scale-105 transition-transform"><ClipboardList size={18} /> Daily Work Log</button>
                                    {isStaff && <button onClick={() => { setActiveTab('apps'); setActiveApp('performance'); }} className="bg-white/10 text-white px-10 py-5 rounded-[2rem] font-bold backdrop-blur-md transition-all text-sm border border-white/10 hover:bg-white/20 flex items-center gap-2"><TrendingUp size={18} /> Performance</button>}
                                </div>
                            </div>
                        </div>
                        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-2xl flex flex-col items-center justify-center text-center">
                            <div className="p-5 bg-emerald-50 text-emerald-600 rounded-[2rem] mb-6 shadow-sm"><ShieldCheck size={40} /></div>
                            <div className="text-[11px] font-black text-slate-400 mb-2 uppercase tracking-[0.4em]">Verified Identity</div>
                            <div className="text-2xl font-black text-slate-900 capitalize tracking-tighter">{userRole || 'Client'}</div>
                            <div className="mt-6 px-4 py-2 bg-emerald-50 rounded-full text-[10px] text-emerald-600 font-black uppercase tracking-widest flex items-center gap-2"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div> Secure</div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm flex items-center justify-between group cursor-pointer hover:shadow-xl transition-all" onClick={() => setActiveTab('apps')}>
                            <div className="flex items-center gap-6"><div className="p-4 bg-blue-50 text-blue-600 rounded-2xl"><Grid size={32} /></div><div><h4 className="text-2xl font-black text-slate-900">App Gallery</h4><p className="text-slate-400 text-sm font-medium">Work Logs & Intelligence</p></div></div>
                            <div className="p-4 bg-slate-50 rounded-xl text-slate-300 group-hover:bg-primary group-hover:text-white transition-colors"><Plus size={24} /></div>
                        </div>
                        <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm flex items-center justify-between group cursor-pointer hover:shadow-xl transition-all" onClick={() => setActiveTab('tools')}>
                            <div className="flex items-center gap-6"><div className="p-4 bg-orange-50 text-orange-600 rounded-2xl"><Wrench size={32} /></div><div><h4 className="text-2xl font-black text-slate-900">Utility Hub</h4><p className="text-slate-400 text-sm font-medium">Dimension & EMI Tools</p></div></div>
                            <div className="p-4 bg-slate-50 rounded-xl text-slate-300 group-hover:bg-primary group-hover:text-white transition-colors"><Plus size={24} /></div>
                        </div>
                    </div>
                </div>
            );
            case 'profile': return (
                <div className="bg-white p-16 rounded-[4rem] border border-slate-100 shadow-2xl max-w-3xl animate-fade-in mx-auto mt-10">
                    <div className="w-32 h-32 rounded-[3rem] bg-gradient-to-br from-primary to-blue-800 text-white flex items-center justify-center text-5xl font-black mx-auto mb-8 shadow-2xl border-8 border-white">{user?.email?.[0].toUpperCase()}</div>
                    <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{user?.displayName || 'ABS Professional'}</h3>
                    <p className="text-slate-400 font-bold text-center mt-2 uppercase text-xs">{user?.email}</p>
                    <div className="mt-12 flex flex-col gap-4"><button onClick={logout} className="w-full flex items-center justify-center gap-3 text-rose-500 border-2 border-rose-50 hover:bg-rose-50 py-5 rounded-[2rem] font-black transition-all text-sm uppercase tracking-widest"><LogOut size={18} /> Close Workspace</button></div>
                </div>
            );
            default: return null;
        }
    };

    const navItems = [
        { id: 'dashboard', label: 'Work Overview', icon: LayoutDashboard },
        { id: 'apps', label: 'App Gallery', icon: Grid },
        { id: 'tools', label: 'Utilities', icon: Wrench },
        { id: 'chat', label: 'Secure Chat', icon: MessageSquare },
        { id: 'profile', label: 'Account Identity', icon: User },
    ];
    if (isStaff) navItems.splice(3, 0, { id: 'market-intelligence', label: 'Intelligence Map', icon: MapIcon });

    return (
        <div className="min-h-screen bg-slate-50 flex font-sans relative overflow-hidden">
            {isMobileMenuOpen && <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />}
            <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-slate-400 transform ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'} md:translate-x-0 md:static transition-transform duration-500 flex flex-col border-r border-white/5`}>
                <div className="p-10 border-b border-white/5 flex flex-col gap-1"><h2 className="text-white text-2xl font-black tracking-tighter">ABS <span className="text-primary font-normal">Panel</span></h2><div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mt-1">Institutional Interface</div></div>
                <nav className="flex-1 p-6 space-y-2 mt-4 custom-scrollbar">
                    {navItems.map(item => (
                        <button key={item.id} onClick={() => { setActiveTab(item.id); setActiveApp(null); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-4 px-6 py-4.5 rounded-[1.5rem] transition-all group ${activeTab === item.id ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'hover:bg-white/5 hover:text-white'}`}>
                            <item.icon size={18} className={activeTab === item.id ? 'opacity-100' : 'opacity-40 group-hover:opacity-100'} />
                            <span className="font-bold text-sm tracking-tight">{item.label}</span>
                        </button>
                    ))}
                </nav>
                <div className="p-6 border-t border-white/5"><button onClick={logout} className="w-full flex items-center gap-4 px-6 py-4.5 rounded-[1.5rem] hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 font-bold text-sm transition-all group"><LogOut size={18} /><span>End Workspace</span></button></div>
            </aside>
            <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
                <header className="h-24 bg-white border-b border-slate-200 flex items-center justify-between px-10 shrink-0 z-30 shadow-sm"><button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-3 bg-slate-100 rounded-2xl text-slate-600"><Menu size={24} /></button><h1 className="text-3xl font-black text-slate-900 capitalize tracking-tighter">{activeApp ? activeApp.replace('-', ' ') : activeTab.replace('-', ' ')}</h1><div className="w-14 h-14 rounded-[1.5rem] bg-gradient-to-br from-primary to-blue-800 flex items-center justify-center text-white font-black text-xl shadow-2xl border-4 border-white">{user?.email?.[0].toUpperCase()}</div></header>
                <div className="flex-1 overflow-y-auto p-8 md:p-12 bg-slate-50/30 custom-scrollbar"><div className="max-w-7xl mx-auto">{renderContent()}</div></div>
            </main>
        </div>
    );
};

export default UserDashboard;
