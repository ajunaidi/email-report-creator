/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  BarChart3, Users, Mail, TrendingUp, MousePointerClick, 
  LogOut, MessageSquare, Download, Settings2, Briefcase, ExternalLink, Filter, Plus, Trash2, Palette, Image as ImageIcon, FileText,
  Share2, LogIn, User as UserIcon, Loader2, Save, Menu, X, Link as LinkIcon
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { cn } from './lib/utils';
import { ReportData, CampaignPerformanceRow } from './types';
import { MOCK_FULL_DATA } from './mockData';
import { ReportHeader } from './components/ReportHeader';
import { SummarySection, MetricCardSmall } from './components/ReportSections';
import { EmailPerformanceTable, GoalTracker } from './components/TableSections';
import { GrowthChart, DistributionChart, FunnelDisplay } from './components/ChartSections';
import { Line } from 'react-chartjs-2';
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
      setIsSaving(true);
      try {
        const id = await saveReport(currentId, currentData);
        if (!currentId) {
          setReportId(id);
          const newUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}?reportId=${id}`;
          window.history.pushState({ path: newUrl }, '', newUrl);
        }
      } catch (err) {
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
    const element = reportRef.current;
    
    // Create a styled clone for PDF capture
    const captureWrapper = document.createElement('div');
    captureWrapper.id = 'pdf-capture-wrapper';
    captureWrapper.style.backgroundColor = data.themeColor;
    captureWrapper.style.padding = '60px';
    captureWrapper.style.width = '1200px'; 
    captureWrapper.style.position = 'fixed';
    captureWrapper.style.top = '-20000px'; // Move further away
    captureWrapper.style.left = '-10000px';
    captureWrapper.style.fontFamily = fontFamilyMap[data.fontFamily];
    captureWrapper.style.setProperty('--accent-color', data.accentColor);
    captureWrapper.style.setProperty('--card-bg', data.cardColor);
    captureWrapper.style.setProperty('--report-text', data.textColor);
    captureWrapper.style.setProperty('--card-radius', borderRadiusMap[data.borderRadius]);
    
    // Deep clone the element to preserve structure
    const clone = element.cloneNode(true) as HTMLElement;
    captureWrapper.appendChild(clone);
    document.body.appendChild(captureWrapper);

    // CRITICAL: Copy canvas content from original to clone
    const originalCanvases = element.querySelectorAll('canvas');
    const clonedCanvases = clone.querySelectorAll('canvas');
    
    originalCanvases.forEach((originalCanvas, index) => {
      const clonedCanvas = clonedCanvases[index] as HTMLCanvasElement;
      if (clonedCanvas) {
        const destCtx = clonedCanvas.getContext('2d');
        if (destCtx) {
          destCtx.drawImage(originalCanvas, 0, 0);
        }
      }
    });

    try {
      // Wait for layout and images
      await new Promise(resolve => setTimeout(resolve, 800));

      const canvas = await html2canvas(captureWrapper, {
        scale: 2,
        useCORS: true,
        backgroundColor: data.themeColor,
        windowWidth: 1200,
        logging: false,
        onclone: (clonedDoc) => {
          const wrapper = clonedDoc.getElementById('pdf-capture-wrapper');
          if (wrapper) {
            wrapper.style.top = '0';
            wrapper.style.left = '0';
          }
        }
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      
      // Calculate dimensions for a SINGLE long page
      // jsPDF units are mm. 1200px at 72dpi is approx 423mm
      // But we use a standard width (e.g. 210mm for A4) and scale the height accordingly
      const pdfWidth = 210; 
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      const pdf = new jsPDF('p', 'mm', [pdfWidth, pdfHeight]);
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      
      pdf.save(`Report_${data.reportTitle.replace(/\s+/g, '_')}_${Date.now()}.pdf`);
    } catch (err) {
      console.error("PDF generation failed", err);
    } finally {
      document.body.removeChild(captureWrapper);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setData({ ...data, clientLogo: reader.result as string });
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
      {/* Sidebar - Control Panel */}
      <aside 
        id="sidebar-editor" 
        className={cn(
          "w-full md:w-[380px] bg-stone-900 text-white overflow-y-auto border-r border-stone-800 p-6 space-y-6 scrollbar-thin transition-all duration-300 fixed md:relative z-40 h-full",
          !isSidebarOpen || isViewerMode ? "-translate-x-full md:hidden" : "translate-x-0"
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

            <div>
              <label className="block text-[9px] font-bold text-stone-600 uppercase mb-1">Brand Logo</label>
              <label className="flex items-center gap-2 cursor-pointer bg-stone-800 border border-stone-700 rounded-lg p-3 hover:bg-stone-700 transition-all">
                <ImageIcon size={14} className="text-mustard" />
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
            </div>
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
      <main className="flex-1 overflow-y-auto px-4 py-8 md:px-12 scroll-smooth pb-40 relative">
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

        {isViewerMode && !isLoading && (
          <div className="max-w-[1000px] mx-auto mb-8 flex items-center justify-between gap-4 p-4 rounded-2xl bg-stone-900/40 backdrop-blur-md shadow-2xl border border-stone-700/50">
             <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-mustard rounded-lg flex items-center justify-center text-stone-900"><Mail size={16} /></div>
                <p className="text-[10px] font-black uppercase tracking-widest text-white">Preview Content</p>
             </div>
             <div className="flex gap-2">
                <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-lg text-[10px] font-bold uppercase tracking-tight hover:bg-white/20 transition-all border border-white/10">
                    <FileText size={14} /> PDF
                </button>
                <button onClick={handleDownloadHTML} className="flex items-center gap-2 px-4 py-2 bg-mustard text-stone-900 rounded-lg text-[10px] font-bold uppercase tracking-tight hover:opacity-90 transition-all">
                    <Download size={14} /> HTML
                </button>
             </div>
          </div>
        )}
        <div 
          ref={reportRef} 
          className="max-w-[1000px] mx-auto space-y-8 bg-transparent"
          style={{
            '--accent-color': data.accentColor,
            '--card-bg': data.cardColor,
            '--report-text': data.textColor,
            '--card-radius': borderRadiusMap[data.borderRadius],
            fontFamily: fontFamilyMap[data.fontFamily]
          } as React.CSSProperties}
        >
          
          <ReportHeader title={data.reportTitle} date={data.datePeriod} activeTab="General" logo={data.clientLogo} />

          {/* Row 1: Goals */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GoalTracker 
              title="Deals and Conversion Goals"
              label1="Contact Count" val1={data.conversionCount} max1={data.conversionGoal} color1={data.accentColor}
              label2="Deal Count" val2={data.dealsCount} max2={data.dealsGoal} color2={data.textColor}
            />
            <div className="report-card flex flex-col justify-between">
              <h3 className="font-bold text-stone-900 text-xs uppercase tracking-wide mb-4">List of Deals and Contacts</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs font-bold">
                   <div className="flex items-center gap-2 text-stone-500"><Users size={14}/> Contact Count</div>
                   <span className="text-stone-800">{data.listContacts.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-bold">
                   <div className="flex items-center gap-2 text-stone-500"><Briefcase size={14}/> Deal Count</div>
                   <span className="text-stone-800">{data.listDeals.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <SummarySection summary={data.summary} recommendations={data.recommendations} />

          {/* Row 3: Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <MetricCardSmall title="Contact Count" value={data.contactCount.toLocaleString()} label="Contact Count" icon={<Users size={20} style={{color: data.accentColor}} />} desc="Displays the total count of contacts as a single value." color={data.accentColor} />
             <MetricCardSmall title="Deal Count" value={data.dealCount.toLocaleString()} label="Deal Count" icon={<Briefcase size={20} style={{color: data.textColor}} />} desc="Number of deals (in all accounts)" color={data.textColor} />
             <MetricCardSmall title="Deals Value" value={`$${data.dealsValue.toLocaleString()}`} label="Value" icon={<TrendingUp size={20} style={{color: data.accentColor}} />} desc="Total value of all deals" color={data.accentColor} />
          </div>

          {/* Row 4: Comparison Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             <GrowthChart labels={data.growthLabels} contacts={data.growthContacts} deals={data.growthDeals} accentColor={data.accentColor} textColor={data.textColor} />
             <DistributionChart contacts={data.contactCount} deals={data.dealCount} accentColor={data.accentColor} textColor={data.textColor} />
          </div>

          {/* Row 5: Deals Value List */}
          <div className="report-card">
             <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-stone-900 text-sm uppercase tracking-wide">Deals value</h3>
                <span className="text-[10px] font-bold text-stone-400 uppercase flex items-center gap-1">Value <TrendingUp size={10}/></span>
             </div>
             <div className="space-y-3">
                {data.dealSources.map(s => (
                  <div key={s.id} className="flex justify-between border-b border-stone-50 pb-2 text-sm">
                    <span className="text-stone-600 truncate">{s.source}</span>
                    <span className="font-bold text-stone-800">{s.value.toLocaleString()}</span>
                  </div>
                ))}
             </div>
          </div>

          {/* Row 6: Engagement Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="report-card">
              <h3 className="font-bold text-stone-900 mb-6 text-xs uppercase tracking-wide">Email Engagement Goals</h3>
              <div className="space-y-4">
                <MiniProgress label="Total Emails Sent" val={data.actualSent} max={data.emailsSentGoal} color={data.accentColor} />
                <MiniProgress label="Total Opens" val={data.actualOpens} max={data.emailsOpenedGoal} color={data.textColor} />
                <MiniProgress label="Total Link Clicks" val={data.actualClicks} max={data.linkClicksGoal} color={data.accentColor} />
              </div>
            </div>
            <div className="report-card flex flex-col justify-between">
              <h3 className="font-bold text-stone-900 text-xs uppercase tracking-wide mb-4">Campaign Engagement List</h3>
              <div className="space-y-3">
                <MetricRow icon={<Mail size={14}/>} label="Emails Sent" val={data.actualSent} />
                <MetricRow icon={<ExternalLink size={14}/>} label="Opens" val={data.actualOpens} />
                <MetricRow icon={<MousePointerClick size={14}/>} label="Link Clicks" val={data.actualClicks} />
                <MetricRow icon={<MessageSquare size={14}/>} label="Replies" val={data.actualReplies} />
              </div>
            </div>
          </div>

          {/* Row 7: Major Engagement Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <MetricCardSmall title="Total Emails Sent" value={data.metricsEmailsSent.toLocaleString()} label="Emails Sent" icon={<Mail size={20} style={{color: data.accentColor}} />} color={data.accentColor} />
             <MetricCardSmall title="Opens" value={data.metricsOpens.toLocaleString()} label="Opens" icon={<ExternalLink size={20} style={{color: data.textColor}} />} color={data.textColor} />
             <MetricCardSmall title="Open Rate" value={data.metricsOpenRate} label="Open Rate" icon={<TrendingUp color={data.metricsOpenRate.startsWith('-') ? '#ef4444' : data.textColor} size={20}/>} color={data.cardColor}/>
          </div>

          {/* Row 8: Sent vs Opens Trend */}
          <div className="report-card">
             <h3 className="font-bold text-stone-900 mb-6 text-xs uppercase tracking-wide">Sent vs. Opens</h3>
             <div className="h-[250px]">
                <Line data={{
                  labels: data.growthLabels,
                  datasets: [
                    { label: 'Sent', data: data.sentTrend, borderColor: '#1e1b4b', backgroundColor: 'transparent', tension: 0.1, borderWidth: 2 },
                    { label: 'Opens', data: data.opensTrend, borderColor: '#ef4444', backgroundColor: 'transparent', tension: 0.1, borderWidth: 2 },
                  ]
                }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />
             </div>
          </div>

          {/* Click Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <MetricCardSmall title="Link clicks" value={data.linkClicksTotal.toLocaleString()} label="Link Clicks" icon={<MousePointerClick size={20}/>} />
             <MetricCardSmall title="Link Click Rate" value={data.linkClickRateStr} label="Rate" icon={<Filter color={data.linkClickRateStr.startsWith('-') ? '#ef4444' : '#1e1b4b'} size={20}/>} />
          </div>

          {/* Funnel and Engagement Overlap */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             <FunnelDisplay sent={data.funnelSent} opened={data.funnelOpened} clicked={data.funnelClicked} accentColor={data.accentColor} textColor={data.textColor} />
             <div className="report-card lg:col-span-2">
                <h3 className="font-bold text-stone-900 mb-6 text-xs uppercase tracking-wide">Sent/opened emails</h3>
                <div className="h-[280px]">
                   <Line data={{
                     labels: data.growthLabels,
                     datasets: [
                       { label: 'Total Opens', data: data.engagementOpensTrend, borderColor: '#ef4444', backgroundColor: 'transparent', tension: 0.3 },
                       { label: 'Total Link Clicks', data: data.engagementClicksTrend, borderColor: '#1e1b4b', backgroundColor: 'transparent', tension: 0.3 },
                     ]
                   }} options={{ responsive: true, maintainAspectRatio: false }} />
                </div>
             </div>
          </div>

          {/* Unsubcribes & Footer Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <MetricCardSmall title="Unsubscribes" value={data.unsubscribes.toLocaleString()} label="Unsubscribes" icon={<LogOut size={20}/>} />
             <MetricCardSmall title="Unsubscribe Rate" value={data.unsubscribeRateStr} label="Rate" icon={<Users size={20}/>} />
             <MetricCardSmall title="Replies" value={data.repliesTotal.toLocaleString()} label="Replies" icon={<MessageSquare size={20}/>} />
          </div>

          <EmailPerformanceTable rows={data.campaignsPerformance} />

        </div>
      </main>
    </div>
  );
}

// Sidebars Helpers
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
        <span className="text-stone-800">{val.toLocaleString()} / {max.toLocaleString()}</span>
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
       <span className="text-stone-800">{val.toLocaleString()}</span>
    </div>
  );
}
