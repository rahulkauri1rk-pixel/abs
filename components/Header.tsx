import React, { useState, useEffect } from 'react';
import { Menu, X, Moon, Sun, Phone, FileText, LogIn, Package } from 'lucide-react';
import { useSite } from '../contexts/SiteContext';
import Link from 'next/link';

interface HeaderProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const Header: React.FC<HeaderProps> = ({ darkMode, toggleDarkMode }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const { openLoginModal, config } = useSite();

  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
            const currentScroll = window.scrollY;
            const docHeight = document.documentElement.scrollHeight;
            const winHeight = window.innerHeight;
            const scrollHeight = docHeight - winHeight;
            
            setIsScrolled(currentScroll > 20);
            setScrollProgress(scrollHeight > 0 ? (currentScroll / scrollHeight) * 100 : 0);
            
            ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('/')) return; // Allow normal Next.js Link behavior for internal routes
    
    e.preventDefault();
    const targetId = href.replace('#', '');
    if (!targetId && href !== '#home') return; 
    
    const element = document.getElementById(targetId);
    
    if (element) {
      const headerOffset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      
      setIsMobileMenuOpen(false);
    } else if (href === '#home') {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
      setIsMobileMenuOpen(false);
    }
  };

  const navLinks = [
    { name: 'Home', href: '#home' },
    { name: 'Services', href: '#services' },
    { name: 'Testimonials', href: '#testimonials' },
    { name: 'About', href: '#about' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b ${
        isScrolled
          ? 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm border-slate-200/50 dark:border-slate-800/50 py-3'
          : 'bg-transparent border-transparent py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <a 
          href="#home" 
          onClick={(e) => handleNavClick(e, '#home')}
          className="flex items-center gap-2 group"
        >
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:scale-105 transition-transform">
                A
            </div>
            <span className={`text-xl font-bold font-heading tracking-tight ${
                isScrolled ? 'text-slate-900 dark:text-white' : 'text-white'
            }`}>
                ABS<span className="font-normal opacity-80 hidden sm:inline ml-1">Aaditya</span>
            </span>
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-1">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                isScrolled 
                ? 'text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5' 
                : 'text-white/90 hover:text-white hover:bg-white/10'
              }`}
            >
              {link.name}
            </a>
          ))}
          
          <Link
            href="/v4"
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
              isScrolled 
              ? 'text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5' 
              : 'text-white/90 hover:text-white hover:bg-white/10'
            }`}
          >
            <Package size={16} />
            Parcel Tracking
          </Link>
          
          <button
            onClick={openLoginModal}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
              isScrolled 
              ? 'text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5' 
              : 'text-white/90 hover:text-white hover:bg-white/10'
            }`}
          >
            <LogIn size={16} />
            Login
          </button>
          
          <div className="w-px h-6 bg-slate-200 dark:bg-white/20 mx-2"></div>

          <button
            onClick={toggleDarkMode}
            className={`p-2 rounded-full transition-colors ${
                 isScrolled 
                 ? 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5' 
                 : 'text-white hover:bg-white/10'
            }`}
            aria-label="Toggle dark mode"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          
          <div className="flex items-center gap-3 ml-4">
             <a
                href={`tel:${config.contact.phone.replace(/\s/g, '')}`}
                className={`flex items-center gap-2 text-sm font-semibold transition-colors ${
                    isScrolled ? 'text-slate-700 dark:text-slate-200 hover:text-primary' : 'text-white/90 hover:text-white'
                }`}
              >
                <Phone size={16} className="fill-current" />
                <span className="hidden lg:inline">{config.contact.phone}</span>
              </a>

              <a
                href="#contact"
                onClick={(e) => handleNavClick(e, '#contact')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 ${
                    isScrolled 
                    ? 'bg-primary text-white hover:bg-primary-dark' 
                    : 'bg-white text-primary hover:bg-blue-50'
                }`}
              >
                <FileText size={16} />
                <span>Get a Quote</span>
              </a>
          </div>
        </nav>

        {/* Mobile Menu Button */}
        <div className="flex items-center gap-3 md:hidden">
            <button
            onClick={toggleDarkMode}
            className={`p-2 rounded-full transition-colors ${
                isScrolled ? 'text-slate-600 dark:text-slate-300' : 'text-white'
            }`}
            aria-label="Toggle dark mode"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`p-2 rounded-full transition-colors ${
                isScrolled ? 'text-slate-900 dark:text-white' : 'text-white'
            }`}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Scroll Progress Bar */}
      <div className="absolute bottom-0 left-0 w-full h-[2px] bg-transparent">
        <div 
            className="h-full bg-primary transition-all duration-150 ease-out"
            style={{ width: `${scrollProgress}%` }}
        ></div>
      </div>

      {/* Mobile Menu with Glassmorphism */}
      <div
        className={`md:hidden absolute top-full left-0 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800 shadow-xl transition-all duration-300 overflow-hidden ${
          isMobileMenuOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="flex flex-col p-6 space-y-4">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-lg font-medium text-slate-800 dark:text-slate-200 hover:text-primary dark:hover:text-primary-light"
              onClick={(e) => handleNavClick(e, link.href)}
            >
              {link.name}
            </a>
          ))}
          
          <Link
            href="/v4"
            className="text-lg font-medium text-slate-800 dark:text-slate-200 hover:text-primary dark:hover:text-primary-light flex items-center gap-2"
            onClick={() => setIsMobileMenuOpen(false)}
          >
             <Package size={18} /> Parcel Tracking
          </Link>
          
          <button
            onClick={() => { openLoginModal(); setIsMobileMenuOpen(false); }}
            className="text-lg font-medium text-slate-800 dark:text-slate-200 hover:text-primary dark:hover:text-primary-light text-left flex items-center gap-2"
          >
             <LogIn size={18} /> Login
          </button>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-3">
             <a
                href={`tel:${config.contact.phone.replace(/\s/g, '')}`}
                className="flex items-center justify-center gap-2 text-slate-600 dark:text-slate-300 py-2 font-medium"
              >
                <Phone size={18} />
                {config.contact.phone}
              </a>
              <a
                href="#contact"
                onClick={(e) => handleNavClick(e, '#contact')}
                className="flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-xl font-bold shadow-lg shadow-primary/30"
              >
                <FileText size={20} />
                Get a Quote
              </a>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;