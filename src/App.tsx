/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  BarChart3, Users, Mail, TrendingUp, MousePointerClick, 
  LogOut, MessageSquare, Download, Settings2, Briefcase, ExternalLink, Filter, Plus, Trash2, Palette, Image, Type, Maximize2, FileText,
  Share2, LogIn, User as UserIcon, Loader2, Save, Menu, X, Link as LinkIcon
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { cn } from './lib/utils';
import { compressImage } from './lib/imageUtils';

const formatNumber = (val: number | undefined | null) => {
  return (val ?? 0).toLocaleString();
};

export interface ReportDataWithOptional extends ReportData {}
import { ReportData, CampaignPerformanceRow } from './types';
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

export default function App() {
  const [data, setData] = useState<ReportData>(MOCK_FULL_DATA);
  const [reportId, setReportId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isViewerMode, setIsViewerMode] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  // Authentication Listener
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setIsViewerMode(params.get('viewer') === 'true');
    
    // Auto-hide sidebar on mobile
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  // Load report from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('reportId');
    if (id) {
      loadReport(id);
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
    if (!reportRef.current) return;
    setIsLoading(true);
    
    // 1. Prepare for high-quality capture
    window.scrollTo(0, 0);

    try {
      const element = reportRef.current;
      
      // 2. High-fidelity capture with increased scale
      const canvas = await html2canvas(element, {
        scale: 3, // Set high scale as requested
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#f8fafc', 
        logging: false,
        width: element.offsetWidth,
        height: element.offsetHeight,
        onclone: (clonedDoc) => {
          // Hide interactive buttons and sidebar artifacts
          const buttons = clonedDoc.querySelectorAll('button');
          buttons.forEach(btn => btn.style.display = 'none');
          
          // Ensure the cloned area has the correct font family
          const report = clonedDoc.getElementById('report-preview-area') as HTMLElement;
          if (report) {
            report.style.fontFamily = "'Inter', sans-serif";
            report.style.backgroundColor = '#f8fafc';
          }
        }
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const imgWidth = 210; // A4 width basis
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: [imgWidth, imgHeight], // Custom infographic size
        compress: true
      });

      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
      
      const fileName = `Infographic_Report_${data.reportTitle.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error("High-fidelity PDF generation failed:", err);
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

  return (
    <div className="flex h-screen overflow-hidden relative" style={{ backgroundColor: data.themeColor }}>
      {/* Top bar for mobile/desktop layout control */}
      {!isViewerMode && (
        <header className="fixed top-0 left-0 right-0 h-14 border-b border-stone-800 bg-stone-950/80 backdrop-blur-xl flex items-center justify-between px-4 z-50 md:hidden">
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-mustard rounded-lg flex items-center justify-center text-stone-900"><Mail size={16} /></div>
             <p className="text-xs font-black uppercase tracking-tighter text-white">MailDash</p>
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
          <div className="w-10 h-10 bg-mustard rounded-xl flex items-center justify-center text-stone-900 border-2" style={{ borderColor: 'rgba(255, 255, 255, 0.2)' }}><Mail size={20} /></div>
          <div>
            <h1 className="font-bold text-lg leading-tight uppercase tracking-tighter">MailDash</h1>
            <p className="text-[10px] text-stone-400 uppercase tracking-widest font-black">Report Builder</p>
          </div>
        </div>

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
          className="max-w-[1000px] mx-auto space-y-8 bg-transparent pb-32"
          style={{
            fontFamily: "'Inter', sans-serif",
            lineHeight: '1.15'
          } as React.CSSProperties}
        >
          {/* Header Section: Deep Golden with Badge */}
          <div className="bg-[#E8B931] rounded-b-[60px] p-16 text-stone-900 relative shadow-2xl overflow-hidden min-h-[400px] flex flex-col justify-end">
             <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
             <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/5 rounded-full -ml-32 -mb-32 blur-2xl" />
             
             <div className="relative z-10">
                <div className="inline-flex items-center gap-2 bg-stone-900 text-[#E8B931] px-5 py-2 rounded-full text-[12px] font-black uppercase tracking-[0.2em] mb-8 shadow-xl">
                  <div className="w-2 h-2 rounded-full bg-[#E8B931] animate-pulse" />
                  {data.datePeriod}
                </div>
                
                <div className="flex flex-col md:flex-row justify-between items-end gap-12">
                  <div className="flex-1">
                    <h1 className="text-6xl md:text-8xl font-black uppercase leading-[0.85] tracking-tighter mb-6">
                      Email Marketing<br/>Case Study
                    </h1>
                    <div className="w-24 h-3 bg-stone-900 rounded-full" />
                  </div>
                  {data.clientLogo && (
                    <div className="bg-white/30 backdrop-blur-xl p-6 rounded-[40px] shadow-2xl border border-white/20">
                      <img src={data.clientLogo} alt="Client Logo" className="h-20 w-auto object-contain" />
                    </div>
                  )}
                </div>
                
                <div className="mt-12 pt-12 border-t border-stone-800/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <p className="text-xl font-black uppercase tracking-widest text-stone-800">
                    Prepared for: <span className="text-stone-950 underline decoration-4 decoration-stone-900/20">{data.reportTitle}</span>
                  </p>
                  <p className="text-sm font-bold uppercase tracking-widest opacity-60">Confidential Report</p>
                </div>
             </div>
          </div>

          {/* Bento Grid: Summary & Recommendations */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <BentoCard className="md:col-span-8 flex flex-col justify-between border-l-[16px] border-[#E8B931] bg-white group hover:translate-y-[-4px]">
               <h3 className="text-2xl font-black uppercase flex items-center gap-4 mb-8">
                 <div className="w-10 h-10 bg-[#E8B931] rounded-2xl flex items-center justify-center text-stone-900 shadow-lg">
                   <FileText size={20} />
                 </div>
                 Executive Summary
               </h3>
               <p className="text-stone-600 text-xl font-medium leading-[1.5] italic pr-8">
                "{data.summary}"
               </p>
               <div className="mt-12 flex items-center gap-3 text-stone-400 font-black uppercase text-[10px] tracking-widest">
                  <div className="w-8 h-1 bg-slate-100 rounded-full" />
                  Insight Analysis
               </div>
            </BentoCard>

            <BentoCard className="md:col-span-4 bg-amber-50/50 border-amber-200/50 flex flex-col hover:bg-amber-50 group transition-colors">
               <h3 className="text-sm font-black uppercase text-amber-700 mb-8 flex items-center gap-3 tracking-widest">
                 <div className="p-2 bg-stone-900 rounded-lg text-[#E8B931] group-hover:scale-110 transition-transform">
                   <TrendingUp size={14} />
                 </div>
                 Strategic Shifts
               </h3>
               <div className="space-y-6 flex-1">
                 {data.recommendations.map((rec, i) => (
                   <div key={i} className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-stone-900 text-[#E8B931] flex items-center justify-center font-black text-xs shadow-md">
                        {i + 1}
                      </div>
                      <p className="text-sm font-bold text-stone-700 leading-tight pt-1 group-hover:text-stone-900">
                        {rec}
                      </p>
                   </div>
                 ))}
               </div>
            </BentoCard>
          </div>

          {/* Metrics Row: 3 Premium Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { label: "Contact Count", val: data.contactCount, icon: <Users size={28}/>, accent: '#E8B931', prefix: '' },
                { label: "Deal Velocity", val: data.dealCount, icon: <Briefcase size={28}/>, accent: '#1a1a1a', prefix: '' },
                { label: "Estimated Value", val: data.dealsValue, icon: <TrendingUp size={28}/>, accent: '#E8B931', prefix: '$' }
              ].map((m, i) => (
                <BentoCard key={i} className="flex items-center gap-8 group hover:shadow-xl hover:border-[#E8B931] transition-all">
                   <div className="w-20 h-20 rounded-[28px] flex items-center justify-center text-white shadow-2xl transition-transform group-hover:scale-110 group-hover:rotate-3" style={{ backgroundColor: m.accent }}>
                     {m.icon}
                   </div>
                   <div>
                     <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2">{m.label}</p>
                     <p className="text-4xl font-black text-stone-900 tracking-tighter">{m.prefix}{formatNumber(m.val)}</p>
                   </div>
                </BentoCard>
              ))}
          </div>

          {/* Charts Section: High Fidelity Visuals */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
             <BentoCard className="md:col-span-8 group">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
                   <div>
                     <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">Sent vs. Opens</h3>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Time-series engagement analysis</p>
                   </div>
                   <div className="flex gap-6">
                     <div className="flex items-center gap-3">
                        <div className="w-12 h-1.5 rounded-full bg-[#E8B931] group-hover:w-16 transition-all" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Sent</span>
                     </div>
                     <div className="flex items-center gap-3">
                        <div className="w-12 h-1.5 rounded-full bg-stone-900 group-hover:w-16 transition-all" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Opens</span>
                     </div>
                   </div>
                </div>
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.growthLabels.map((l, i) => ({ name: l, sent: data.growthContacts[i] || 0, opens: data.growthDeals[i] || 0 }))}>
                      <defs>
                        <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#E8B931" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#E8B931" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} fontWeight={900} dy={10} />
                      <YAxis axisLine={false} tickLine={false} fontSize={10} fontWeight={900} />
                      <Tooltip contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                      <Area type="monotone" dataKey="sent" stroke="#E8B931" strokeWidth={5} fillOpacity={1} fill="url(#colorSent)" />
                      <Area type="monotone" dataKey="opens" stroke="#1a1a1a" strokeWidth={5} fill="transparent" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
             </BentoCard>

             <BentoCard className="md:col-span-4 flex flex-col justify-center items-center text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#E8B931]/5 rounded-full -mr-12 -mt-12" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-12 text-slate-400">Database Conversion</h3>
                <div className="relative w-56 h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[{ name: 'Contact vs Deal', value: 38 }, { name: 'Untapped', value: 62 }]}
                        innerRadius={75}
                        outerRadius={100}
                        paddingAngle={8}
                        dataKey="value"
                        stroke="none"
                      >
                        <Cell fill="#E8B931" />
                        <Cell fill="#f1f5f9" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-6xl font-black text-stone-900 tracking-tighter">38%</span>
                    <span className="text-[12px] font-black text-slate-400 uppercase tracking-widest mt-2">Deal Ratio</span>
                  </div>
                </div>
                <p className="mt-12 text-[11px] font-bold text-stone-500 leading-relaxed max-w-[200px]">
                  Highest performing bucket identified in <span className="text-stone-900 font-black underline decoration-2 decoration-[#E8B931]">new entries</span>.
                </p>
             </BentoCard>
          </div>

          {/* Email Clicks Funnel */}
          <BentoCard className="bg-white group overflow-hidden">
             <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
                <div className="md:col-span-7 flex flex-col gap-4">
                   <div className="bg-[#ef4444] text-white p-8 rounded-[36px] flex justify-between items-center transform -skew-x-2 shadow-xl hover:scale-[1.02] transition-transform">
                       <div className="flex items-center gap-6">
                         <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center font-black">01</div>
                         <span className="text-lg font-black uppercase tracking-widest">Total Emails Sent</span>
                       </div>
                       <span className="text-3xl font-black">{formatNumber(data.metricsEmailsSent)}</span>
                    </div>
                    <div className="bg-[#1a1a1a] text-white p-8 rounded-[36px] flex justify-between items-center transform -skew-x-2 shadow-xl hover:scale-[1.02] transition-transform ml-4">
                       <div className="flex items-center gap-6">
                         <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center font-black">02</div>
                         <span className="text-lg font-black uppercase tracking-widest">Opened Interactions</span>
                       </div>
                       <span className="text-3xl font-black">{formatNumber(data.metricsOpens)}</span>
                    </div>
                    <div className="bg-[#E8B931] text-stone-900 p-8 rounded-[36px] flex justify-between items-center transform -skew-x-2 shadow-xl hover:scale-[1.02] transition-transform ml-8 border-4 border-white/50">
                       <div className="flex items-center gap-6">
                         <div className="w-12 h-12 bg-stone-900/20 rounded-2xl flex items-center justify-center font-black">03</div>
                         <span className="text-lg font-black uppercase tracking-widest">Engagement Clicks</span>
                       </div>
                       <span className="text-3xl font-black">{formatNumber(data.linkClicksTotal)}</span>
                    </div>
                </div>
                <div className="md:col-span-5 text-center p-12 bg-stone-950 text-[#E8B931] rounded-[60px] border-[12px] border-slate-50 flex flex-col items-center justify-center shadow-[0_45px_70px_-20px_rgba(0,0,0,0.5)]">
                    <p className="text-[12px] font-black uppercase tracking-[0.4em] mb-6 opacity-60">Funnel Conversion Rate</p>
                    <p className="text-[120px] font-black italic tracking-tighter leading-none mb-4 -mx-10 select-none">38.16%</p>
                    <div className="w-32 h-2 bg-[#E8B931] rounded-full mt-4" />
                </div>
             </div>
          </BentoCard>

          {/* Campaigns Performance Table */}
          <div className="pt-12">
            <h3 className="text-3xl font-black uppercase mb-12 flex items-center gap-6">
              <div className="w-1.5 h-12 bg-[#E8B931] rounded-full" />
              Campaigns Performance
            </h3>
            <div className="overflow-x-auto pb-8">
              <table className="w-full border-separate border-spacing-y-4">
                <thead>
                  <tr className="text-left text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">
                    <th className="px-10 py-6">Identity</th>
                    <th className="px-10 py-6">Impression</th>
                    <th className="px-10 py-6">Interaction</th>
                    <th className="px-10 py-6">Efficiency</th>
                    <th className="px-10 py-6 text-right">Activity</th>
                  </tr>
                </thead>
                <tbody>
                  {data.campaignsPerformance.map((row, i) => (
                    <tr key={i} className="bg-white rounded-[32px] group hover:scale-[1.01] transition-all cursor-default shadow-sm hover:shadow-xl">
                      <td className="px-10 py-8 rounded-l-[32px] font-black text-stone-950 border-y-2 border-l-2 border-transparent group-hover:border-[#E8B931]/20">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-black text-[10px] text-slate-400">
                            {String(i + 1).padStart(2, '0')}
                          </div>
                          {row.name}
                        </div>
                      </td>
                      <td className="px-10 py-8 text-stone-600 font-bold border-y-2 border-transparent group-hover:border-[#E8B931]/20">
                        {formatNumber(row.sent)}
                      </td>
                      <td className="px-10 py-8 text-stone-600 font-bold border-y-2 border-transparent group-hover:border-[#E8B931]/20">
                        {formatNumber(row.opens)}
                      </td>
                      <td className="px-10 py-8 font-black text-[#E8B931] text-lg border-y-2 border-transparent group-hover:border-[#E8B931]/20">
                        {row.openRate}%
                      </td>
                      <td className="px-10 py-8 rounded-r-[32px] text-right font-black text-stone-950 border-y-2 border-r-2 border-transparent group-hover:border-[#E8B931]/20 group-hover:text-[#E8B931]">
                        {formatNumber(row.linkClicks)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-20 pt-12 border-t border-slate-200 text-center flex flex-col items-center">
             <div className="w-20 h-20 bg-stone-900 text-[#E8B931] rounded-[24px] flex items-center justify-center mb-6 shadow-2xl">
               <Mail size={32} />
             </div>
             <p className="text-sm font-black uppercase tracking-[0.4em] text-slate-400 mb-2">Automated Report Generator</p>
             <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">Built for performance markers & growth engineers</p>
          </div>

        </div>
      </main>
    </div>
  );
}

// Sidebar Helpers
function BentoCard({ children, className, ...props }: { children: React.ReactNode, className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props} className={cn("bg-white border-2 border-slate-100 rounded-[40px] shadow-sm p-8 transition-all duration-300", className)}>
      {children}
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
