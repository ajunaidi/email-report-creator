import React from 'react';
import { CampaignPerformanceRow } from '../types';

export function EmailPerformanceTable({ rows }: { rows: CampaignPerformanceRow[] }) {
  return (
    <div className="report-card overflow-hidden">
      <h3 className="font-bold mb-6 text-sm uppercase tracking-wide" style={{ color: 'var(--h3-color, var(--report-text, inherit))' }}>Campaigns performance</h3>
      <div className="overflow-x-auto scrollbar-hide">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead>
            <tr className="border-b" style={{ borderColor: 'var(--report-text, #e7e5e4)20' }}>
              <th className="pb-4 pt-2 font-bold uppercase tracking-wider text-[10px] pr-4 opacity-40" style={{ color: 'var(--desc-color, var(--report-text, inherit))' }}>Name</th>
              <th className="pb-4 pt-2 font-bold uppercase tracking-wider text-[10px] pr-4 opacity-40" style={{ color: 'var(--desc-color, var(--report-text, inherit))' }}>Sent</th>
              <th className="pb-4 pt-2 font-bold uppercase tracking-wider text-[10px] pr-4 opacity-40" style={{ color: 'var(--desc-color, var(--report-text, inherit))' }}>Opens</th>
              <th className="pb-4 pt-2 font-bold uppercase tracking-wider text-[10px] pr-4 opacity-40" style={{ color: 'var(--desc-color, var(--report-text, inherit))' }}>Open Rate</th>
              <th className="pb-4 pt-2 font-bold uppercase tracking-wider text-[10px] pr-4 opacity-40" style={{ color: 'var(--desc-color, var(--report-text, inherit))' }}>Unique Opens</th>
              <th className="pb-4 pt-2 font-bold uppercase tracking-wider text-[10px] pr-4 opacity-40" style={{ color: 'var(--desc-color, var(--report-text, inherit))' }}>Unique Open Rate</th>
              <th className="pb-4 pt-2 font-bold uppercase tracking-wider text-[10px] pr-4 opacity-40" style={{ color: 'var(--desc-color, var(--report-text, inherit))' }}>Link Clicks</th>
              <th className="pb-4 pt-2 font-bold uppercase tracking-wider text-[10px] pr-4 opacity-40" style={{ color: 'var(--desc-color, var(--report-text, inherit))' }}>Link Click Rate</th>
              <th className="pb-4 pt-2 font-bold uppercase tracking-wider text-[10px] pr-4 opacity-40" style={{ color: 'var(--desc-color, var(--report-text, inherit))' }}>Unique Clicks</th>
              <th className="pb-4 pt-2 font-bold uppercase tracking-wider text-[10px] pr-4 opacity-40" style={{ color: 'var(--desc-color, var(--report-text, inherit))' }}>Unique Click Rate</th>
              <th className="pb-4 pt-2 font-bold uppercase tracking-wider text-[10px] pr-4 opacity-40" style={{ color: 'var(--desc-color, var(--report-text, inherit))' }}>Hard Bounces</th>
              <th className="pb-4 pt-2 font-bold uppercase tracking-wider text-[10px] opacity-40" style={{ color: 'var(--desc-color, var(--report-text, inherit))' }}>Soft Bounces</th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: 'var(--report-text, #e7e5e4)10' }}>
            {rows.map((row, i) => (
              <tr key={i} className="hover:opacity-80 transition-opacity">
                <td className="py-4 pr-4">
                  <div className="font-bold opacity-90" style={{ color: 'var(--h3-color, var(--report-text, inherit))' }}>{row.name}</div>
                  <div className="text-[10px] opacity-40" style={{ color: 'var(--desc-color, var(--report-text, inherit))' }}>Date: {row.date}</div>
                </td>
                <td className="py-4 pr-4 font-medium opacity-70" style={{ color: 'var(--desc-color, var(--report-text, inherit))' }}>{row.sent.toLocaleString()}</td>
                <td className="py-4 pr-4 font-medium opacity-70" style={{ color: 'var(--desc-color, var(--report-text, inherit))' }}>{row.opens.toLocaleString()}</td>
                <td className={`py-4 pr-4 font-bold`} style={{ color: row.openRate < 0 ? '#ef4444' : 'var(--desc-color, var(--report-text, inherit))' }}>{row.openRate.toFixed(2)}%</td>
                <td className="py-4 pr-4 font-medium opacity-70" style={{ color: 'var(--desc-color, var(--report-text, inherit))' }}>{row.uniqueOpens.toLocaleString()}</td>
                <td className="py-4 pr-4 font-medium opacity-70" style={{ color: 'var(--desc-color, var(--report-text, inherit))' }}>{row.uniqueOpenRate.toFixed(2)}%</td>
                <td className="py-4 pr-4 font-medium opacity-70" style={{ color: 'var(--desc-color, var(--report-text, inherit))' }}>{row.linkClicks.toLocaleString()}</td>
                <td className={`py-4 pr-4 font-bold`} style={{ color: row.linkClickRate < 0 ? '#ef4444' : 'var(--desc-color, var(--report-text, inherit))' }}>{row.linkClickRate.toFixed(2)}%</td>
                <td className="py-4 pr-4 font-medium opacity-70" style={{ color: 'var(--desc-color, var(--report-text, inherit))' }}>{row.uniqueClicks.toLocaleString()}</td>
                <td className="py-4 pr-4 font-medium opacity-70" style={{ color: 'var(--desc-color, var(--report-text, inherit))' }}>{row.uniqueClickRate.toFixed(2)}%</td>
                <td className="py-4 pr-4 font-medium opacity-70" style={{ color: 'var(--desc-color, var(--report-text, inherit))' }}>{row.hardBounces.toLocaleString()}</td>
                <td className="py-4 font-medium opacity-70" style={{ color: 'var(--desc-color, var(--report-text, inherit))' }}>{row.softBounces.toLocaleString()}</td>
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
      <h3 className="font-bold mb-4 text-xs uppercase tracking-wide" style={{ color: 'var(--h3-color, var(--report-text, inherit))' }}>{title}</h3>
      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-[10px] font-bold mb-1">
            <span className="opacity-40 uppercase tracking-tight" style={{ color: 'var(--desc-color, var(--report-text, inherit))' }}>{label1}</span>
            <span className="opacity-80" style={{ color: 'var(--desc-color, var(--report-text, inherit))' }}>{val1.toLocaleString()} / {max1.toLocaleString()}</span>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--report-text, #000)13' }}>
            <div className={`h-full rounded-full`} style={{ width: `${(val1 / max1) * 100}%`, backgroundColor: color1 }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-[10px] font-bold mb-1">
            <span className="opacity-40 uppercase tracking-tight" style={{ color: 'var(--desc-color, var(--report-text, inherit))' }}>{label2}</span>
            <span className="opacity-80" style={{ color: 'var(--desc-color, var(--report-text, inherit))' }}>{val2.toLocaleString()} / {max2.toLocaleString()}</span>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--report-text, #000)13' }}>
            <div className={`h-full rounded-full`} style={{ width: `${(val2 / max2) * 100}%`, backgroundColor: color2 }} />
          </div>
        </div>
      </div>
    </div>
  );
}
