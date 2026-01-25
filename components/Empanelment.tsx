
import React from 'react';
import { Landmark, Briefcase, ShieldCheck, Globe, Building2, Scale } from 'lucide-react';
import { useSite } from '../contexts/SiteContext';

const Empanelment: React.FC = () => {
  const { config } = useSite();
  const categories = [
    { name: "BANKS & FINANCE COMPANIES", icon: <Landmark size={20} /> },
    { name: "CENTRAL EXCISE DEPARTMENT", icon: <ShieldCheck size={20} /> },
    { name: "VIGILANCE DEPARTMENT/CBI", icon: <ShieldCheck size={20} /> },
    { name: "GOVERNMENT DEPARTMENTS", icon: <Building2 size={20} /> },
    { name: "INDUSTRIAL CORPORATIONS", icon: <Building2 size={20} /> },
    { name: "PETROLEUM COMPANIES", icon: <Building2 size={20} /> },
    { name: "INSURANCE COMPANIES", icon: <ShieldCheck size={20} /> },
    { name: "PUBLIC LIMITED COMPANIES", icon: <Globe size={20} /> },
    { name: "TAXATION AUTHORITIES", icon: <Scale size={20} /> },
    { name: "ACQUISITION & LIQUIDATION", icon: <Briefcase size={20} /> },
    { name: "FLAT PROMOTERS", icon: <Home size={20} /> },
    { name: "VISA ASSISTANCE", icon: <Globe size={20} /> },
    { name: "OTHER PROFESSIONALS", icon: <Briefcase size={20} /> },
    { name: "PUBLIC SECTOR", icon: <Users size={20} /> },
  ];

  const banks = config.banks;

  return (
    <section className="py-20 bg-white dark:bg-slate-900 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-30">
            <div className="absolute top-[10%] left-[-5%] w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-[10%] right-[-5%] w-64 h-64 bg-accent/5 rounded-full blur-3xl"></div>
        </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <span className="text-primary font-semibold tracking-wider uppercase text-sm mb-2 block">Our Network</span>
          <h2 className="text-3xl md:text-4xl font-bold font-heading text-slate-900 dark:text-white mb-6">
            Institutional Empanelment
          </h2>
          <p className="max-w-2xl mx-auto text-slate-600 dark:text-slate-400 text-lg mb-6">
            We provide professional valuation services across a diverse spectrum of government, corporate, and financial sectors.
          </p>
          <div className="w-20 h-1.5 bg-accent mx-auto rounded-full"></div>
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {categories.map((cat, index) => (
            <div key={index} className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700 transition-all hover:shadow-md">
              <div className="text-primary dark:text-blue-400 shrink-0">{cat.icon}</div>
              <span className="text-[10px] font-black text-slate-700 dark:text-slate-200 tracking-wider leading-tight uppercase">{cat.name}</span>
            </div>
          ))}
        </div>

        <div className="text-center mb-10">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Partner Banks</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
          {banks.map((bank, index) => (
            <div 
              key={index} 
              className="group flex items-center p-5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 transition-all duration-300 hover:shadow-lg hover:border-primary/30 hover:-translate-y-1"
            >
              <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-700 shadow-sm flex items-center justify-center text-primary dark:text-blue-400 mr-4 shrink-0 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                <Landmark size={18} />
              </div>
              <span className="font-semibold text-slate-700 dark:text-slate-200 group-hover:text-primary dark:group-hover:text-blue-300 transition-colors text-xs leading-tight">
                {bank}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Helper components for missing icons
const Home = ({ size, className }: { size: number, className?: string }) => <Building2 size={size} className={className} />;
const Users = ({ size, className }: { size: number, className?: string }) => <Building2 size={size} className={className} />;

export default Empanelment;
