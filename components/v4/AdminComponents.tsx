import React from 'react';
import { LucideIcon } from 'lucide-react';

// --- Card Component ---
interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendColor?: string;
  colorClass: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, trend, colorClass, trendColor }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        {trend && (
          <p className={`text-xs mt-2 font-medium ${trendColor || 'text-gray-500'}`}>
            {trend}
          </p>
        )}
      </div>
      <div className={`p-3 rounded-lg ${colorClass} bg-opacity-10`}>
        <Icon className={`w-6 h-6 ${colorClass.replace('bg-', 'text-')}`} />
      </div>
    </div>
  );
};

// --- Filters Component ---
interface FilterBarProps {
  currentFilter: string;
  onFilterChange: (f: any) => void;
  onExport: () => void;
  onSeed: () => void;
  isLoading: boolean;
}

export const FilterBar: React.FC<FilterBarProps> = ({ currentFilter, onFilterChange, onExport, onSeed, isLoading }) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-lg border border-gray-200 mb-6 gap-4">
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium text-gray-700">Time Range:</span>
        <select 
          value={currentFilter}
          onChange={(e) => onFilterChange(e.target.value)}
          className="form-select block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
        >
          <option value="today">Today</option>
          <option value="week">Last 7 Days</option>
          <option value="month">Last 30 Days</option>
        </select>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onSeed}
          disabled={isLoading}
          className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white 
          ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500'}`}
        >
          {isLoading ? 'Loading...' : 'Seed Database'}
        </button>
        <button
          onClick={onExport}
          disabled={isLoading}
          className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white 
          ${isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'}`}
        >
          {isLoading ? 'Loading...' : 'Export CSV'}
        </button>
      </div>
    </div>
  );
};

// --- Table Components ---
export const TableHeader: React.FC<{ headers: string[] }> = ({ headers }) => (
  <thead className="bg-gray-50">
    <tr>
      {headers.map((h, i) => (
        <th key={i} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          {h}
        </th>
      ))}
    </tr>
  </thead>
);

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const styles: Record<string, string> = {
    delivered: 'bg-green-100 text-green-800',
    closed: 'bg-gray-100 text-gray-800',
    received: 'bg-blue-100 text-blue-800',
    assigned: 'bg-yellow-100 text-yellow-800',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100'}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};
