export type ParcelStatus = 'received' | 'assigned' | 'delivered' | 'closed';

export interface Parcel {
  parcelId: string;
  type: 'incoming' | 'outgoing';
  courierCompany: string;
  assignedTo: string; // staff_uid
  assignedToName?: string; // Optional: usually fetched via join or stored for easier display
  status: ParcelStatus;
  createdAt: number; // Unix timestamp in seconds
  updatedAt: number; // Unix timestamp in seconds
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface StaffMetric {
  staffId: string;
  name: string;
  totalAssigned: number;
  delivered: number;
  pending: number;
  avgDeliveryTimeHours: number;
}

export interface CourierMetric {
  companyName: string;
  totalHandled: number;
  delivered: number;
  delayed: number; // Arbitrary logic: e.g., > 48 hours
}

export interface DashboardMetrics {
  totalParcels: number;
  pendingParcels: number;
  deliveredParcels: number;
  deliveredToday: number;
  avgDeliveryTimeHours: number;
}

export type TimeFilter = 'today' | 'week' | 'month' | 'custom';
