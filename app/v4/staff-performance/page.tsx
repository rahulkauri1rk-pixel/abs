'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Parcel, StaffMetric, TimeFilter } from '@/types/v4';
import { fetchParcelsByDateRange, calculateDateRange, exportToCSV } from '@/lib/v4/dataService';
import { FilterBar, TableHeader } from '@/components/v4/AdminComponents';

const computeStaffMetrics = (parcels: Parcel[]) => {
  const staffMap = new Map<string, StaffMetric>();
  const deliveredList = parcels.filter(p => ['delivered', 'closed'].includes(p.status));
  
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
    } else {
      staff.pending++;
    }
  });

  const staffArray = Array.from(staffMap.values()).map(staff => {
    const staffDeliveredParcels = deliveredList.filter(p => p.assignedTo === staff.staffId);
    const sumTime = staffDeliveredParcels.reduce((acc, p) => acc + (p.updatedAt - p.createdAt), 0);
    const avg = staffDeliveredParcels.length > 0 ? (sumTime / staffDeliveredParcels.length) / 3600 : 0;
    
    return { ...staff, avgDeliveryTimeHours: parseFloat(avg.toFixed(1)) };
  });

  return staffArray;
};

export default function StaffPerformancePage() {
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

  const staffMetrics = useMemo(() => computeStaffMetrics(parcels), [parcels]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Staff Performance</h1>
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
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden animate-in fade-in duration-500">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Performance Metrics</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <TableHeader headers={['Staff Name', 'Total Assigned', 'Delivered', 'Pending', 'Avg Time (Hrs)', 'Efficiency']} />
              <tbody className="bg-white divide-y divide-gray-200">
                {staffMetrics.map((staff) => (
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
      )}
    </div>
  );
}
