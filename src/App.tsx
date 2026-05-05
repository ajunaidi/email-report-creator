/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  BarChart3, Users, Mail, TrendingUp, MousePointerClick, 
  LogOut, MessageSquare, Download, Settings2, Briefcase, ExternalLink, Filter, Plus, Trash2, Palette, Image, Type, Maximize2, FileText, Info,
  Share2, LogIn, User as UserIcon, Loader2, Save, Menu, X, Link as LinkIcon, Telescope, Calendar as CalendarIcon, Copy, Trash, PieChart as PieChartIcon, ChevronUp, ChevronDown, LayoutDashboard, Chrome,
  Sprout, Leaf, Star, Heart, Triangle, Zap, Award, Smile, Square, Minus, ArrowRight, Layers,
  ChevronRight, ChevronLeft, Hash,
  Monitor, Redo2, Undo2, CloudCheck, Search, Globe, Box, Grid3X3, Wand2, UploadCloud, FolderHeart, LayoutTemplate
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { cn } from './lib/utils';
import { compressImage, fileToBase64 } from './lib/imageUtils';
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
import { saveReport, getReport, deleteReport } from './services/reportService';

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

function SectionWrapper({ children, onDuplicate, onRemove, onMoveUp, onMoveDown, isFirst, isLast, isViewer, id, bgImage, isActive, onClick }: { children: React.ReactNode, onDuplicate: () => void, onRemove: () => void, onMoveUp: () => void, onMoveDown: () => void, isFirst: boolean, isLast: boolean, isViewer?: boolean, id?: string, bgImage?: string, isActive?: boolean, onClick?: () => void }) {
  return (
    <div 
      id={id} 
      onClick={onClick}
      className={cn(
        "relative group/section print:break-after-page mb-16 print:mb-0 min-h-[500px] transition-all",
        !isViewer && "cursor-pointer rounded-2xl",
        !isViewer && isActive && "ring-4 ring-mustard/30 ring-offset-8 ring-offset-transparent shadow-2xl"
      )}
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

function FloatingElementComponent({ element, onChange, onRemove, onSelect, isSelected, isViewer }: { element: FloatingElement, onChange: (el: FloatingElement) => void, onRemove: () => void, onSelect: () => void, isSelected: boolean, isViewer?: boolean }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [startSize, setStartSize] = useState({ w: 0, h: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isViewer) return;
    onSelect();
    setIsDragging(true);
    setStartPos({ x: e.clientX, y: e.clientY });
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    setStartPos({ x: e.clientX, y: e.clientY });
    setStartSize({ w: element.width, h: element.height });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const dx = e.clientX - startPos.x;
        const dy = e.clientY - startPos.y;
        onChange({
          ...element,
          left: element.left + dx,
          top: element.top + dy
        });
        setStartPos({ x: e.clientX, y: e.clientY });
      } else if (isResizing) {
        const dx = e.clientX - startPos.x;
        const dy = e.clientY - startPos.y;
        onChange({
          ...element,
          width: Math.max(20, startSize.w + dx),
          height: Math.max(20, startSize.h + dy)
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, startPos, startSize, element, onChange]);

  return (
    <div 
      className={cn(
        "absolute cursor-move select-none group/floating",
        (isDragging || isSelected) && "z-50 ring-2 ring-[#E8B931] ring-offset-2",
        isSelected && "z-50"
      )}
      style={{
        top: `${element.top}px`,
        left: `${element.left}px`,
        width: `${element.width}px`,
        height: `${element.height}px`,
        zIndex: element.zIndex,
        transform: `rotate(${element.rotation || 0}deg)`,
        opacity: element.opacity ?? 1,
        boxShadow: element.shadow ? '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' : 'none'
      }}
      onMouseDown={handleMouseDown}
    >
      {element.type === 'image' ? (
        <img src={element.content} referrerPolicy="no-referrer" className="w-full h-full object-cover shadow-xl" style={{ borderRadius: `${element.borderRadius || 8}px` }} alt="" draggable={false} />
      ) : element.type === 'icon' ? (
        <div className="w-full h-full flex items-center justify-center pointer-events-none" style={{ color: element.color || '#E8B931' }}>
          {React.createElement(
            element.content === 'sprout' ? Sprout :
            element.content === 'leaf' ? Leaf :
            element.content === 'star' ? Star :
            element.content === 'heart' ? Heart :
            element.content === 'triangle' ? Triangle :
            element.content === 'zap' ? Zap :
            element.content === 'award' ? Award :
            element.content === 'smile' ? Smile :
            element.content === 'arrow' ? ArrowRight :
            element.content === 'square' ? Square :
            element.content === 'minus' ? Minus : Heart,
            { size: Math.min(element.width, element.height), strokeWidth: element.strokeWidth || 2 }
          )}
        </div>
      ) : element.type === 'text' ? (
        <div 
          className="w-full h-full flex items-center justify-center"
          style={{ 
            color: element.color || '#000000', 
            fontSize: `${element.fontSize || 16}px`,
            fontWeight: element.fontWeight || 'bold',
            fontFamily: element.fontFamily || "'Inter', sans-serif",
            textAlign: (element.textAlign || 'center') as any,
            letterSpacing: `${element.letterSpacing || 0}px`,
            lineHeight: element.lineHeight || 1.2,
            fontStyle: element.fontStyle || 'normal',
            textDecoration: element.textDecoration || 'none',
            borderRadius: `${element.borderRadius || 0}px`,
            padding: `${element.padding || 8}px`,
            backgroundColor: element.borderColor ? element.borderColor : 'transparent',
            textShadow: element.textShadow || 'none',
            WebkitTextStroke: element.outlineWidth ? `${element.outlineWidth}px ${element.outlineColor || '#000'}` : 'none'
          }}
        >
          {element.content}
        </div>
      ) : element.type === 'chart' ? (
        <div className="w-full h-full p-2 bg-white rounded-xl shadow-inner border border-stone-100 overflow-hidden">
          <ResponsiveContainer width="100%" height="100%">
            {element.content === 'pie' ? (
               <PieChart>
                 <Pie data={[{value: 40}, {value: 60}]} dataKey="value" stroke="none">
                    <Cell fill={element.color || "#ef4444"} />
                    <Cell fill="#f1f5f9" />
                 </Pie>
               </PieChart>
            ) : element.content === 'line-chart' ? (
               <AreaChart data={[{v: 10}, {v: 30}, {v: 25}, {v: 45}, {v: 35}]}>
                  <Area type="monotone" dataKey="v" stroke={element.color || "#ef4444"} fill={element.color || "#ef4444"} fillOpacity={0.2} />
               </AreaChart>
            ) : (
               <BarChart data={[{v: 20}, {v: 50}, {v: 30}, {v: 80}, {v: 40}]}>
                  <Bar dataKey="v" fill={element.color || "#ef4444"} radius={[4, 4, 0, 0]} />
               </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      ) : (
        <div 
          className="w-full h-full flex items-center justify-center pointer-events-none" 
          style={{ 
            color: element.color || '#E8B931',
          }}
        >
           { element.content === 'circle' && <div className="w-full h-full rounded-full" style={{ border: `${element.strokeWidth || 4}px solid ${element.borderColor || 'currentColor'}`, opacity: element.opacity ?? 0.5 }} /> }
           { element.content === 'square' && <div className="w-full h-full" style={{ border: `${element.strokeWidth || 4}px solid ${element.borderColor || 'currentColor'}`, borderRadius: `${element.borderRadius || 8}px`, opacity: element.opacity ?? 0.5 }} /> }
           { element.content === 'rectangle' && <div className="w-full h-full" style={{ border: `${element.strokeWidth || 4}px solid ${element.borderColor || 'currentColor'}`, borderRadius: `${element.borderRadius || 4}px`, opacity: element.opacity ?? 0.5 }} /> }
           { element.content === 'line' && <div className="w-full h-1 w-full" style={{ height: `${element.strokeWidth || 4}px`, backgroundColor: element.color || 'currentColor', opacity: element.opacity ?? 0.5 }} /> }
           { element.content === 'solid-circle' && <div className="w-full h-full rounded-full" style={{ backgroundColor: element.color || 'currentColor', border: element.borderColor ? `${element.strokeWidth || 2}px solid ${element.borderColor}` : 'none', opacity: element.opacity ?? 0.5 }} /> }
           { element.content === 'solid-square' && <div className="w-full h-full" style={{ backgroundColor: element.color || 'currentColor', border: element.borderColor ? `${element.strokeWidth || 2}px solid ${element.borderColor}` : 'none', borderRadius: `${element.borderRadius || 8}px`, opacity: element.opacity ?? 0.5 }} /> }
        </div>
      )}
      
      {!isViewer && isSelected && (
        <>
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex gap-2 whitespace-nowrap bg-stone-900 text-white px-3 py-1.5 rounded-full text-[10px] font-black uppercase shadow-2xl border border-stone-800">
            <span className="text-[#E8B931]">Selected</span>
            <div className="w-px h-3 bg-stone-700" />
            <button 
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
              className="hover:text-red-500 transition-all flex items-center gap-1 group"
            >
              <Trash2 size={10} className="group-hover:scale-110 transition-transform" />
              Remove
            </button>
          </div>
          {/* Resize Handle */}
          <div 
            className="absolute -bottom-2 -right-2 w-5 h-5 bg-[#E8B931] border-2 border-stone-950 rounded-full cursor-nwse-resize shadow-lg z-50 flex items-center justify-center"
            onMouseDown={handleResizeStart}
          >
            <div className="w-1.5 h-1.5 bg-stone-950 rotate-45" />
          </div>
        </>
      )}
    </div>
  );
}

export interface ReportDataWithOptional extends ReportData {}

function RailButton({ icon, label, active, onClick, className }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void, className?: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full h-[72px] flex flex-col items-center justify-center gap-1.5 transition-all relative group",
        active ? "bg-white/10 text-white" : "text-white/40 hover:text-white/80 hover:bg-white/5",
        className
      )}
    >
      {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full" />}
      <div className={cn("transition-transform", active ? "scale-110" : "group-hover:scale-105")}>{icon}</div>
      <span className="text-[10px] font-bold tracking-tight opacity-100">{label}</span>
    </button>
  );
}

function ContextToolbar({ selectedElementId, elements, updateEl, deleteEl, data }: { selectedElementId: string | null, elements: FloatingElement[], updateEl: (id: string, updates: Partial<FloatingElement>) => void, deleteEl: () => void, data: ReportData }) {
  const el = elements.find(e => e.id === selectedElementId);
  if (!el) return null;

  return (
    <div className="sticky top-4 z-[60] bg-white shadow-xl rounded-2xl border border-stone-200 p-1.5 flex items-center gap-2 mb-4">
      <div className="flex items-center gap-1 border-r border-stone-100 pr-2">
        <button 
          onClick={() => updateEl(el.id, { fontStyle: el.fontStyle === 'italic' ? 'normal' : 'italic' })}
          className={cn("p-2 rounded-lg transition-colors", el.fontStyle === 'italic' ? "bg-mustard/10 text-mustard" : "hover:bg-stone-100")}
        >
          <Type size={16} className="italic" />
        </button>
        <button 
          onClick={() => updateEl(el.id, { fontWeight: el.fontWeight === 'bold' ? 'normal' : 'bold' })}
          className={cn("p-2 rounded-lg transition-colors", el.fontWeight === 'bold' ? "bg-mustard/10 text-mustard" : "hover:bg-stone-100")}
        >
          <span className="font-bold">B</span>
        </button>
      </div>

      {el.type === 'text' && (
        <div className="flex items-center gap-2 border-r border-stone-100 pr-2">
          <input 
             type="number" 
             value={el.fontSize || 16} 
             onChange={(e) => updateEl(el.id, { fontSize: parseInt(e.target.value) })}
             className="w-12 bg-stone-50 rounded px-1 py-1 text-xs font-bold text-center border border-stone-200"
          />
          <div className="flex bg-stone-50 rounded-lg p-0.5 border border-stone-200">
            {['left', 'center', 'right'].map(a => (
              <button 
                key={a}
                onClick={() => updateEl(el.id, { textAlign: a as any })}
                className={cn("w-6 h-6 flex items-center justify-center rounded transition-colors text-[10px]", el.textAlign === a ? "bg-white shadow-sm" : "text-stone-400")}
              >
                {a[0].toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 border-r border-stone-100 pr-2">
         <div className="w-6 h-6 rounded border border-stone-200 overflow-hidden relative shadow-sm">
            <input 
              type="color" 
              value={el.color || '#000000'} 
              onChange={(e) => updateEl(el.id, { color: e.target.value })}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="w-full h-full" style={{ backgroundColor: el.color || '#000' }} />
         </div>
      </div>

      <button 
        onClick={deleteEl}
        className="p-2 hover:bg-red-50 rounded-lg text-stone-400 hover:text-red-500 transition-colors"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}

export default function App() {
  const [data, setData] = useState<ReportData>(MOCK_FULL_DATA);
  const [reportId, setReportId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Loading...');
  const [copySuccess, setCopySuccess] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<'design' | 'elements' | 'text' | 'uploads' | 'pages' | 'export' | 'inspector' | 'brand' | 'tools' | 'apps'>('design');
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [elementsSubTab, setElementsSubTab] = useState<'graphics' | 'photos'>('graphics');
  const [unsplashQuery, setUnsplashQuery] = useState('');
  const [unsplashResults, setUnsplashResults] = useState<any[]>([]);
  const [isSearchingPhotos, setIsSearchingPhotos] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{ id: string, url: string }[]>([]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const base64 = await fileToBase64(file);
      const compressed = await compressImage(base64);
      const newFile = { id: `up-${Date.now()}`, url: compressed };
      setUploadedFiles(prev => [newFile, ...prev]);
    } catch (err) {
      console.error('File upload failed:', err);
    }
  };

  const fetchUnsplash = async (query: string) => {
    if (!query) return;
    setIsSearchingPhotos(true);
    try {
      const accessKey = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;
      if (!accessKey) {
        console.warn('Unsplash Access Key is missing');
        // Fallback to some random photos if key is missing for demo
        setUnsplashResults([
          { id: '1', urls: { small: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400' } },
          { id: '2', urls: { small: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=400' } },
          { id: '3', urls: { small: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=400' } },
          { id: '4', urls: { small: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400' } },
        ]);
        return;
      }
      const response = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=20`, {
        headers: {
          Authorization: `Client-ID ${accessKey}`
        }
      });
      const data = await response.json();
      setUnsplashResults(data.results || []);
    } catch (err) {
      console.error('Error fetching Unsplash photos:', err);
    } finally {
      setIsSearchingPhotos(false);
    }
  };

  const addElement = (type: 'image' | 'shape' | 'icon' | 'text' | 'chart', content: string) => {
    const newEl: FloatingElement = {
      id: `fe-${Date.now()}`,
      type,
      content,
      top: 100,
      left: 100,
      width: type === 'text' ? 200 : 100,
      height: type === 'text' ? 60 : 100,
      zIndex: (data.floatingElements?.length || 0) + 1,
      opacity: 1,
      color: type === 'text' ? '#000000' : '#E8B931'
    };
    setData({ ...data, floatingElements: [...(data.floatingElements || []), newEl] });
    handleSelectElement(newEl.id);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('type');
    const content = e.dataTransfer.getData('content');
    
    // Get drop position relative to canvas
    const rect = (document.getElementById('report-preview-area'))?.getBoundingClientRect();
    if (!rect) return;

    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    const newEl: FloatingElement = {
      id: `fe-${Date.now()}`,
      type: type as any,
      content: content,
      top: y - 50,
      left: x - 50,
      width: type === 'text' ? 400 : 200,
      height: type === 'text' ? 100 : 200,
      zIndex: (data.floatingElements || []).length + 1,
      opacity: 1,
      color: type === 'text' ? '#000000' : '#E8B931',
      fontSize: type === 'text' ? 40 : undefined,
      fontWeight: type === 'text' ? 'bold' : undefined,
    };

    setData({
      ...data,
      floatingElements: [...(data.floatingElements || []), newEl]
    });
    handleSelectElement(newEl.id);
  };

  const updateElement = (id: string, updates: Partial<FloatingElement>) => {
    const copy = [...(data.floatingElements || [])];
    const idx = copy.findIndex(e => e.id === id);
    if (idx !== -1) {
      copy[idx] = { ...copy[idx], ...updates };
      setData({ ...data, floatingElements: copy });
    }
  };

  const handleDeleteElement = () => {
    if (!selectedElementId) return;
    setData({
      ...data,
      floatingElements: (data.floatingElements || []).filter(e => e.id !== selectedElementId)
    });
    handleSelectElement(null);
  };

  const handleSelectElement = (id: string | null) => {
    setSelectedElementId(id);
    if (id) {
      setIsSidebarOpen(true);
      setSidebarTab('inspector');
    }
  };

  const handleSelection = (sectionId: string | null) => {
    setActiveSectionId(sectionId);
    if (sectionId) {
       setIsSidebarOpen(true);
       setSidebarTab('pages');
    }
  };
  const [isViewerMode, setIsViewerMode] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [view, setView] = useState<'auth' | 'dashboard' | 'editor'>('auth');

  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const performSave = useCallback(
    debounce(async (currentData: ReportData, currentId: string | null) => {
      if (!user || isViewerMode) return;
      try {
        const id = await saveReport(currentId, currentData);
        if (id && id !== currentId) {
          setReportId(id);
          // Update URL without refreshing
          const newUrl = `${window.location.pathname}?reportId=${id}`;
          window.history.pushState({ path: newUrl }, '', newUrl);
        }
        setLastSaved(new Date());
      } catch (err) {
        console.error("Auto-save failed", err);
      }
    }, 2000),
    [user, isViewerMode]
  );

  useEffect(() => {
    if (view === 'editor' && !isViewerMode) {
      performSave(data, reportId);
    }
  }, [data, view, isViewerMode, reportId]);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAuthLoading(false);
      if (u) {
        if (view === 'auth') setView('dashboard');
        setIsOfflineMode(false);
      } else if (!isOfflineMode) {
        setView('auth');
      }
    });
    return () => unsubscribe();
  }, [view, isViewerMode, isOfflineMode]);

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

  const getPageDimensions = (pageSize?: string, orientation?: string) => {
    const baseWidth = 1200;
    const ratio = 1.414;
    const size = pageSize || data.pageSize || 'A4';
    const orient = orientation || data.orientation || 'portrait';
    
    // Scale factor for different A sizes (A4 is baseline 1.0)
    const scaleMap: Record<string, number> = {
      'A1': 2.8,
      'A2': 2.0,
      'A3': 1.4,
      'A4': 1.0,
      'A5': 0.7,
    };
    const scale = scaleMap[size] || 1.0;
    const width = baseWidth * scale;

    if (orient === 'landscape') {
      return { width: Math.round(width * ratio), height: Math.round(width) };
    }
    return { width: Math.round(width), height: Math.round(width * ratio) };
  };

  const handleCreateNew = (pageSize: 'A1' | 'A2' | 'A3' | 'A4' | 'A5' = 'A4', orientation: 'portrait' | 'landscape' = 'portrait') => {
    setData({
      ...MOCK_FULL_DATA,
      pageSize,
      orientation,
      reportTitle: "Untitled Report"
    });
    setReportId(null);
    setView('editor');
  };

  const handleSelectReport = (id: string) => {
    setReportId(id);
    setView('editor');
    loadReport(id);
  };

  const renderDesignTab = () => (
    <div className="space-y-8">
      <section className="space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2">Style Palettes</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { name: 'Midnight', primary: '#1a1a1a', accent: '#ef4444' },
            { name: 'Forest', primary: '#064e3b', accent: '#fbbf24' },
            { name: 'Ocean', primary: '#1e3a8a', accent: '#3b82f6' },
            { name: 'Sunset', primary: '#4c1d95', accent: '#f472b6' },
          ].map((theme) => (
            <button 
              key={theme.name}
              onClick={() => setData({ ...data, themeColor: theme.primary, accentColor: theme.accent })}
              className="group text-left space-y-2 p-3 rounded-2xl border border-stone-100 hover:border-mustard transition-all bg-white shadow-sm"
            >
              <div className="flex h-6 rounded-full overflow-hidden">
                <div className="flex-1" style={{ backgroundColor: theme.primary }} />
                <div className="flex-1" style={{ backgroundColor: theme.accent }} />
              </div>
              <span className="text-[9px] font-black uppercase tracking-tight text-stone-500 group-hover:text-stone-900 transition-colors">{theme.name}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-stone-400">Custom Branding</h3>
        <div className="grid grid-cols-2 gap-3 pb-2 border-b border-stone-50">
          <div className="space-y-1">
            <label className="text-[9px] uppercase font-bold text-stone-500">Theme</label>
            <input type="color" value={data.themeColor} onChange={(e) => setData({...data, themeColor: e.target.value})} className="w-full h-10 rounded-lg border border-stone-200 cursor-pointer" />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] uppercase font-bold text-stone-500">Accent</label>
            <input type="color" value={data.accentColor} onChange={(e) => setData({...data, accentColor: e.target.value})} className="w-full h-10 rounded-lg border border-stone-200 cursor-pointer" />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-stone-400">Typography Pairing</h3>
        <div className="space-y-2">
          {[
            { name: 'Modern Sans', family: 'sans' },
            { name: 'Classic Serif', family: 'serif' },
            { name: 'Technical Mono', family: 'mono' },
          ].map((font) => (
             <button 
               key={font.family}
               onClick={() => setData({ ...data, fontFamily: font.family as any })}
               className={cn(
                 "w-full text-left p-4 rounded-2xl border transition-all",
                 data.fontFamily === font.family ? "bg-mustard border-mustard text-stone-900" : "bg-stone-50 border-stone-100 text-stone-600 hover:border-mustard"
               )}
             >
               <span className="text-xs font-black uppercase tracking-widest">{font.name}</span>
             </button>
          ))}
        </div>
      </section>
    </div>
  );

  const renderElementsTab = () => (
    <div className="space-y-8">
      <div className="bg-stone-50 p-2 rounded-2xl flex gap-1 border border-stone-100">
        <button 
          onClick={() => setElementsSubTab('graphics')}
          className={cn(
            "flex-1 h-10 shadow-sm rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all",
            elementsSubTab === 'graphics' ? "bg-white text-stone-900 border border-stone-200" : "text-stone-400 hover:text-stone-600"
          )}
        >
          Graphics
        </button>
        <button 
          onClick={() => setElementsSubTab('photos')}
          className={cn(
            "flex-1 h-10 shadow-sm rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all",
            elementsSubTab === 'photos' ? "bg-white text-stone-900 border border-stone-200" : "text-stone-400 hover:text-stone-600"
          )}
        >
          Photos
        </button>
      </div>

      {elementsSubTab === 'graphics' ? (
        <>
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-stone-400">Quick Shapes</h3>
              <button className="text-[9px] font-black uppercase text-mustard">See All</button>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {[
                { id: 'square', icon: <Square size={20}/> },
                { id: 'circle', icon: <div className="w-5 h-5 rounded-full border-2 border-current"/> },
                { id: 'solid-circle', icon: <div className="w-5 h-5 rounded-full bg-current"/> },
                { id: 'triangle', icon: <Triangle size={20}/> },
              ].map((shape) => (
                <button 
                  key={shape.id} 
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('type', 'shape');
                    e.dataTransfer.setData('content', shape.id);
                  }}
                  onClick={() => addElement('shape', shape.id)}
                  className="aspect-square bg-stone-50 rounded-xl flex items-center justify-center text-stone-400 hover:bg-mustard/10 hover:text-mustard hover:scale-110 active:scale-95 transition-all outline-none cursor-grab"
                >
                  {shape.icon}
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-stone-400">Charts</h3>
            <div className="grid grid-cols-2 gap-3">
               <ToolButton icon={<PieChartIcon size={24}/>} label="Pie Chart" onClick={() => addElement('chart', 'pie')} onDragStart={(e) => { e.dataTransfer.setData('type', 'chart'); e.dataTransfer.setData('content', 'pie'); }} />
               <ToolButton icon={<BarChart3 size={24}/>} label="Bar Chart" onClick={() => addElement('chart', 'bar')} onDragStart={(e) => { e.dataTransfer.setData('type', 'chart'); e.dataTransfer.setData('content', 'bar'); }} />
               <ToolButton icon={<TrendingUp size={24}/>} label="Line Chart" onClick={() => addElement('chart', 'line-chart')} onDragStart={(e) => { e.dataTransfer.setData('type', 'chart'); e.dataTransfer.setData('content', 'line-chart'); }} />
               <ToolButton icon={<Maximize2 size={24}/>} label="Grid Layout" onClick={() => {}} />
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-stone-400">Icons</h3>
            <div className="grid grid-cols-4 gap-3">
               {[Sprout, Leaf, Star, Heart, Triangle, Zap, Award, Smile].map((Icon, i) => (
                 <button 
                   key={i} 
                   draggable
                   onDragStart={(e) => {
                     e.dataTransfer.setData('type', 'icon');
                     e.dataTransfer.setData('content', Icon.name.toLowerCase());
                   }}
                   onClick={() => addElement('icon', Icon.name.toLowerCase())} 
                   className="aspect-square bg-stone-50 rounded-xl flex items-center justify-center text-stone-400 hover:text-mustard transition-colors cursor-grab"
                 >
                    <Icon size={20} />
                 </button>
               ))}
            </div>
          </section>
        </>
      ) : (
        <section className="space-y-4">
          <div className="relative mb-6">
            <input 
              type="text" 
              placeholder="Search Unsplash..."
              value={unsplashQuery}
              onChange={(e) => setUnsplashQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchUnsplash(unsplashQuery)}
              className="w-full h-11 bg-stone-100 border border-stone-200 rounded-2xl px-4 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-mustard/20 transition-all"
            />
            <button 
              onClick={() => fetchUnsplash(unsplashQuery)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-stone-400 hover:text-mustard transition-colors"
            >
              <Search size={16} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 min-h-[400px]">
             {isSearchingPhotos ? (
               <div className="col-span-2 py-20 flex flex-col items-center justify-center text-stone-400 gap-3">
                  <Loader2 className="animate-spin" size={24} />
                  <p className="text-[10px] font-black uppercase tracking-widest">Searching Unsplash...</p>
               </div>
             ) : unsplashResults.length > 0 ? (
               unsplashResults.map(photo => (
                 <button 
                   key={photo.id}
                   draggable
                   onDragStart={(e) => {
                     e.dataTransfer.setData('type', 'image');
                     e.dataTransfer.setData('content', photo.urls.regular || photo.urls.small);
                   }}
                   onClick={() => addElement('image', photo.urls.regular || photo.urls.small)}
                   className="aspect-square rounded-xl overflow-hidden group relative bg-stone-100"
                 >
                    <img src={photo.urls.small} referrerPolicy="no-referrer" className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="" />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                       <Plus className="text-white bg-mustard rounded-full p-1" size={24} />
                    </div>
                 </button>
               ))
             ) : (
               <div className="col-span-2 py-20 flex flex-col items-center justify-center text-stone-100/50">
                  <Image className="mb-4" size={48} />
                  <p className="text-[10px] font-black uppercase tracking-widest max-w-[140px] text-center leading-loose">Search millions of free high-quality photos</p>
               </div>
             )}
          </div>
        </section>
      )}
    </div>
  );

  const ToolButton = ({ icon, label, onClick, onDragStart }: { icon: React.ReactNode, label: string, onClick: () => void, onDragStart?: (e: React.DragEvent) => void }) => (
    <button 
      onClick={onClick} 
      draggable={!!onDragStart}
      onDragStart={onDragStart}
      className={cn(
        "flex flex-col items-center justify-center gap-2 p-4 bg-stone-50 border border-stone-100 rounded-2xl hover:border-mustard hover:shadow-xl hover:shadow-mustard/5 transition-all active:scale-95 group",
        onDragStart && "cursor-grab"
      )}
    >
       <div className="text-stone-400 group-hover:text-mustard group-hover:scale-110 transition-all">{icon}</div>
       <span className="text-[10px] font-black text-stone-500 uppercase tracking-widest group-hover:text-stone-900">{label}</span>
    </button>
  );

  const renderTextTab = () => (
    <div className="space-y-8">
       <section className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-stone-400">Default Styles</h3>
          <div className="space-y-3">
             <button 
               draggable
               onDragStart={(e) => {
                 e.dataTransfer.setData('type', 'text');
                 e.dataTransfer.setData('content', 'Heading 1');
               }}
               onClick={() => addElement('text', 'Heading 1')}
               className="w-full text-left p-4 bg-stone-50 border border-stone-100 rounded-2xl hover:border-mustard hover:shadow-lg transition-all group cursor-grab"
             >
                <div className="text-2xl font-black text-stone-900 group-hover:text-mustard transition-colors">Add a heading</div>
                <div className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mt-1">Extra Bold / 120px</div>
             </button>
             <button 
               draggable
               onDragStart={(e) => {
                 e.dataTransfer.setData('type', 'text');
                 e.dataTransfer.setData('content', 'Subheading');
               }}
               onClick={() => addElement('text', 'Subheading')}
               className="w-full text-left p-4 bg-stone-50 border border-stone-100 rounded-2xl hover:border-mustard hover:shadow-lg transition-all group cursor-grab"
             >
                <div className="text-lg font-bold text-stone-700 group-hover:text-stone-900 transition-colors">Add a subheading</div>
                <div className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mt-1">Bold / 60px</div>
             </button>
             <button 
               draggable
               onDragStart={(e) => {
                 e.dataTransfer.setData('type', 'text');
                 e.dataTransfer.setData('content', 'Body text');
               }}
               onClick={() => addElement('text', 'Body text')}
               className="w-full text-left p-4 bg-stone-50 border border-stone-100 rounded-2xl hover:border-mustard hover:shadow-lg transition-all group cursor-grab"
             >
                <div className="text-sm font-medium text-stone-500 group-hover:text-stone-700 transition-colors">Add body text</div>
                <div className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mt-1">Medium / 24px</div>
             </button>
          </div>
       </section>

       <section className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-stone-400">Font Combinations</h3>
          <div className="grid grid-cols-1 gap-3">
             {[
               { h: 'Bold Statement', s: 'modern approach', hf: 'sans', sf: 'mono' },
               { h: 'The Classic', s: 'Traditional quality', hf: 'serif', sf: 'sans' },
             ].map((combo, i) => (
               <button 
                 key={i} 
                 onClick={() => {
                   addElement('text', combo.h);
                   // maybe we could add a grouped element here? But for now just the heading
                 }}
                 className="p-5 bg-stone-900 text-white rounded-3xl text-left hover:scale-[1.02] transition-all shadow-xl shadow-stone-200"
               >
                  <div className={cn("text-xl font-black mb-1", combo.hf === 'serif' ? 'font-serif' : combo.hf === 'mono' ? 'font-mono' : '')}>{combo.h}</div>
                  <div className={cn("text-xs opacity-60", combo.sf === 'serif' ? 'font-serif' : combo.sf === 'mono' ? 'font-mono' : '')}>{combo.s}</div>
               </button>
             ))}
          </div>
       </section>
    </div>
  );

  const renderUploadsTab = () => (
    <div className="space-y-8">
      <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-stone-100 rounded-[32px] bg-stone-50 hover:bg-stone-100 transition-all group">
         <div className="w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center text-stone-300 group-hover:text-mustard transition-colors mb-6">
            <UploadCloud size={32} />
         </div>
         <h3 className="text-sm font-black uppercase text-stone-900 mb-2">Upload Files</h3>
         <p className="text-[10px] text-stone-500 font-medium text-center mb-6 px-4">Upload images to use them in your designs.</p>
         <label className="px-6 h-12 bg-stone-900 text-white rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all cursor-pointer">
            Select Files
            <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
         </label>
      </div>

      <div className="grid grid-cols-2 gap-3 min-h-[100px]">
         {uploadedFiles.map(file => (
           <button 
             key={file.id}
             draggable
             onDragStart={(e) => {
               e.dataTransfer.setData('type', 'image');
               e.dataTransfer.setData('content', file.url);
             }}
             onClick={() => addElement('image', file.url)}
             className="aspect-square rounded-xl overflow-hidden group relative bg-stone-100"
           >
              <img src={file.url} referrerPolicy="no-referrer" className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="" />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                 <Plus className="text-white bg-mustard rounded-full p-1" size={24} />
              </div>
           </button>
         ))}
      </div>
    </div>
  );

  const renderPagesTab = () => (
    <div className="space-y-3">
      {data.sections.map((section, idx) => (
        <div key={section.id} className="flex items-center gap-3 p-3 bg-stone-50 rounded-2xl group border border-transparent hover:border-mustard/30 transition-all">
          <div className="w-10 h-10 bg-stone-200 rounded-lg flex items-center justify-center font-black text-stone-500 text-xs">
            {idx + 1}
          </div>
          <div className="flex-1 min-w-0">
             <p className="text-[10px] font-black uppercase text-stone-400">Page {idx + 1}</p>
             <p className="text-xs font-bold text-stone-700 truncate">{section.type}</p>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => removeSection(section.id)} className="p-1.5 hover:text-red-500"><Trash size={14}/></button>
            <button onClick={() => moveSection(section.id, 'up')} className="p-1.5 hover:text-mustard"><ChevronUp size={14}/></button>
          </div>
        </div>
      ))}
      <button 
        onClick={() => addSection('after')}
        className="w-full py-4 border-2 border-dashed border-stone-200 rounded-2xl flex items-center justify-center gap-2 text-stone-400 hover:text-mustard hover:border-mustard transition-all text-xs font-bold uppercase"
      >
        <Plus size={16} /> New Page
      </button>
    </div>
  );

  const renderInspectorTab = () => {
    const el = (data.floatingElements || []).find(e => e.id === selectedElementId);
    if (!el) return (
      <div className="space-y-8 px-1">
        <section className="space-y-4">
           <h3 className="text-[10px] font-black uppercase tracking-widest text-stone-400">Canvas Settings</h3>
           <div className="p-6 bg-stone-900 rounded-[32px] border border-stone-800">
              <div className="flex items-center gap-4 mb-6">
                 <div className="w-12 h-12 bg-[#E8B931]/10 text-[#E8B931] rounded-2xl flex items-center justify-center">
                    <Maximize2 size={24} />
                 </div>
                 <div>
                    <p className="text-[10px] font-black uppercase text-stone-500 tracking-widest">Active Size</p>
                    <p className="text-xl font-black text-white">{data.pageSize || 'A4'} <span className="text-stone-600 text-xs font-bold">{data.orientation}</span></p>
                 </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                 <button 
                  onClick={() => setData({ ...data, orientation: data.orientation === 'portrait' ? 'landscape' : 'portrait' })}
                  className="h-12 bg-stone-800 text-stone-300 rounded-xl text-[9px] font-black uppercase hover:bg-stone-700 hover:text-white transition-all flex items-center justify-center gap-2"
                 >
                    <Grid3X3 size={14}/> Switch Layout
                 </button>
                 <button 
                  onClick={() => setData({ ...data, pageSize: 'A4' })}
                  className={cn(
                    "h-12 rounded-xl text-[9px] font-black uppercase transition-all flex items-center justify-center gap-2",
                    data.pageSize === 'A4' ? "bg-[#E8B931] text-stone-900" : "bg-stone-800 text-stone-300 hover:bg-stone-700"
                  )}
                 >
                    <FileText size={14}/> Convert to A4
                 </button>
              </div>
           </div>
        </section>

        <section className="space-y-4">
           <h3 className="text-[10px] font-black uppercase tracking-widest text-stone-400">Background</h3>
           <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                 <label className="text-[9px] uppercase font-bold text-stone-500">Theme Color</label>
                 <div className="h-12 rounded-xl border border-stone-800 relative overflow-hidden">
                    <input type="color" value={data.themeColor} onChange={e => setData({...data, themeColor: e.target.value})} className="absolute inset-[-10px] w-[200%] h-[200%] cursor-pointer" />
                 </div>
              </div>
              <div className="space-y-2">
                 <label className="text-[9px] uppercase font-bold text-stone-500">Accent Color</label>
                 <div className="h-12 rounded-xl border border-stone-800 relative overflow-hidden">
                    <input type="color" value={data.accentColor} onChange={e => setData({...data, accentColor: e.target.value})} className="absolute inset-[-10px] w-[200%] h-[200%] cursor-pointer" />
                 </div>
              </div>
           </div>
        </section>
      </div>
    );

    const updateEl = (updates: Partial<FloatingElement>) => updateElement(el.id, updates);

    return (
      <div className="space-y-8">
        <section className="space-y-3">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-stone-400">Layering & Position</h3>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => updateEl({ zIndex: (el.zIndex || 0) + 1 })} className="h-10 bg-stone-50 border border-stone-200 rounded-xl text-[9px] font-black uppercase hover:bg-white transition-all flex items-center justify-center gap-2">
               <ChevronUp size={14}/> Bring Forward
            </button>
            <button onClick={() => updateEl({ zIndex: Math.max(0, (el.zIndex || 0) - 1) })} className="h-10 bg-stone-50 border border-stone-200 rounded-xl text-[9px] font-black uppercase hover:bg-white transition-all flex items-center justify-center gap-2">
               <ChevronDown size={14}/> Send Backward
            </button>
          </div>
        </section>

        <section className="space-y-3">
           <div className="flex justify-between items-center">
             <h3 className="text-[10px] font-black uppercase tracking-widest text-stone-400">Appearance</h3>
             <span className="text-[10px] font-bold text-stone-900">{Math.round((el.opacity || 1) * 100)}%</span>
           </div>
           <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-stone-500 tracking-tighter">Opacity</label>
                <input type="range" min="0" max="1" step="0.01" value={el.opacity ?? 1} onChange={(e) => updateEl({ opacity: parseFloat(e.target.value) })} className="w-full accent-mustard" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-stone-500 tracking-tighter">Corner Radius</label>
                <input type="range" min="0" max="100" value={el.borderRadius ?? 0} onChange={(e) => updateEl({ borderRadius: parseInt(e.target.value) })} className="w-full accent-mustard" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-stone-500 tracking-tighter">Rotation</label>
                <input type="range" min="0" max="360" value={el.rotation ?? 0} onChange={(e) => updateEl({ rotation: parseInt(e.target.value) })} className="w-full accent-mustard" />
              </div>
           </div>
        </section>

        {el.type === 'image' && (
          <section className="space-y-3">
             <h3 className="text-[10px] font-black uppercase tracking-widest text-stone-400">Image Control</h3>
             <ImageUploader label="Replace Image" value={el.content} onUpload={(url) => updateEl({ content: url })} onClear={() => updateEl({ content: '' })} />
             <div className="flex items-center gap-2 mt-4">
                <button onClick={() => updateEl({ shadow: !el.shadow })} className={cn("flex-1 h-10 rounded-xl text-[9px] font-black uppercase border transition-all", el.shadow ? "bg-mustard border-mustard text-stone-900" : "bg-stone-50 border-stone-200 text-stone-400 hover:text-stone-600")}>Drop Shadow</button>
             </div>
          </section>
        )}

        {(el.type === 'shape' || el.type === 'icon' || el.type === 'text') && (
           <section className="space-y-3">
             <h3 className="text-[10px] font-black uppercase tracking-widest text-stone-400">Color & Border</h3>
             <div className="grid grid-cols-2 gap-3">
               <div className="space-y-1">
                 <label className="text-[9px] uppercase font-bold text-stone-500">Color</label>
                 <input type="color" value={el.color || '#E8B931'} onChange={(e) => updateEl({ color: e.target.value })} className="w-full h-10 rounded-lg border border-stone-200 cursor-pointer" />
               </div>
               <div className="space-y-1">
                 <label className="text-[9px] uppercase font-bold text-stone-500">Border</label>
                 <input type="color" value={el.borderColor || '#000000'} onChange={(e) => updateEl({ borderColor: e.target.value })} className="w-full h-10 rounded-lg border border-stone-200 cursor-pointer" />
               </div>
             </div>
             <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-stone-500 tracking-tighter">Border Width</label>
                <input type="range" min="0" max="20" value={el.strokeWidth ?? 2} onChange={(e) => updateEl({ strokeWidth: parseInt(e.target.value) })} className="w-full accent-mustard" />
              </div>
           </section>
        )}

        {el.type === 'text' && (
           <section className="space-y-3">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-stone-400">Typography Details</h3>
              <div className="grid grid-cols-2 gap-2">
                 <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-stone-500">Size</label>
                    <input type="number" value={el.fontSize || 16} onChange={(e) => updateEl({ fontSize: parseInt(e.target.value) })} className="w-full h-8 bg-stone-50 border border-stone-200 rounded px-2 text-[10px] font-bold" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-stone-500">Weight</label>
                    <select value={el.fontWeight || 'normal'} onChange={(e) => updateEl({ fontWeight: e.target.value })} className="w-full h-8 bg-stone-50 border border-stone-200 rounded px-2 text-[10px] font-bold">
                       <option value="normal">Normal</option>
                       <option value="bold">Bold</option>
                       <option value="black">Black</option>
                    </select>
                 </div>
              </div>
           </section>
        )}

        <div className="pt-6 mt-6 border-t border-stone-100 italic">
          <button 
            onClick={handleDeleteElement}
            className="w-full py-3 bg-red-50 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <Trash2 size={14}/> Delete Element
          </button>
        </div>
      </div>
    );
  };

  const renderExportTab = () => (
    <div className="space-y-6">
      <div className="p-4 bg-mustard/5 rounded-2xl border border-mustard/10 space-y-3 shadow-inner shadow-mustard/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-mustard rounded-xl flex items-center justify-center text-stone-900 shadow-md">
            <FileText size={20} />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-tight">Standard PDF</h4>
            <p className="text-[10px] text-stone-500 font-medium leading-tight">High quality report (CMYK ready)</p>
          </div>
        </div>
        <button 
          onClick={handleDownloadPDF}
          className="w-full py-3 bg-mustard text-stone-900 rounded-xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-mustard/20 hover:scale-[1.02] active:scale-95 transition-all"
        >
          Download PDF
        </button>
      </div>

      <div className="space-y-2">
         <h3 className="text-[10px] font-black uppercase tracking-widest text-stone-400">Sharing</h3>
         <button 
           onClick={handleGenerateShareLink}
           className="w-full py-3 bg-stone-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-colors"
         >
           <Share2 size={14} /> {copySuccess ? 'Link Copied!' : 'Copy Share Link'}
         </button>
         {reportId && (
            <a 
              href={`${window.location.protocol}//${window.location.host}${window.location.pathname}?reportId=${reportId}&viewer=true`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-3 bg-stone-50 text-stone-900 border border-stone-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-center hover:bg-white transition-colors"
            >
              Open Online Viewer
            </a>
         )}
      </div>
    </div>
  );
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

  useEffect(() => {
    if (activeSectionId && reportRef.current) {
      const element = reportRef.current.querySelector(`#${activeSectionId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [activeSectionId]);

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
      bgImage: section.bgImage,
      isActive: activeSectionId === section.id,
      onClick: () => {
        if (!isViewerMode) {
          handleSelection(section.id);
        }
      },
      reportRef: reportRef
    };

    switch (section.type) {
      case 'cover':
        return (
          <SectionWrapper key={section.id} id={section.id} {...commonProps}>
            <div className="min-h-[800px] flex flex-col justify-center relative py-12">
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
    if (isOfflineMode) {
      alert("You are in Offline Mode. Log in with a valid Firebase configuration to save to the cloud.");
      return;
    }
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
    if (isOfflineMode) {
      alert("Sharing is disabled in Offline Mode. Log in with a valid Firebase configuration to share reports.");
      return;
    }
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
    if (!reportRef.current) return;
    setLoadingMessage('Preparing high-fidelity PDF... (Canva Mode)');
    setIsLoading(true);
    
    // Ensure we are at the top of the container for best capture
    const mainArea = reportRef.current.parentElement;
    if (mainArea) mainArea.scrollTop = 0;

    const previewArea = document.getElementById('report-preview-area');
    if (!previewArea) {
      setIsLoading(false);
      return;
    }

    try {
      // 1. Critical: Wait for all images and fonts
      if ('fonts' in document) {
        await (document as any).fonts.ready;
      }
      
      const images = Array.from(previewArea.querySelectorAll('img'));
      await Promise.all(images.map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      }));

      // Small delay for any final settling
      await new Promise(r => setTimeout(r, 800));

      // Use html2canvas on the ENTIRE container to get floating elements correctly
      const captureWidth = 1200; // Fixed width for consistent high-quality export
      
      const captureOptions = {
        scale: 2, // 2x for retina quality
        useCORS: true,
        backgroundColor: data.themeColor || '#FFFFFF',
        logging: false,
        imageTimeout: 0,
        scrollX: 0,
        scrollY: 0,
        windowWidth: captureWidth,
        width: captureWidth,
        onclone: (clonedDoc: Document) => {
          const win = clonedDoc.defaultView || window;
          
          // 1. Handle Forms: Convert inputs/textareas to DIVs so they render correctly
          clonedDoc.querySelectorAll('textarea, input').forEach((el: any) => {
            const div = clonedDoc.createElement('div');
            div.textContent = el.value || el.placeholder || '';
            const style = win.getComputedStyle(el);
            // Copy essential styling
            ['fontSize', 'fontFamily', 'fontWeight', 'color', 'padding', 'lineHeight', 'textAlign', 'whiteSpace'].forEach(prop => {
              (div.style as any)[prop] = style[prop as any];
            });
            div.style.width = style.width;
            div.style.height = style.height;
            div.style.display = 'block';
            div.style.overflow = 'hidden';
            el.parentNode?.replaceChild(div, el);
          });

          // 2. Fix colors and modern CSS
          const colorRegex = /(oklch|oklab|color-mix)\((?:[^()]+|\([^()]*\))+\)/g;
          const colorFallback = '#78716c';
          clonedDoc.querySelectorAll('style').forEach(s => {
            if (s.textContent) s.textContent = s.textContent.replace(colorRegex, colorFallback);
          });

          const all = clonedDoc.getElementsByTagName('*');
          for (let i = 0; i < all.length; i++) {
            const el = all[i] as HTMLElement;
            const style = win.getComputedStyle(el);
            if (style.color?.includes('oklch')) el.style.color = colorFallback;
            if (style.backgroundColor?.includes('oklch')) el.style.backgroundColor = colorFallback;
            if (style.borderColor?.includes('oklch')) el.style.borderColor = colorFallback;
          }

          // 3. Force clean layout for capture
          const container = clonedDoc.getElementById('report-preview-area');
          if (container) {
            container.style.transform = 'none';
            container.style.width = `${captureWidth}px`;
            container.style.margin = '0';
            container.style.padding = '40px';
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
            container.style.gap = '0'; // We will handle spacing manually if needed or use sections
            container.style.boxShadow = 'none';
          }

          // Hide UI elements that shouldn't be in print
          clonedDoc.querySelectorAll('.absolute.-top-12, .cursor-nwse-resize, .group\\/section .absolute, .context-toolbar').forEach(e => {
            (e as HTMLElement).style.display = 'none';
          });
        }
      };

      const canvas = await html2canvas(previewArea, captureOptions);
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      
      const sections = previewArea.querySelectorAll('.print\\:break-after-page');
      
      // Calculate dimensions for jsPDF
      // A4 is 210 x 297 mm. We will use pixels for precision then scale.
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'px',
        format: [captureWidth, 1600] // Initial guess, we will adjust
      });

      if (sections.length > 0) {
        // Multi-page export by slicing the big canvas
        // This is tricky but leads to the best "Canva" feel where floating elements are preserved
        let currentY = 0;
        
        for (let i = 0; i < sections.length; i++) {
          const section = sections[i] as HTMLElement;
          const sectionHeight = section.offsetHeight + 48; // add gap
          
          if (i > 0) pdf.addPage([captureWidth, sectionHeight], 'p');
          else {
            // Re-initialize first page with correct size
            (pdf as any).deletePage(1);
            pdf.addPage([captureWidth, sectionHeight], 'p');
          }

          // Use the big canvas and crop it for each page
          // This ensures everything (floating elements included) is captured at once
          pdf.addImage(imgData, 'JPEG', 0, -currentY, captureWidth, canvas.height / 2, undefined, 'FAST');
          currentY += sectionHeight;
        }
      } else {
        // Single page
        const w = canvas.width / 2;
        const h = canvas.height / 2;
        const pdfSingle = new jsPDF({ orientation: w > h ? 'l' : 'p', unit: 'px', format: [w, h] });
        pdfSingle.addImage(imgData, 'JPEG', 0, 0, w, h);
        const title = (data.reportTitle || 'Report').replace(/\s+/g, '_');
        pdfSingle.save(`${title}_${Date.now()}.pdf`);
        setIsLoading(false);
        return;
      }

      const title = (data.reportTitle || 'Report').replace(/\s+/g, '_');
      pdf.save(`${title}_${Date.now()}.pdf`);

    } catch (err) {
      console.error("PDF generation failed:", err);
      alert(`Failed to generate PDF. Please try the "Save as Web Format" option for the most accurate results.`);
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
    return (
      <AuthPage 
        onSuccess={() => setView('dashboard')} 
        onContinueOffline={() => {
          setIsOfflineMode(true);
          setView('dashboard');
        }}
      />
    );
  }

  if (view === 'dashboard' && !isViewerMode) {
    return <Dashboard onNewReport={handleCreateNew} onSelectReport={handleSelectReport} />;
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-stone-100 font-sans selection:bg-mustard/30">
      {/* Canva Top Navigation */}
      {!isViewerMode && (
        <header className="h-[52px] bg-stone-900 border-b border-white/5 flex items-center justify-between px-4 z-[110] text-sm text-white/80 shrink-0">
          <div className="flex items-center gap-4">
            <button className="hover:bg-white/10 px-2 py-1 rounded transition-colors font-medium">File</button>
            <button className="hover:bg-white/10 px-2 py-1 rounded transition-colors font-medium">Resize</button>
            <div className="h-4 w-[1px] bg-white/10 mx-2" />
            <div className="flex items-center gap-1 hover:bg-white/10 px-2 py-1 rounded cursor-pointer transition-colors">
              <span className="font-bold">Editing</span>
              <ChevronDown size={14} />
            </div>
            <div className="flex items-center gap-4 ml-2">
              <button className="text-white/40 hover:text-white transition-colors"><Undo2 size={18} /></button>
              <button className="text-white/40 hover:text-white transition-colors"><Redo2 size={18} /></button>
            </div>
            <div className="h-4 w-[1px] bg-white/10 mx-2" />
            <CloudCheck size={18} className="text-emerald-400 opacity-80" />
          </div>

          <div className="flex-1 text-center px-4">
            <div className="inline-flex items-center gap-2 hover:bg-white/10 px-3 py-1 rounded transition-colors cursor-text group max-w-[300px]">
              <span className="truncate font-medium text-white/90">
                <EditableText value={data.reportTitle || 'Untitled Design'} onChange={(v) => setData({...data, reportTitle: v})} isViewer={false} />
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex -space-x-2 mr-4">
               <div className="w-8 h-8 rounded-full bg-stone-800 border-2 border-stone-900 flex items-center justify-center font-bold text-xs">M</div>
               <div className="w-8 h-8 rounded-full bg-mustard border-2 border-stone-900 flex items-center justify-center font-bold text-xs text-stone-900">+</div>
            </div>
            <button className="h-8 px-4 bg-white/10 hover:bg-white/15 rounded-md flex items-center gap-2 text-xs font-bold transition-colors">
              <MessageSquare size={14} />
            </button>
            <button 
              onClick={handleGenerateShareLink}
              className="h-8 px-4 bg-white/10 hover:bg-white/15 rounded-md flex items-center gap-2 text-xs font-bold transition-colors"
            >
              <Share2 size={14} />
              Share
            </button>
            <button 
              onClick={handleDownloadPDF}
              className="h-8 px-4 bg-[#00c4cc] hover:bg-[#00b4bc] text-white rounded-md flex items-center gap-2 text-xs font-black uppercase tracking-tighter transition-all"
            >
              <Download size={14} strokeWidth={3} />
              Download
            </button>
          </div>
        </header>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Canva Left Rail */}
        {!isViewerMode && (
          <aside className="w-[72px] bg-[#0e1217] flex flex-col items-center py-2 z-[100] border-r border-white/5 shrink-0">
            <div className="flex-1 w-full flex flex-col gap-1 items-center">
              <RailButton 
                icon={<LayoutTemplate size={22} />} 
                label="Design" 
                active={sidebarTab === 'design'} 
                onClick={() => { setSidebarTab('design'); setIsSidebarOpen(true); }} 
              />
              <RailButton 
                icon={<Box size={22} />} 
                label="Elements" 
                active={sidebarTab === 'elements'} 
                onClick={() => { setSidebarTab('elements'); setIsSidebarOpen(true); }} 
              />
              <RailButton 
                icon={<Type size={22} />} 
                label="Text" 
                active={sidebarTab === 'text'} 
                onClick={() => { setSidebarTab('text'); setIsSidebarOpen(true); }} 
              />
              <RailButton 
                icon={<Globe size={22} />} 
                label="Brand" 
                active={sidebarTab === 'brand'} 
                onClick={() => { setSidebarTab('brand'); setIsSidebarOpen(true); }} 
              />
              <RailButton 
                icon={<UploadCloud size={22} />} 
                label="Uploads" 
                active={sidebarTab === 'uploads'} 
                onClick={() => { setSidebarTab('uploads'); setIsSidebarOpen(true); }} 
              />
              <RailButton 
                icon={<Wand2 size={22} />} 
                label="Tools" 
                active={sidebarTab === 'tools'} 
                onClick={() => { setSidebarTab('tools'); setIsSidebarOpen(true); }} 
              />
              <RailButton 
                icon={<FolderHeart size={22} />} 
                label="Projects" 
                active={sidebarTab === 'pages'} 
                onClick={() => { setSidebarTab('pages'); setIsSidebarOpen(true); }} 
              />
              <RailButton 
                icon={<Grid3X3 size={22} />} 
                label="Apps" 
                active={sidebarTab === 'apps'} 
                onClick={() => { setSidebarTab('apps'); setIsSidebarOpen(true); }} 
              />
            </div>
            
            <div className="mt-auto w-full flex flex-col items-center gap-4 pb-4">
               {user && (
                 <div className="w-8 h-8 rounded-full bg-mustard flex items-center justify-center text-stone-900 border-2 border-transparent hover:border-white transition-all cursor-pointer">
                    <UserIcon size={16} strokeWidth={3} />
                 </div>
               )}
            </div>
          </aside>
        )}

        {/* Secondary Panel */}
        {!isViewerMode && (
          <motion.aside 
            initial={false}
            animate={{ width: isSidebarOpen ? 360 : 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="bg-white border-r border-stone-200 overflow-hidden relative shadow-2xl z-[90] shrink-0"
          >
            <div className="w-[360px] h-full flex flex-col">
              <header className="h-[72px] px-6 flex items-center justify-between flex-shrink-0">
                <h2 className="font-extrabold text-lg text-stone-900 capitalize">{sidebarTab}</h2>
                <button onClick={() => setIsSidebarOpen(false)} className="w-8 h-8 rounded-full hover:bg-stone-50 flex items-center justify-center text-stone-400">
                  <ChevronLeft size={20} />
                </button>
              </header>
              
              <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
                <div className="mb-6 relative">
                   <div className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"><Search size={16}/></div>
                   <input 
                     type="text" 
                     placeholder={`Search ${sidebarTab}...`} 
                     className="w-full h-10 bg-stone-100/50 border border-stone-200 rounded-xl pl-10 pr-4 text-xs font-medium focus:bg-white focus:ring-2 focus:ring-mustard/20 focus:outline-none transition-all" 
                   />
                </div>
                {sidebarTab === 'design' && renderDesignTab()}
                {sidebarTab === 'elements' && renderElementsTab()}
                {sidebarTab === 'text' && renderTextTab()}
                {sidebarTab === 'brand' && (
                  <div className="flex flex-col items-center justify-center pt-20 text-center px-6">
                    <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center text-stone-200 mb-4 text-[#00c4cc]">
                      <Globe size={32} />
                    </div>
                    <h3 className="text-sm font-black uppercase text-stone-900 mb-1">Brand Kit</h3>
                    <p className="text-[10px] text-stone-500 font-medium leading-relaxed">Centralize your colors, logos, and fonts for consistent designs.</p>
                  </div>
                )}
                {sidebarTab === 'tools' && (
                   <div className="grid grid-cols-2 gap-3">
                      <ToolButton icon={<Wand2 size={24}/>} label="Magic Media" onClick={() => {}} />
                      <ToolButton icon={<Maximize2 size={24}/>} label="Resize" onClick={() => {}} />
                      <ToolButton icon={<Palette size={24}/>} label="Styles" onClick={() => setSidebarTab('design')} />
                   </div>
                )}
                {sidebarTab === 'apps' && (
                  <div className="flex flex-col items-center justify-center pt-20 text-center px-6">
                    <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center text-stone-200 mb-4">
                      <Box size={32} />
                    </div>
                    <h3 className="text-sm font-black uppercase text-stone-900 mb-1">App Marketplace</h3>
                    <p className="text-[10px] text-stone-500 font-medium leading-relaxed">Connect to your favorite tools and unlock new features.</p>
                  </div>
                )}
                {sidebarTab === 'uploads' && renderUploadsTab()}
                {sidebarTab === 'pages' && renderPagesTab()}
                {sidebarTab === 'inspector' && renderInspectorTab()}
                {sidebarTab === 'export' && renderExportTab()}
              </div>
            </div>
          </motion.aside>
        )}

        {/* Workspace */}
        <main className="flex-1 flex flex-col relative bg-[#252b33] overflow-hidden">
          {/* Canvas Area */}
          <div className="flex-1 overflow-auto relative scrollbar-canva p-12 flex flex-col items-center">
              {/* Canva Element Toolbar (Floating) */}
              <AnimatePresence>
                {selectedElementId && (
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 20, opacity: 0 }}
                    className="fixed top-20 left-1/2 -translate-x-1/2 z-[120] bg-white border border-stone-200 shadow-2xl rounded-2xl h-12 flex items-center px-4 gap-4"
                  >
                      <PropertyBarContent 
                        element={(data.floatingElements || []).find(e => e.id === selectedElementId)} 
                        onUpdate={(updates) => updateElement(selectedElementId, updates)}
                        onDelete={handleDeleteElement}
                      />
                  </motion.div>
                )}
              </AnimatePresence>

              <div 
                ref={reportRef}
                id="report-preview-area"
                className="flex flex-col gap-12 origin-top transition-all shadow-2xl ring-1 ring-white/5 bg-white"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                style={{ 
                  transform: `scale(${zoom})`,
                  width: `${getPageDimensions().width}px`,
                  minHeight: `${getPageDimensions().height}px`
                }}
              >
                {/* Floating Elements Layer */}
                <div className="absolute inset-0 pointer-events-none z-[50]">
                  <div className="relative w-full h-full pointer-events-auto">
                    {(data.floatingElements || []).map((el) => (
                      <FloatingElementComponent 
                        key={el.id} 
                        element={el} 
                        isViewer={isViewerMode}
                        isSelected={selectedElementId === el.id}
                        onSelect={() => handleSelectElement(el.id)}
                        onChange={(updated) => updateElement(el.id, updated)}
                        onRemove={() => handleDeleteElement()}
                      />
                    ))}
                  </div>
                </div>
                
                {data.sections.map((section, idx) => renderSection(section, idx))}
              </div>
          </div>

          {/* Canva Bottom Bar */}
          {!isViewerMode && (
            <footer className="h-10 bg-stone-900 border-t border-white/5 flex items-center justify-between px-4 z-[100] text-xs text-white/60 shrink-0">
               <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer">
                    <MessageSquare size={14} /> Notes
                  </div>
                  <div className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer">
                    <CalendarIcon size={14} /> Timer
                  </div>
               </div>

               <div className="flex items-center gap-4 absolute left-1/2 -translate-x-1/2">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setZoom(Math.max(0.1, zoom - 0.1))} className="hover:text-white"><Minus size={14}/></button>
                    <input 
                      type="range" 
                      min="0.1" max="2" step="0.1" 
                      value={zoom} 
                      onChange={(e) => setZoom(parseFloat(e.target.value))}
                      className="w-24 accent-mustard" 
                    />
                    <button onClick={() => setZoom(Math.min(2, zoom + 0.1))} className="hover:text-white"><Plus size={14}/></button>
                    <span className="w-10 text-center font-bold">{Math.round(zoom * 100)}%</span>
                  </div>
               </div>

               <div className="flex items-center gap-4">
                  <button className="flex items-center gap-1 hover:text-white transition-colors">
                    <Layers size={14} /> Pages
                  </button>
                  <span className="font-bold">{data.sections.length}</span>
               </div>
            </footer>
          )}
        </main>
      </div>
    </div>
  );
}

function PropertyBarContent({ element, onUpdate, onDelete }: { element?: FloatingElement, onUpdate: (u: Partial<FloatingElement>) => void, onDelete: () => void }) {
  if (!element) return null;

  return (
    <div className="flex items-center gap-4 h-full">
      {element.type === 'text' && (
        <>
          <div className="flex items-center gap-1 border-r pr-4 border-stone-100">
            <button onClick={() => onUpdate({ fontSize: Math.max(8, (element.fontSize || 16) - 2) })} className="p-1.5 hover:bg-stone-50 rounded-lg text-stone-600"><Minus size={14}/></button>
            <input 
              type="number" 
              value={element.fontSize || 16} 
              onChange={(e) => onUpdate({ fontSize: parseInt(e.target.value) })}
              className="w-10 text-center text-xs font-black bg-stone-50 rounded h-7 outline-none border-none"
            />
            <button onClick={() => onUpdate({ fontSize: Math.min(200, (element.fontSize || 16) + 2) })} className="p-1.5 hover:bg-stone-50 rounded-lg text-stone-600"><Plus size={14}/></button>
          </div>
          <div className="flex items-center gap-1 border-r pr-4 border-stone-100">
             <button 
               onClick={() => onUpdate({ fontWeight: element.fontWeight === 'bold' ? 'normal' : 'bold' })} 
               className={cn("w-8 h-8 flex items-center justify-center rounded-lg transition-colors", element.fontWeight === 'bold' ? "bg-stone-900 text-white" : "hover:bg-stone-50 text-stone-600")}
             >
                <div className="font-serif font-black">B</div>
             </button>
             <button 
               onClick={() => onUpdate({ fontStyle: element.fontStyle === 'italic' ? 'normal' : 'italic' })} 
               className={cn("w-8 h-8 flex items-center justify-center rounded-lg transition-colors", element.fontStyle === 'italic' ? "bg-stone-900 text-white" : "hover:bg-stone-50 text-stone-600")}
             >
                <div className="font-serif italic font-black">I</div>
             </button>
             <div className="w-px h-6 bg-stone-100 mx-1" />
             <button 
               onClick={() => onUpdate({ textShadow: element.textShadow ? '' : '2px 2px 4px rgba(0,0,0,0.3)' })} 
               className={cn("w-8 h-8 flex items-center justify-center rounded-lg transition-colors", element.textShadow ? "bg-stone-900 text-white" : "hover:bg-stone-50 text-stone-600")}
               title="Shadow Effect"
             >
                <Star size={14}/>
             </button>
             <button 
               onClick={() => onUpdate({ outlineWidth: element.outlineWidth ? 0 : 2, outlineColor: '#ffffff' })} 
               className={cn("w-8 h-8 flex items-center justify-center rounded-lg transition-colors", element.outlineWidth ? "bg-stone-900 text-white" : "hover:bg-stone-50 text-stone-600")}
               title="Outline Effect"
             >
                <Award size={14}/>
             </button>
          </div>
        </>
      )}

      <div className="flex items-center gap-2 border-r pr-4 border-stone-100">
         <div className="w-8 h-8 rounded-lg relative overflow-hidden border border-stone-200">
            <input 
              type="color" 
              value={element.color || '#000000'} 
              onChange={(e) => onUpdate({ color: e.target.value })}
              className="absolute inset-[-10px] w-[200%] h-[200%] cursor-pointer"
            />
         </div>
         <span className="text-[10px] font-black uppercase text-stone-400">Color</span>
      </div>

      <div className="flex items-center gap-1">
         <button onClick={onDelete} className="p-2 hover:bg-red-50 hover:text-red-500 rounded-lg text-stone-400 transition-colors">
            <Trash2 size={16} />
         </button>
      </div>
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

function Section({ label, icon, children, isActive, onHeaderClick }: any) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isActive && ref.current && document.activeElement !== ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [isActive]);

  return (
    <div ref={ref} className={cn("mb-6 transition-all duration-500", isActive ? "scale-105" : "opacity-80 hover:opacity-100")}>
      <div 
        onClick={onHeaderClick}
        className={cn(
          "flex items-center gap-2 mb-3 border-b pb-1 cursor-pointer transition-colors",
          isActive ? "border-mustard" : "border-stone-800"
        )}
      >
        <span className={cn("font-bold transition-colors", isActive ? "text-mustard" : "text-stone-600")}>{icon}</span>
        <h3 className={cn("text-[10px] font-black uppercase tracking-widest transition-colors", isActive ? "text-white" : "text-stone-500")}>
          {label}
        </h3>
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
