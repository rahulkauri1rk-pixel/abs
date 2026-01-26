'use client';

import React, { useState, useEffect } from 'react';
import { Parcel, TimeFilter } from '@/types/v4';
import { fetchParcelsByDateRange, calculateDateRange, exportToCSV } from '@/lib/v4/dataService';
import { FilterBar, TableHeader, StatusBadge } from '@/components/v4/AdminComponents';

export default function ParcelsReportPage() {
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

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Raw Parcel Data</h1>
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
        <div className="bg-white rounded-lg shadow overflow-hidden animate-in fade-in duration-500">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <TableHeader headers={['ID', 'Status', 'Courier', 'Staff', 'Date']} />
              <tbody className="bg-white divide-y divide-gray-200">
                {parcels.length > 0 ? (
                  parcels.slice(0, 100).map(p => (
                    <tr key={p.parcelId} className="hover:bg-gray-50">
                       <td className="px-6 py-4 text-sm font-medium text-gray-900">{p.parcelId}</td>
                       <td className="px-6 py-4 text-sm"><StatusBadge status={p.status} /></td>
                       <td className="px-6 py-4 text-sm text-gray-500">{p.courierCompany}</td>
                       <td className="px-6 py-4 text-sm text-gray-500">{p.assignedToName || p.assignedTo}</td>
                       <td className="px-6 py-4 text-sm text-gray-500">{new Date(p.createdAt * 1000).toLocaleDateString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No records found for this range.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {parcels.length > 0 && (
            <div className="px-6 py-4 border-t text-sm text-gray-500">
              Showing recent {Math.min(100, parcels.length)} of {parcels.length} records. Export CSV for full details.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
