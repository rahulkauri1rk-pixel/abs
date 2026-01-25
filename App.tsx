import React, { useState, useEffect, Suspense, useRef } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import TrustBadges from './components/TrustBadges';
import Services from './components/Services';
import Empanelment from './components/Empanelment';
import Testimonials from './components/Testimonials';
import FAQ from './components/FAQ';
import About from './components/About';
import Contact from './components/Contact';
import Footer from './components/Footer';
import AIAssistant from './components/AIAssistant';
import LoginModal from './components/LoginModal';
import { ArrowUp, Loader2 } from 'lucide-react';
import { SiteProvider, useSite } from './contexts/SiteContext';
import { doc, updateDoc, increment, setDoc } from 'firebase/firestore';
import { db } from './lib/firebase';

// Lazy load heavy dashboard components
const AdminPanel = React.lazy(() => import('./components/admin/AdminPanel'));
const UserDashboard = React.lazy(() => import('./components/user/UserDashboard'));

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
    <div className="flex flex-col items-center gap-3">
      <Loader2 size={40} className="text-primary animate-spin" />
      <p className="text-slate-500 font-medium text-sm">Loading Dashboard...</p>
    </div>
  </div>
);

const MainApp: React.FC = () => {
  const { isAdmin, user } = useSite();
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);
  const hasCountedView = useRef(false);

  useEffect(() => {
    // Check local storage for dark mode preference
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode === 'enabled') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    } else if (savedMode === 'disabled') {
      setDarkMode(false);
      document.documentElement.classList.remove('dark');
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }

    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);

    // Increment View Count (Once per session/refresh)
    const trackView = async () => {
        if (hasCountedView.current) return;
        hasCountedView.current = true;

        try {
            const statsRef = doc(db, 'site_stats', 'general');
            await updateDoc(statsRef, { views: increment(1) });
        } catch (error: any) {
            // Silently handle lack of permission for public users
            if (error.code === 'permission-denied') return;

            // If document doesn't exist, try to initialize it
            if (error.code === 'not-found' || error.message?.includes('No document to update')) {
                 try {
                    const statsRef = doc(db, 'site_stats', 'general');
                    await setDoc(statsRef, { views: 1, bounceRate: 42 }, { merge: true });
                 } catch (innerError: any) {
                    // Fail silently
                 }
            }
        }
    };
    trackView();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleDarkMode = () => {
    if (darkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'disabled');
      setDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'enabled');
      setDarkMode(true);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isAdmin) {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <AdminPanel />
      </Suspense>
    );
  }

  // If user is logged in but NOT an admin, show the User Dashboard
  if (user) {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <UserDashboard />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen font-sans antialiased selection:bg-accent selection:text-white">
      <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      
      <main>
        <Hero />
        <TrustBadges />
        <Services />
        <Empanelment />
        <Testimonials />
        <FAQ />
        <About />
        <Contact />
      </main>

      <Footer />
      
      <AIAssistant />
      <LoginModal />

      {/* Scroll to top button */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-24 right-6 p-3 rounded-full bg-primary text-white shadow-lg transition-all duration-300 z-40 hover:bg-primary-light md:bottom-8 ${
          showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
        }`}
        aria-label="Scroll to top"
      >
        <ArrowUp size={24} />
      </button>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <SiteProvider>
      <MainApp />
    </SiteProvider>
  );
};

export default App;