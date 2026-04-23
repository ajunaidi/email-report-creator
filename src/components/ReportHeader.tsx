import React from 'react';
import { Mail, Settings2, Users, Briefcase, TrendingUp } from 'lucide-react';

export function ReportHeader({ title, date, activeTab, logo }: { title: string, date: string, activeTab: string, logo?: string }) {
  return (
    <div className="space-y-4">
      {logo && (
        <div className="flex justify-center md:justify-start mb-4">
          <img src={logo} alt="Client Logo" className="max-h-16 object-contain" referrerPolicy="no-referrer" />
        </div>
      )}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-medium text-stone-700">{title}</h1>
        <div className="flex gap-2">
          <button className="px-4 py-1.5 bg-stone-200/50 rounded-full text-xs font-semibold text-stone-600 border border-stone-300">General Email Marketing</button>
          <button className="px-4 py-1.5 bg-transparent rounded-full text-xs font-semibold text-stone-400">eCommerce Email Marketing</button>
        </div>
      </div>
      
      <div className="report-card flex flex-col md:flex-row md:items-center justify-between gap-6 py-4">
        <div className="flex items-center gap-4">
           <div className="bg-mustard/20 p-2 rounded-lg text-mustard">
              <Settings2 size={18} />
           </div>
           <div>
              <p className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Date period</p>
              <p className="text-sm font-semibold text-stone-700">{date}</p>
              <p className="text-[10px] text-stone-400">Duration: 30 days</p>
           </div>
        </div>
        <div className="flex gap-3 h-8 items-center border-l border-stone-200 pl-6">
           <div className="w-8 h-8 rounded-full bg-orange-400 flex items-center justify-center text-white"><Users size={14} /></div>
           <div className="w-8 h-8 rounded-full bg-stone-800 flex items-center justify-center text-white"><Briefcase size={14} /></div>
           <div className="w-8 h-8 rounded-full bg-blue-400 flex items-center justify-center text-white"><Mail size={14} /></div>
           <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center text-stone-700"><TrendingUp size={14} /></div>
        </div>
      </div>
    </div>
  );
}
