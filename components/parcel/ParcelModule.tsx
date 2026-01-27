
import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, Link, useLocation, Navigate, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Truck, 
  Package, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Menu,
  X,
  LucideIcon,
  LogOut
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';

import { Parcel, StaffMetric, CourierMetric, DashboardMetrics, TimeFilter } from '../../types';
import { fetchParcelsByDateRange, calculateDateRange, exportToCSV } from './dataService';
import { StatCard, FilterBar, TableHeader, StatusBadge } from './AdminComponents';
import { auth } from '../../lib/firebase';
import { Login } from './Login';

// --- Helper Logic for Analytics ---

const computeAnalytics = (parcels: Parcel[]) => {
  const now = Math.floor(Date.now() / 1000);
  const todayStart = new Date();
  todayStart.setHours(0,0,0,0);
  const todayStartSec = Math.floor(todayStart.getTime() / 1000);

  // 1. Overview Metrics
  const total = parcels.length;
  const pending = parcels.filter(p => ['received', 'assigned'].includes(p.status)).length;
  const deliveredList = parcels.filter(p => ['delivered', 'closed'].includes(p.status));
  const delivered = deliveredList.length;
  const deliveredToday = deliveredList.filter(p => p.updatedAt >= todayStartSec).length;

  // Avg Delivery Time Calculation (in hours)
  const totalDuration = deliveredList.reduce((acc, p) => acc + (p.updatedAt - p.createdAt), 0);
  const avgTime = delivered > 0 ? (totalDuration / delivered) / 3600 : 0;

  const dashboardMetrics: DashboardMetrics = {
    totalParcels: total,
    pendingParcels: pending,
    deliveredParcels: delivered,
    deliveredToday,
    avgDeliveryTimeHours: parseFloat(avgTime.toFixed(1))
  };

  // 2. Staff Metrics
  const staffMap = new Map<string, StaffMetric>();
  
  parcels.forEach(p => {
    if (!p.assignedTo) return;
    
    if (!staffMap.has(p.assignedTo)) {
      staffMap.set(p.assignedTo, {
        staffId: p.assignedTo,
        name: p.assignedToName || 'Unknown Staff',
        totalAssigned: 0,
        delivered: 0,
        pending: 0,
        avgDeliveryTimeHours: 0
      });
    }
    
    const staff = staffMap.get(p.assignedTo)!;
    staff.totalAssigned++;
    
    if (['delivered', 'closed'].includes(p.status)) {
      staff.delivered++;
      // We store raw sum here, compute avg later
      // Using a temp property on the object or re-calculating (simplified here)
    } else {
      staff.pending++;
    }
  });

  // Calculate Average times per staff (Need a second pass or smarter accumulation)
  // Simplified: Filter delivered per staff
  const staffArray = Array.from(staffMap.values()).map(staff => {
    const staffDeliveredParcels = deliveredList.filter(p => p.assignedTo === staff.staffId);
    const sumTime = staffDeliveredParcels.reduce((acc, p) => acc + (p.updatedAt - p.createdAt), 0);
    const avg = staffDeliveredParcels.length > 0 ? (sumTime / staffDeliveredParcels.length) / 3600 : 0;
    
    return { ...staff, avgDeliveryTimeHours: parseFloat(avg.toFixed(1)) };
  });

  // 3. Courier Metrics
  const courierMap = new Map<string, CourierMetric>();
  parcels.forEach(p => {
    if (!courierMap.has(p.courierCompany)) {
      courierMap.set(p.courierCompany, {
        companyName: p.courierCompany,
        totalHandled: 0,
        delivered: 0,
        delayed: 0
      });
    }
    const c = courierMap.get(p.courierCompany)!;
    c.totalHandled++;
    if (['delivered', 'closed'].includes(p.status)) c.delivered++;
    
    // Definition of "Delayed": Not delivered and older than 48 hours
    const ageHours = (now - p.createdAt) / 3600;
    if (!['delivered', 'closed'].includes(p.status) && ageHours > 48) {
      c.delayed++;
    }
  });

  // 4. Status Data for Charts
  const statusCounts = parcels.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusChartData = Object.keys(statusCounts).map(key => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    value: statusCounts[key]
  }));

  return {
    dashboardMetrics,
    staffMetrics: staffArray,
    courierMetrics: Array.from(courierMap.values()),
    statusChartData
  };
};

