import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { FaqItem } from '../types';

const FAQ: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const faqs: FaqItem[] = [
    {
      question: "How long does a typical property valuation take?",
      answer: "A standard residential valuation typically takes 1-2 hours on-site, with the full report delivered within 3-5 working days. Commercial valuations may require additional time depending on the property size and complexity."
    },
    {
      question: "What qualifications do your surveyors hold?",
      answer: "All our valuers are registered with the Insolvency and Bankruptcy Board of India (IBBI) and hold relevant academic qualifications. We maintain continuing professional development to stay current with industry standards."
    },
    {
      question: "Are your valuations accepted by mortgage lenders?",
      answer: "Yes, our valuations are accepted by all major financial institutions. We follow Indian Valuation Standards to ensure compliance."
    },
    {
      question: "What's the difference between a valuation and a survey?",
      answer: "A valuation determines the market value of a property, while a survey assesses the physical condition and identifies defects. Many clients request both services together for a complete picture."
    }
  ];

  const toggleAccordion = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-20 bg-slate-50 dark:bg-slate-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
            <HelpCircle className="text-primary dark:text-blue-400 w-6 h-6" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold font-heading text-slate-900 dark:text-white mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Common questions about our surveying and valuation services.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className={`bg-white dark:bg-slate-800 rounded-xl overflow-hidden transition-all duration-300 border ${
                activeIndex === index
                  ? 'border-primary dark:border-blue-500 shadow-lg'
                  : 'border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md'
              }`}
            >
              <button
                onClick={() => toggleAccordion(index)}
                className="w-full flex justify-between items-center p-6 text-left focus:outline-none"
                aria-expanded={activeIndex === index}
              >
                <span className={`font-semibold text-lg ${
                  activeIndex === index ? 'text-primary dark:text-blue-400' : 'text-slate-800 dark:text-slate-200'
                }`}>
                  {faq.question}
                </span>
                {activeIndex === index ? (
                  <ChevronUp className="text-primary dark:text-blue-400 transition-transform" />
                ) : (
                  <ChevronDown className="text-slate-400 transition-transform" />
                )}
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  activeIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="p-6 pt-0 text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-700 mt-2">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;