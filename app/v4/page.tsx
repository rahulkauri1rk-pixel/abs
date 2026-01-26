'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Package, 
  Clock, 
  CheckCircle, 
  AlertCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

import { Parcel, DashboardMetrics, TimeFilter } from '@/types/v4';
import { fetchParcelsByDateRange, calculateDateRange, exportToCSV, seedDatabase } from '@/lib/v4/dataService';
import { StatCard, FilterBar } from '@/components/v4/AdminComponents';

const computeAnalytics = (parcels: Parcel[]) => {
  const todayStart = new Date();
  todayStart.setHours(0,0,0,0);
  const todayStartSec = Math.floor(todayStart.getTime() / 1000);

  const total = parcels.length;
  const pending = parcels.filter(p => ['received', 'assigned'].includes(p.status)).length;
  const deliveredList = parcels.filter(p => ['delivered', 'closed'].includes(p.status));
  const delivered = deliveredList.length;
  const deliveredToday = deliveredList.filter(p => p.updatedAt >= todayStartSec).length;

  const totalDuration = deliveredList.reduce((acc, p) => acc + (p.updatedAt - p.createdAt), 0);
  const avgTime = delivered > 0 ? (totalDuration / delivered) / 3600 : 0;

  const dashboardMetrics: DashboardMetrics = {
    totalParcels: total,
    pendingParcels: pending,
    deliveredParcels: delivered,
    deliveredToday,
    avgDeliveryTimeHours: parseFloat(avgTime.toFixed(1))
  };

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
    statusChartData
  };
};

export default function V4Dashboard() {
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [filterType, setFilterType] = useState<TimeFilter>('week');
  const [loading, setLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);

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
  
  const handleSeed = async () => {
    setIsSeeding(true);
    try {
      await seedDatabase();
      alert('Database seeded successfully!');
      // Optionally, reload data
      const range = calculateDateRange(filterType);
      const data = await fetchParcelsByDateRange(range);
      setParcels(data);
    } catch (error) {
      console.error("Failed to seed database", error);
      alert('Failed to seed database. See console for details.');
    } finally {
      setIsSeeding(false);
    }
  };

  const analytics = useMemo(() => computeAnalytics(parcels), [parcels]);

  const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#6b7280'];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <button
          onClick={handleSeed}
          disabled={isSeeding}
          className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white 
          ${isSeeding ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'}`}
        >
          {isSeeding ? 'Seeding...' : 'Seed Database'}
        </button>
      </div>

      <FilterBar 
        currentFilter={filterType} 
        onFilterChange={setFilterType} 
        onExport={() => exportToCSV(parcels)}
        isLoading={loading}
      />

      {loading ? (
        <div className="flex items-center justify-center h-64">
           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard 
              title="Total Parcels" 
              value={analytics.dashboardMetrics.totalParcels} 
              icon={Package} 
              colorClass="bg-indigo-500" 
            />
            <StatCard 
              title="Pending Actions" 
              value={analytics.dashboardMetrics.pendingParcels} 
              icon={AlertCircle} 
              colorClass="bg-yellow-500"
              trend="Requires attention"
              trendColor="text-yellow-600"
            />
            <StatCard 
              title="Delivered Today" 
              value={analytics.dashboardMetrics.deliveredToday} 
              icon={CheckCircle} 
              colorClass="bg-green-500" 
            />
            <StatCard 
              title="Avg Delivery Time" 
              value={`${analytics.dashboardMetrics.avgDeliveryTimeHours} hrs`} 
              icon={Clock} 
              colorClass="bg-purple-500" 
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Parcel Status Distribution</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.statusChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {analytics.statusChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-center">
              <div className="text-center">
                 <h3 className="text-lg font-bold text-gray-800 mb-4">System Efficiency</h3>
                 <div className="flex flex-col gap-4">
                   <div className="p-4 bg-green-50 rounded-lg">
                     <span className="block text-2xl font-bold text-green-700">
                       {((analytics.dashboardMetrics.deliveredParcels / (analytics.dashboardMetrics.totalParcels || 1)) * 100).toFixed(0)}%
                     </span>
                     <span className="text-sm text-green-600">Completion Rate</span>
                   </div>
                   <div className="p-4 bg-indigo-50 rounded-lg">
                     <span className="block text-2xl font-bold text-indigo-700">{analytics.dashboardMetrics.totalParcels}</span>
                     <span className="text-sm text-indigo-600">Total Processed in Range</span>
                   </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
