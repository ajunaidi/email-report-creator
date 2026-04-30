/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  BarChart3, Users, Mail, TrendingUp, MousePointerClick, 
  LogOut, MessageSquare, Download, Settings2, Briefcase, ExternalLink, Filter, Plus, Trash2, Palette, Image, Type, Maximize2, FileText,
  Share2, LogIn, User as UserIcon, Loader2, Save, Menu, X, Link as LinkIcon, Telescope, Calendar as CalendarIcon, Copy, Trash, PieChart as PieChartIcon, ChevronUp, ChevronDown, LayoutDashboard, Chrome,
  Sprout, Leaf, Star, Heart, Triangle
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { cn } from './lib/utils';
import { compressImage } from './lib/imageUtils';
import { ReportData, CampaignPerformanceRow, FloatingElement } from './types';
import { MOCK_FULL_DATA } from './mockData';
import { ReportHeader } from './components/ReportHeader';
import { SummarySection, MetricCardSmall } from './components/ReportSections';
import { EmailPerformanceTable, GoalTracker } from './components/TableSections';
import { GrowthChart, DistributionChart, FunnelDisplay } from './components/ChartSections';
import { Line } from 'react-chartjs-2';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import debounce from 'lodash.debounce';
import { auth } from './lib/firebase';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged,
  User,
  signOut
} from 'firebase/auth';
import { saveReport, getReport } from './services/reportService';

import { AuthPage } from './components/AuthPage';
import { Dashboard } from './components/Dashboard';

const formatNumber = (val: number | undefined | null) => {
  return (val ?? 0).toLocaleString();
};

const ICON_MAP: Record<string, React.ReactNode> = {
  TrendingUp: <TrendingUp />,
  MousePointerClick: <MousePointerClick />,
  ExternalLink: <ExternalLink />,
  LogOut: <LogOut />,
  Users: <Users />,
  Mail: <Mail />,
  Briefcase: <Briefcase />,
  MessageSquare: <MessageSquare />,
  Telescope: <Telescope />,
  BarChart3: <BarChart3 />,
  PieChart: <PieChartIcon />,
  Settings2: <Settings2 />,
  Maximize2: <Maximize2 />,
  FileText: <FileText />
};

// --- Editable Components ---

function EditableText({ value, onChange, className, isViewer }: { value: string, onChange: (v: string) => void, className?: string, isViewer?: boolean }) {
  const [isEditing, setIsEditing] = useState(false);
  const [val, setVal] = useState(value);

  useEffect(() => { setVal(value); }, [value]);

  if (isViewer) return <span className={className}>{value}</span>;

  if (isEditing) {
    return (
      <input
        autoFocus
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={() => { setIsEditing(false); onChange(val); }}
        onKeyDown={(e) => { if (e.key === 'Enter') { setIsEditing(false); onChange(val); } }}
        className={cn("bg-white/90 text-black border-2 border-[#E8B931] outline-none rounded px-1", className)}
      />
    );
  }

  return (
    <span 
      onClick={() => setIsEditing(true)} 
      className={cn("cursor-pointer hover:bg-black/5 rounded transition-colors", className)}
    >
      {value || <span className="opacity-30 italic">Click to edit</span>}
    </span>
  );
}

function EditableTextArea({ value, onChange, className, isViewer }: { value: string, onChange: (v: string) => void, className?: string, isViewer?: boolean }) {
  const [isEditing, setIsEditing] = useState(false);
  const [val, setVal] = useState(value);

  useEffect(() => { setVal(value); }, [value]);

  if (isViewer) return <span className={className}>{value}</span>;

  if (isEditing) {
    return (
      <textarea
        autoFocus
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={() => { setIsEditing(false); onChange(val); }}
        className={cn("w-full bg-white/90 text-black border-2 border-[#E8B931] outline-none rounded p-2", className)}
      />
    );
  }

  return (
    <span 
      onClick={() => setIsEditing(true)} 
      className={cn("cursor-pointer hover:bg-black/5 rounded block", className)}
    >
      {value || <span className="opacity-30 italic">Click to edit</span>}
    </span>
  );
}

function EditableNumber({ value, onChange, className, prefix = '', suffix = '', isViewer }: { value: number, onChange: (v: number) => void, className?: string, prefix?: string, suffix?: string, isViewer?: boolean }) {
  const [isEditing, setIsEditing] = useState(false);
  const [val, setVal] = useState(value.toString());

  useEffect(() => { setVal(value.toString()); }, [value]);

  if (isViewer) return <span className={className}>{prefix}{formatNumber(value)}{suffix}</span>;

  if (isEditing) {
    return (
      <input
        autoFocus
        type="number"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={() => { setIsEditing(false); onChange(Number(val)); }}
        onKeyDown={(e) => { if (e.key === 'Enter') { setIsEditing(false); onChange(Number(val)); } }}
        className={cn("bg-white/90 text-black border-2 border-[#E8B931] outline-none rounded px-1", className)}
      />
    );
  }

  return (
    <span 
      onClick={() => setIsEditing(true)} 
      className={cn("cursor-pointer hover:bg-black/5 rounded", className)}
    >
      {prefix}{formatNumber(value)}{suffix}
    </span>
  );
}

function ClickableImage({ src, onUpload, className, isViewer }: { src?: string, onUpload: (url: string) => void, className?: string, isViewer?: boolean }) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string, 800, 800, 0.6);
        onUpload(compressed);
      };
      reader.readAsDataURL(file);
    }
  };

  if (isViewer) {
    return src ? <img src={src} className={className} alt="" /> : <div className={cn("bg-slate-100 flex items-center justify-center", className)}><Image className="text-slate-300" /></div>;
  }

  return (
    <div 
      onClick={() => fileInputRef.current?.click()} 
      className={cn("relative group cursor-pointer overflow-hidden", className)}
    >
      {src ? (
        <img src={src} className="w-full h-full object-contain" alt="" />
      ) : (
        <div className="w-full h-full bg-slate-100 flex items-center justify-center">
          <Plus className="text-slate-400 group-hover:text-[#E8B931] group-hover:scale-125 transition-all" />
        </div>
      )}
      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
        <label className="bg-white text-black px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest pointer-events-none shadow-xl">
          Upload Image
        </label>
      </div>
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFile} />
    </div>
  );
}

function SectionControls({ onDuplicate, onRemove, onMoveUp, onMoveDown, isFirst, isLast, isViewer }: { onDuplicate: () => void, onRemove: () => void, onMoveUp: () => void, onMoveDown: () => void, isFirst: boolean, isLast: boolean, isViewer?: boolean }) {
  if (isViewer) return null;
  return (
    <div className="absolute -top-10 right-0 flex gap-2 opacity-0 group-hover/section:opacity-100 transition-opacity z-50">
      {!isFirst && (
        <button 
          onClick={onMoveUp} 
          className="w-8 h-8 rounded-full bg-white text-stone-600 shadow-xl flex items-center justify-center hover:bg-[#E8B931] hover:text-white transition-all transform hover:scale-110"
          title="Move Up"
        >
          <ChevronUp size={14} />
        </button>
      )}
      {!isLast && (
        <button 
          onClick={onMoveDown} 
          className="w-8 h-8 rounded-full bg-white text-stone-600 shadow-xl flex items-center justify-center hover:bg-[#E8B931] hover:text-white transition-all transform hover:scale-110"
          title="Move Down"
        >
          <ChevronDown size={14} />
        </button>
      )}
      <button 
        onClick={onDuplicate} 
        className="w-8 h-8 rounded-full bg-white text-stone-600 shadow-xl flex items-center justify-center hover:bg-[#E8B931] hover:text-white transition-all transform hover:scale-110"
        title="Duplicate Section"
      >
        <Copy size={14} />
      </button>
      <button 
        onClick={onRemove} 
        className="w-8 h-8 rounded-full bg-white text-red-500 shadow-xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all transform hover:scale-110"
        title="Remove Section"
      >
        <Trash size={14} />
      </button>
    </div>
  );
}

function SectionWrapper({ children, onDuplicate, onRemove, onMoveUp, onMoveDown, isFirst, isLast, isViewer, id, bgImage }: { children: React.ReactNode, onDuplicate: () => void, onRemove: () => void, onMoveUp: () => void, onMoveDown: () => void, isFirst: boolean, isLast: boolean, isViewer?: boolean, id?: string, bgImage?: string }) {
  return (
    <div 
      id={id} 
      className="relative group/section print:break-after-page mb-16 print:mb-0 min-h-[500px]"
    >
      {bgImage && (
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden rounded-[inherit]">
          <img src={bgImage} className="w-full h-full object-cover opacity-10" alt="" />
        </div>
      )}
      <div className="relative z-10">
        <SectionControls 
          onDuplicate={onDuplicate} 
          onRemove={onRemove} 
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          isFirst={isFirst}
          isLast={isLast}
          isViewer={isViewer} 
        />
        {children}
      </div>
    </div>
  );
}

