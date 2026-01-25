
import React from 'react';

export interface ServiceItem {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export interface TestimonialItem {
  text: string;
  author: string;
  role: string;
  initials: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
  groundingChunks?: any[]; 
}

// --- Admin & Professional Ecosystem Types ---

export interface ExternalApp {
  id: string;
  name: string;
  url: string;
  description: string;
  category: string;
  iconName?: string;
  color?: string;
  clicks?: number;
  isEmbeddable?: boolean;
  createdAt: any;
}

export interface PropertyRecord {
  id: string;
  lat: number;
  lng: number;
  type: string;
  rate: number;
  areaName: string;
  city: string;
  boundaries?: {
    north: string;
    south: string;
    east: string;
    west: string;
  };
  recordedBy: string;
  userId: string;
  timestamp: any;
}

export interface ContactRecord {
  id: string;
  state: string;
  city: string;
  bank: string;
  branch: string;
  branch_code?: string;
  contact_person?: string;
  primary_phone?: string;
  alternate_phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  created_at: any;
  updated_at: any;
  created_by?: string;
}

// --- Performance & ERP Types ---

export interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  date: string; // YYYY-MM-DD
  checkIn: any; // Timestamp
  checkOut?: any; // Timestamp
  status: 'Present' | 'Late' | 'Half-Day' | 'Absent';
  location?: {
    lat: number;
    lng: number;
  };
  durationMinutes?: number;
}

export interface PaymentRecord {
  amount: number;
  date: string;
  mode: 'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque';
  reference?: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  hsnSac: string; // 998322 for consultancy
  quantity: number;
  rate: number;
  amount: number;
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  ifscCode: string;
  branchName: string;
  isDefault?: boolean;
}

export interface FirmProfile {
  firmName: string;
  subTitle: string;
  proprietorName: string;
  address: string;
  email: string;
  phonePrimary: string;
  phoneSecondary: string;
  gstin: string;
  
  // Legacy single bank fields (kept for backward compatibility if needed, but UI will prefer bankAccounts)
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  ifscCode?: string;
  branchName?: string;
  
  // New multiple bank accounts
  bankAccounts?: BankAccount[];

  signatoryLabel: string;
  logoUrl?: string;
}

export interface InvoiceRecord {
  id: string;
  userId: string; 
  caseId: string;
  invoiceNo: string; // e.g., 444
  
  // Billing To (Bank/Branch Details)
  billingToBankName?: string; // e.g. Bank of Baroda
  billingToBranch?: string;   // e.g. Branch - Bazpur
  billingToDistrict?: string; // e.g. Distt - U.S.Nagar
  billingToState?: string;    // e.g. Uttarakhand

  // Branch Case Details
  branchCaseDetails?: string; // e.g. BOB - Bazpur
  propertyAddress?: string; // e.g. "Property at Khasra No 123..."

  // Client Details (The actual borrower/client)
  clientName: string;         // e.g. M/S Uma Shakti Steels Pvt. Ltd. (Account Name)
  clientOwnerName?: string;   // e.g. Prop. Arpit Agarwal (if relevant) or blank
  clientAddress?: string;
  clientGstin?: string;
  clientMobile?: string;
  clientState?: string;
  placeOfSupply?: string;

  // Financials
  items: InvoiceItem[];
  subtotal: number;
  taxType: 'IGST' | 'CGST_SGST';
  taxRate: number; // usually 18
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  amount: number; // Total with tax (Grand Total)
  
  // Payment Status
  balance?: number; 
  received?: number; 
  payments?: PaymentRecord[]; 
  
  // Meta
  invoiceDate: string;
  dueDate: string;
  status: 'Draft' | 'Sent' | 'Partially Paid' | 'Paid' | 'Overdue' | 'Cancelled';
  paymentDate?: string;
  
  // Terms
  termsAndConditions?: string;

  // Our Bank Details Snapshot
  firmBankDetails?: BankAccount;
}

export interface ExpenseRecord {
  id: string;
  date: string;
  category: 'Salaries' | 'Travel' | 'Rent' | 'Software' | 'Printing' | 'Misc';
  description: string;
  amount: number;
  paymentMode: 'Cash' | 'UPI' | 'Bank' | 'Card';
  employeeId?: string; // Linked employee
  employeeName?: string;
  caseId?: string; // Linked project
  status: 'Pending' | 'Approved' | 'Rejected';
  receiptUrl?: string;
  isFixed?: boolean; // Fixed vs Variable
  createdAt: any;
}

export interface IncomeRecord {
  id: string;
  date: string;
  source: string; // Client or Payer
  category: 'Consultation' | 'Valuation' | 'Survey' | 'Advance' | 'Refund' | 'Other';
  amount: number;
  paymentMode: 'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque';
  reference?: string;
  description?: string;
  invoiceId?: string; // Optional link
  createdAt: any;
}

