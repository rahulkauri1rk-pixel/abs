'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Truck, 
  Package, 
  X,
  Menu,
  LogOut,
  ChevronLeft
} from 'lucide-react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';

const SidebarLink: React.FC<{ href: string; icon: any; label: string; active: boolean }> = ({ href, icon: Icon, label, active }) => (
  <Link
    href={href}
    className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-150 ${
      active 
        ? 'bg-indigo-50 text-indigo-700' 
        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
    }`}
  >
    <Icon className={`w-5 h-5 mr-3 ${active ? 'text-indigo-600' : 'text-gray-400'}`} />
    {label}
  </Link>
);

export default function V4Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const links = [
    { href: '/v4', label: 'Overview', icon: LayoutDashboard },
    { href: '/v4/staff-performance', label: 'Staff Performance', icon: Users },
    { href: '/v4/courier-report', label: 'Courier Reports', icon: Truck },
    { href: '/v4/parcels-report', label: 'Raw Parcel Data', icon: Package },
  ];

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-gray-50 p-4 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Restricted</h1>
        <p className="text-gray-600 mb-8">Please login to access the Parcel Analytics module.</p>
        <Link href="/" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
          Go to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 md:hidden" onClick={() => setIsMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed md:inset-y-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0 flex flex-col justify-between ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div>
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <Link href="/" className="flex items-center text-indigo-600 font-bold">
              <ChevronLeft className="w-4 h-4 mr-1" />
              <span>Back to ABSV</span>
            </Link>
            <button onClick={() => setIsMobileOpen(false)} className="md:hidden text-gray-500">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="px-6 py-4">
             <span className="text-xl font-bold text-gray-800">Parcel Analytics</span>
          </div>
          <nav className="p-4 space-y-1">
            {links.map((link) => (
              <SidebarLink 
                key={link.href} 
                href={link.href} 
                label={link.label} 
                icon={link.icon} 
                active={pathname === link.href} 
              />
            ))}
          </nav>
        </div>
        
        <div className="p-4 border-t border-gray-200">
          <button 
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between h-16 px-6 bg-white border-b border-gray-200 md:hidden">
          <button onClick={() => setIsMobileOpen(true)} className="text-gray-500">
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-semibold text-gray-700">Analytics</span>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
