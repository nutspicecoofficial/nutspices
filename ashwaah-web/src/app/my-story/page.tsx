"use client";

import React from "react";
import { Mail, Phone, Camera, Share2, Send, MessageCircle, Sparkles } from "lucide-react";


export default function MyStory() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#FCFBF8] via-[#FDFBF7] to-[#F7F3EB] text-[#1B3022]">
      


      {/* Narrative Section */}
      <section className="max-w-6xl mx-auto px-6 pt-4 pb-12 md:pt-8 md:pb-16 relative">
        <div className="absolute -right-20 top-40 w-64 h-64 bg-[#C5A059]/10 rounded-full blur-[100px]"></div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center relative z-10">
          <div className="relative group max-w-sm mx-auto md:mx-0">
            <div className="absolute -inset-4 bg-[#C5A059]/20 rounded-[3rem] blur-2xl group-hover:bg-[#C5A059]/30 transition-all duration-700"></div>
            <div className="relative rounded-[2.5rem] overflow-hidden border border-[#C5A059]/10 shadow-xl aspect-square">
              <img 
                src="/images/Owner-profile.jpg" 
                alt="Boutique Owner" 
                className="w-full h-full object-cover grayscale-[20%] hover:grayscale-0 transition-all duration-1000 scale-105 hover:scale-100"
              />
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <span className="text-[#C5A059] font-black uppercase tracking-[0.4em] text-[10px] mb-4 block">Our Philosophy</span>
              <h2 className="text-4xl md:text-5xl font-playfair font-bold text-[#1B3022] leading-tight mb-4">
                The Vision Behind <span className="text-[#C5A059]">Ashwaah</span>
              </h2>
              <div className="w-20 h-1 bg-[#C5A059] rounded-full"></div>
            </div>

            <div className="space-y-4 text-lg text-[#1B3022]/70 font-medium leading-relaxed">
              <p>
I am Ashwini Gowda, a woman whose journey began in the serene village of Siddhapura, Karnataka, a place known for the breathtaking Jog Falls. From these humble roots, my passion for fashion grew into a mission—to redefine style by blending fashion with comfort and making it accessible, sustainable, and empowering.

Fashion, to me, is not just about trends—it is about identity, confidence, and the way we carry ourselves. I wanted to create a path where comfort meets couture, and that vision gave birth to my brand.              </p>
              <p>
                Every garment we create is a story of quality, precision, and passion—designed to empower your unique expression.
              </p>
            </div>

            <div className="pt-4">
              <p className="italic text-[#C5A059] font-playfair text-xl border-l-4 border-[#C5A059] pl-6 py-3 bg-[#C5A059]/10 rounded-r-2xl">
                "We don't just sell clothes; we weave memories into every thread."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Connect Section */}
      <section className="bg-[#1B3022] py-24 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#C5A059]/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
        
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-16 items-center relative z-10">
          <div>
            <h3 className="text-3xl font-playfair font-bold mb-8 flex items-center gap-3">
              Contact Us <Sparkles size={24} className="text-[#C5A059]" />
            </h3>
            <div className="space-y-6">
              <div className="flex items-center gap-6 group">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-[#C5A059] transition-all duration-500">
                  <Mail size={20} className="text-[#C5A059] group-hover:text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Email Us</p>
                  <p className="text-lg font-bold">hello@ashwaah.com</p>
                </div>
              </div>
              
              <div className="flex items-center gap-6 group">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-[#C5A059] transition-all duration-500">
                  <Phone size={20} className="text-[#C5A059] group-hover:text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Call Us</p>
                  <p className="text-lg font-bold">+91 76739 63808</p>
                </div>
              </div>
              
              <a href="https://wa.me/917673963808" target="_blank" rel="noopener noreferrer" className="flex items-center gap-6 group">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-[#25D366] transition-all duration-500">
                  <MessageCircle size={20} className="text-[#C5A059] group-hover:text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/40">WhatsApp Us</p>
                  <p className="text-lg font-bold">+91 76739 63808</p>
                </div>
              </a>
            </div>
          </div>
          
          <div className="bg-white/5 p-12 rounded-[3rem] border border-white/10 backdrop-blur-md">
            <h4 className="text-xl font-playfair font-bold mb-8">Follow Our Journey</h4>
            <div className="grid grid-cols-2 gap-4">
              <a href="#" className="flex items-center justify-center gap-3 p-4 bg-white/5 rounded-2xl hover:bg-[#C5A059] transition-all group">
                <Camera size={20} />
                <span className="text-xs font-bold uppercase tracking-widest">Instagram</span>
              </a>
              <a href="#" className="flex items-center justify-center gap-3 p-4 bg-white/5 rounded-2xl hover:bg-brand-dark transition-all group">
                <Share2 size={20} />
                <span className="text-xs font-bold uppercase tracking-widest">Facebook</span>
              </a>
              <a href="#" className="flex items-center justify-center gap-3 p-4 bg-white/5 rounded-2xl hover:bg-blue-400 transition-all group">
                <Send size={20} />
                <span className="text-xs font-bold uppercase tracking-widest">Twitter</span>
              </a>
              <div className="p-4 bg-white/5 rounded-2xl flex items-center justify-center text-[10px] font-black uppercase tracking-[0.2em] text-white/20">
                More Coming Soon
              </div>
            </div>
          </div>
        </div>
      </section>


    </main>
  );
}
