import React from 'react';
import { cn } from '../lib/utils';
import { ChevronRight } from 'lucide-react';

export function SummarySection({ summary, recommendations }: { summary: string, recommendations: string[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="report-card">
        <h3 className="font-bold mb-4 text-sm uppercase tracking-wide border-b border-stone-100 pb-2" style={{ color: 'var(--h3-color, var(--report-text, inherit))' }}>Summary</h3>
        <p className="leading-relaxed text-sm whitespace-pre-wrap opacity-80" style={{ color: 'var(--desc-color, var(--report-text, inherit))' }}>
          {summary}
        </p>
      </div>
      <div className="report-card">
        <h3 className="font-bold mb-4 text-sm uppercase tracking-wide border-b border-stone-100 pb-2" style={{ color: 'var(--h3-color, var(--report-text, inherit))' }}>Recommendations</h3>
        <ul className="space-y-4">
          {recommendations.map((rec, i) => (
            <li key={i} className="flex gap-4 text-sm opacity-80" style={{ color: 'var(--desc-color, var(--report-text, inherit))' }}>
              <span className="font-bold opacity-40 min-w-[20px]">{i + 1}.</span>
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
        <h4 className="text-[10px] font-bold opacity-40 uppercase mb-1 tracking-wider" style={{ color: 'var(--desc-color, var(--report-text, inherit))' }}>{title}</h4>
        {desc && <p className="text-[10px] mb-4 leading-tight opacity-30" style={{ color: 'var(--desc-color, var(--report-text, inherit))' }}>{desc}</p>}
      </div>
      <div className="flex items-center gap-4 mt-2">
        <div 
          className={cn("w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110", !color?.startsWith('#') && (color || "bg-stone-100"))}
          style={color?.startsWith('#') ? { backgroundColor: color + '22' } : {}}
        >
          {icon}
        </div>
        <div>
          <p className="text-2xl font-black tracking-tight" style={{ color: 'var(--h2-color, var(--report-text, inherit))' }}>{value}</p>
          <p className="text-[10px] font-bold opacity-40 uppercase tracking-tight" style={{ color: 'var(--desc-color, var(--report-text, inherit))' }}>{label}</p>
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <div className="w-5 h-5 rounded-full flex items-center justify-center scale-90 opacity-20 hover:opacity-100 transition-opacity" style={{ backgroundColor: 'var(--report-text, #000)10', color: 'var(--desc-color, var(--report-text, inherit))' }}>
           <ChevronRight size={10} />
        </div>
      </div>
    </div>
  );
}
