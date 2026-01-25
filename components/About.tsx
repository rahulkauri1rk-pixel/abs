
import React, { useState, useEffect, useRef } from 'react';
import { useSite } from '../contexts/SiteContext';

// Simple hook for counting up numbers when in view
const useCounter = (end: number, duration: number = 2000) => {
  const [count, setCount] = useState(0);
  const elementRef = useRef<HTMLDivElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          let start = 0;
          const increment = end / (duration / 16); // 60fps
          
          const timer = setInterval(() => {
            start += increment;
            if (start >= end) {
              setCount(end);
              clearInterval(timer);
            } else {
              setCount(Math.floor(start));
            }
          }, 16);
        }
      },
      { threshold: 0.5 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [end, duration, hasAnimated]);

  return { count, elementRef };
};

const StatCard: React.FC<{ end: number; suffix: string; label: string; delay?: number }> = ({ end, suffix, label }) => {
    const { count, elementRef } = useCounter(end);
    
    return (
        <div 
            ref={elementRef}
            className="bg-slate-50 dark:bg-slate-700 p-8 rounded-2xl text-center border-b-4 border-accent shadow-lg transform transition hover:-translate-y-2 group"
        >
            <div className="text-4xl font-bold text-primary dark:text-white mb-2 group-hover:scale-110 transition-transform inline-block">
                {count}{suffix}
            </div>
            <div className="text-sm font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wide">
                {label}
            </div>
        </div>
    );
};

const About: React.FC = () => {
  const { config } = useSite();
  const { stats } = config;

  return (
    <section id="about" className="py-20 bg-white dark:bg-slate-800 scroll-mt-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold font-heading text-slate-900 dark:text-white mb-6">
              Your Trusted Property <br />
              <span className="text-primary-light">Professionals</span>
            </h2>
            <div className="space-y-4 text-slate-600 dark:text-slate-300 text-lg leading-relaxed">
              <p>
                Led by <span className="font-semibold text-primary dark:text-blue-400">Vr. Arpit Agarwal</span>, a Chartered Civil Engineer, Authorised Structural Engineer, and IBBI Registered Valuer, Aaditya Building Solution (ABS) stands for integrity and precision in the valuation industry.
              </p>
              <p>
                With over {stats.years} years of experience, we provide accurate, reliable, and professional surveying and valuation services tailored to both individual and corporate clients. Our head office is based in Kashipur, Uttarakhand, serving clients across the region.
              </p>
              <p>
                As Govt. Approved Valuers, we adhere to the highest standards of the Insolvency and Bankruptcy Board of India (IBBI) and Indian Valuation Standards, ensuring every report we deliver is comprehensive and legally robust.
              </p>
              
              <div className="pt-6">
                <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/2/2f/Sign_signature_sample.svg" 
                    alt="Signature" 
                    className="h-12 opacity-60 dark:invert"
                />
                <p className="text-sm font-bold text-slate-400 mt-2">Vr. Arpit Agarwal</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <StatCard end={stats.years} suffix="+" label="Years Experience" />
            <div className="sm:translate-y-6">
                <StatCard end={stats.properties} suffix="+" label="Properties Valued" />
            </div>
            <StatCard end={stats.clients} suffix="+" label="Happy Clients" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
