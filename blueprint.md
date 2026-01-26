# Project Blueprint - Aaditya Building Solution (ABSV)

## Purpose and Capabilities
A comprehensive enterprise management platform for a professional valuation and engineering firm. It streamlines field surveys, case management, financial reporting, and internal communication.

## Implementation Details

### Core Technologies
- **Frontend:** Next.js (App Router), React, Tailwind CSS, Lucide React
- **Backend/Database:** Firebase (Firestore, Auth, Storage)
- **Charts:** Recharts
- **PDF Generation:** jsPDF, jsPDF-AutoTable
- **Icons:** Lucide-React

### Key Features
- **User Dashboard:** Role-based access for Admins, Employees, and Clients.
- **Survey Pad:** Mobile-responsive tool for field engineers to capture property details, measurements, and geo-tagged photos.
- **Finance Module:** Automated invoicing, expense tracking, and financial analytics.
- **Secure Chat:** Real-time, encrypted internal communication system with case-linking capabilities.
- **Market Intelligence:** Collaborative map-based tool for tracking property rates across regions.
- **Attendance & Performance:** GPS-based check-in/out and automated performance scoring.
- **Parcel Analytics (V4 Module):** Integrated reporting system for tracking parcel deliveries, staff performance, and courier efficiency.

### Style and Design
- **Modern UI:** Clean, whitespace-rich design with a professional color palette (Indigo, Emerald, Slate).
- **Responsive:** Fully optimized for mobile (especially Survey Pad and Chat) and desktop.
- **Interactive:** Subtle animations, glowing shadows on interactive elements, and intuitive navigation.

## Current Plan: Integrate V4 Parcel Analytics Module

### Objectives
1.  **Standalone Module:** Integrate V4 code as a modular feature within the existing Next.js app.
2.  **Next.js Migration:** Convert V4's `react-router-dom` navigation to Next.js App Router.
3.  **Firebase Reuse:** Ensure the module uses the existing Firebase configuration and Auth.
4.  **Seamless UI:** Adapt V4's UI components to match the project's design system.

### Action Steps
1.  **Setup Directory Structure:**
    - Create `/app/v4/` for routing.
    - Create `/components/v4/` for module-specific UI.
    - Create `/lib/v4/` for data services and logic.
2.  **Port Services & Types:**
    - Migrate `temp_v4/types.ts` to `/types/v4.ts`.
    - Migrate `temp_v4/services/dataService.ts` to `/lib/v4/dataService.ts`, ensuring it uses the global Firebase instance.
3.  **Port Components:**
    - Migrate and refactor `AdminComponents.tsx` to `/components/v4/AdminComponents.tsx`.
4.  **Implement Next.js Pages:**
    - Create `/app/v4/layout.tsx` with the module sidebar.
    - Create `/app/v4/page.tsx` (Dashboard).
    - Create `/app/v4/staff-performance/page.tsx`.
    - Create `/app/v4/courier-report/page.tsx`.
    - Create `/app/v4/parcels-report/page.tsx`.
5.  **Global Integration:**
    - Add "Parcel Analytics" to the main navigation (e.g., `components/Header.tsx` or `AdminPanel.tsx`).
6.  **Cleanup:** Remove `temp_v4` directory and temporary files.
