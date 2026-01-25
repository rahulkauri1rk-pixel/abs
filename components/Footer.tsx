import React from 'react';
import { Facebook, Twitter, Linkedin, Instagram } from 'lucide-react';
import { useSite } from '../contexts/SiteContext';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const { config } = useSite();
  const { socials } = config.contact;

  return (
    <footer className="bg-primary-dark text-white pt-16 pb-8 relative overflow-hidden">
      {/* Background Overlay */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
         <img
          src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200"
          alt="background"
          className="w-full h-full object-cover grayscale"
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12 border-b border-blue-800 pb-12">
            <div className="col-span-1 md:col-span-1">
                <h3 className="text-xl font-bold font-heading mb-4">Aaditya Building Solution</h3>
                <p className="text-blue-200 text-sm leading-relaxed">
                    Trusted IBBI Registered Valuers providing expert valuation and property advice.
                </p>
            </div>
            
            <div>
                <h4 className="font-bold mb-4">Quick Links</h4>
                <ul className="space-y-2 text-sm text-blue-200">
                    <li><a href="#home" className="hover:text-white transition-colors">Home</a></li>
                    <li><a href="#services" className="hover:text-white transition-colors">Services</a></li>
                    <li><a href="#about" className="hover:text-white transition-colors">About Us</a></li>
                    <li><a href="#contact" className="hover:text-white transition-colors">Contact</a></li>
                </ul>
            </div>

            <div>
                 <h4 className="font-bold mb-4">Services</h4>
                <ul className="space-y-2 text-sm text-blue-200">
                    <li><a href="#services" className="hover:text-white transition-colors">Valuations</a></li>
                    <li><a href="#services" className="hover:text-white transition-colors">Building Surveys</a></li>
                    <li><a href="#services" className="hover:text-white transition-colors">Expert Witness</a></li>
                    <li><a href="#services" className="hover:text-white transition-colors">Investment</a></li>
                </ul>
            </div>

            <div>
                <h4 className="font-bold mb-4">Connect With Us</h4>
                <div className="flex space-x-4">
                    {socials.facebook && (
                        <a href={socials.facebook} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-blue-800/50 flex items-center justify-center hover:bg-accent transition-colors">
                            <Facebook size={18} />
                        </a>
                    )}
                    {socials.twitter && (
                        <a href={socials.twitter} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-blue-800/50 flex items-center justify-center hover:bg-accent transition-colors">
                            <Twitter size={18} />
                        </a>
                    )}
                    {socials.linkedin && (
                         <a href={socials.linkedin} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-blue-800/50 flex items-center justify-center hover:bg-accent transition-colors">
                            <Linkedin size={18} />
                        </a>
                    )}
                    {socials.instagram && (
                        <a href={socials.instagram} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-blue-800/50 flex items-center justify-center hover:bg-accent transition-colors">
                            <Instagram size={18} />
                        </a>
                    )}
                </div>
            </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center text-sm text-blue-300">
            <p>&copy; {currentYear} Aaditya Building Solution. All rights reserved.</p>
            <div className="mt-2 md:mt-0 flex gap-4">
                <span>Registered in India</span>
                <span>|</span>
                <span>IBBI Registered Valuer</span>
            </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;