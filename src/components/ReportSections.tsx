import React from 'react';
import { cn } from '../lib/utils';
import { ChevronRight } from 'lucide-react';

export function SummarySection({ summary, recommendations }: { summary: string, recommendations: string[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="report-card">
        <h3 className="font-bold text-stone-900 mb-4 text-sm uppercase tracking-wide border-b border-stone-100 pb-2">Summary</h3>
        <p className="text-stone-600 leading-relaxed text-sm whitespace-pre-wrap">
          {summary}
        </p>
      </div>
      <div className="report-card">
        <h3 className="font-bold text-stone-900 mb-4 text-sm uppercase tracking-wide border-b border-stone-100 pb-2">Recommendations</h3>
        <ul className="space-y-4">
          {recommendations.map((rec, i) => (
            <li key={i} className="flex gap-4 text-sm text-stone-600">
              <span className="font-bold text-stone-400 min-w-[20px]">{i + 1}.</span>
              <span>
                {rec.split(/(-?\d+\.?\d*%)/).map((part, index) => 
                  part.match(/-?\d+\.?\d*%/) ? (
                    <span key={index} className="text-red-500 font-bold">{part}</span>
                  ) : (
                    part
                  )
                )}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function MetricCardSmall({ title, value, label, icon, desc, color }: { title: string, value: string, label: string, icon: React.ReactNode, desc?: string, color?: string }) {
  return (
    <div className="report-card flex flex-col justify-between group cursor-help">
      <div>
        <h4 className="text-[10px] font-bold text-stone-400 uppercase mb-1 tracking-wider">{title}</h4>
        {desc && <p className="text-[10px] text-stone-400 mb-4 leading-tight opacity-70">{desc}</p>}
      </div>
      <div className="flex items-center gap-4 mt-2">
        <div 
          className={cn("w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110", !color?.startsWith('#') && (color || "bg-stone-100"))}
          style={color?.startsWith('#') ? { backgroundColor: color + '22' } : {}}
        >
          {icon}
        </div>
        <div>
          <p className="text-2xl font-black text-stone-900 tracking-tight">{value}</p>
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-tight">{label}</p>
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center scale-90 opacity-40 hover:opacity-100 transition-opacity">
           <ChevronRight size={10} />
        </div>
      </div>
    </div>
  );
}
