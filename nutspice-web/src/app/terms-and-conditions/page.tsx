"use client";

import React from "react";
import { FileText } from "lucide-react";

export default function TermsAndConditionsPage() {
  return (
    <main className="min-h-screen bg-[#FDFBF7] text-[#1B3022] py-20 px-4 md:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border border-brand/5 p-8 md:p-12">
        <div className="flex items-center gap-4 mb-8 border-b border-brand/10 pb-8">
          <div className="w-16 h-16 bg-brand/5 rounded-2xl flex items-center justify-center">
            <FileText size={32} className="text-[#C5A059]" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-playfair font-bold text-brand">Terms & Conditions</h1>
            <p className="text-brand/60 mt-2">Last updated: {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        <div className="space-y-8 text-brand/80 leading-relaxed font-inter">
          <section>
            <h2 className="text-2xl font-playfair font-bold text-brand mb-4">1. Agreement to Terms</h2>
            <p>
              By accessing our website and purchasing our products, you agree to be bound by these Terms and Conditions and agree that you are responsible for the agreement with any applicable local laws. If you disagree with any of these terms, you are prohibited from accessing this site.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-playfair font-bold text-brand mb-4">2. Products and Pricing</h2>
            <p className="mb-4">
              All products listed on the website are subject to availability. We reserve the right to modify or discontinue any product at any time. Prices for our products are subject to change without notice. We shall not be liable to you or to any third-party for any modification, price change, suspension or discontinuance of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-playfair font-bold text-brand mb-4">3. Shipping and Delivery</h2>
            <p>
              We strive to deliver products in the best condition and within the estimated delivery time. However, delivery times are estimates and not guaranteed. NutspiceCo is not liable for any delays in delivery caused by courier companies or unforeseen circumstances.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-playfair font-bold text-brand mb-4">4. Returns and Refunds</h2>
            <p>
              Given the perishable nature of our products, we have a strict return policy. If you receive a damaged or incorrect product, please contact us within 24 hours of delivery with photographic evidence. Refunds or replacements will be processed at our discretion after verification.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-playfair font-bold text-brand mb-4">5. Intellectual Property</h2>
            <p>
              All content included on this site, such as text, graphics, logos, images, and software, is the property of NutspiceCo or its content suppliers and protected by international copyright laws. The compilation of all content on this site is the exclusive property of NutspiceCo.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-playfair font-bold text-brand mb-4">6. Contact Information</h2>
            <p>
              Questions about the Terms and Conditions should be sent to us at: <br/><br/>
              <strong>Email:</strong> nutspiceco.official@gmail.com <br/>
              <strong>Phone:</strong> +91 97030 88446
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
