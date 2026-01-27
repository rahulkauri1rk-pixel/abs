import { Parcel, DateRange, TimeFilter } from '../types';
import { db } from './firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  writeBatch, 
  doc, 
  Timestamp 
} from 'firebase/firestore';

// --- SERVICE FUNCTIONS ---

/**
 * Fetches parcels from Firestore based on a date range.
 * Note: Firestore requires a composite index for equality checks combined with range checks.
 * If the query fails, check the console for a link to create the index.
 */
export const fetchParcelsByDateRange = async (range: DateRange): Promise<Parcel[]> => {
  const parcelsRef = collection(db, 'parcels');
  
  // Convert JS Dates to Unix timestamps (seconds) as per your Type definition
  const startSeconds = Math.floor(range.startDate.getTime() / 1000);
  const endSeconds = Math.floor(range.endDate.getTime() / 1000);

  // Query: Select parcels created within the range
  const q = query(
    parcelsRef,
    where('createdAt', '>=', startSeconds),
    where('createdAt', '<=', endSeconds)
  );

  try {
    const querySnapshot = await getDocs(q);
    const parcels: Parcel[] = [];
    querySnapshot.forEach((doc) => {
      parcels.push(doc.data() as Parcel);
    });
    return parcels;
  } catch (error) {
    console.error("Error fetching parcels:", error);
    throw error;
  }
};

export const calculateDateRange = (filter: TimeFilter): DateRange => {
  const now = new Date();
  const start = new Date();
  
  if (filter === 'today') {
    start.setHours(0, 0, 0, 0);
  } else if (filter === 'week') {
    start.setDate(now.getDate() - 7);
  } else if (filter === 'month') {
    start.setMonth(now.getMonth() - 1);
  } else {
    // Default fallback for custom or 'year'
    start.setMonth(now.getMonth() - 1);
  }
  
  return { startDate: start, endDate: now };
};

export const exportToCSV = (parcels: Parcel[]) => {
  const headers = ['Parcel ID', 'Courier', 'Staff', 'Status', 'Type', 'Created Date', 'Delivered Date'];
  
  const rows = parcels.map(p => {
    const created = new Date(p.createdAt * 1000).toLocaleString();
    const delivered = (p.status === 'delivered' || p.status === 'closed') 
      ? new Date(p.updatedAt * 1000).toLocaleString() 
      : 'N/A';
      
    return [
      p.parcelId,
      p.courierCompany,
      p.assignedToName || p.assignedTo,
      p.status,
      p.type,
      `"${created}"`,
      `"${delivered}"`
    ].join(',');
  });

  const csvContent = "data:text/csv;charset=utf-8," 
    + [headers.join(','), ...rows].join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "parcel_report.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// --- SEEDING FUNCTION ---
// This embeds the data from firestore_seed.json to allow one-click setup from the UI.
export const seedDatabase = async () => {
  const batch = writeBatch(db);
  
  const seedData: Record<string, Parcel> = {
    "PCL-2024-1001": {
      "parcelId": "PCL-2024-1001",
      "type": "incoming",
      "courierCompany": "BlueDart",
      "assignedTo": "staff_1",
      "assignedToName": "Alice Johnson",
      "status": "delivered",
      "createdAt": 1709539200,
      "updatedAt": 1709625600
    },
    "PCL-2024-1002": {
      "parcelId": "PCL-2024-1002",
      "type": "outgoing",
      "courierCompany": "FedEx",
      "assignedTo": "staff_2",
      "assignedToName": "Bob Smith",
      "status": "assigned",
      "createdAt": 1710144000,
      "updatedAt": 1710144000
    },
    "PCL-2024-1003": {
      "parcelId": "PCL-2024-1003",
      "type": "incoming",
      "courierCompany": "DTDC",
      "assignedTo": "staff_3",
      "assignedToName": "Charlie Brown",
      "status": "received",
      "createdAt": 1710230400,
      "updatedAt": 1710230400
    },
    "PCL-2024-1004": {
      "parcelId": "PCL-2024-1004",
      "type": "incoming",
      "courierCompany": "Delhivery",
      "assignedTo": "staff_1",
      "assignedToName": "Alice Johnson",
      "status": "closed",
      "createdAt": 1709280000,
      "updatedAt": 1709366400
    },
    "PCL-2024-1005": {
      "parcelId": "PCL-2024-1005",
      "type": "outgoing",
      "courierCompany": "BlueDart",
      "assignedTo": "staff_2",
      "assignedToName": "Bob Smith",
      "status": "assigned",
      "createdAt": 1709884800,
      "updatedAt": 1709884800
    },
    "PCL-2024-1006": {
      "parcelId": "PCL-2024-1006",
      "type": "incoming",
      "courierCompany": "FedEx",
      "assignedTo": "staff_1",
      "assignedToName": "Alice Johnson",
      "status": "delivered",
      "createdAt": 1710316800,
      "updatedAt": 1710324000
    }
  };

  Object.values(seedData).forEach((parcel) => {
    const docRef = doc(db, "parcels", parcel.parcelId);
    batch.set(docRef, parcel);
  });

  await batch.commit();
  console.log("Database seeded successfully!");
};
