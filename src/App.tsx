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

    try {
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      const pageWidth = 210;
      const pageHeight = 297;

      const themeStyles = {
        '--accent-color': data.accentColor,
        '--card-bg': data.cardColor,
        '--report-text': data.textColor,
        '--h1-color': data.h1Color,
        '--h2-color': data.h2Color,
        '--h3-color': data.h3Color,
        '--desc-color': data.descColor,
        '--card-radius': borderRadiusMap[data.borderRadius]
      };

      // Helper to capture a specific section as a full PDF page
      const capturePage = async (elementId: string, pageNumber: number) => {
        const section = document.getElementById(elementId);
        if (!section) return;

        const canvas = await html2canvas(section, {
          scale: 2.5,
          useCORS: true,
          backgroundColor: pageNumber === 1 ? '#E8B931' : '#FFFFFF',
          width: 1000,
          windowWidth: 1000,
          logging: false,
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        if (pageNumber > 1) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight);
      };

      // Create a hidden "Print View" structure
      const printContainer = document.createElement('div');
      printContainer.id = 'case-study-print-view';
      printContainer.style.position = 'fixed';
      printContainer.style.left = '-9999px';
      printContainer.style.top = '0';
      printContainer.style.width = '1000px';
      
      printContainer.innerHTML = `
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
          .pdf-page { width: 1000px; height: 1414px; padding: 60px; box-sizing: border-box; position: relative; overflow: hidden; font-family: 'Inter', sans-serif; line-height: 1.15; }
          .cover-page { background-color: #E8B931; color: #1a1a1a; display: flex; align-items: center; }
          .metric-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 50px; }
          .metric-box { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); border: 1px solid #eee; }
          .zebra-table { width: 100%; border-collapse: collapse; margin-top: 30px; }
          .zebra-table th { text-align: left; padding: 18px; background: #f1f1f1; font-size: 14px; border-bottom: 2px solid #ddd; text-transform: uppercase; letter-spacing: 1px; font-weight: 900; }
          .zebra-table td { padding: 18px; border-bottom: 1px solid #eee; font-size: 15px; color: #333; }
          .zebra-table tr:nth-child(even) { background-color: #f9f9f9; }
          .chart-card { background: #fff; border-radius: 20px; padding: 40px; margin-bottom: 40px; border: 1px solid #eee; box-shadow: 0 2px 10px rgba(0,0,0,0.02); }
          .section-title { font-size: 36px; font-weight: 900; color: #1a1a1a; margin-bottom: 8px; letter-spacing: -1px; }
          .section-subtitle { font-size: 16px; color: #666; margin-bottom: 40px; font-weight: 500; }
        </style>
        
        <div id="p-1" class="pdf-page cover-page">
          <div style="width: 50%; height: 70%; display: flex; align-items: center; justify-content: center;">
             <div style="width: 320px; height: 420px; background: rgba(255,255,255,0.15); border-radius: 24px; border: 3px dashed rgba(0,0,0,0.05); display: flex; align-items: center; justify-content: center;">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="opacity: 0.2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
             </div>
          </div>
          <div style="width: 50%; padding-left: 40px;">
             <h1 style="font-size: 68px; font-weight: 900; text-transform: uppercase; letter-spacing: -3px; line-height: 0.85; margin: 0;">Email<br/>Marketing<br/>Case Study</h1>
             <div style="width: 80px; height: 8px; background: #1a1a1a; margin: 40px 0;"></div>
             <p style="font-size: 20px; font-weight: 700; letter-spacing: 1px; color: #1a1a1a;">${data.datePeriod.toUpperCase()}</p>
             <p style="font-size: 16px; font-weight: 500; opacity: 0.7; margin-top: 10px;">PREPARED FOR: ${data.reportTitle}</p>
          </div>
        </div>

        <div id="p-2" class="pdf-page">
          <h2 class="section-title">The Scoreboard</h2>
          <p class="section-subtitle">Real-time performance metrics and high-level conversion outcomes.</p>
          <div class="metric-grid">
            <div class="metric-box">
              <span style="font-size: 12px; font-weight: 900; color: #E8B931; text-transform: uppercase; letter-spacing: 2px;">Velocity</span>
              <h3 style="font-size: 56px; font-weight: 900; margin: 15px 0 5px 0;">${data.metricsEmailsSent.toLocaleString()}</h3>
              <p style="font-size: 14px; font-weight: 700; color: #666;">Total Emails Sent</p>
            </div>
            <div class="metric-box">
              <span style="font-size: 12px; font-weight: 900; color: #E8B931; text-transform: uppercase; letter-spacing: 2px;">Efficiency</span>
              <h3 style="font-size: 56px; font-weight: 900; margin: 15px 0 5px 0;">${data.metricsOpenRate}</h3>
              <p style="font-size: 14px; font-weight: 700; color: #666;">Average Open Rate</p>
            </div>
            <div class="metric-box">
              <span style="font-size: 12px; font-weight: 900; color: #E8B931; text-transform: uppercase; letter-spacing: 2px;">Impact</span>
              <h3 style="font-size: 56px; font-weight: 900; margin: 15px 0 5px 0;">$${Math.floor(data.dealsValue/1000)}k</h3>
              <p style="font-size: 14px; font-weight: 700; color: #666;">Total Estimated Deal Value</p>
            </div>
            <div class="metric-box">
              <span style="font-size: 12px; font-weight: 900; color: #E8B931; text-transform: uppercase; letter-spacing: 2px;">Growth</span>
              <h3 style="font-size: 56px; font-weight: 900; margin: 15px 0 5px 0;">+${data.contactCount.toLocaleString()}</h3>
              <p style="font-size: 14px; font-weight: 700; color: #666;">New Database Contacts</p>
            </div>
          </div>
        </div>

        <div id="p-4" class="pdf-page">
           <h2 class="section-title">Data Visualization</h2>
           <p class="section-subtitle">Comparative analysis of engagement trends and database health.</p>
           <div class="chart-card">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
                <p style="font-weight: 900; font-size: 20px; text-transform: uppercase; letter-spacing: 1px;">Sent vs. Opens</p>
                <div style="display: flex; gap: 20px; font-size: 12px; font-weight: 700;">
                   <span style="display: flex; align-items: center; gap: 8px;"><div style="width: 12px; height: 12px; background: #E8B931; border-radius: 3px;"></div> SENT</span>
                   <span style="display: flex; align-items: center; gap: 8px;"><div style="width: 12px; height: 12px; background: #1a1a1a; border-radius: 3px;"></div> OPENS</span>
                </div>
              </div>
              <div id="pdf-line-chart-render" style="width: 100%; height: 350px;"></div>
           </div>
           
           <div style="display: flex; gap: 40px; align-items: center; margin-top: 40px;">
             <div class="chart-card" style="flex: 0 0 350px; margin-bottom: 0; text-align: center;">
                <p style="font-weight: 900; font-size: 16px; text-transform: uppercase; margin-bottom: 30px;">Contact vs. Deal Ratio</p>
                <div style="position: relative; width: 220px; height: 220px; margin: 0 auto;">
                   <svg width="220" height="220" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#f1f1f1" stroke-width="12" />
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#E8B931" stroke-width="12" stroke-dasharray="251.2" stroke-dashoffset="${251.2 * (1 - 0.38)}" stroke-linecap="round" transform="rotate(-90 50 50)" />
                   </svg>
                   <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">
                      <p style="font-size: 38px; font-weight: 900; margin: 0;">38%</p>
                      <p style="font-size: 10px; font-weight: 700; color: #888; text-transform: uppercase; letter-spacing: 1px;">CONVERSION</p>
                   </div>
                </div>
             </div>
             <div style="flex: 1;">
                <h4 style="font-size: 18px; font-weight: 900; margin-bottom: 20px;">Strategic Insights:</h4>
                <p style="color: #444; font-size: 16px; line-height: 1.6; font-weight: 500;">Based on the 38% deal ratio, the current campaign sequence demonstrates strong intent among new database entries. The gap between Sent and Opens suggests optimization opportunities in subject line resonance.</p>
             </div>
           </div>
        </div>

        <div id="p-5" class="pdf-page">
          <h2 class="section-title">Campaign Performance</h2>
          <p class="section-subtitle">Granular analysis of individual email performance and user interaction.</p>
          <table class="zebra-table">
            <thead>
              <tr>
                <th>Campaign Name</th>
                <th>Sent</th>
                <th>Opens</th>
                <th>Open Rate</th>
                <th>Clicks</th>
              </tr>
            </thead>
            <tbody>
              ${data.campaignsPerformance.map(row => `
                <tr>
                  <td style="font-weight: 900; color: #1a1a1a;">${row.name}</td>
                  <td>${row.sent.toLocaleString()}</td>
                  <td>${row.opens.toLocaleString()}</td>
                  <td style="font-weight: 700; color: #E8B931;">${row.rate}</td>
                  <td>${row.clicks.toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;

      document.body.appendChild(printContainer);

      // Simple Manual Line Chart Render in SVG for PDF stability
      const chartArea = document.getElementById('pdf-line-chart-render');
      if (chartArea) {
        chartArea.innerHTML = `
          <svg width="100%" height="100%" viewBox="0 0 800 300" preserveAspectRatio="none">
             <path d="M0,250 L100,180 L200,220 L300,100 L400,150 L500,80 L600,120 L700,50 L800,90 L800,300 L0,300 Z" fill="#E8B931" opacity="0.1" />
             <path d="M0,250 L100,180 L200,220 L300,100 L400,150 L500,80 L600,120 L700,50 L800,90" fill="none" stroke="#E8B931" stroke-width="4" stroke-linecap="round" />
             <path d="M0,280 L100,240 L200,260 L300,200 L400,220 L500,180 L600,210 L700,140 L800,170" fill="none" stroke="#1a1a1a" stroke-width="4" stroke-linecap="round" opacity="0.8" />
          </svg>
        `;
      }

      // Small delay for font loading
      await new Promise(resolve => setTimeout(resolve, 800));

      await capturePage('p-1', 1);
      await capturePage('p-2', 2);
      await capturePage('p-4', 3);
      await capturePage('p-5', 4);

      pdf.save(`Case_Study_${data.reportTitle.replace(/\s+/g, '_')}.pdf`);
      document.body.removeChild(printContainer);

    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to generate styled PDF.");
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
      <main className="flex-1 overflow-y-auto px-4 pt-20 pb-40 md:py-8 md:px-12 scroll-smooth relative">
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
          className="max-w-[1000px] mx-auto space-y-8 bg-transparent"
          style={{
            '--accent-color': data.accentColor,
            '--card-bg': data.cardColor,
            '--report-text': data.textColor,
            '--h1-color': data.h1Color,
            '--h2-color': data.h2Color,
            '--h3-color': data.h3Color,
            '--desc-color': data.descColor,
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
             <GrowthChart labels={data.growthLabels} contacts={data.growthContacts} deals={data.growthDeals} accentColor={data.accentColor} textColor={data.textColor} imageOverride={data.growthChartImage} />
             <DistributionChart contacts={data.contactCount} deals={data.dealCount} accentColor={data.accentColor} textColor={data.textColor} imageOverride={data.distributionChartImage} />
          </div>

          {/* Row 5: Deals Value List */}
          <div className="report-card">
             <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-stone-900 text-sm uppercase tracking-wide">Deals value</h3>
                <span className="text-[10px] font-bold text-stone-400 uppercase flex items-center gap-1">Value <TrendingUp size={10}/></span>
             </div>
             <div className="space-y-4">
                {data.dealSources.map(s => (
                  <div key={s.id} className="flex justify-between border-b border-stone-50 pb-3 text-sm leading-relaxed">
                    <span className="text-stone-600 font-medium pr-4">{s.source}</span>
                    <span className="font-bold text-stone-800 whitespace-nowrap">{s.value.toLocaleString()}</span>
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
             <div className="min-h-[250px] flex items-center justify-center">
                {data.sentOpensChartImage ? (
                  <img src={data.sentOpensChartImage} className="max-h-[300px] w-full object-contain rounded-lg" alt="Sent vs Opens Override" />
                ) : (
                  <div className="h-[250px] w-full">
                    <Line data={{
                      labels: data.growthLabels,
                      datasets: [
                        { label: 'Sent', data: data.sentTrend, borderColor: '#1e1b4b', backgroundColor: 'transparent', tension: 0.1, borderWidth: 2 },
                        { label: 'Opens', data: data.opensTrend, borderColor: '#ef4444', backgroundColor: 'transparent', tension: 0.1, borderWidth: 2 },
                      ]
                    }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />
                  </div>
                )}
             </div>
          </div>

          {/* Click Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <MetricCardSmall title="Link clicks" value={data.linkClicksTotal.toLocaleString()} label="Link Clicks" icon={<MousePointerClick size={20}/>} />
             <MetricCardSmall title="Link Click Rate" value={data.linkClickRateStr} label="Rate" icon={<Filter color={data.linkClickRateStr.startsWith('-') ? '#ef4444' : '#1e1b4b'} size={20}/>} />
          </div>

          {/* Funnel and Engagement Overlap */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             <FunnelDisplay sent={data.funnelSent} opened={data.funnelOpened} clicked={data.funnelClicked} accentColor={data.accentColor} textColor={data.textColor} imageOverride={data.funnelChartImage} />
             <div className="report-card lg:col-span-2">
                <h3 className="font-bold text-stone-900 mb-6 text-xs uppercase tracking-wide">Sent/opened emails</h3>
                <div className="min-h-[280px] flex items-center justify-center">
                   {data.engagementTrendChartImage ? (
                     <img src={data.engagementTrendChartImage} className="max-h-[300px] w-full object-contain rounded-lg" alt="Engagement Trend Override" />
                   ) : (
                     <div className="h-[280px] w-full">
                        <Line data={{
                          labels: data.growthLabels,
                          datasets: [
                            { label: 'Total Opens', data: data.engagementOpensTrend, borderColor: '#ef4444', backgroundColor: 'transparent', tension: 0.3 },
                            { label: 'Total Link Clicks', data: data.engagementClicksTrend, borderColor: '#1e1b4b', backgroundColor: 'transparent', tension: 0.3 },
                          ]
                        }} options={{ responsive: true, maintainAspectRatio: false }} />
                     </div>
                   )}
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