// --- PAGES ---

const DashboardOverview: React.FC<{ 
  metrics: DashboardMetrics, 
  statusData: any[] 
}> = ({ metrics, statusData }) => {
  const COLORS = ['#3B82F6', '#F59E0B', '#10B981', '#6B7280'];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Parcels" 
          value={metrics.totalParcels} 
          icon={Package} 
          colorClass="bg-blue-500" 
        />
        <StatCard 
          title="Pending Actions" 
          value={metrics.pendingParcels} 
          icon={AlertCircle} 
          colorClass="bg-yellow-500"
          trend="Requires attention"
          trendColor="text-yellow-600"
        />
        <StatCard 
          title="Delivered Today" 
          value={metrics.deliveredToday} 
          icon={CheckCircle} 
          colorClass="bg-green-500" 
        />
        <StatCard 
          title="Avg Delivery Time" 
          value={`${metrics.avgDeliveryTimeHours} hrs`} 
          icon={Clock} 
          colorClass="bg-purple-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Parcel Status Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Volume Placeholder (Can be enhanced with daily grouping) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-center">
          <div className="text-center">
             <h3 className="text-lg font-bold text-gray-800 mb-4">System Efficiency</h3>
             <div className="flex flex-col gap-4">
               <div className="p-4 bg-green-50 rounded-lg">
                 <span className="block text-2xl font-bold text-green-700">{((metrics.deliveredParcels / (metrics.totalParcels || 1)) * 100).toFixed(0)}%</span>
                 <span className="text-sm text-green-600">Completion Rate</span>
               </div>
               <div className="p-4 bg-blue-50 rounded-lg">
                 <span className="block text-2xl font-bold text-blue-700">{metrics.totalParcels}</span>
                 <span className="text-sm text-blue-600">Total Processed in Range</span>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StaffReport: React.FC<{ data: StaffMetric[] }> = ({ data }) => {
  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Staff Performance</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <TableHeader headers={['Staff Name', 'Total Assigned', 'Delivered', 'Pending', 'Avg Time (Hrs)', 'Efficiency']} />
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((staff) => (
              <tr key={staff.staffId} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{staff.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{staff.totalAssigned}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">{staff.delivered}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600 font-medium">{staff.pending}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{staff.avgDeliveryTimeHours}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {((staff.delivered / (staff.totalAssigned || 1)) * 100).toFixed(0)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const CourierReport: React.FC<{ data: CourierMetric[] }> = ({ data }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Courier Volume & Delays</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="companyName" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="totalHandled" name="Total Volume" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="delayed" name="Delayed (>48h)" fill="#EF4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <TableHeader headers={['Courier Company', 'Total Handled', 'Delivered', 'Significant Delays']} />
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((courier) => (
                <tr key={courier.companyName} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{courier.companyName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{courier.totalHandled}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{courier.delivered}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {courier.delayed > 0 ? (
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold">
                        {courier.delayed} Delayed
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
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

// --- LAYOUT & MAIN APP ---

const SidebarLink: React.FC<{ to: string; icon: LucideIcon; label: string; active: boolean }> = ({ to, icon: Icon, label, active }) => (
  <Link
    to={to}
    className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-150 ${
      active 
        ? 'bg-blue-50 text-blue-700' 
        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
    }`}
  >
    <Icon className={`w-5 h-5 mr-3 ${active ? 'text-blue-600' : 'text-gray-400'}`} />
    {label}
  </Link>
);

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Links relative to the Admin Layout route
  const links = [
    { path: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { path: 'staff-performance', label: 'Staff Performance', icon: Users },
    { path: 'courier-report', label: 'Courier Reports', icon: Truck },
    { path: 'parcels-report', label: 'Raw Parcel Data', icon: Package },
  ];

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 md:hidden" onClick={() => setIsMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed md:inset-y-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0 flex flex-col justify-between ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div>
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <span className="text-xl font-bold text-gray-800">AdminPanel</span>
            <button onClick={() => setIsMobileOpen(false)} className="md:hidden text-gray-500">
              <X className="w-6 h-6" />
            </button>
          </div>
          <nav className="p-4 space-y-1">
            {links.map((link) => (
              <SidebarLink 
                key={link.path} 
                to={link.path} 
                label={link.label} 
                icon={link.icon} 
                active={location.pathname.includes(link.path)} 
              />
            ))}
          </nav>
        </div>
        
        <div className="p-4 border-t border-gray-200">
          <button 
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between h-16 px-6 bg-white border-b border-gray-200 md:hidden">
          <button onClick={() => setIsMobileOpen(true)} className="text-gray-500">
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-semibold text-gray-700">Analytics</span>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

// Container Component handles Data Fetching and State
const AnalyticsContainer: React.FC = () => {
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [filterType, setFilterType] = useState<TimeFilter>('week');
  const [loading, setLoading] = useState(true);

  // Load Data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const range = calculateDateRange(filterType);
        const data = await fetchParcelsByDateRange(range);
        setParcels(data);
      } catch (error) {
        console.error("Failed to load metrics", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [filterType]);

  // Compute Derived Analytics
  const analytics = useMemo(() => computeAnalytics(parcels), [parcels]);

  const handleExport = () => {
    exportToCSV(parcels);
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <span className="text-sm text-gray-500 mt-1 md:mt-0">Read-only Access</span>
        </div>

        <FilterBar 
          currentFilter={filterType} 
          onFilterChange={setFilterType} 
          onExport={handleExport}
          isLoading={loading}
        />

        {loading ? (
          <div className="flex items-center justify-center h-64">
             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <Routes>
            <Route path="dashboard" element={
              <DashboardOverview metrics={analytics.dashboardMetrics} statusData={analytics.statusChartData} />
            } />
            <Route path="staff-performance" element={
              <StaffReport data={analytics.staffMetrics} />
            } />
            <Route path="courier-report" element={
              <CourierReport data={analytics.courierMetrics} />
            } />
             <Route path="parcels-report" element={
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <TableHeader headers={['ID', 'Status', 'Courier', 'Staff', 'Date']} />
                  <tbody className="bg-white divide-y divide-gray-200">
                    {parcels.slice(0, 50).map(p => (
                      <tr key={p.parcelId}>
                         <td className="px-6 py-4 text-sm font-medium text-gray-900">{p.parcelId}</td>
                         <td className="px-6 py-4 text-sm"><StatusBadge status={p.status} /></td>
                         <td className="px-6 py-4 text-sm text-gray-500">{p.courierCompany}</td>
                         <td className="px-6 py-4 text-sm text-gray-500">{p.assignedToName || p.assignedTo}</td>
                         <td className="px-6 py-4 text-sm text-gray-500">{new Date(p.createdAt * 1000).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="px-6 py-4 border-t text-sm text-gray-500">
                  Showing recent 50 of {parcels.length} records. Export CSV for full details.
                </div>
              </div>
            } />
            <Route path="/" element={<Navigate to="dashboard" replace />} />
          </Routes>
        )}
      </div>
    </AdminLayout>
  );
};

// Main App Entry - Exported for Modular Use
const ParcelAdminApp: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Uses Routes without a specific Router, allowing the parent to provide the context.
  return (
    <Routes>
      <Route path="login" element={
        !user ? <Login /> : <Navigate to="../admin/dashboard" replace />
      } />
      
      <Route path="admin/*" element={
        user ? <AnalyticsContainer /> : <Navigate to="../login" replace />
      } />
      
      {/* Default redirect based on auth status */}
      <Route path="*" element={
        <Navigate to={user ? "admin/dashboard" : "login"} replace />
      } />
    </Routes>
  );
};

export default ParcelAdminApp;
