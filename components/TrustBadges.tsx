import React from 'react';
import { Award, ShieldCheck, Clock, Star } from 'lucide-react';

const TrustBadges: React.FC = () => {
  const badges = [
    { icon: <Award size={32} />, text: 'IBBI Registered Valuer' },
    { icon: <ShieldCheck size={32} />, text: 'Fully Insured' },
    { icon: <Clock size={32} />, text: '20+ Years Experience' },
    { icon: <Star size={32} />, text: '5-Star Rated' },
  ];

  return (
    <div className="relative -mt-16 z-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 dark:border-slate-700 p-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {badges.map((badge, index) => (
            <div key={index} className="flex flex-col items-center text-center group">
              <div className="text-primary-light dark:text-blue-400 mb-3 transform transition-transform group-hover:scale-110 group-hover:rotate-6 duration-300">
                {badge.icon}
              </div>
              <p className="font-semibold text-slate-700 dark:text-slate-200 text-sm md:text-base">
                {badge.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrustBadges;