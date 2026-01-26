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

### Style and Design
- **Modern UI:** Clean, whitespace-rich design with a professional color palette (Indigo, Emerald, Slate).
- **Responsive:** Fully optimized for mobile (especially Survey Pad and Chat) and desktop.
- **Interactive:** Subtle animations, glowing shadows on interactive elements, and intuitive navigation.

## Current Plan: Fix "Failed to Send Message" in Secure Chat

### Issues Identified
1.  **Sync Delays:** In `handleSendMessage`, the code relies on the `rooms` state variable to find the current room's metadata. If the room was just joined/created, it might not be in the `rooms` array yet, causing the metadata update to be incomplete or fail.
2.  **Missing Initialization:** When joining an existing case room, the `unreadCounts` for the joining user was not being initialized, which could lead to issues when trying to increment or reset it.
3.  **Error Handling:** The alert message "Failed to send message" is generic and doesn't provide enough information for debugging.

### Action Steps
1.  **Update `createCaseRoom`**: Ensure `unreadCounts` is initialized when a user joins an existing room.
2.  **Refactor `handleSendMessage`**: 
    - Fetch the latest room document directly if it's not found in the local state.
    - Improve the metadata update logic to be more resilient to missing fields.
    - Provide better error logging.
3.  **Optimize Mark as Read**: Ensure unread counts are properly reset when messages are viewed.
4.  **Lint and Verify**: Run linting and check the dev server output.
