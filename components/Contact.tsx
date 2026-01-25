import React, { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Send, CheckCircle2, FileText, User } from 'lucide-react';
import { useSite } from '../contexts/SiteContext';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

const Contact: React.FC = () => {
  const { config } = useSite();
  const { contact } = config;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    service: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
        await addDoc(collection(db, 'contact_submissions'), {
            ...formData,
            timestamp: new Date().toISOString(),
            status: 'new',
            read: false
        });
        
        setSubmitted(true);
        setFormData({ name: '', email: '', phone: '', service: '', message: '' });
        
        // Reset success message after 5s
        setTimeout(() => setSubmitted(false), 5000); 
    } catch (error) {
        console.error("Error submitting form:", error);
        alert("There was a problem sending your request. Please try again or contact us by phone.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <section id="contact" className="py-20 bg-slate-50 dark:bg-slate-900 scroll-mt-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
             <FileText className="text-primary dark:text-blue-400 w-6 h-6" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold font-heading text-slate-900 dark:text-white mb-4">
            Get a Free Quote
          </h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Fill out the form below to receive a personalized valuation quote or callback from our team.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 h-full flex flex-col">
            <div className="border-b border-slate-100 dark:border-slate-700 pb-6 mb-6">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Contact Information</h3>
                
                <div className="flex items-start gap-4 mb-2">
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg text-primary dark:text-blue-400 shrink-0 mt-1">
                        <User size={20} />
                    </div>
                    <div>
                        <h4 className="text-lg font-bold text-primary dark:text-blue-400">Vr. Arpit Agarwal</h4>
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mt-1 leading-relaxed">
                            Chartered Civil Engineer | Authorised Structural Engineer<br/>
                            Govt. Approved Valuer | IBBI Registered Valuer
                        </p>
                    </div>
                </div>
            </div>

            <p className="text-slate-600 dark:text-slate-300 mb-8">
              Reach out to us directly or visit our head office. We are here to answer your property related queries.
            </p>
            
            <div className="space-y-6 flex-grow">
              <div className="flex items-start gap-4">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full text-primary dark:text-blue-400 shrink-0">
                  <MapPin size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">Head Office</h4>
                  <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                    {contact.address}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full text-primary dark:text-blue-400 shrink-0">
                  <Phone size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">Phone</h4>
                  <div className="text-slate-600 dark:text-slate-300 text-sm space-y-1">
                    <a href={`tel:${contact.phone.replace(/\s/g, '')}`} className="hover:text-primary transition-colors block">{contact.phone}</a>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full text-primary dark:text-blue-400 shrink-0">
                  <Mail size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">Email</h4>
                  <p className="text-slate-600 dark:text-slate-300 text-sm">
                    <a href={`mailto:${contact.email}`} className="hover:text-primary transition-colors break-all">{contact.email}</a>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full text-primary dark:text-blue-400 shrink-0">
                  <Clock size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">Hours</h4>
                  <p className="text-slate-600 dark:text-slate-300 text-sm">Mon-Sat: 10:00 AM - 7:00 PM</p>
                  <p className="text-slate-600 dark:text-slate-300 text-sm">Sunday: Closed</p>
                </div>
              </div>
            </div>
            
            {/* Map Placeholder */}
            <div className="mt-8 rounded-xl overflow-hidden h-48 bg-slate-200 dark:bg-slate-700 relative group">
                 <img 
                    src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&q=80" 
                    alt="Map Location" 
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                    <a 
                        href={contact.googleMapsLink || "https://maps.google.com"}
                        target="_blank" 
                        rel="noreferrer"
                        className="bg-white text-primary px-5 py-2.5 rounded-lg font-bold shadow-lg hover:scale-105 transition-transform flex items-center gap-2"
                    >
                        <MapPin size={18} /> Locate Us
                    </a>
                </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-16 -mt-16 pointer-events-none"></div>
            
            {submitted ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 animate-fade-in">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 shadow-soft">
                  <CheckCircle2 size={48} />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Request Received!</h3>
                <p className="text-slate-600 dark:text-slate-300 mb-6">
                  Thank you for contacting Aaditya Building Solution. Our team will review your request and get back to you with a quote shortly.
                </p>
                <button 
                  onClick={() => setSubmitted(false)}
                  className="text-primary font-semibold hover:underline"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Send us a message</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Full Name *
                    </label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                        placeholder="Your Name"
                    />
                    </div>

                    <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Phone Number *
                    </label>
                    <input
                        type="tel"
                        id="phone"
                        name="phone"
                        required
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                        placeholder="+91 98371 79179"
                    />
                    </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="service" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Service Required *
                  </label>
                  <select
                    id="service"
                    name="service"
                    required
                    value={formData.service}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all appearance-none"
                  >
                    <option value="">Select a service</option>
                    <option value="residential">Residential Valuation</option>
                    <option value="commercial">Commercial Valuation</option>
                    <option value="building-survey">Building Survey</option>
                    <option value="land-survey">Land Survey</option>
                    <option value="project-management">Project Management</option>
                    <option value="investment">Investment Advice</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Message / Property Details
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none"
                    placeholder="Tell us about your property and requirements..."
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full bg-accent hover:bg-accent-hover text-white font-bold py-3.5 px-6 rounded-xl transition-all transform hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-accent/20 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {loading ? (
                    <>Processing Request...</>
                  ) : (
                    <>
                      <Send size={18} /> Request Free Quote
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;