"use client";

import React from "react";
import { Mail, Phone, Camera, Share2, Send, MessageCircle, MapPin, Clock, Navigation } from "lucide-react";

export default function AboutUs() {
  return (
    <main className="min-h-screen bg-[#FDFBF7] text-[#1B3022]">
      
      {/* Store Hero Section */}
      <section className="relative h-[40vh] min-h-[300px] w-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-brand-dark/80 z-10"></div>
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url("/images/nutspice_local_store.png")' }}
        ></div>
        <div className="relative z-20 text-center px-4 max-w-4xl mx-auto">
          <span className="text-[#C5A059] font-black uppercase tracking-[0.4em] text-xs mb-4 block">Visit Us In Person</span>
          <h1 className="text-4xl md:text-6xl font-playfair font-bold text-white mb-6">Our Local Store</h1>
          <p className="text-white/80 text-lg md:text-xl font-medium max-w-2xl mx-auto">
            Experience the aroma, taste the freshness, and explore our premium collection of nuts and spices right here in the neighborhood.
          </p>
        </div>
      </section>

      {/* Store Details & Map Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          
          {/* Store Info */}
          <div className="space-y-10">
            <div>
              <h2 className="text-3xl font-playfair font-bold text-brand mb-6">NutspiceCo Experience Center</h2>
              <p className="text-brand/70 leading-relaxed text-lg mb-8">
                Step into our beautifully designed local store where tradition meets modern quality. We've created a warm, inviting space where you can sample our products, learn about their origins, and get personalized recommendations from our staff.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-brand/5 flex items-start space-x-4">
                <div className="p-3 bg-brand/5 rounded-2xl text-brand flex-shrink-0">
                  <MapPin size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-brand mb-2 uppercase tracking-widest text-xs">Location</h4>
                  <p className="text-sm text-brand/60 leading-relaxed">
                    H.No. 11-13-393, Ground Floor, <br/>
                    Alkapur Colony, SRK Puram <br/>
                    Kothapeta, Hyderabad-500035
                  </p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl shadow-sm border border-brand/5 flex items-start space-x-4">
                <div className="p-3 bg-brand/5 rounded-2xl text-brand flex-shrink-0">
                  <Clock size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-brand mb-2 uppercase tracking-widest text-xs">Store Hours</h4>
                  <p className="text-sm text-brand/60 leading-relaxed">
                    <span className="block mb-1"><strong>Mon - Fri:</strong> 9:00 AM - 8:00 PM</span>
                    <span className="block mb-1"><strong>Saturday:</strong> 10:00 AM - 9:00 PM</span>
                    <span className="block text-red-400"><strong>Sunday:</strong> Closed</span>
                  </p>
                </div>
              </div>
            </div>

            <a href="https://www.google.com/maps/place/17%C2%B021'55.4%22N+78%C2%B033'03.7%22E/@17.3653874,78.5484505,17z/data=!3m1!4b1!4m4!3m3!8m2!3d17.3653874!4d78.5510254?hl=en&entry=ttu" target="_blank" rel="noreferrer" className="inline-flex items-center space-x-3 bg-brand text-white px-8 py-4 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-brand-hover transition-all shadow-lg active:scale-95 group">
              <span>Get Directions</span>
              <Navigation size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </a>
          </div>

          {/* Map Embed */}
          <div className="relative h-[500px] w-full rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white">
            <iframe 
              src="https://maps.google.com/maps?q=17.3653874,78.5510254&t=&z=17&ie=UTF8&iwloc=&output=embed" 
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              allowFullScreen={true} 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              className="grayscale-[30%] contrast-125 opacity-90 hover:grayscale-0 hover:opacity-100 transition-all duration-1000"
            ></iframe>
          </div>
        </div>
      </section>

      {/* Connect Section */}
      <section className="bg-brand py-24 text-white overflow-hidden relative mt-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#C5A059]/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
        
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-16 items-center relative z-10">
          <div>
            <h3 className="text-3xl font-playfair font-bold mb-8 flex items-center gap-3">
              Get In Touch <Mail size={24} className="text-[#C5A059]" />
            </h3>
            <div className="space-y-6">
              <div className="flex items-center gap-6 group">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-[#C5A059] transition-all duration-500">
                  <Mail size={20} className="text-[#C5A059] group-hover:text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Email Us</p>
                  <p className="text-lg font-bold">nutspiceco.official@gmail.com</p>
                </div>
              </div>
              
              <div className="flex items-center gap-6 group">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-[#C5A059] transition-all duration-500">
                  <Phone size={20} className="text-[#C5A059] group-hover:text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Call Us</p>
                  <p className="text-lg font-bold">+91 97030 88446</p>
                </div>
              </div>
              
              <a href="https://wa.me/919703088446" target="_blank" rel="noopener noreferrer" className="flex items-center gap-6 group">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-[#25D366] transition-all duration-500">
                  <MessageCircle size={20} className="text-[#C5A059] group-hover:text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/40">WhatsApp Us</p>
                  <p className="text-lg font-bold">+91 97030 88446</p>
                </div>
              </a>
            </div>
          </div>
          
          <div className="bg-white/5 p-10 md:p-14 rounded-[3rem] border border-white/10 backdrop-blur-md">
            <h4 className="text-xl font-playfair font-bold mb-8">Follow Our Journey</h4>
            <div className="grid grid-cols-2 gap-4">
              <a href="https://www.instagram.com/nutspicecodryfruitwholespice?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-3 p-5 bg-white/5 rounded-2xl hover:bg-[#C5A059] transition-all group">
                <Camera size={20} />
                <span className="text-xs font-bold uppercase tracking-widest">Instagram</span>
              </a>
              <a href="https://www.facebook.com/NutSpiceCoPremiumDryFruitsWholeSpices" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-3 p-5 bg-white/5 rounded-2xl hover:bg-brand-dark transition-all group">
                <Share2 size={20} />
                <span className="text-xs font-bold uppercase tracking-widest">Facebook</span>
              </a>
              <a href="#" className="flex items-center justify-center gap-3 p-5 bg-white/5 rounded-2xl hover:bg-blue-400 transition-all group">
                <Send size={20} />
                <span className="text-xs font-bold uppercase tracking-widest">Twitter</span>
              </a>
              <div className="p-5 bg-white/5 rounded-2xl flex items-center justify-center text-[10px] font-black uppercase tracking-[0.2em] text-white/20 text-center">
                More Coming Soon
              </div>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}