function FloatingElementComponent({ element, onChange, onRemove, isViewer }: { element: FloatingElement, onChange: (el: FloatingElement) => void, onRemove: () => void, isViewer?: boolean }) {
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isViewer) return;
    setIsDragging(true);
    setStartPos({ x: e.clientX - element.left, y: e.clientY - element.top });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        onChange({
          ...element,
          left: e.clientX - startPos.x,
          top: e.clientY - startPos.y
        });
      }
    };

    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, startPos, element, onChange]);

  return (
    <div 
      className={cn(
        "absolute cursor-move select-none group/floating",
        isDragging && "z-50 ring-2 ring-[#E8B931] ring-offset-2"
      )}
      style={{
        top: `${element.top}px`,
        left: `${element.left}px`,
        width: `${element.width}px`,
        height: `${element.height}px`,
        zIndex: element.zIndex,
        transform: `rotate(${element.rotation || 0}deg)`,
        opacity: element.opacity ?? 1
      }}
      onMouseDown={handleMouseDown}
    >
      {element.type === 'image' ? (
        <img src={element.content} className="w-full h-full object-cover rounded-lg shadow-xl" alt="" draggable={false} />
      ) : element.type === 'icon' ? (
        <div className="w-full h-full flex items-center justify-center" style={{ color: element.color || '#E8B931' }}>
          {React.createElement(
            element.content === 'sprout' ? Sprout :
            element.content === 'leaf' ? Leaf :
            element.content === 'star' ? Star :
            element.content === 'heart' ? Heart :
            element.content === 'triangle' ? Triangle : Heart,
            { size: element.width }
          )}
        </div>
      ) : (
        <div className="w-full h-full bg-stone-900/10 border-2 border-stone-900/20 rounded-xl flex items-center justify-center p-4">
           { element.content === 'circle' && <div className="w-full h-full rounded-full bg-current opacity-20" /> }
           { element.content === 'square' && <div className="w-full h-full rounded-lg bg-current opacity-20" /> }
        </div>
      )}
      
      {!isViewer && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex gap-1 opacity-0 group-hover/floating:opacity-100 transition-opacity whitespace-nowrap bg-stone-900 text-white p-1 rounded-lg text-[9px] font-black uppercase">
          <button 
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="px-2 hover:text-red-500 transition-colors"
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
}

export interface ReportDataWithOptional extends ReportData {}

export default function App() {
  const [data, setData] = useState<ReportData>(MOCK_FULL_DATA);
  const [reportId, setReportId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isViewerMode, setIsViewerMode] = useState(false);
  const [view, setView] = useState<'auth' | 'dashboard' | 'editor'>('auth');
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAuthLoading(false);
      if (u) {
        if (view === 'auth') setView('dashboard');
      } else {
        setView('auth');
      }
    });
    return () => unsubscribe();
  }, [view, isViewerMode]);

  // Handle URL params for direct sharing
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedId = params.get('reportId');
    const viewerParam = params.get('viewer') === 'true';
    if (sharedId) {
      setReportId(sharedId);
      if (viewerParam) setIsViewerMode(true);
      setView('editor');
      loadReport(sharedId);
    }
  }, []);

  const loadReport = async (id: string) => {
    setIsLoading(true);
    try {
      const report = await getReport(id);
      if (report) {
        setData(report.data);
        setReportId(id);
      }
    } catch (err) {
      console.error("Failed to load report", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNew = () => {
    setData(MOCK_FULL_DATA);
    setReportId(null);
    setView('editor');
  };

  const handleSelectReport = (id: string) => {
    setReportId(id);
    setView('editor');
    loadReport(id);
  };
  const reportRef = useRef<HTMLDivElement>(null);

  const addSection = (type: any) => {
    const newSection = { id: `sec-${Date.now()}`, type };
    setData({ ...data, sections: [...(data.sections || []), newSection] });
  };

  const duplicateSection = (id: string) => {
    const sectionIndex = data.sections?.findIndex(s => s.id === id);
    if (sectionIndex === undefined || sectionIndex === -1) return;
    const section = data.sections![sectionIndex];
    const newSection = { ...section, id: `sec-${Date.now()}` };
    const newSections = [...(data.sections || [])];
    newSections.splice(sectionIndex + 1, 0, newSection);
    setData({ ...data, sections: newSections });
  };

  const removeSection = (id: string) => {
    setData({ ...data, sections: data.sections?.filter(s => s.id !== id) });
  };

  const moveSection = (id: string, direction: 'up' | 'down') => {
    const index = data.sections?.findIndex(s => s.id === id);
    if (index === undefined || index === -1) return;
    const newSections = [...(data.sections || [])];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newSections.length) return;
    [newSections[index], newSections[newIndex]] = [newSections[newIndex], newSections[index]];
    setData({ ...data, sections: newSections });
  };

  const renderSection = (section: { id: string, type: string, bgImage?: string }, index: number) => {
    const sectionsCount = data.sections?.length || 0;
    const commonProps = {
      onDuplicate: () => duplicateSection(section.id),
      onRemove: () => removeSection(section.id),
      onMoveUp: () => moveSection(section.id, 'up'),
      onMoveDown: () => moveSection(section.id, 'down'),
      isFirst: index === 0,
      isLast: index === sectionsCount - 1,
      isViewer: isViewerMode,
      id: section.id,
      bgImage: section.bgImage
    };

    switch (section.type) {
      case 'cover':
        return (
          <SectionWrapper key={section.id} id={section.id} {...commonProps}>
            <div className="min-h-[800px] flex flex-col justify-center relative py-12">
               {/* Floating Elements Layer */}
               <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
                  <div className="relative w-full h-full pointer-events-auto">
                    {(data.floatingElements || []).map((el, idx) => (
                      <FloatingElementComponent 
                        key={el.id} 
                        element={el} 
                        isViewer={isViewerMode}
                        onChange={(updated) => {
                          const copy = [...(data.floatingElements || [])];
                          copy[idx] = updated;
                          setData({...data, floatingElements: copy});
                        }}
                        onRemove={() => {
                          const copy = [...(data.floatingElements || [])];
                          copy.splice(idx, 1);
                          setData({...data, floatingElements: copy});
                        }}
                      />
                    ))}
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10 pointer-events-none">
                  <div className="pointer-events-auto">
                     <h1 className="text-[60px] sm:text-[100px] md:text-[120px] font-black leading-[0.85] tracking-tighter text-stone-950 mb-4 whitespace-pre-wrap">
                        <EditableTextArea 
                          value={data.reportTitle || "EMAIL\nMARKETING\nCASE STUDY"} 
                          onChange={(v) => setData({ ...data, reportTitle: v })}
                          isViewer={isViewerMode}
                        />
                     </h1>
                     <p className="text-xl md:text-2xl font-bold uppercase tracking-widest text-stone-800 opacity-80 mt-8">
                        <EditableText 
                          value={data.campaignName || "Campaign Overview"} 
                          onChange={(v) => setData({ ...data, campaignName: v })} 
                          isViewer={isViewerMode} 
                        />
                     </p>
                     <div className="mt-24">
                        <ClickableImage 
                          src={data.clientLogo}
                          onUpload={(url) => setData({ ...data, clientLogo: url })}
                          className="w-48 h-48 md:w-64 md:h-64 bg-stone-900/5 rounded-3xl flex items-center justify-center border-4 border-dashed border-stone-950/20 shadow-sm transition-all hover:scale-105"
                          isViewer={isViewerMode}
                        />
                        <p className="text-[10px] font-black uppercase text-stone-400 mt-4 tracking-widest">Main Client Logo / Feature Image</p>
                     </div>
                  </div>
                  
                  <div className="relative pl-0 md:pl-12 mt-12 md:mt-0 pointer-events-auto">
                      <div className="space-y-12 relative z-10">
                         {(data.heroStats || []).map((item, idx) => (
                           <div key={item.id} className="flex items-center gap-6 group">
                              <div className="w-16 h-16 md:w-20 md:h-20 rounded-[28px] bg-stone-900 text-[#E8B931] flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-all flex-shrink-0">
                                 {ICON_MAP[item.iconName] || <TrendingUp/>}
                              </div>
                              <div className="min-w-0 flex-1">
                                 <p className="text-xl md:text-3xl font-black text-stone-950 truncate">
                                   <EditableText value={item.value} onChange={(v) => {
                                      const newStats = [...(data.heroStats || [])];
                                      newStats[idx].value = v;
                                      setData({...data, heroStats: newStats});
                                   }} isViewer={isViewerMode} />
                                 </p>
                                 <p className="text-sm font-bold text-stone-800 opacity-60 truncate">
                                    <EditableText value={item.label} onChange={(v) => {
                                      const newStats = [...(data.heroStats || [])];
                                      newStats[idx].label = v;
                                      setData({...data, heroStats: newStats});
                                   }} isViewer={isViewerMode} />
                                    {" — "}
                                    <EditableText value={item.subLabel} onChange={(v) => {
                                      const newStats = [...(data.heroStats || [])];
                                      newStats[idx].subLabel = v;
                                      setData({...data, heroStats: newStats});
                                   }} isViewer={isViewerMode} />
                                 </p>
                              </div>
                           </div>
                         ))}
                      </div>
                  </div>
               </div>
            </div>
          </SectionWrapper>
        );
      case 'overview':
        return (
          <SectionWrapper key={section.id} {...commonProps}>
            <div className="min-h-[800px] flex flex-col justify-center">
               <h2 className="text-[60px] md:text-[100px] font-black tracking-tighter text-stone-950 mb-12">
                  <EditableTextArea 
                    value={data.overviewTitle || "Overview\nMetrics"} 
                    onChange={(v) => setData({ ...data, overviewTitle: v })} 
                    isViewer={isViewerMode} 
                  />
               </h2>
               <div className="space-y-6 max-w-2xl">
                  {[
                    "Total Emails Sent", "Total Opens", "Total Clicks", 
                    "Overall Open Rate", "Overall Click Rate", "Replies / Unsubscribes"
                  ].map((m, i) => (
                    <div key={i} className="flex items-center gap-4 text-2xl md:text-3xl font-bold text-stone-800">
                      <div className="w-8 h-2 bg-stone-950 rounded-full flex-shrink-0" />
                      <EditableText value={m} onChange={() => {}} isViewer={isViewerMode} />
                    </div>
                  ))}
                  <p className="text-xl font-medium text-stone-800 opacity-60 mt-12 italic">
                    <EditableText value="Show in 4–6 clean boxes (no clutter)" onChange={() => {}} isViewer={isViewerMode} />
                  </p>
               </div>
            </div>
          </SectionWrapper>
        );
      case 'goals':
        return (
          <SectionWrapper key={section.id} {...commonProps}>
            <div className="space-y-12">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-8">
                  <div>
                     <p className="text-xl md:text-2xl font-black text-stone-800 opacity-60 uppercase tracking-widest">
                       <EditableText 
                         value={data.campaignName || "Campaign Name"} 
                         onChange={(v) => setData({ ...data, campaignName: v })} 
                         isViewer={isViewerMode} 
                       />
                     </p>
                     <h2 className="text-5xl md:text-7xl font-black text-stone-950 tracking-tighter uppercase leading-tight">
                       <EditableText 
                         value={data.goalsTitle || "Email Marketing Report"} 
                         onChange={(v) => setData({ ...data, goalsTitle: v })} 
                         isViewer={isViewerMode} 
                       />
                     </h2>
                  </div>
                  <BentoCard className="flex items-center gap-8 py-4 px-10 w-full md:w-auto overflow-hidden">
                     <div className="p-4 bg-slate-100 rounded-2xl flex-shrink-0"><CalendarIcon className="text-stone-400" /></div>
                     <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase text-slate-400">Date Period</p>
                         <p className="text-lg md:text-xl font-black truncate">
                           <EditableText value={data.datePeriod} onChange={(v) => setData({ ...data, datePeriod: v })} isViewer={isViewerMode} />
                         </p>
                        <p className="text-xs font-bold text-slate-400">Duration: 30 days</p>
                     </div>
                  </BentoCard>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <BentoCard className="overflow-hidden">
                     <h3 className="text-xl font-black uppercase mb-8 border-b border-slate-50 pb-4">Deals and Conversion Goals</h3>
                     <div className="space-y-10">
                        <MetricRowProgress label="Contact Count" val={data.conversionCount} max={data.conversionGoal} color="#ef4444" />
                        <MetricRowProgress label="Deal Count" val={data.dealsCount} max={data.dealsGoal} color="#1a1a1a" />
                     </div>
                  </BentoCard>
                  <BentoCard className="overflow-hidden">
                     <h3 className="text-xl font-black uppercase mb-8 border-b border-slate-50 pb-4">List of Deals and Contacts</h3>
                     <div className="space-y-8">
                        <div className="flex justify-between items-center bg-slate-50 p-6 rounded-3xl gap-4">
                           <div className="flex items-center gap-4 text-stone-500 font-bold truncate flex-shrink-0"><Users/> Contact Count</div>
                           <span className="text-2xl md:text-3xl font-black text-stone-950 truncate">
                             <EditableNumber value={data.listContacts} onChange={(v) => setData({ ...data, listContacts: v })} isViewer={isViewerMode} />
                           </span>
                        </div>
                        <div className="flex justify-between items-center bg-slate-50 p-6 rounded-3xl gap-4">
                           <div className="flex items-center gap-4 text-stone-500 font-bold truncate flex-shrink-0"><Briefcase/> Deal Count</div>
                           <span className="text-2xl md:text-3xl font-black text-stone-950 truncate">
                             <EditableNumber value={data.listDeals} onChange={(v) => setData({ ...data, listDeals: v })} isViewer={isViewerMode} />
                           </span>
                        </div>
                     </div>
                  </BentoCard>
                  <BentoCard className="flex flex-col min-h-[300px] overflow-hidden">
                     <h3 className="text-xl font-black uppercase mb-8 border-b border-slate-50 pb-4 text-red-500">Summary</h3>
                     <div className="text-stone-500 text-sm leading-loose font-medium flex-1 overflow-y-auto">
                       <EditableTextArea value={data.summary} onChange={(v) => setData({ ...data, summary: v })} isViewer={isViewerMode} className="h-full" />
                     </div>
                  </BentoCard>
                  <BentoCard className="overflow-hidden">
                     <h3 className="text-xl font-black uppercase mb-8 border-b border-slate-50 pb-4 text-red-500">Summary Highlights</h3>
                     <div className="space-y-6 overflow-y-auto max-h-[400px]">
                        {data.recommendations.map((rec, i) => (
                          <div key={i} className="flex gap-4 group">
                             <span className="text-lg font-black text-red-500 flex-shrink-0 transition-transform group-hover:scale-125">{i+1}.</span>
                             <div className="text-sm font-bold text-stone-600 leading-relaxed group-hover:text-stone-950 flex-1">
                               <EditableTextArea 
                                 value={rec} 
                                 onChange={(v) => {
                                   const newRecs = [...data.recommendations];
                                   newRecs[i] = v;
                                   setData({ ...data, recommendations: newRecs });
                                 }} 
                                 isViewer={isViewerMode}
                                 className={rec.includes("%") ? "text-red-500" : ""}
                               />
                             </div>
                          </div>
                        ))}
                     </div>
                  </BentoCard>
               </div>
            </div>
          </SectionWrapper>
        );
      case 'growth':
        return (
          <SectionWrapper key={section.id} {...commonProps}>
            <div className="space-y-12">
               <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                   {[
                     { label: "Contact Count", key: 'contactCount', icon: <Users size={28}/>, accent: '#ef4444', desc: "consectetur adipiscing elitged duilo sectetur" },
                     { label: "Deal Count", key: 'dealCount', icon: <Briefcase size={28}/>, accent: '#1a1a1a', desc: "consectetur adipiscing elitged duilo sectetur" },
                     { label: "Deals Value", key: 'dealsValue', icon: <TrendingUp size={28}/>, accent: '#ef4444', prefix: '$', desc: "consectetur adipiscing elitged duilo sectetur" }
                   ].map((m, i) => (
                     <BentoCard key={i} className="relative group overflow-hidden p-6 md:p-10">
                        <p className="text-lg font-black text-stone-950 mb-3 truncate">
                          <EditableText value={m.label} onChange={() => {}} isViewer={isViewerMode} />
                        </p>
                        <p className="text-[10px] text-stone-400 font-bold mb-8 leading-relaxed line-clamp-2">
                          <EditableTextArea value={m.desc} onChange={() => {}} isViewer={isViewerMode} />
                        </p>
                        <div className="flex items-center gap-4 md:gap-6">
                           <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center text-white shadow-lg flex-shrink-0" style={{ backgroundColor: i % 2 === 0 ? '#fee2e2' : '#f1f5f9' }}>
                             <div className="text-red-500" style={{ color: i % 2 === 0 ? '#ef4444' : '#1e1b4b' }}>{m.icon}</div>
                           </div>
                           <div className="min-w-0">
                             <p className="text-2xl md:text-4xl font-black text-stone-950 truncate">
                               <EditableNumber 
                                 value={(data as any)[m.key]} 
                                 prefix={m.prefix} 
                                 onChange={(v) => setData({ ...data, [m.key]: v })} 
                                 isViewer={isViewerMode} 
                               />
                             </p>
                             <p className="text-[10px] font-black uppercase text-slate-300 tracking-widest truncate">{m.label}</p>
                           </div>
                        </div>
                     </BentoCard>
                   ))}
               </div>
  
               <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                  <BentoCard className="md:col-span-7 overflow-hidden">
                      <h3 className="text-xl font-black uppercase mb-12">
                        <EditableText 
                          value={data.growthTitle || "Deals and Contacts in Account"} 
                          onChange={(v) => setData({ ...data, growthTitle: v })} 
                          isViewer={isViewerMode} 
                        />
                      </h3>
                     <div className="h-[300px] w-full">
                        {data.growthChartImage ? (
                          <ClickableImage 
                            src={data.growthChartImage} 
                            onUpload={(url) => setData({ ...data, growthChartImage: url })} 
                            className="w-full h-full" 
                            isViewer={isViewerMode} 
                          />
                        ) : (
                          <ResponsiveContainer width="100%" height="100%">
                             <AreaChart data={data.growthLabels.map((l, i) => ({ name: l, contacts: data.growthContacts[i], deals: data.growthDeals[i] }))}>
                                <Area type="monotone" dataKey="contacts" stroke="#ef4444" strokeWidth={4} fill="#fee2e2" fillOpacity={0.6} />
                                <Area type="monotone" dataKey="deals" stroke="#1a1a1a" strokeWidth={4} fill="transparent" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} fontWeight={900} />
                                <YAxis axisLine={false} tickLine={false} fontSize={10} fontWeight={900} />
                                <Tooltip />
                             </AreaChart>
                          </ResponsiveContainer>
                        )}
                     </div>
                  </BentoCard>
                   <BentoCard className="md:col-span-5 flex flex-col items-center overflow-hidden">
                      <h3 className="text-xl font-black uppercase mb-12 text-center">
                        <EditableText 
                          value={data.growthDistributionTitle || "Contacts & Deals distribution"} 
                          onChange={(v) => setData({ ...data, growthDistributionTitle: v })} 
                          isViewer={isViewerMode} 
                        />
                      </h3>
                     <div className="relative w-48 h-48 md:w-64 md:h-64 flex-shrink-0">
                        {data.distributionChartImage ? (
                          <ClickableImage 
                            src={data.distributionChartImage} 
                            onUpload={(url) => setData({ ...data, distributionChartImage: url })} 
                            className="w-full h-full" 
                            isViewer={isViewerMode} 
                          />
                        ) : (
                          <ResponsiveContainer width="100%" height="100%">
                             <PieChart>
                                <Pie data={[{ name: 'Ratio', value: 38 }, { name: 'Other', value: 62 }]} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                   <Cell fill="#ef4444" />
                                   <Cell fill="#1a1a1a" />
                                </Pie>
                             </PieChart>
                          </ResponsiveContainer>
                        )}
                        {!data.distributionChartImage && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                             <span className="text-[10px] font-black text-slate-400 uppercase">Ratio</span>
                             <span className="text-3xl md:text-5xl font-black text-stone-950 tracking-tighter">38%</span>
                          </div>
                        )}
                     </div>
                     <div className="mt-8 space-y-3 w-full">
                        <div className="flex justify-between items-center text-[10px] md:text-xs font-black">
                           <div className="flex items-center gap-2 truncate"><div className="w-3 h-3 rounded-full bg-red-500 flex-shrink-0"/> Contact Count</div>
                           <span className="flex-shrink-0">2,871 (38.41%)</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] md:text-xs font-black">
                           <div className="flex items-center gap-2 truncate"><div className="w-3 h-3 rounded-full bg-stone-900 flex-shrink-0"/> Deal Count</div>
                           <span className="flex-shrink-0">2,871 (38.41%)</span>
                        </div>
                     </div>
                  </BentoCard>
               </div>
            </div>
          </SectionWrapper>
        );
      case 'deals':
        return (
          <SectionWrapper key={section.id} {...commonProps}>
            <div className="space-y-12">
               <BentoCard className="overflow-hidden">
                  <div className="flex justify-between items-center mb-8 border-b pb-4 gap-4">
                     <h3 className="text-xl md:text-2xl font-black uppercase tracking-tighter truncate">
                       <EditableText 
                         value={data.dealsValueTitle || "Deals value"} 
                         onChange={(v) => setData({ ...data, dealsValueTitle: v })} 
                         isViewer={isViewerMode} 
                       />
                     </h3>
                     <span className="text-xs md:text-sm font-black text-slate-400 uppercase tracking-widest flex-shrink-0">Value</span>
                  </div>
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                     {data.dealSources.map((s, idx) => (
                       <div key={s.id} className="flex justify-between items-center group py-2 gap-4 border-b border-transparent hover:border-slate-100 transition-colors">
                          <span className="text-base md:text-lg font-bold text-stone-700 group-hover:text-stone-950 transition-colors uppercase italic truncate">
                            <EditableText 
                              value={s.source} 
                              onChange={(v) => {
                                const newSources = [...data.dealSources];
                                newSources[idx].source = v;
                                setData({ ...data, dealSources: newSources });
                              }} 
                              isViewer={isViewerMode} 
                            />
                          </span>
                          <span className="text-base md:text-lg font-black text-stone-950 flex-shrink-0">
                            <EditableNumber 
                              value={s.value} 
                              onChange={(v) => {
                                const newSources = [...data.dealSources];
                                newSources[idx].value = v;
                                setData({ ...data, dealSources: newSources });
                              }} 
                              isViewer={isViewerMode} 
                            />
                          </span>
                       </div>
                     ))}
                  </div>
               </BentoCard>
  
               <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <BentoCard className="overflow-hidden">
                     <h3 className="text-xl font-black uppercase mb-10 text-red-500">
                       <EditableText 
                         value={data.dealsGoalsTitle || "Deals and Conversion Goals"} 
                         onChange={(v) => setData({ ...data, dealsGoalsTitle: v })} 
                         isViewer={isViewerMode} 
                       />
                     </h3>
                     <div className="space-y-10">
                        <MetricRowProgress label="Contact Count" val={data.conversionCount} max={data.conversionGoal} color="#ef4444" />
                        <MetricRowProgress label="Deal Count" val={data.dealsCount} max={data.dealsGoal} color="#1a1a1a" />
                        <MetricRowProgress label="Total Link Clicks" val={data.actualClicks} max={data.linkClicksGoal} color="#ef4444" />
                     </div>
                  </BentoCard>
                  <BentoCard className="overflow-hidden">
                     <h3 className="text-xl font-black uppercase mb-10 text-red-500">
                       <EditableText 
                         value={data.campaignEngagementTitle || "Campaign Engagement List"} 
                         onChange={(v) => setData({ ...data, campaignEngagementTitle: v })} 
                         isViewer={isViewerMode} 
                       />
                     </h3>
                     <div className="space-y-6">
                        <IconMetricRow icon={<Mail/>} label="Emails Sent" val={data.actualSent} />
                        <IconMetricRow icon={<ExternalLink/>} label="Opens" val={data.actualOpens} />
                        <IconMetricRow icon={<MousePointerClick/>} label="Link Clicks" val={data.actualClicks} />
                        <IconMetricRow icon={<MessageSquare/>} label="Replies" val={data.actualReplies} />
                     </div>
                  </BentoCard>
               </div>
            </div>
          </SectionWrapper>
        );
      case 'metrics':
        return (
          <SectionWrapper key={section.id} {...commonProps}>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
               {[
                 { label: data.metricsLabels?.[0] || "Total Emails Sent", val: 2871, icon: <Users/>, sub: "Contact Count" },
                 { label: data.metricsLabels?.[1] || "Opens", val: 4603, icon: <ExternalLink/>, sub: "Deal Count" },
                 { label: data.metricsLabels?.[2] || "Open Rate", val: 5871, icon: <TrendingUp/>, sub: "Value", prefix: "$" },
                 { label: data.metricsLabels?.[3] || "Contact Count", val: 2871, icon: <Users/>, sub: "Contact Count" },
                 { label: data.metricsLabels?.[4] || "Deal Count", val: 4603, icon: <Briefcase/>, sub: "Deal Count" },
                 { label: data.metricsLabels?.[5] || "Deals Value", val: 5871, icon: <TrendingUp/>, sub: "Value", prefix: "$" },
                 { label: data.metricsLabels?.[6] || "Contact Count", val: 2871, icon: <Users/>, sub: "Contact Count" },
                 { label: data.metricsLabels?.[7] || "Deal Count", val: 4603, icon: <Briefcase/>, sub: "Deal Count" },
                 { label: data.metricsLabels?.[8] || "Deals Value", val: 5871, icon: <TrendingUp/>, sub: "Value", prefix: "$" }
               ].map((m, i) => (
                  <BentoCard key={i} className="overflow-hidden p-6 md:p-10">
                     <p className="text-sm font-black text-stone-950 mb-1 truncate">
                       <EditableText 
                         value={m.label} 
                         onChange={(v) => {
                           const newLabels = [...(data.metricsLabels || [])];
                           newLabels[i] = v;
                           setData({ ...data, metricsLabels: newLabels });
                         }} 
                         isViewer={isViewerMode} 
                       />
                     </p>
                     <p className="text-[10px] text-stone-400 font-bold mb-8 truncate">
                       <EditableText value="consectetur adipiscing elitged duilo sectetur" onChange={() => {}} isViewer={isViewerMode} />
                     </p>
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                           {m.icon}
                        </div>
                        <div className="min-w-0">
                           <p className="text-2xl md:text-3xl font-black text-stone-950 truncate">
                             <EditableNumber value={m.val} prefix={m.prefix} onChange={() => {}} isViewer={isViewerMode} />
                           </p>
                           <p className="text-[10px] uppercase font-black text-slate-300 tracking-widest truncate">{m.sub}</p>
                        </div>
                     </div>
                  </BentoCard>
               ))}
            </div>
          </SectionWrapper>
        );
      case 'trends':
        return (
          <SectionWrapper key={section.id} {...commonProps}>
            <div className="space-y-12">
               <BentoCard className="overflow-hidden">
                  <h3 className="text-xl font-black uppercase mb-12 truncate">
                    <EditableText 
                      value={data.trendsSentOpensTitle || "Sent vs. Opens"} 
                      onChange={(v) => setData({ ...data, trendsSentOpensTitle: v })} 
                      isViewer={isViewerMode} 
                    />
                  </h3>
                  <div className="h-[300px] md:h-[400px] w-full">
                     {data.sentOpensChartImage ? (
                       <ClickableImage 
                         src={data.sentOpensChartImage} 
                         onUpload={(url) => setData({ ...data, sentOpensChartImage: url })} 
                         className="w-full h-full" 
                         isViewer={isViewerMode} 
                       />
                     ) : (
                       <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={data.growthLabels.map((l, i) => ({ name: l, sent: data.sentTrend[i], opens: data.opensTrend[i] }))}>
                             <Area type="monotone" dataKey="sent" stroke="#1a1a1a" strokeWidth={3} fill="transparent" />
                             <Area type="monotone" dataKey="opens" stroke="#ef4444" strokeWidth={3} fill="transparent" />
                             <XAxis dataKey="name" fontSize={10} fontWeight={900} axisLine={false} tickLine={false} />
                             <YAxis fontSize={10} fontWeight={900} axisLine={false} tickLine={false} />
                             <Tooltip />
                          </AreaChart>
                       </ResponsiveContainer>
                     )}
                  </div>
                  <div className="flex justify-center gap-4 md:gap-8 mt-4 overflow-x-auto pb-2">
                     <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest whitespace-nowrap"><div className="w-8 h-1 bg-stone-950 rounded-full"/> Sent</div>
                     <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest whitespace-nowrap"><div className="w-8 h-1 bg-red-500 rounded-full"/> Opens</div>
                  </div>
               </BentoCard>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <BentoCard className="flex flex-col justify-between overflow-hidden">
                     <div>
                       <p className="text-xl font-black text-stone-950 mb-2 truncate">
                         <EditableText 
                           value={data.trendsClicksTitle || "Link clicks"} 
                           onChange={(v) => setData({ ...data, trendsClicksTitle: v })} 
                           isViewer={isViewerMode} 
                         />
                       </p>
                       <p className="text-[10px] text-stone-400 font-bold mb-8 leading-relaxed truncate">
                         <EditableText value="consectetur adipiscing elitged duilo sectetur" onChange={() => {}} isViewer={isViewerMode} />
                       </p>
                     </div>
                     <div className="flex items-center gap-6">
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center shadow-lg flex-shrink-0"><MousePointerClick size={30}/></div>
                        <div className="min-w-0">
                           <p className="text-3xl md:text-5xl font-black text-stone-950 truncate">
                             <EditableNumber value={8303} onChange={() => {}} isViewer={isViewerMode} />
                           </p>
                           <p className="text-[10px] md:text-xs font-black text-slate-300 uppercase tracking-widest">Link Clicks</p>
                        </div>
                     </div>
                  </BentoCard>
                  <BentoCard className="flex flex-col justify-between overflow-hidden">
                     <div>
                       <p className="text-xl font-black text-stone-950 mb-2 truncate">
                         <EditableText 
                           value={data.trendsClickRateTitle || "Link Click Rate"} 
                           onChange={(v) => setData({ ...data, trendsClickRateTitle: v })} 
                           isViewer={isViewerMode} 
                         />
                       </p>
                       <p className="text-[10px] text-stone-400 font-bold mb-8 leading-relaxed truncate">
                         <EditableText value="consectetur adipiscing elitged duilo sectetur" onChange={() => {}} isViewer={isViewerMode} />
                       </p>
                     </div>
                     <div className="flex items-center gap-6">
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-slate-100 text-stone-400 rounded-3xl flex items-center justify-center shadow-lg flex-shrink-0"><Filter size={30}/></div>
                        <div className="min-w-0">
                           <p className="text-3xl md:text-5xl font-black text-stone-950 truncate">
                             <EditableNumber value={4603} onChange={() => {}} isViewer={isViewerMode} />
                           </p>
                           <p className="text-[10px] md:text-xs font-black text-slate-300 uppercase tracking-widest">Deal Count</p>
                        </div>
                     </div>
                  </BentoCard>
               </div>
            </div>
          </SectionWrapper>
        );
      case 'funnel':
        return (
          <SectionWrapper key={section.id} {...commonProps}>
            <div className="space-y-12">
               <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                  <BentoCard className="md:col-span-5 text-center overflow-hidden">
                     <h3 className="text-xl font-black uppercase mb-12 text-left truncate">
                       <EditableText 
                         value={data.funnelClicksTitle || "Email Clicks funnel"} 
                         onChange={(v) => setData({ ...data, funnelClicksTitle: v })} 
                         isViewer={isViewerMode} 
                       />
                     </h3>
                     <div className="h-[300px] md:h-auto overflow-hidden">
                        {data.funnelChartImage ? (
                          <ClickableImage 
                            src={data.funnelChartImage} 
                            onUpload={(url) => setData({ ...data, funnelChartImage: url })} 
                            className="w-full h-full" 
                            isViewer={isViewerMode} 
                          />
                        ) : (
                          <div className="space-y-4 mb-12">
                             <div className="bg-red-600 text-white p-4 md:p-6 rounded-3xl text-xl md:text-3xl font-black uppercase italic tracking-tighter">SENT</div>
                             <div className="bg-stone-900 text-white p-4 md:p-6 rounded-3xl text-xl md:text-3xl font-black uppercase italic tracking-tighter mx-4">OPENED</div>
                             <div className="bg-red-300 text-white p-4 md:p-6 rounded-3xl text-xl md:text-3xl font-black uppercase italic tracking-tighter mx-8">CLICKED</div>
                          </div>
                        )}
                     </div>
                     <div className="space-y-4 border-t pt-8">
                        {["Porro est in.", "Porro est in.", "Porro est in."].map((p, i) => (
                          <div key={i} className="flex justify-between font-bold text-xs text-stone-600 gap-4">
                             <span className="truncate flex-1 text-left"><EditableText value={p} onChange={() => {}} isViewer={isViewerMode} /></span>
                             <span className="flex-shrink-0">9,483 100.00%</span>
                          </div>
                        ))}
                     </div>
                     <div className="mt-8 flex flex-col md:flex-row justify-between items-center text-red-500 gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest">Total conversion rate</span>
                        <span className="text-3xl md:text-5xl font-black italic tracking-tighter select-none">38.16%</span>
                     </div>
                  </BentoCard>
                  <BentoCard className="md:col-span-7 overflow-hidden">
                     <h3 className="text-xl font-black uppercase mb-12 truncate">
                       <EditableText 
                         value={data.funnelTrendsTitle || "Sent/opened emails trends"} 
                         onChange={(v) => setData({ ...data, funnelTrendsTitle: v })} 
                         isViewer={isViewerMode} 
                       />
                     </h3>
                     <div className="h-[300px] md:h-[400px] w-full">
                        {data.engagementTrendChartImage ? (
                          <ClickableImage 
                            src={data.engagementTrendChartImage} 
                            onUpload={(url) => setData({ ...data, engagementTrendChartImage: url })} 
                            className="w-full h-full" 
                            isViewer={isViewerMode} 
                          />
                        ) : (
                          <ResponsiveContainer width="100%" height="100%">
                             <AreaChart data={data.growthLabels.map((l, i) => ({ name: l, opens: data.engagementOpensTrend[i], clicks: data.engagementClicksTrend[i] }))}>
                                <Area type="monotone" dataKey="opens" stroke="#ef4444" strokeWidth={3} fill="transparent" />
                                <Area type="monotone" dataKey="clicks" stroke="#1a1a1a" strokeWidth={3} fill="transparent" />
                                <XAxis dataKey="name" fontSize={10} fontWeight={900} axisLine={false} tickLine={false} />
                                <YAxis fontSize={10} fontWeight={900} axisLine={false} tickLine={false} />
                             </AreaChart>
                          </ResponsiveContainer>
                        )}
                     </div>
                  </BentoCard>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                  {[
                    { label: "Unsubscribes", val: data.unsubscribes, key: 'unsubscribes', icon: <Users/>, sub: "Contact Count" },
                    { label: "Unsubscribes Rate", val: data.unsubscribeRateStr, key: 'unsubscribeRateStr', icon: <ExternalLink/>, sub: "Deal Count", isString: true },
                    { label: "Replies", val: data.repliesTotal, key: 'repliesTotal', icon: <TrendingUp/>, sub: "Value", prefix: "$" }
                  ].map((m, i) => (
                    <BentoCard key={i} className="overflow-hidden p-6 md:p-10">
                       <p className="text-lg font-black text-stone-950 mb-12 truncate">
                         <EditableText value={m.label} onChange={() => {}} isViewer={isViewerMode} />
                       </p>
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 md:w-12 md:h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                             {m.icon}
                          </div>
                          <div className="min-w-0">
                             <p className="text-2xl md:text-4xl font-black text-stone-950 truncate">
                               {m.isString ? (
                                 <EditableText value={m.val as string} onChange={(v) => setData({ ...data, [m.key]: v })} isViewer={isViewerMode} />
                               ) : (
                                 <EditableNumber value={m.val as number} prefix={m.prefix} onChange={(v) => setData({ ...data, [m.key]: v })} isViewer={isViewerMode} />
                               )}
                             </p>
                             <p className="text-[10px] uppercase font-black text-slate-300 tracking-widest truncate">{m.sub}</p>
                          </div>
                       </div>
                    </BentoCard>
                  ))}
               </div>
            </div>
          </SectionWrapper>
        );
      case 'table':
        return (
          <SectionWrapper key={section.id} {...commonProps}>
            <div>
              <BentoCard className="overflow-hidden">
                <h3 className="text-2xl md:text-3xl font-black uppercase mb-12 truncate">
                  <EditableText 
                    value={data.performanceTableTitle || "Campaigns Performance"} 
                    onChange={(v) => setData({ ...data, performanceTableTitle: v })} 
                    isViewer={isViewerMode} 
                  />
                </h3>
                <div className="overflow-x-auto pb-4">
                  <table className="w-full text-left min-w-[800px]">
                    <thead>
                      <tr className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] bg-slate-50">
                        <th className="px-6 py-4 rounded-tl-3xl">Name</th>
                        <th className="px-6 py-4">Sent</th>
                        <th className="px-6 py-4">Opens</th>
                        <th className="px-6 py-4">Open Rate</th>
                        <th className="px-6 py-4">Unique Opens</th>
                        <th className="px-6 py-4">Unique Clicks</th>
                        <th className="px-6 py-4 rounded-tr-3xl">Link Clicks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 italic font-bold text-stone-600">
                      {data.campaignsPerformance.map((row, i) => (
                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-8">
                             <div className="text-stone-950 font-black not-italic text-sm truncate">
                               <EditableText value={row.name} onChange={(v) => {
                                 const copy = [...data.campaignsPerformance];
                                 copy[i].name = v;
                                 setData({...data, campaignsPerformance: copy});
                               }} isViewer={isViewerMode} />
                             </div>
                             <div className="text-[10px] text-slate-300">Date: 2026-01-18</div>
                          </td>
                          <td className="px-6 py-8"><EditableNumber value={row.sent} onChange={(v) => {
                                 const copy = [...data.campaignsPerformance];
                                 copy[i].sent = v;
                                 setData({...data, campaignsPerformance: copy});
                               }} isViewer={isViewerMode} /></td>
                          <td className="px-6 py-8"><EditableNumber value={row.opens} onChange={(v) => {
                                 const copy = [...data.campaignsPerformance];
                                 copy[i].opens = v;
                                 setData({...data, campaignsPerformance: copy});
                               }} isViewer={isViewerMode} /></td>
                          <td className="px-6 py-8 text-red-500 font-black">
                            <EditableNumber value={row.openRate} suffix="%" onChange={(v) => {
                                 const copy = [...data.campaignsPerformance];
                                 copy[i].openRate = v;
                                 setData({...data, campaignsPerformance: copy});
                               }} isViewer={isViewerMode} />
                          </td>
                          <td className="px-6 py-8">12,740</td>
                          <td className="px-6 py-8">64.43%</td>
                          <td className="px-6 py-8 text-red-500 font-black">
                            <EditableNumber value={row.linkClicks} onChange={(v) => {
                                 const copy = [...data.campaignsPerformance];
                                 copy[i].linkClicks = v;
                                 setData({...data, campaignsPerformance: copy});
                               }} isViewer={isViewerMode} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </BentoCard>
            </div>
          </SectionWrapper>
        );
      case 'footer':
        return (
          <SectionWrapper key={section.id} {...commonProps}>
            <div className="min-h-[700px] flex flex-col justify-center relative overflow-hidden">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24 items-center">
                  <div className="z-10">
                     <h2 className="text-[100px] md:text-[180px] font-black leading-[0.7] tracking-tighter text-stone-950 mb-12 select-none" style={{ fontFamily: "'Dancing Script', cursive" }}>
                        <EditableTextArea 
                          value={data.thanksTitle || "Thanks\nyou"} 
                          onChange={(v) => setData({ ...data, thanksTitle: v })} 
                          isViewer={isViewerMode} 
                        />
                     </h2>
                     <div className="text-base md:text-lg font-bold text-stone-800 opacity-60 leading-relaxed max-w-md">
                        <EditableTextArea 
                          value={data.thanksBody || "Lorem ipsum dolor sit amet, consectetur adipiscing elit, seodo eiusm odtempor incididunt ut labore et dolore magna aliqua. Ut enim asdfd minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."} 
                          onChange={(v) => setData({ ...data, thanksBody: v })} 
                          isViewer={isViewerMode} 
                        />
                     </div>
                  </div>
                  <div className="flex justify-center mt-12 md:mt-0">
                     <div className="w-64 h-64 md:w-80 md:h-80 bg-stone-900/5 rounded-full flex items-center justify-center border-4 border-dashed border-stone-950/20">
                        <Telescope size={100} className="text-stone-950 opacity-40 rotate-12" />
                     </div>
                  </div>
               </div>
            </div>
          </SectionWrapper>
        );
      default:
        return null;
    }
  };

  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error("Sign in failed", err);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setReportId(null);
      setData(MOCK_FULL_DATA);
    } catch (err) {
      console.error("Sign out failed", err);
    }
  };

  // Auto-save logic
  const debouncedSave = useCallback(
    debounce(async (currentData: ReportData, currentId: string | null, currentUser: User | null) => {
      if (!currentUser) return;
      
      // Check document size estimate (1MB limit)
      const dataSize = JSON.stringify(currentData).length;
      if (dataSize > 900000) {
        console.warn(`Report data size (${dataSize} bytes) is approaching Firestore 1MB limit.`);
      }

      setIsSaving(true);
      try {
        const id = await saveReport(currentId, currentData);
        if (!currentId) {
          setReportId(id);
          const newUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}?reportId=${id}`;
          window.history.pushState({ path: newUrl }, '', newUrl);
        }
      } catch (err: any) {
        if (err.message?.includes('exceeds the maximum allowed size')) {
          alert("Document too large! Try reducing image sizes or removing some images.");
        }
        console.error("Auto-save failed", err);
      } finally {
        setIsSaving(false);
      }
    }, 2000),
    []
  );

  useEffect(() => {
    if (user) {
      debouncedSave(data, reportId, user);
    }
  }, [data, user, reportId, debouncedSave]);

  const handleSaveReport = async () => {
    if (!user) {
      await handleSignIn();
      return;
    }
    setIsSaving(true);
    try {
      const id = await saveReport(reportId, data);
      setReportId(id);
      const newUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}?reportId=${id}`;
      window.history.pushState({ path: newUrl }, '', newUrl);
    } catch (err) {
      console.error("Failed to save report", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateShareLink = async () => {
    if (!user) {
      await handleSignIn();
      return;
    }

    setIsSaving(true);
    try {
      const id = await saveReport(reportId, data);
      setReportId(id);
      // Create a viewer link
      const shareUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}?reportId=${id}&viewer=true`;
      await navigator.clipboard.writeText(shareUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000);
      
      const newUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}?reportId=${id}`;
      window.history.pushState({ path: newUrl }, '', newUrl);
    } catch (err) {
      console.error("Failed to generate share link", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadHTML = () => {
    if (!reportRef.current) return;
    const content = reportRef.current.innerHTML;
    const fullHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet">
  <style>
    :root {
      --accent-color: ${data.accentColor};
      --card-bg: ${data.cardColor};
      --report-text: ${data.textColor};
      --card-radius: ${borderRadiusMap[data.borderRadius]};
    }
    body { 
      background-color: ${data.themeColor}; 
      padding: 40px; 
      font-family: ${fontFamilyMap[data.fontFamily]};
      color: var(--report-text);
    } 
    .report-card { 
      background: var(--card-bg); 
      border-radius: var(--card-radius); 
      padding: 24px; 
      margin-bottom: 24px; 
      box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
      border: 1px solid rgba(0,0,0,0.05);
      color: var(--report-text);
    }
    .text-stone-900, .text-stone-800 { color: var(--report-text); }
  </style>
</head>
<body>
  <div style="max-width: 1000px; margin: 0 auto;">${content}</div>
</body>
</html>`;
    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Report_${Date.now()}.html`;
    a.click();
  };

  const handleDownloadPDF = async () => {
    if (!reportRef.current || !data.sections) return;
    setIsLoading(true);
    
    window.scrollTo(0, 0);

    try {
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < data.sections.length; i++) {
        const section = data.sections[i];
        const sectionEl = document.getElementById(section.id);
        
        if (!sectionEl) continue;

        const canvas = await html2canvas(sectionEl, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: data.themeColor,
          logging: false,
          onclone: (clonedDoc) => {
            // Apply fix for modern CSS colors in the clone
            const style = clonedDoc.createElement('style');
            style.textContent = `
              * { transition: none !important; animation: none !important; }
              [data-chart] { visibility: visible !important; }
            `;
            clonedDoc.head.appendChild(style);
          }
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.9);
        const margin = 10;
        const imgWidth = pageWidth - (margin * 2);
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        if (i > 0) pdf.addPage();
        
        // Centering vertically if the content is short
        const yPos = imgHeight < (pageHeight - margin * 2) 
          ? (pageHeight - imgHeight) / 2 
          : margin;

        pdf.addImage(imgData, 'JPEG', margin, yPos, imgWidth, Math.min(imgHeight, pageHeight - margin * 2));
      }
      
      const fileName = `Report_${data.reportTitle.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to generate PDF. Check console for details.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string, 400, 400, 0.8);
        setData({ ...data, clientLogo: compressed });
      };
      reader.readAsDataURL(file);
    }
  };

  const addCampaignRow = () => {
    const newRow: CampaignPerformanceRow = {
      id: `cp-${Date.now()}`,
      name: 'New Campaign',
      date: new Date().toISOString().split('T')[0],
      sent: 0,
      opens: 0,
      openRate: 0,
      uniqueOpens: 0,
      uniqueOpenRate: 0,
      linkClicks: 0,
      linkClickRate: 0,
      uniqueClicks: 0,
      uniqueClickRate: 0,
      hardBounces: 0,
      softBounces: 0
    };
    setData({ ...data, campaignsPerformance: [...data.campaignsPerformance, newRow] });
  };

  const removeCampaignRow = (id: string) => {
    setData({ ...data, campaignsPerformance: data.campaignsPerformance.filter(c => c.id !== id) });
  };

  const borderRadiusMap = {
    none: '0',
    sm: '0.125rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    full: '9999px'
  };

  const fontFamilyMap = {
    sans: 'Inter, ui-sans-serif, system-ui',
    serif: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
    mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <Loader2 className="animate-spin text-[#E8B931]" size={48} />
      </div>
    );
  }

  if (view === 'auth' && !isViewerMode) {
    return <AuthPage onSuccess={() => setView('dashboard')} />;
  }

  if (view === 'dashboard' && !isViewerMode) {
    return <Dashboard onNewReport={handleCreateNew} onSelectReport={handleSelectReport} />;
  }

  return (
    <div className="flex h-screen overflow-hidden relative" style={{ backgroundColor: data.themeColor }}>
      {/* Top bar for mobile/desktop layout control */}
      {!isViewerMode && (
        <header className="fixed top-0 left-0 right-0 h-14 border-b border-stone-800 bg-stone-950/80 backdrop-blur-xl flex items-center justify-between px-4 z-50 md:hidden">
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-mustard rounded-lg flex items-center justify-center text-stone-900"><Mail size={16} /></div>
             <p className="text-xs font-black uppercase tracking-tighter text-white">Ajunaidi</p>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            className="w-10 h-10 rounded-lg bg-stone-900 flex items-center justify-center text-mustard border border-stone-800"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </header>
      )}

      {/* Sidebar - Control Panel */}
      <aside 
        id="sidebar-editor" 
        className={cn(
          "w-full md:w-[400px] bg-stone-900 text-white overflow-y-auto border-r border-stone-800 p-6 space-y-6 scrollbar-thin transition-all duration-300 fixed md:relative z-40 h-full pt-20 md:pt-6 shadow-2xl",
          (!isSidebarOpen && !isViewerMode) ? "-translate-x-full md:hidden" : 
          (isViewerMode ? "-translate-x-full lg:hidden" : "translate-x-0")
        )}
      >
        <div className="flex items-center gap-3 p-4 rounded-xl border border-stone-700" style={{ backgroundColor: 'rgba(41, 37, 36, 0.5)' }}>
          <button 
            onClick={() => setView('dashboard')}
            className="w-10 h-10 bg-mustard rounded-xl flex items-center justify-center text-stone-900 border-2" 
            style={{ borderColor: 'rgba(255, 255, 255, 0.2)' }}
            title="Back to Dashboard"
          >
            <LayoutDashboard size={20} />
          </button>
          <div>
            <h1 className="font-bold text-lg leading-tight uppercase tracking-tighter">Ajunaidi</h1>
            <p className="text-[10px] text-stone-400 uppercase tracking-widest font-black">Email Report Builder</p>
          </div>
        </div>

        <Section label="Cloud Storage" icon={<ExternalLink size={14} />}>
           <div className="space-y-3">
             <button 
               onClick={async () => {
                 await handleSaveReport();
                 alert('Report saved to your account successfully!');
               }}
               className="w-full h-12 bg-stone-800 rounded-xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest hover:bg-stone-700 transition-all border border-stone-700"
             >
               <Save size={16} className="text-mustard" />
               Save to Account
             </button>
             <button 
               onClick={() => {
                 alert('Google Drive integration requires an API Key. Please configure GOOGLE_DRIVE_API_KEY in your settings.');
               }}
               className="w-full h-12 bg-white text-stone-950 rounded-xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest hover:bg-stone-50 transition-all shadow-lg"
             >
               <Chrome size={16} className="text-[#4285F4]" />
               Upload to Google Drive
             </button>
           </div>
        </Section>

        {/* User & Sharing Controls */}
        <div className="p-4 rounded-xl border border-stone-700 space-y-3" style={{ backgroundColor: 'rgba(41, 37, 36, 0.8)' }}>
          {user ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-8 h-8 flex-shrink-0 rounded-full bg-mustard flex items-center justify-center text-stone-900 border border-white/20">
                  <UserIcon size={14} />
                </div>
                <div className="overflow-hidden">
                  <p className="text-[10px] font-bold truncate">{user.displayName || user.email}</p>
                  <p className="text-[8px] text-stone-400 uppercase tracking-widest flex items-center gap-1">
                    {isSaving ? <Loader2 size={8} className="animate-spin" /> : <Save size={8} />}
                    {isSaving ? 'Saving...' : 'All changes saved'}
                  </p>
                </div>
              </div>
              <button 
                onClick={handleSignOut} 
                className="p-2 hover:bg-red-500/10 text-stone-500 hover:text-red-500 rounded-lg transition-colors flex-shrink-0"
                title="Sign Out"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button onClick={handleSignIn} className="w-full flex items-center justify-center gap-2 py-2.5 bg-white text-stone-900 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-stone-100 transition-colors">
              <LogIn size={14} /> Sign in to Auto-Save
            </button>
          )}

          <button 
            onClick={handleGenerateShareLink} 
            disabled={isSaving && !copySuccess}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
              copySuccess ? 'bg-green-500 text-white' : 'bg-mustard text-stone-900 hover:bg-mustard/90'
            }`}
          >
            {copySuccess ? <Plus size={14} className="rotate-45" /> : <Share2 size={14} />}
            {copySuccess ? 'Link Copied!' : 'Copy Share Preview Link'}
          </button>

          {reportId && (
            <a 
              href={`${window.location.protocol}//${window.location.host}${window.location.pathname}?reportId=${reportId}&viewer=true`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-stone-800 text-stone-300 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-stone-700 transition-colors border border-stone-700"
            >
              <LinkIcon size={14} /> Open Live Preview
            </a>
          )}
        </div>

        <Section label="Brand Identity" icon={<Palette size={14} />}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[9px] font-bold text-stone-600 uppercase mb-1">Canvas Color</label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={data.themeColor} onChange={(e) => setData({ ...data, themeColor: e.target.value })} className="w-8 h-8 p-1 bg-stone-800 border border-stone-700 rounded-lg cursor-pointer" />
                  <span className="text-[10px] font-mono text-stone-500 uppercase">{data.themeColor}</span>
                </div>
              </div>
              <div>
                <label className="block text-[9px] font-bold text-stone-600 uppercase mb-1">Accent Color</label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={data.accentColor} onChange={(e) => setData({ ...data, accentColor: e.target.value })} className="w-8 h-8 p-1 bg-stone-800 border border-stone-700 rounded-lg cursor-pointer" />
                  <span className="text-[10px] font-mono text-stone-500 uppercase">{data.accentColor}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[9px] font-bold text-stone-600 uppercase mb-1">Card Background</label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={data.cardColor} onChange={(e) => setData({ ...data, cardColor: e.target.value })} className="w-8 h-8 p-1 bg-stone-800 border border-stone-700 rounded-lg cursor-pointer" />
                  <span className="text-[10px] font-mono text-stone-500 uppercase">{data.cardColor}</span>
                </div>
              </div>
              <div>
                <label className="block text-[9px] font-bold text-stone-600 uppercase mb-1">Text Color</label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={data.textColor} onChange={(e) => setData({ ...data, textColor: e.target.value })} className="w-8 h-8 p-1 bg-stone-800 border border-stone-700 rounded-lg cursor-pointer" />
                  <span className="text-[10px] font-mono text-stone-500 uppercase">{data.textColor}</span>
                </div>
              </div>
            </div>
          </div>
        </Section>

        <Section label="Text Colors" icon={<Type size={14} />}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[9px] font-bold text-stone-600 uppercase mb-1">H1 Heading</label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={data.h1Color} onChange={(e) => setData({ ...data, h1Color: e.target.value })} className="w-8 h-8 p-1 bg-stone-800 border border-stone-700 rounded-lg cursor-pointer" />
                </div>
              </div>
              <div>
                <label className="block text-[9px] font-bold text-stone-600 uppercase mb-1">H2 Heading</label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={data.h2Color} onChange={(e) => setData({ ...data, h2Color: e.target.value })} className="w-8 h-8 p-1 bg-stone-800 border border-stone-700 rounded-lg cursor-pointer" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[9px] font-bold text-stone-600 uppercase mb-1">H3 Heading</label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={data.h3Color} onChange={(e) => setData({ ...data, h3Color: e.target.value })} className="w-8 h-8 p-1 bg-stone-800 border border-stone-700 rounded-lg cursor-pointer" />
                </div>
              </div>
              <div>
                <label className="block text-[9px] font-bold text-stone-600 uppercase mb-1">Description</label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={data.descColor} onChange={(e) => setData({ ...data, descColor: e.target.value })} className="w-8 h-8 p-1 bg-stone-800 border border-stone-700 rounded-lg cursor-pointer" />
                </div>
              </div>
            </div>
          </div>
        </Section>

        <Section label="Layout & Corner" icon={<Maximize2 size={14} />}>
          <div className="space-y-4">
            <div>
              <label className="block text-[9px] font-bold text-stone-600 uppercase mb-1">Typography Style</label>
              <select 
                value={data.fontFamily} 
                onChange={(e) => setData({ ...data, fontFamily: e.target.value as any })}
                className="w-full bg-stone-800 border border-stone-700 rounded-lg h-10 px-3 text-xs text-white outline-none focus:ring-1 focus:ring-mustard"
              >
                <option value="sans">Modern (Sans-Serif)</option>
                <option value="serif">Elegant (Serif)</option>
                <option value="mono">Technical (Monospace)</option>
              </select>
            </div>

            <div>
              <label className="block text-[9px] font-bold text-stone-600 uppercase mb-1">Corner Rounding</label>
              <select 
                value={data.borderRadius} 
                onChange={(e) => setData({ ...data, borderRadius: e.target.value as any })}
                className="w-full bg-stone-800 border border-stone-700 rounded-lg h-10 px-3 text-xs text-white outline-none focus:ring-1 focus:ring-mustard"
              >
                <option value="none">Sharp (None)</option>
                <option value="sm">Subtle (SM)</option>
                <option value="md">Balanced (MD)</option>
                <option value="lg">Soft (LG)</option>
                <option value="xl">Rounded (XL)</option>
                <option value="2xl">Extra Rounded (2XL)</option>
                <option value="full">Pill (Full)</option>
              </select>
            </div>
          </div>
        </Section>

        <Section label="Brand Assets" icon={<Image size={14} />}>
              <label className="flex items-center gap-2 cursor-pointer bg-stone-800 border border-stone-700 rounded-lg p-3 hover:bg-stone-700 transition-all">
                <Image size={14} className="text-mustard" />
                <span className="text-xs text-stone-300 font-bold">{data.clientLogo ? 'Update Logo' : 'Upload Logo'}</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              </label>
              {data.clientLogo && (
                <div className="mt-3 relative group w-fit mx-auto">
                  <div className="bg-white rounded-lg p-2 border border-stone-700 shadow-xl overflow-hidden">
                    <img src={data.clientLogo} className="max-h-24 object-contain" />
                  </div>
                  <button 
                    onClick={() => setData({ ...data, clientLogo: "" })}
                    className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1.5 shadow-2xl opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              )}
        </Section>

        <Section label="Chart Image Replacements" icon={<Image size={14} />}>
           <p className="text-[9px] text-stone-500 mb-3 uppercase font-black px-1 tracking-tighter">Replace dynamic charts with static images</p>
           <div className="space-y-4">
             <ImageUploader label="Growth Chart" value={data.growthChartImage} onUpload={(url) => setData({...data, growthChartImage: url})} onClear={() => setData({...data, growthChartImage: ""})} />
             <ImageUploader label="Distribution Chart" value={data.distributionChartImage} onUpload={(url) => setData({...data, distributionChartImage: url})} onClear={() => setData({...data, distributionChartImage: ""})} />
             <ImageUploader label="Sent vs Opens Chart" value={data.sentOpensChartImage} onUpload={(url) => setData({...data, sentOpensChartImage: url})} onClear={() => setData({...data, sentOpensChartImage: ""})} />
             <ImageUploader label="Funnel Chart" value={data.funnelChartImage} onUpload={(url) => setData({...data, funnelChartImage: url})} onClear={() => setData({...data, funnelChartImage: ""})} />
             <ImageUploader label="Engagement Trend Chart" value={data.engagementTrendChartImage} onUpload={(url) => setData({...data, engagementTrendChartImage: url})} onClear={() => setData({...data, engagementTrendChartImage: ""})} />
           </div>
        </Section>

        <Section label="Graphic Elements" icon={<Palette size={14} />}>
          <p className="text-[10px] text-stone-500 mb-4 px-1 uppercase font-black tracking-tighter italic">Floating sticks, shapes, grass or icons</p>
          <div className="space-y-4">
             {/* Icons / "Grass" */}
             <div className="grid grid-cols-4 gap-2 mb-4">
               {[
                 { id: 'sprout', icon: Sprout, label: 'Grass' },
                 { id: 'leaf', icon: Leaf, label: 'Leaf' },
                 { id: 'star', icon: Star, label: 'Star' },
                 { id: 'heart', icon: Heart, label: 'Heart' },
               ].map(item => (
                 <button 
                   key={item.id}
                   onClick={() => {
                     const newEl: FloatingElement = { id: `fe-${Date.now()}`, type: 'icon', content: item.id, top: 200, left: 200, width: 40, height: 40, zIndex: 10, color: '#22c55e' };
                     setData({...data, floatingElements: [...(data.floatingElements || []), newEl]});
                   }}
                   className="flex flex-col items-center justify-center p-2 bg-stone-800 rounded-lg border border-stone-700 hover:border-mustard transition-all group"
                 >
                   <item.icon size={16} className="text-stone-400 group-hover:text-mustard" />
                   <span className="text-[8px] font-black uppercase mt-1 text-stone-600">{item.label}</span>
                 </button>
               ))}
             </div>

            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => {
                  const newEl: FloatingElement = { id: `fe-${Date.now()}`, type: 'shape', content: 'circle', top: 100, left: 100, width: 100, height: 100, zIndex: 1, opacity: 0.5 };
                  setData({...data, floatingElements: [...(data.floatingElements || []), newEl]});
                }}
                className="py-2 bg-stone-800 border border-stone-700 rounded-lg text-white text-[9px] font-black uppercase tracking-widest hover:border-mustard transition-all"
              >
                + Circle
              </button>
              <button 
                onClick={() => {
                  const newEl: FloatingElement = { id: `fe-${Date.now()}`, type: 'shape', content: 'square', top: 120, left: 120, width: 100, height: 100, zIndex: 1, opacity: 0.5 };
                  setData({...data, floatingElements: [...(data.floatingElements || []), newEl]});
                }}
                className="py-2 bg-stone-800 border border-stone-700 rounded-lg text-white text-[9px] font-black uppercase tracking-widest hover:border-mustard transition-all"
              >
                + Square
              </button>
              <button 
                onClick={() => {
                  const newEl: FloatingElement = { id: `fe-${Date.now()}`, type: 'icon', content: 'triangle', top: 140, left: 140, width: 80, height: 80, zIndex: 1, opacity: 0.5, color: '#E8B931' };
                  setData({...data, floatingElements: [...(data.floatingElements || []), newEl]});
                }}
                className="py-2 bg-stone-800 border border-stone-700 rounded-lg text-white text-[9px] font-black uppercase tracking-widest hover:border-mustard transition-all"
              >
                + Triangle
              </button>
            </div>
            
            <ImageUploader 
              label="Add Floating Image" 
              value="" 
              onUpload={(url) => {
                const newEl: FloatingElement = { id: `fe-${Date.now()}`, type: 'image', content: url, top: 150, left: 150, width: 200, height: 200, zIndex: 5 };
                setData({...data, floatingElements: [...(data.floatingElements || []), newEl]});
              }} 
              onClear={() => {}}
            />

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {(data.floatingElements || []).map((el, i) => (
                <div key={el.id} className="p-2 bg-stone-900 border border-stone-800 rounded-lg flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-stone-800 rounded flex items-center justify-center text-[10px] text-mustard font-black">
                      {i + 1}
                    </div>
                    <span className="text-[10px] text-stone-400 uppercase font-bold">{el.type}</span>
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => {
                        const copy = [...(data.floatingElements || [])];
                        // change z-index or something?
                        copy[i] = { ...el, zIndex: (el.zIndex || 0) + 1 };
                        setData({...data, floatingElements: copy});
                      }}
                      title="Bring Forward"
                      className="text-stone-500 hover:text-white"
                    >
                      <ChevronUp size={12} />
                    </button>
                    <button 
                      onClick={() => {
                        const copy = [...(data.floatingElements || [])];
                        copy.splice(i, 1);
                        setData({...data, floatingElements: copy});
                      }}
                      className="text-stone-500 hover:text-red-500"
                    >
                      <Trash size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Section>

        <Section label="Section Management" icon={<Maximize2 size={14} />}>
          <p className="text-[10px] text-stone-500 mb-4 px-1 uppercase font-black tracking-tighter">Adjust background images for each page</p>
          <div className="space-y-4">
            {(data.sections || []).map((section, idx) => (
              <div key={section.id} className="p-3 bg-stone-800 rounded-lg border border-stone-700 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase text-stone-500">Page {idx + 1}: {section.type}</span>
                </div>
                <ImageUploader 
                  label="Background Image" 
                  value={section.bgImage} 
                  onUpload={(url) => {
                    const copy = [...(data.sections || [])];
                    copy[idx] = { ...copy[idx], bgImage: url };
                    setData({...data, sections: copy});
                  }} 
                  onClear={() => {
                    const copy = [...(data.sections || [])];
                    copy[idx] = { ...copy[idx], bgImage: "" };
                    setData({...data, sections: copy});
                  }} 
                />
              </div>
            ))}
          </div>
        </Section>

        <Section label="Hero Section Stats" icon={<Telescope size={14} />}>
          <div className="space-y-4">
            {(data.heroStats || []).map((stat, idx) => (
              <div key={stat.id} className="p-3 bg-stone-800 rounded-lg border border-stone-700 space-y-2 relative group-item">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase text-stone-500">Stat {idx + 1}</span>
                  <button 
                    onClick={() => {
                      const copy = [...(data.heroStats || [])];
                      copy.splice(idx, 1);
                      setData({...data, heroStats: copy});
                    }}
                    className="text-stone-500 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
                <Input label="Value" value={stat.value} onChange={(v) => {
                  const copy = [...(data.heroStats || [])];
                  copy[idx].value = v;
                  setData({...data, heroStats: copy});
                }} />
                <Input label="Label" value={stat.label} onChange={(v) => {
                  const copy = [...(data.heroStats || [])];
                  copy[idx].label = v;
                  setData({...data, heroStats: copy});
                }} />
                <Input label="Sub-label" value={stat.subLabel} onChange={(v) => {
                  const copy = [...(data.heroStats || [])];
                  copy[idx].subLabel = v;
                  setData({...data, heroStats: copy});
                }} />
                <div>
                  <label className="block text-[9px] font-bold text-stone-600 uppercase mb-1">Icon</label>
                  <select 
                    value={stat.iconName} 
                    onChange={e => {
                      const copy = [...(data.heroStats || [])];
                      copy[idx].iconName = e.target.value;
                      setData({...data, heroStats: copy});
                    }}
                    className="w-full bg-stone-900 border border-stone-700 rounded h-8 px-2 text-[10px] text-white outline-none"
                  >
                    {Object.keys(ICON_MAP).map(icon => (
                      <option key={icon} value={icon}>{icon}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
            <button 
              onClick={() => {
                const newStat = { id: `hs-${Date.now()}`, label: 'New Stat', value: '0', subLabel: 'Description', iconName: 'TrendingUp' };
                setData({...data, heroStats: [...(data.heroStats || []), newStat]});
              }}
              className="w-full flex items-center justify-center gap-2 py-2 border border-dashed border-stone-700 rounded-lg text-stone-500 hover:text-mustard hover:border-mustard transition-all text-[10px] font-black uppercase tracking-widest"
            >
              <Plus size={14} /> Add Hero Stat
            </button>
          </div>
        </Section>

        <Section label="1. Project Basics" icon={<Settings2 size={14} />}>
          <Input label="Report Title" value={data.reportTitle} onChange={(v: string) => setData({...data, reportTitle: v})} />
          <Input label="Date Period" value={data.datePeriod} onChange={(v: string) => setData({...data, datePeriod: v})} />
        </Section>

        <Section label="2 & 3. Goals & Lists" icon={<Filter size={14} />}>
           <p className="text-[9px] text-stone-500 mb-2 uppercase font-black px-1 tracking-tighter">Deals and Contacts Goals</p>
           <div className="grid grid-cols-2 gap-2 mb-4">
              <Input label="Contacts Goal" type="number" value={data.conversionGoal} onChange={(v: string) => setData({...data, conversionGoal: Number(v)})} />
              <Input label="Contacts Actual" type="number" value={data.conversionCount} onChange={(v: string) => setData({...data, conversionCount: Number(v)})} />
              <Input label="Deals Goal" type="number" value={data.dealsGoal} onChange={(v: string) => setData({...data, dealsGoal: Number(v)})} />
              <Input label="Deals Actual" type="number" value={data.dealsCount} onChange={(v: string) => setData({...data, dealsCount: Number(v)})} />
           </div>
           <p className="text-[9px] text-stone-500 mb-2 uppercase font-black px-1 tracking-tighter">Account List Totals</p>
           <div className="grid grid-cols-2 gap-2">
              <Input label="Total Contacts" type="number" value={data.listContacts} onChange={(v: string) => setData({...data, listContacts: Number(v)})} />
              <Input label="Total Deals" type="number" value={data.listDeals} onChange={(v: string) => setData({...data, listDeals: Number(v)})} />
           </div>
        </Section>

        <Section label="4 & 5. Analysis" icon={<MessageSquare size={14} />}>
          <div className="space-y-4">
            <div>
              <label className="block text-[9px] font-bold text-stone-600 uppercase mb-1 tracking-wider">Executive Summary</label>
              <textarea 
                value={data.summary} 
                onChange={e => setData({...data, summary: e.target.value})} 
                className="w-full bg-stone-800 border border-stone-700 rounded-lg p-3 text-xs focus:ring-1 focus:ring-mustard outline-none transition-all text-white h-28 leading-relaxed"
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-stone-600 uppercase mb-1 tracking-wider">Key Recommendations</label>
              <textarea 
                value={data.recommendations.join('\n')} 
                onChange={e => setData({...data, recommendations: e.target.value.split('\n')})} 
                className="w-full bg-stone-800 border border-stone-700 rounded-lg p-3 text-xs focus:ring-1 focus:ring-mustard outline-none transition-all text-white h-28 leading-relaxed placeholder:text-stone-600"
                placeholder="Enter one recommendation per line..."
              />
            </div>
          </div>
        </Section>

        <Section label="6, 7 & 8. Top Metrics" icon={<TrendingUp size={14} />}>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <Input label="Contact Count" type="number" value={data.contactCount} onChange={(v: string) => setData({...data, contactCount: Number(v)})} />
            <Input label="Deal Count" type="number" value={data.dealCount} onChange={(v: string) => setData({...data, dealCount: Number(v)})} />
          </div>
          <Input label="Deals Value ($)" type="number" value={data.dealsValue} onChange={(v: string) => setData({...data, dealsValue: Number(v)})} />
        </Section>

        <Section label="9 & 10. Growth Data" icon={<Briefcase size={14} />}>
           <Input label="Chart Labels (comma sep)" value={data.growthLabels.join(', ')} onChange={(v: string) => setData({...data, growthLabels: v.split(',').map(s => s.trim())})} />
           <Input label="Contact Growth Values" value={data.growthContacts.join(', ')} onChange={(v: string) => setData({...data, growthContacts: v.split(',').map(s => Number(s.trim()))})} />
           <Input label="Deal Growth Values" value={data.growthDeals.join(', ')} onChange={(v: string) => setData({...data, growthDeals: v.split(',').map(s => Number(s.trim()))})} />
        </Section>

        <Section label="11. Deals Breakdown" icon={<TrendingUp size={14} />}>
           <div className="space-y-2">
            {data.dealSources.map((s, idx) => (
              <div key={s.id} className="flex gap-1 items-center p-2 rounded-lg border border-stone-800" style={{ backgroundColor: 'rgba(41, 37, 36, 0.5)' }}>
                  <input className="flex-1 bg-stone-900 border-none rounded h-7 px-2 text-[10px] focus:ring-1 focus:ring-mustard" value={s.source} onChange={e => {
                    const copy = [...data.dealSources];
                    copy[idx].source = e.target.value;
                    setData({...data, dealSources: copy});
                  }} />
                  <input className="w-20 bg-stone-900 border-none rounded h-7 px-2 text-[10px] focus:ring-1 focus:ring-mustard" type="number" value={s.value} onChange={e => {
                    const copy = [...data.dealSources];
                    copy[idx].value = Number(e.target.value);
                    setData({...data, dealSources: copy});
                  }} />
              </div>
            ))}
           </div>
        </Section>

        <Section label="Add Report Sections" icon={<Plus size={14} />}>
           <div className="grid grid-cols-2 gap-2">
              {[
                { type: 'cover', label: 'Cover' },
                { type: 'overview', label: 'Overview' },
                { type: 'goals', label: 'Goals' },
                { type: 'growth', label: 'Growth' },
                { type: 'deals', label: 'Deals List' },
                { type: 'metrics', label: 'Metrics Grid' },
                { type: 'trends', label: 'Trends' },
                { type: 'funnel', label: 'Funnel' },
                { type: 'table', label: 'DataTable' },
                { type: 'footer', label: 'Footer' },
              ].map((btn) => (
                <button 
                  key={btn.type}
                  onClick={() => addSection(btn.type as any)}
                  className="flex items-center gap-2 py-2 px-3 bg-stone-800 hover:bg-mustard hover:text-stone-950 transition-all rounded-lg text-[10px] font-black uppercase tracking-tight text-stone-400 text-left"
                >
                  <Plus size={12} className="flex-shrink-0" /> {btn.label}
                </button>
              ))}
           </div>
        </Section>

        <Section label="12 & 13. Engagement Summary" icon={<Mail size={14} />}>
           <div className="grid grid-cols-2 gap-2 mb-4">
              <Input label="Emails Sent Goal" type="number" value={data.emailsSentGoal} onChange={(v: string) => setData({...data, emailsSentGoal: Number(v)})} />
              <Input label="Emails Sent Actual" type="number" value={data.actualSent} onChange={(v: string) => setData({...data, actualSent: Number(v)})} />
              <Input label="Opened Goal" type="number" value={data.emailsOpenedGoal} onChange={(v: string) => setData({...data, emailsOpenedGoal: Number(v)})} />
              <Input label="Opened Actual" type="number" value={data.actualOpens} onChange={(v: string) => setData({...data, actualOpens: Number(v)})} />
              <Input label="Click Goal" type="number" value={data.linkClicksGoal} onChange={(v: string) => setData({...data, linkClicksGoal: Number(v)})} />
              <Input label="Click Actual" type="number" value={data.actualClicks} onChange={(v: string) => setData({...data, actualClicks: Number(v)})} />
           </div>
           <Input label="Total Campaign Replies" type="number" value={data.actualReplies} onChange={(v: string) => setData({...data, actualReplies: Number(v)})} />
        </Section>

        <Section label="14, 15 & 16. Fast Metrics" icon={<ExternalLink size={14} />}>
           <div className="grid grid-cols-2 gap-2">
              <Input label="Metric: Emails Sent" type="number" value={data.metricsEmailsSent} onChange={(v: string) => setData({...data, metricsEmailsSent: Number(v)})} />
              <Input label="Metric: Opens" type="number" value={data.metricsOpens} onChange={(v: string) => setData({...data, metricsOpens: Number(v)})} />
              <Input label="Metric: Open Rate %" value={data.metricsOpenRate} onChange={(v: string) => setData({...data, metricsOpenRate: v})} />
           </div>
        </Section>

        <Section label="17, 18 & 19. Trends & Clicks" icon={<TrendingUp size={14} />}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <Input label="Sent Trend Values" value={data.sentTrend.join(', ')} onChange={(v: string) => setData({...data, sentTrend: v.split(',').map(s => Number(s.trim()))})} />
                <Input label="Opens Trend Values" value={data.opensTrend.join(', ')} onChange={(v: string) => setData({...data, opensTrend: v.split(',').map(s => Number(s.trim()))})} />
              </div>
              <div className="grid grid-cols-2 gap-2 border-t border-stone-800 pt-3">
                <Input label="Total Link Clicks" type="number" value={data.linkClicksTotal} onChange={(v: string) => setData({...data, linkClicksTotal: Number(v)})} />
                <Input label="Click Rate %" value={data.linkClickRateStr} onChange={(v: string) => setData({...data, linkClickRateStr: v})} />
              </div>
            </div>
        </Section>

        <Section label="20. Conversion Funnel" icon={<Filter size={14} />}>
           <div className="grid grid-cols-3 gap-2">
              <Input label="Funnel: Sent" type="number" value={data.funnelSent} onChange={(v: string) => setData({...data, funnelSent: Number(v)})} />
              <Input label="Funnel: Opens" type="number" value={data.funnelOpened} onChange={(v: string) => setData({...data, funnelOpened: Number(v)})} />
              <Input label="Funnel: Clicks" type="number" value={data.funnelClicked} onChange={(v: string) => setData({...data, funnelClicked: Number(v)})} />
           </div>
        </Section>

        <Section label="21, 22, 23 & 24. Final Stats" icon={<TrendingUp size={14} />}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <Input label="Engmt: Opens" value={data.engagementOpensTrend.join(', ')} onChange={(v: string) => setData({...data, engagementOpensTrend: v.split(',').map(s => Number(s.trim()))})} />
                <Input label="Engmt: Clicks" value={data.engagementClicksTrend.join(', ')} onChange={(v: string) => setData({...data, engagementClicksTrend: v.split(',').map(s => Number(s.trim()))})} />
              </div>
              <div className="grid grid-cols-3 gap-2 border-t border-stone-800 pt-3">
                <Input label="Unsubs" type="number" value={data.unsubscribes} onChange={(v: string) => setData({...data, unsubscribes: Number(v)})} />
                <Input label="Unsub %" value={data.unsubscribeRateStr} onChange={(v: string) => setData({...data, unsubscribeRateStr: v})} />
                <Input label="Reply Total" type="number" value={data.repliesTotal} onChange={(v: string) => setData({...data, repliesTotal: Number(v)})} />
              </div>
            </div>
        </Section>

        <Section label="25. Campaign Performance Rows" icon={<BarChart3 size={14} />}>
           <div className="space-y-4">
              {data.campaignsPerformance.map((camp, idx) => (
                <div key={camp.id} className="bg-stone-800 p-4 rounded-xl border border-stone-700 relative shadow-inner">
                  <button 
                    onClick={() => removeCampaignRow(camp.id)}
                    className="absolute -top-3 -right-3 bg-red-600 rounded-full p-2 shadow-2xl hover:bg-red-700 transition-all z-10 border-2 border-stone-900"
                  >
                    <Trash2 size={12} className="text-white" />
                  </button>
                  <Input label="Campaign Label" value={camp.name} onChange={(v: string) => {
                    const copy = [...data.campaignsPerformance];
                    copy[idx].name = v;
                    setData({...data, campaignsPerformance: copy});
                  }} />
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <Input label="Total Sent" type="number" value={camp.sent} onChange={(v: string) => {
                      const copy = [...data.campaignsPerformance];
                      copy[idx].sent = Number(v);
                      setData({...data, campaignsPerformance: copy});
                    }} />
                    <Input label="Total Opens" type="number" value={camp.opens} onChange={(v: string) => {
                      const copy = [...data.campaignsPerformance];
                      copy[idx].opens = Number(v);
                      setData({...data, campaignsPerformance: copy});
                    }} />
                    <Input label="Open Rate %" type="number" value={camp.openRate} onChange={(v: string) => {
                      const copy = [...data.campaignsPerformance];
                      copy[idx].openRate = Number(v);
                      setData({...data, campaignsPerformance: copy});
                    }} />
                    <Input label="Unique Opens" type="number" value={camp.uniqueOpens} onChange={(v: string) => {
                      const copy = [...data.campaignsPerformance];
                      copy[idx].uniqueOpens = Number(v);
                      setData({...data, campaignsPerformance: copy});
                    }} />
                    <Input label="Unique Open Rate %" type="number" value={camp.uniqueOpenRate} onChange={(v: string) => {
                      const copy = [...data.campaignsPerformance];
                      copy[idx].uniqueOpenRate = Number(v);
                      setData({...data, campaignsPerformance: copy});
                    }} />
                    <Input label="Links Clicked" type="number" value={camp.linkClicks} onChange={(v: string) => {
                      const copy = [...data.campaignsPerformance];
                      copy[idx].linkClicks = Number(v);
                      setData({...data, campaignsPerformance: copy});
                    }} />
                    <Input label="Link Click Rate %" type="number" value={camp.linkClickRate} onChange={(v: string) => {
                      const copy = [...data.campaignsPerformance];
                      copy[idx].linkClickRate = Number(v);
                      setData({...data, campaignsPerformance: copy});
                    }} />
                    <Input label="Unique Clicks" type="number" value={camp.uniqueClicks} onChange={(v: string) => {
                      const copy = [...data.campaignsPerformance];
                      copy[idx].uniqueClicks = Number(v);
                      setData({...data, campaignsPerformance: copy});
                    }} />
                    <Input label="Unique Click Rate %" type="number" value={camp.uniqueClickRate} onChange={(v: string) => {
                      const copy = [...data.campaignsPerformance];
                      copy[idx].uniqueClickRate = Number(v);
                      setData({...data, campaignsPerformance: copy});
                    }} />
                    <Input label="Hard Bounces" type="number" value={camp.hardBounces} onChange={(v: string) => {
                      const copy = [...data.campaignsPerformance];
                      copy[idx].hardBounces = Number(v);
                      setData({...data, campaignsPerformance: copy});
                    }} />
                    <Input label="Soft Bounces" type="number" value={camp.softBounces} onChange={(v: string) => {
                      const copy = [...data.campaignsPerformance];
                      copy[idx].softBounces = Number(v);
                      setData({...data, campaignsPerformance: copy});
                    }} />
                  </div>
                </div>
              ))}
              <button 
                onClick={addCampaignRow}
                className="w-full flex items-center justify-center gap-3 py-4 border-2 border-dashed border-stone-700 rounded-xl text-stone-500 hover:text-mustard hover:border-mustard hover:bg-stone-800/20 transition-all text-xs font-black uppercase tracking-tighter"
              >
                <Plus size={16} /> New Campaign Performance Row
              </button>
           </div>
        </Section>

        <div className="pt-8 pb-32 space-y-4">
           <button onClick={handleDownloadPDF} className="w-full flex items-center justify-center gap-3 py-4 bg-stone-100 text-stone-900 rounded-xl hover:bg-white transition-all font-black uppercase tracking-tight shadow-xl group">
             <FileText size={18} className="group-hover:text-red-600 transition-colors" /> Save as Professional PDF
           </button>
           <button onClick={handleDownloadHTML} className="w-full flex items-center justify-center gap-3 py-4 bg-mustard text-stone-900 rounded-xl hover:opacity-90 transition-all font-black uppercase tracking-tight shadow-xl group">
             <Download size={18} className="group-hover:scale-110 transition-transform" /> Save as Web Format (HTML)
           </button>
        </div>
      </aside>

      {/* Main Preview Area */}
      <main className="flex-1 overflow-y-auto px-4 pt-20 pb-40 md:py-8 md:px-12 scroll-smooth relative bg-slate-50">
        {/* Mobile Sidebar Toggle */}
        {!isViewerMode && (
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="fixed bottom-6 right-6 z-50 md:hidden w-14 h-14 bg-stone-900 text-mustard rounded-full shadow-2xl flex items-center justify-center border border-stone-700"
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        )}

        {isLoading && (
          <div className="absolute inset-0 bg-stone-900/10 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-4">
              <Loader2 className="animate-spin text-mustard" size={40} />
              <p className="font-bold text-stone-800 uppercase tracking-widest text-xs">Loading Shared Report...</p>
            </div>
          </div>
        )}

        {/* Empty state for clean viewer mode spacing */}
        {isViewerMode && <div className="h-8" />}
        
        <div 
          ref={reportRef} 
          id="report-preview-area"
          className="max-w-[1100px] mx-auto space-y-24 bg-[#E8B931] p-12 overflow-hidden shadow-2xl"
          style={{
            fontFamily: "'Inter', sans-serif",
            lineHeight: '1.25'
          } as React.CSSProperties}
        >
          {/* DYNAMIC SECTIONS */}
          {data.sections.map((section, idx) => (
            <React.Fragment key={section.id}>
              {renderSection(section, idx)}
            </React.Fragment>
          ))}

        </div>

        <footer className="mt-12 text-center pb-12">
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
            app bottom show allright, reserved by Ajunaidi 2026
          </p>
        </footer>

      </main>
    </div>
  );
}

// Sidebar Helpers
function BentoCard({ children, className, ...props }: { children: React.ReactNode, className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props} className={cn("bg-white rounded-[40px] shadow-sm p-10 transition-all duration-300 border-none", className)}>
      {children}
    </div>
  );
}

function MetricRowProgress({ label, val, max, color }: { label: string, val: number, max: number, color: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs font-black mb-3">
        <span className="text-stone-400 uppercase tracking-widest">{label}</span>
        <span className="text-stone-950 underline decoration-4 decoration-stone-200">{formatNumber(val)} / {formatNumber(max)}</span>
      </div>
      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${(val / max) * 100}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function IconMetricRow({ icon, label, val }: { icon: React.ReactNode, label: string, val: number }) {
  return (
    <div className="flex items-center justify-between p-6 bg-slate-50 rounded-[32px] group hover:bg-white hover:shadow-lg transition-all">
       <div className="flex items-center gap-4 text-stone-500 font-bold">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-stone-400 shadow-sm">{icon}</div>
          {label}
       </div>
       <span className="text-2xl font-black text-stone-950">{formatNumber(val)}</span>
    </div>
  );
}

function Section({ label, icon, children }: any) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3 border-b border-stone-800 pb-1">
        <span className="text-mustard font-bold">{icon}</span>
        <h3 className="text-[10px] font-black uppercase tracking-widest text-stone-400">{label}</h3>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Input({ label, value, onChange, type = 'text' }: any) {
  return (
    <div>
      <label className="block text-[9px] font-black text-stone-600 uppercase mb-1 tracking-tighter">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} className="w-full bg-stone-800 border border-stone-700 rounded-lg h-10 px-3 text-xs focus:ring-1 focus:ring-mustard outline-none transition-all text-white placeholder:text-stone-600" />
    </div>
  );
}

function MiniProgress({ label, val, max, color }: any) {
  return (
    <div>
      <div className="flex justify-between text-[10px] font-bold mb-1">
        <span className="text-stone-500 uppercase tracking-tight">{label}</span>
        <span className="text-stone-800">{formatNumber(val)} / {formatNumber(max)}</span>
      </div>
      <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(245, 245, 244, 0.5)' }}>
        <div className={`h-full`} style={{ width: `${(val / max) * 100}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function MetricRow({ icon, label, val }: any) {
  return (
    <div className="flex items-center justify-between text-xs font-bold border-b border-stone-50 pb-2">
       <div className="flex items-center gap-2 text-stone-500">{icon} {label}</div>
       <span className="text-stone-800">{formatNumber(val)}</span>
    </div>
  );
}

function ImageUploader({ label, value, onUpload, onClear }: { label: string, value?: string, onUpload: (url: string) => void, onClear: () => void }) {
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string, 800, 800, 0.6);
        onUpload(compressed);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-[9px] font-black text-stone-600 uppercase tracking-tighter">{label}</label>
      {value ? (
        <div className="relative group w-full bg-stone-950 rounded-lg p-2 border border-stone-800">
          <img src={value} className="h-20 w-full object-contain mx-auto" />
          <button 
            onClick={onClear}
            className="absolute top-1 right-1 bg-red-600 rounded-full p-1 shadow-lg hover:bg-red-700 transition-all border border-stone-900"
          >
            <Trash2 size={10} className="text-white" />
          </button>
        </div>
      ) : (
        <label className="flex items-center justify-center gap-2 cursor-pointer bg-stone-800 border border-stone-700 rounded-lg h-10 hover:bg-stone-700 transition-all group">
          <Plus size={14} className="text-stone-500 group-hover:text-mustard" />
          <span className="text-[10px] text-stone-400 font-bold uppercase">Upload Chart Image</span>
          <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </label>
      )}
    </div>
  );
}
