import React from 'react';
import { Line, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, Filler } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler);

export function GrowthChart({ labels, contacts, deals, accentColor, textColor }: { labels: string[], contacts: number[], deals: number[], accentColor: string, textColor: string }) {
  return (
    <div className="report-card col-span-1 lg:col-span-2">
      <h3 className="font-bold mb-6 text-sm uppercase tracking-wide" style={{ color: 'var(--report-text, inherit)' }}>Deals and Contacts in Account</h3>
      <div className="h-[300px]">
        <Line 
          data={{
            labels,
            datasets: [
              { label: 'Contacts Count', data: contacts, borderColor: accentColor, backgroundColor: accentColor + '1A', fill: true, tension: 0.4, pointRadius: 2 },
              { label: 'Deal Counts', data: deals, borderColor: textColor, backgroundColor: textColor + '0D', fill: true, tension: 0.4, pointRadius: 2 },
            ]
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'top', align: 'start', labels: { boxWidth: 8, usePointStyle: true, pointStyle: 'circle', font: { size: 10 } } } },
            scales: { y: { beginAtZero: false, ticks: { font: { size: 9 } }, grid: { color: '#f0f0f0' } }, x: { ticks: { font: { size: 9 } }, grid: { display: false } } }
          }}
        />
      </div>
    </div>
  );
}

export function DistributionChart({ contacts, deals, accentColor, textColor }: { contacts: number, deals: number, accentColor: string, textColor: string }) {
  const total = contacts + deals;
  return (
    <div className="report-card">
      <h3 className="font-bold mb-6 text-sm uppercase tracking-wide text-center" style={{ color: 'var(--report-text, inherit)' }}>Contacts and Deals distribution</h3>
      <div className="h-[220px] flex items-center justify-center relative">
        <Doughnut 
          data={{
            labels: ['Contacts', 'Deals'],
            datasets: [{
              data: [contacts, deals],
              backgroundColor: [accentColor, textColor],
              borderWidth: 0,
              hoverOffset: 4
            }]
          }}
          options={{
            cutout: '75%',
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } }
          }}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
           <span className="text-[10px] uppercase font-bold opacity-30" style={{ color: 'var(--report-text, inherit)' }}>Ratio</span>
           <span className="text-xl font-black opacity-80" style={{ color: 'var(--report-text, inherit)' }}>{(contacts / total * 100).toFixed(0)}%</span>
        </div>
      </div>
      <div className="mt-8 space-y-3">
         <div className="flex items-center justify-between text-[11px] font-bold">
            <div className="flex items-center gap-2" style={{ color: 'var(--report-text, inherit)' }}><div className="w-2 h-2 rounded-full" style={{ backgroundColor: accentColor }} /> Contact Count</div>
            <span className="opacity-70" style={{ color: 'var(--report-text, inherit)' }}>{contacts.toLocaleString()} ({(contacts/total*100).toFixed(2)}%)</span>
         </div>
         <div className="flex items-center justify-between text-[11px] font-bold">
            <div className="flex items-center gap-2" style={{ color: 'var(--report-text, inherit)' }}><div className="w-2 h-2 rounded-full" style={{ backgroundColor: textColor }} /> Deal Count</div>
            <span className="opacity-70" style={{ color: 'var(--report-text, inherit)' }}>{deals.toLocaleString()} ({(deals/total*100).toFixed(2)}%)</span>
         </div>
      </div>
    </div>
  );
}

export function FunnelDisplay({ sent, opened, clicked, accentColor, textColor }: any) {
  return (
    <div className="report-card">
      <h3 className="font-bold mb-8 border-b border-stone-100 pb-2 text-sm uppercase tracking-wide" style={{ color: 'var(--report-text, inherit)' }}>Email Clicks funnel</h3>
      <div className="flex flex-col items-center gap-0.5">
          <div className="w-full h-12 rounded-t-lg flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: accentColor }}>SENT</div>
          <div className="w-[85%] h-12 flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: textColor }}>OPENED</div>
          <div className="w-[65%] h-12 rounded-b-lg flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: accentColor + 'CC' }}>CLICKED</div>
      </div>
      <div className="mt-8 space-y-2">
         <div className="flex justify-between text-[10px] font-bold">
            <span className="opacity-40" style={{ color: 'var(--report-text, inherit)' }}>Send Amount</span>
            <span className="opacity-90" style={{ color: 'var(--report-text, inherit)' }}>{sent.toLocaleString()} 100.00%</span>
         </div>
         <div className="flex justify-between text-[10px] font-bold">
            <span className="opacity-40" style={{ color: 'var(--report-text, inherit)' }}>Opens</span>
            <span className="opacity-90" style={{ color: 'var(--report-text, inherit)' }}>{opened.toLocaleString()} {((opened/sent)*100).toFixed(2)}%</span>
         </div>
         <div className="flex justify-between text-[10px] font-bold">
            <span className="opacity-40" style={{ color: 'var(--report-text, inherit)' }}>Link Clicks</span>
            <span className="opacity-90" style={{ color: 'var(--report-text, inherit)' }}>{clicked.toLocaleString()} {((clicked/opened)*100).toFixed(2)}%</span>
         </div>
         <div className="pt-4 border-t border-stone-100 flex justify-between items-end">
            <span className="text-[10px] font-bold opacity-40 uppercase" style={{ color: 'var(--report-text, inherit)' }}>Total conversion rate</span>
            <span className="text-2xl font-black opacity-80" style={{ color: 'var(--report-text, inherit)' }}>{((clicked/sent)*100).toFixed(2)}%</span>
         </div>
      </div>
    </div>
  );
}
