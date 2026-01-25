import React, { useState, useEffect, useCallback } from 'react';
import { Quote, ChevronLeft, ChevronRight } from 'lucide-react';
import { TestimonialItem } from '../types';

const Testimonials: React.FC = () => {
  const testimonials: TestimonialItem[] = [
    {
      text: "Aaditya Building Solution provided an incredibly detailed and accurate valuation for our commercial property. Their expertise helped us secure financing quickly and confidently.",
      author: "John Davidson",
      role: "Property Investor",
      initials: "JD"
    },
    {
      text: "The building survey was thorough and professionally presented. They identified issues we would have missed and saved us thousands in potential repairs.",
      author: "Sarah Mitchell",
      role: "Homeowner",
      initials: "SM"
    },
    {
      text: "As a solicitor, I regularly instruct Aaditya Building Solution for expert witness work. Their reports are clear, comprehensive and stand up well under cross-examination.",
      author: "Robert Clarke",
      role: "Legal Professional",
      initials: "RC"
    },
    {
      text: "The team at ABS helped us navigate a complex land dispute with their precise survey. Highly professional and always available to answer our queries.",
      author: "Michael Chang",
      role: "Real Estate Developer",
      initials: "MC"
    },
    {
      text: "Fast, efficient, and very detailed. Their valuation report was instrumental in our asset restructuring process. Best valuation service in Uttarakhand.",
      author: "Priya Singh",
      role: "Architect",
      initials: "PS"
    }
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(1);
  const [isPaused, setIsPaused] = useState(false);

  // Initialize and handle resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setItemsPerPage(3);
      } else if (window.innerWidth >= 768) {
        setItemsPerPage(2);
      } else {
        setItemsPerPage(1);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Clamp index on resize
  useEffect(() => {
    const maxIndex = Math.max(0, testimonials.length - itemsPerPage);
    if (currentIndex > maxIndex) {
      setCurrentIndex(maxIndex);
    }
  }, [itemsPerPage, testimonials.length, currentIndex]);

  // Auto-play
  useEffect(() => {
    if (isPaused) return;
    
    const maxIndex = Math.max(0, testimonials.length - itemsPerPage);
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev >= maxIndex ? 0 : prev + 1));
    }, 5000);
    
    return () => clearInterval(interval);
  }, [currentIndex, isPaused, itemsPerPage, testimonials.length]);

  const maxIndex = Math.max(0, testimonials.length - itemsPerPage);

  const handlePrev = useCallback(() => {
    setCurrentIndex(prev => (prev === 0 ? maxIndex : prev - 1));
  }, [maxIndex]);

  const handleNext = useCallback(() => {
    setCurrentIndex(prev => (prev >= maxIndex ? 0 : prev + 1));
  }, [maxIndex]);

  return (
    <section id="testimonials" className="py-20 bg-white dark:bg-slate-800 relative overflow-hidden scroll-mt-28">
        {/* Background Pattern */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-blue-50 dark:bg-slate-700/50 blur-3xl opacity-60"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-amber-50 dark:bg-slate-700/50 blur-3xl opacity-60"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold font-heading text-slate-900 dark:text-white mb-4">
            What Our Clients Say
          </h2>
          <div className="w-20 h-1.5 bg-accent mx-auto rounded-full"></div>
        </div>

        {/* Carousel Container */}
        <div 
            className="relative group"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            {/* Viewport */}
            <div className="overflow-hidden px-2 -mx-2 pb-4"> 
                {/* Track */}
                <div 
                    className="flex transition-transform duration-500 ease-out will-change-transform"
                    style={{ transform: `translateX(-${currentIndex * (100 / itemsPerPage)}%)` }}
                >
                    {testimonials.map((item, index) => (
                        <div 
                            key={index} 
                            className="flex-shrink-0 px-3"
                            style={{ width: `${100 / itemsPerPage}%` }}
                        >
                            <div className="bg-slate-50 dark:bg-slate-900 p-8 rounded-2xl shadow-md border border-slate-100 dark:border-slate-700 relative hover:shadow-lg transition-shadow h-full flex flex-col">
                                <Quote className="absolute top-6 left-6 text-blue-200 dark:text-slate-700 w-12 h-12 rotate-180" />
                                <p className="relative z-10 text-slate-700 dark:text-slate-300 italic mb-6 pt-6 flex-grow">
                                    "{item.text}"
                                </p>
                                <div className="flex items-center gap-4 mt-auto">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-md shrink-0">
                                    {item.initials}
                                    </div>
                                    <div>
                                    <h4 className="font-bold text-slate-900 dark:text-white">{item.author}</h4>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{item.role}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Controls */}
            <button 
                onClick={handlePrev}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 md:-translate-x-12 bg-white dark:bg-slate-700 text-slate-800 dark:text-white p-3 rounded-full shadow-lg border border-slate-100 dark:border-slate-600 opacity-0 group-hover:opacity-100 hover:scale-110 transition-all duration-300 z-20 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-30"
                aria-label="Previous testimonial"
            >
                <ChevronLeft size={24} />
            </button>
            <button 
                onClick={handleNext}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 md:translate-x-12 bg-white dark:bg-slate-700 text-slate-800 dark:text-white p-3 rounded-full shadow-lg border border-slate-100 dark:border-slate-600 opacity-0 group-hover:opacity-100 hover:scale-110 transition-all duration-300 z-20 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-30"
                aria-label="Next testimonial"
            >
                <ChevronRight size={24} />
            </button>

            {/* Pagination Dots */}
            <div className="flex justify-center mt-8 gap-2">
                {Array.from({ length: maxIndex + 1 }).map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => setCurrentIndex(idx)}
                        className={`transition-all duration-300 rounded-full ${
                            idx === currentIndex 
                            ? 'w-8 h-2 bg-primary' 
                            : 'w-2 h-2 bg-slate-300 dark:bg-slate-600 hover:bg-primary/50'
                        }`}
                        aria-label={`Go to slide ${idx + 1}`}
                    />
                ))}
            </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;