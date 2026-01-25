import React, { useState } from 'react';
import { Home, Building2, ClipboardList, Map as MapIcon, Scale, TrendingUp, ArrowRight, X, CheckCircle2 } from 'lucide-react';

interface ExpandedServiceItem {
  icon: React.ReactNode;
  title: string;
  description: string;
  details: {
    overview: string;
    benefits: string[];
    requirements: string[];
  }
}

const Services: React.FC = () => {
  const [selectedService, setSelectedService] = useState<ExpandedServiceItem | null>(null);

  const services: ExpandedServiceItem[] = [
    {
      icon: <Home size={32} />,
      title: 'Residential Valuations',
      description: 'Comprehensive property valuations for homes, apartments, and residential developments with detailed market analysis.',
      details: {
        overview: "Our residential valuation service provides an unbiased and precise assessment of your property's market value. Whether for sale, purchase, or mortgage purposes, we ensure our reports meet all regulatory standards.",
        benefits: ["Accepted by all major banks", "Quick turnaround time (3-5 days)", "Detailed market comparison"],
        requirements: ["Ownership documents", "Approved map/plan", "Latest tax receipt"]
      }
    },
    {
      icon: <Building2 size={32} />,
      title: 'Commercial Valuations',
      description: 'Expert valuations for office buildings, retail spaces, industrial properties, and commercial developments.',
      details: {
        overview: "We specialize in valuing complex commercial assets including office spaces, malls, and industrial units. Our reports include rental yield analysis and future projection values.",
        benefits: ["Rental yield analysis", "Compliance with IBBI norms", "Expertise in local commercial zones"],
        requirements: ["Lease deeds (if applicable)", "Building plan", "Occupation certificate"]
      }
    },
    {
      icon: <ClipboardList size={32} />,
      title: 'Building Surveys',
      description: 'Detailed building surveys including condition reports, structural assessments, and maintenance recommendations.',
      details: {
        overview: "A building survey is a comprehensive inspection of a property's condition. It identifies structural defects, dampness issues, and maintenance needs before you commit to a purchase.",
        benefits: ["Identifies hidden defects", "Cost estimates for repairs", "Peace of mind for buyers"],
        requirements: ["Access to all areas of property", "Previous maintenance records"]
      }
    },
    {
      icon: <MapIcon size={32} />,
      title: 'Land Surveys',
      description: 'Professional land surveying services including boundary surveys, topographical surveys, and site analysis.',
      details: {
        overview: "Our digital land surveying uses total stations and GPS to accurately map property boundaries, contours, and physical features essential for development planning.",
        benefits: ["High precision measurements", "Digital CAD drawings", "Boundary dispute resolution"],
        requirements: ["Revenue records (Khatauni)", "Site access"]
      }
    },
    {
      icon: <Scale size={32} />,
      title: 'Expert Witness',
      description: 'Professional expert witness services for property disputes, legal proceedings, and arbitration cases.',
      details: {
        overview: "We provide authoritative expert witness reports and testimony for court cases involving property disputes, family settlements, and valuation contestations.",
        benefits: ["Legally robust reports", "Court appearance support", "Unbiased professional opinion"],
        requirements: ["Legal case brief", "Relevant court orders"]
      }
    },
    {
      icon: <TrendingUp size={32} />,
      title: 'Investment Advice',
      description: 'Strategic property investment advice based on thorough market research and financial analysis.',
      details: {
        overview: "Maximize your returns with our data-driven investment advice. We analyze market trends, growth corridors, and risk factors to guide your real estate portfolio.",
        benefits: ["ROI analysis", "Market trend forecasting", "Risk assessment"],
        requirements: ["Investment goals", "Budget constraints"]
      }
    },
  ];

  return (
    <section id="services" className="py-24 bg-slate-50 dark:bg-slate-950 relative overflow-hidden scroll-mt-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-20">
          <span className="text-primary font-semibold tracking-wider uppercase text-sm mb-2 block">What We Do</span>
          <h2 className="text-4xl md:text-5xl font-bold font-heading text-slate-900 dark:text-white mb-6">
            Comprehensive Services
          </h2>
          <p className="max-w-2xl mx-auto text-slate-600 dark:text-slate-400 text-lg">
            We offer a wide range of professional surveying and valuation services tailored to meet the specific needs of our clients.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <div
              key={index}
              onClick={() => setSelectedService(service)}
              className="group relative bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-soft border border-slate-100 dark:border-slate-800 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:border-primary/20 cursor-pointer"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
              
              <div className="w-16 h-16 rounded-2xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary dark:text-blue-400 mb-8 group-hover:bg-primary group-hover:text-white transition-colors duration-300 shadow-sm">
                {service.icon}
              </div>
              
              <h3 className="text-xl font-bold font-heading mb-4 text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                {service.title}
              </h3>
              
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                {service.description}
              </p>
              
              <button className="inline-flex items-center text-primary font-semibold text-sm group-hover:underline decoration-2 underline-offset-4">
                View Details <ArrowRight size={16} className="ml-1 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Service Detail Modal with Glassmorphism */}
      {selectedService && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
           <div 
             className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
             onClick={() => setSelectedService(null)}
           ></div>
           
           <div className="relative w-full max-w-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/20 dark:border-slate-700/50 animate-fade-in-up flex flex-col max-h-[90vh]">
              {/* Modal Header */}
              <div className="p-6 md:p-8 bg-gradient-to-br from-primary/10 to-transparent border-b border-white/10 dark:border-slate-800 flex justify-between items-start">
                  <div className="flex items-center gap-4">
                      <div className="p-3 bg-white/80 dark:bg-slate-800 rounded-xl shadow-md text-primary">
                          {selectedService.icon}
                      </div>
                      <div>
                          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{selectedService.title}</h3>
                          <p className="text-slate-500 text-sm mt-1">Professional Service</p>
                      </div>
                  </div>
                  <button 
                    onClick={() => setSelectedService(null)}
                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-white/30 dark:hover:bg-slate-800 transition-colors"
                  >
                    <X size={24} />
                  </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 md:p-8 overflow-y-auto">
                  <div className="mb-8">
                      <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Overview</h4>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                          {selectedService.details.overview}
                      </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                          <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Key Benefits</h4>
                          <ul className="space-y-3">
                              {selectedService.details.benefits.map((item, idx) => (
                                  <li key={idx} className="flex items-start gap-2.5 text-slate-700 dark:text-slate-300">
                                      <CheckCircle2 size={18} className="text-green-500 shrink-0 mt-0.5" />
                                      <span className="text-sm font-medium">{item}</span>
                                  </li>
                              ))}
                          </ul>
                      </div>
                      
                      <div className="bg-white/30 dark:bg-slate-800/50 p-5 rounded-2xl border border-white/10 dark:border-slate-700/50">
                          <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Requirements</h4>
                           <ul className="space-y-3">
                              {selectedService.details.requirements.map((item, idx) => (
                                  <li key={idx} className="flex items-start gap-2.5 text-slate-700 dark:text-slate-300">
                                      <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 shrink-0"></span>
                                      <span className="text-sm">{item}</span>
                                  </li>
                              ))}
                          </ul>
                      </div>
                  </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-white/10 dark:border-slate-800 bg-white/30 dark:bg-slate-900/50 flex justify-end gap-3">
                  <button 
                    onClick={() => setSelectedService(null)}
                    className="px-5 py-2.5 text-slate-600 dark:text-slate-300 font-medium hover:bg-white/50 dark:hover:bg-slate-800 rounded-xl transition-colors"
                  >
                    Close
                  </button>
                  <a 
                    href="#contact"
                    onClick={() => setSelectedService(null)}
                    className="px-5 py-2.5 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl transition-colors shadow-lg shadow-primary/20"
                  >
                    Get Quote
                  </a>
              </div>
           </div>
        </div>
      )}
    </section>
  );
};

export default Services;