import React from 'react';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { useSite } from '../contexts/SiteContext';

const Hero: React.FC = () => {
  const { config } = useSite();
  const { hero } = config;

  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const targetId = href.replace('#', '');
    const element = document.getElementById(targetId);
    
    if (element) {
      const headerOffset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section id="home" className="relative pt-32 pb-24 md:pt-48 md:pb-40 overflow-hidden">
      {/* Background Image & Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={hero.backgroundImage}
          alt="Background"
          className="w-full h-full object-cover transform scale-105"
          fetchPriority="high"
        />
        {/* Stronger overlay for better text contrast */}
        <div className="absolute inset-0 bg-slate-900/70 mix-blend-multiply"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-slate-900/60"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 to-transparent"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-8 animate-fade-in-up">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
            </span>
            <span className="text-sm font-medium tracking-wide uppercase">{hero.badge}</span>
        </div>

        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold font-heading mb-8 tracking-tight leading-tight animate-fade-in-up delay-100 drop-shadow-2xl">
          {hero.titleLine1} <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-200 to-white">{hero.titleLine2}</span>
        </h1>
        
        <p className="text-lg md:text-xl text-slate-200 max-w-2xl mx-auto mb-12 leading-relaxed animate-fade-in-up delay-200 font-light drop-shadow-md">
          {hero.description}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-5 justify-center items-center animate-fade-in-up delay-300">
          <a
            href="#contact"
            onClick={(e) => handleScroll(e, '#contact')}
            className="group relative inline-flex items-center justify-center bg-primary hover:bg-primary-dark text-white px-8 py-4 rounded-full text-lg font-semibold transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] hover:-translate-y-1 cursor-pointer"
          >
            Get Free Quote
            <ArrowRight size={20} className="ml-2 transition-transform group-hover:translate-x-1" />
          </a>
          <a
            href="#services"
            onClick={(e) => handleScroll(e, '#services')}
            className="group inline-flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/20 backdrop-blur-sm text-white px-8 py-4 rounded-full text-lg font-medium transition-all hover:-translate-y-1 cursor-pointer"
          >
            Explore Services
            <ChevronRight size={20} className="ml-2 opacity-70 group-hover:opacity-100" />
          </a>
        </div>
      </div>
      
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-slate-50 dark:from-slate-950 to-transparent z-10"></div>
    </section>
  );
};

export default Hero;