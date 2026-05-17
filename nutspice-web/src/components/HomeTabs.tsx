"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

type TabItem = {
  id: number;
  title: string;
  linkHref: string;
  imageUrl: string;
  isActive: boolean;
};

interface Props {
  tabs: TabItem[];
}

export default function HomeTabs({ tabs }: Props) {
  if (!tabs || tabs.length === 0) return null;

  return (
    <section className="py-0 bg-white">
      <div className="max-w-5xl mx-auto px-8 sm:px-12 lg:px-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tabs.map((tab, index) => (
            <Link 
              key={tab.id}
              href={tab.linkHref || "#"}
              className="block"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative h-36 overflow-hidden rounded-2xl group cursor-pointer shadow-lg"
              >
              {tab.imageUrl ? (
                <Image
                  src={tab.imageUrl}
                  alt={tab.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
              ) : (
                <div className="absolute inset-0 bg-brand/10" />
              )}
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent group-hover:via-black/40 transition-all duration-500" />
              
              {/* Content */}
              <div className="absolute inset-0 flex flex-col items-center justify-end pb-3 px-4 text-center">
                <h3 className="text-lg md:text-xl font-playfair font-bold text-white tracking-tight drop-shadow-2xl transform transition-transform duration-500 group-hover:scale-105">
                  {tab.title}
                </h3>
                <div className="mt-2 w-8 h-0.5 bg-brand-accent rounded-full transform origin-center transition-all duration-500 group-hover:w-16 shadow-lg" />
              </div>
            </motion.div>
          </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