export interface PerformanceMetrics {
  userId: string;
  month: string; // YYYY-MM
  scores: {
    workVolume: number; // out of 100
    timeliness: number;
    quality: number;
    fieldEfficiency: number;
    attendance: number;
    behaviour: number;
    billing: number;
  };
  finalScore: number; // out of 100
}

// --- Chat Module Types ---

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: string;
  lastSeen?: any; // Firestore Timestamp
  isOnline?: boolean;
}

export interface ChatMessageData {
  id: string;
  senderId: string;
  senderName: string;
  type: 'text' | 'image' | 'file' | 'survey';
  text?: string;
  mediaUrl?: string;
  fileName?: string;
  timestamp: any;
  readBy: string[]; // Array of user IDs who have read the message
  replyTo?: {
    id: string;
    senderName: string;
    text: string;
  };
  surveyId?: string;
  surveyCaseId?: string;
}

export interface ChatRoom {
  id: string;
  type: 'direct' | 'case';
  caseId?: string; // Optional: Only for case-based chats
  caseName?: string; // Cache case name/ref for display
  participants: string[]; // Array of UIDs
  participantNames: Record<string, string>; // Map UID -> Name
  lastMessage: string;
  lastMessageTime: any;
  unreadCounts: Record<string, number>; // Map UID -> Count
  createdAt: any;
  createdBy: string;
}

// --- Survey Pad Types ---

export interface SurveyMedia {
  id: string;
  url: string;
  type: 'front' | 'rear' | 'left' | 'right' | 'interior' | 'road' | 'landmark' | 'other';
  lat?: number;
  lng?: number;
  timestamp: string;
  note?: string;
}

export interface RoomMeasurement {
  id: string;
  name: string;
  length: number;
  width: number;
  area: number;
}

export interface FloorMeasurement {
  id: string;
  name: string; // e.g., Ground Floor
  rooms: RoomMeasurement[];
  totalArea: number;
}

export interface SurveyRecord {
  id: string;
  caseId: string;
  bankName: string;
  propertyType: 'Residential' | 'Commercial' | 'Industrial' | 'Land' | 'Agricultural';
  employeeId: string;
  employeeName: string;
  status: 'draft' | 'submitted' | 'reviewed';
  revisionCount?: number;
  errorFlag?: boolean;
  
  // Property Details
  details: {
    ownerName: string;
    customerPhone?: string; // Added
    address: string;
    locality: string;
    city: string;
    state: string;
    pincode: string;
    purpose: string;
    occupancy: 'Self Occupied' | 'Tenant' | 'Vacant' | 'Under Construction';
    ageOfProperty: string;
    constructionType: string;
  };

  // Land Details (Added)
  landDetails?: {
    rate: number;
    area: number;
    length: number;
    width: number;
    boundaries: {
        north: string;
        south: string;
        east: string;
        west: string;
    };
    dimensions?: {
        north: number;
        south: number;
        east: number;
        west: number;
    };
  };

  // GPS
  location?: {
    lat: number;
    lng: number;
    capturedAt: string;
  };

  // Media
  media: SurveyMedia[];

  // Measurements
  measurements: {
    unit: 'sqft' | 'sqm';
    floors: FloorMeasurement[];
    totalBuiltUpArea: number;
  };

  // Remarks
  observations: {
    constructionQuality: string;
    surroundings: string;
    legalIssues: string;
    negativeFactors: string;
    overallRemarks: string;
  };

  createdAt: any;
  updatedAt: any;
  submittedAt?: any;
}

export interface HeroConfig {
  badge: string;
  titleLine1: string;
  titleLine2: string;
  description: string;
  backgroundImage: string;
}

export interface SeoConfig {
  title: string;
  description: string;
  keywords: string;
}

export interface ThemeConfig {
  primaryColor: string;
  darkMode: boolean;
}

export interface SocialLinks {
  facebook: string;
  twitter: string;
  linkedin: string;
  instagram: string;
}

export interface ContactInfo {
  phone: string;
  email: string;
  address: string;
  googleMapsLink: string;
  socials: SocialLinks;
}

export interface SiteStats {
  years: number;
  properties: number;
  clients: number;
}

export interface SiteFeatures {
  enableAI: boolean;
  showTestimonials: boolean;
}

export interface AboutConfig {
  title: string;
  description: string;
  imageUrl: string;
}

export interface SiteConfig {
  hero: HeroConfig;
  seo: SeoConfig;
  theme: ThemeConfig;
  contact: ContactInfo;
  features: SiteFeatures;
  stats: SiteStats;
  banks: string[];
  about: AboutConfig;
}
