'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Parcel, CourierMetric, TimeFilter } from '@/types/v4';
import { fetchParcelsByDateRange, calculateDateRange, exportToCSV } from '@/lib/v4/dataService';
import { FilterBar, TableHeader } from '@/components/v4/AdminComponents';

const computeCourierMetrics = (parcels: Parcel[]) => {
  const courierMap = new Map<string, CourierMetric>();
  const now = Math.floor(Date.now() / 1000);

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
    
    const ageHours = (now - p.createdAt) / 3600;
    if (!['delivered', 'closed'].includes(p.status) && ageHours > 48) {
      c.delayed++;
    }
  });

  return Array.from(courierMap.values());
};

export default function CourierReportPage() {
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [filterType, setFilterType] = useState<TimeFilter>('week');
  const [loading, setLoading] = useState(true);

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

  const courierMetrics = useMemo(() => computeCourierMetrics(parcels), [parcels]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Courier Reports</h1>
      </div>

      <FilterBar 
        currentFilter={filterType} 
        onFilterChange={setFilterType} 
        onExport={() => exportToCSV(parcels)}
        onSeed={() => console.log('Seed function not implemented yet')}
        isLoading={loading}
      />

      {loading ? (
        <div className="flex items-center justify-center h-64">
           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Courier Volume & Delays</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={courierMetrics} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="companyName" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="totalHandled" name="Total Volume" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="delayed" name="Delayed (>48h)" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <TableHeader headers={['Courier Company', 'Total Handled', 'Delivered', 'Significant Delays']} />
                <tbody className="bg-white divide-y divide-gray-200">
                  {courierMetrics.map((courier) => (
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
      )}
    </div>
  );
}
