import React from 'react';
import { CampaignPerformanceRow } from '../types';

export function EmailPerformanceTable({ rows }: { rows: CampaignPerformanceRow[] }) {
  return (
    <div className="report-card overflow-hidden">
      <h3 className="font-bold text-stone-900 mb-6 text-sm uppercase tracking-wide">Campaigns performance</h3>
      <div className="overflow-x-auto scrollbar-hide">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead>
            <tr className="border-b border-stone-200">
              <th className="pb-4 pt-2 font-bold text-stone-400 uppercase tracking-wider text-[10px] pr-4">Name</th>
              <th className="pb-4 pt-2 font-bold text-stone-400 uppercase tracking-wider text-[10px] pr-4">Sent</th>
              <th className="pb-4 pt-2 font-bold text-stone-400 uppercase tracking-wider text-[10px] pr-4">Opens</th>
              <th className="pb-4 pt-2 font-bold text-stone-400 uppercase tracking-wider text-[10px] pr-4">Open Rate</th>
              <th className="pb-4 pt-2 font-bold text-stone-400 uppercase tracking-wider text-[10px] pr-4">Unique Opens</th>
              <th className="pb-4 pt-2 font-bold text-stone-400 uppercase tracking-wider text-[10px] pr-4">Unique Open Rate</th>
              <th className="pb-4 pt-2 font-bold text-stone-400 uppercase tracking-wider text-[10px] pr-4">Link Clicks</th>
              <th className="pb-4 pt-2 font-bold text-stone-400 uppercase tracking-wider text-[10px] pr-4">Link Click Rate</th>
              <th className="pb-4 pt-2 font-bold text-stone-400 uppercase tracking-wider text-[10px] pr-4">Unique Clicks</th>
              <th className="pb-4 pt-2 font-bold text-stone-400 uppercase tracking-wider text-[10px] pr-4">Unique Click Rate</th>
              <th className="pb-4 pt-2 font-bold text-stone-400 uppercase tracking-wider text-[10px] pr-4">Hard Bounces</th>
              <th className="pb-4 pt-2 font-bold text-stone-400 uppercase tracking-wider text-[10px]">Soft Bounces</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {rows.map((row, i) => (
              <tr key={i} className="hover:bg-cream-dark/50 transition-colors">
                <td className="py-4 pr-4">
                  <div className="font-bold text-stone-800">{row.name}</div>
                  <div className="text-[10px] text-stone-400">Date: {row.date}</div>
                </td>
                <td className="py-4 pr-4 font-medium text-stone-600">{row.sent.toLocaleString()}</td>
                <td className="py-4 pr-4 font-medium text-stone-600">{row.opens.toLocaleString()}</td>
                <td className={`py-4 pr-4 font-bold ${row.openRate < 0 ? 'text-red-500' : 'text-stone-600'}`}>{row.openRate.toFixed(2)}%</td>
                <td className="py-4 pr-4 font-medium text-stone-600">{row.uniqueOpens.toLocaleString()}</td>
                <td className="py-4 pr-4 font-medium text-stone-600">{row.uniqueOpenRate.toFixed(2)}%</td>
                <td className="py-4 pr-4 font-medium text-stone-600">{row.linkClicks.toLocaleString()}</td>
                <td className={`py-4 pr-4 font-bold ${row.linkClickRate < 0 ? 'text-red-500' : 'text-stone-600'}`}>{row.linkClickRate.toFixed(2)}%</td>
                <td className="py-4 pr-4 font-medium text-stone-600">{row.uniqueClicks.toLocaleString()}</td>
                <td className="py-4 pr-4 font-medium text-stone-600">{row.uniqueClickRate.toFixed(2)}%</td>
                <td className="py-4 pr-4 font-medium text-stone-600">{row.hardBounces.toLocaleString()}</td>
                <td className="py-4 font-medium text-stone-600">{row.softBounces.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function GoalTracker({ title, val1, max1, label1, val2, max2, label2, color1, color2 }: any) {
  return (
    <div className="report-card">
      <h3 className="font-bold text-stone-900 mb-4 text-xs uppercase tracking-wide">{title}</h3>
      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-[10px] font-bold mb-1">
            <span className="text-stone-400 uppercase tracking-tight">{label1}</span>
            <span className="text-stone-700">{val1.toLocaleString()} / {max1.toLocaleString()}</span>
          </div>
          <div className="w-full h-2 bg-stone-100/50 rounded-full overflow-hidden">
            <div className={`h-full rounded-full`} style={{ width: `${(val1 / max1) * 100}%`, backgroundColor: color1 }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-[10px] font-bold mb-1">
            <span className="text-stone-400 uppercase tracking-tight">{label2}</span>
            <span className="text-stone-700">{val2.toLocaleString()} / {max2.toLocaleString()}</span>
          </div>
          <div className="w-full h-2 bg-stone-100/50 rounded-full overflow-hidden">
            <div className={`h-full rounded-full`} style={{ width: `${(val2 / max2) * 100}%`, backgroundColor: color2 }} />
          </div>
        </div>
      </div>
    </div>
  );
}
