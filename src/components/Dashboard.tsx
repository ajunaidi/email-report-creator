import React, { useEffect, useState } from 'react';
import { getUserReports, ReportDocument, deleteReport } from '../services/reportService';
import { seedInitialData } from '../services/seedService';
import { 
  Plus, FileText, Calendar, ChevronRight, Loader2, Trash2, 
  LayoutDashboard, Search, LogOut, Clock, ExternalLink, Download 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { cn } from '../lib/utils';

interface DashboardProps {
  onNewReport: () => void;
  onSelectReport: (id: string) => void;
}

export function Dashboard({ onNewReport, onSelectReport }: DashboardProps) {
  const [reports, setReports] = useState<ReportDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadReports(true);
  }, []);

  const loadReports = async (isInitialLog = false) => {
    setLoading(true);
    try {
      // Remove automatic seeding as requested by user
      const data = await getUserReports();

      const sortedData = data.sort((a, b) => {
        const timeA = a.updatedAt?.toMillis() || a.createdAt?.toMillis() || 0;
        const timeB = b.updatedAt?.toMillis() || b.createdAt?.toMillis() || 0;
        return timeB - timeA;
      });
      setReports(sortedData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!id || deletingId) return;
    
    if (!confirm('Are you sure you want to delete this report? This action cannot be undone.')) return;
    
    setDeletingId(id);
    const originalReports = [...reports];
    
    try {
      console.log('Attempting to delete report:', id);
      // Remove from UI immediately for better "feel"
      setReports(prev => prev.filter(r => r.id !== id));
      
      await deleteReport(id);
      console.log('Report deleted successfully from Firestore:', id);
      alert('Report deleted successfully.');
    } catch (err) {
      console.error('Delete failed:', err);
      // Revert if failed
      setReports(originalReports);
      
      let errorMsg = 'Failed to delete report from database.';
      if (err instanceof Error) {
        try {
          const parsed = JSON.parse(err.message);
          if (parsed.error && parsed.error.includes('permissions')) {
            errorMsg = 'Permission denied: You do not have permission to delete this report.';
          }
        } catch {
          errorMsg = `Error: ${err.message}`;
        }
      }
      alert(errorMsg);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredReports = reports.filter(r => 
    r.reportTitle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const [isCreating, setIsCreating] = useState(false);
  const [newReportParams, setNewReportParams] = useState({
    pageSize: 'A4' as 'A1' | 'A2' | 'A3' | 'A4' | 'A5',
    orientation: 'portrait' as 'portrait' | 'landscape'
  });

  const handleStartCreation = () => {
    setIsCreating(true);
  };

  const confirmCreation = () => {
    // We'll pass these to onNewReport
    (onNewReport as any)(newReportParams.pageSize, newReportParams.orientation);
    setIsCreating(false);
  };

  return (
    <div className="min-h-screen bg-stone-50 font-sans flex relative">
      {/* Create Modal */}
      <AnimatePresence>
        {isCreating && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreating(false)}
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-xl bg-white rounded-[40px] shadow-2xl p-10 overflow-hidden"
            >
              <h2 className="text-4xl font-black text-stone-900 tracking-tighter mb-2">Configure Page.</h2>
              <p className="text-stone-400 font-bold mb-8">Choose your canvas size and orientation before starting.</p>

              <div className="space-y-8">
                <section>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-4">Standard Sizes</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {['A1', 'A2', 'A3', 'A4', 'A5'].map((size) => (
                      <button 
                        key={size}
                        onClick={() => setNewReportParams({ ...newReportParams, pageSize: size as any })}
                        className={cn(
                          "h-16 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-1",
                          newReportParams.pageSize === size 
                            ? "bg-mustard border-mustard text-stone-900 shadow-lg shadow-mustard/20" 
                            : "bg-white border-stone-100 text-stone-400 hover:border-mustard"
                        )}
                      >
                        <span className="text-lg font-black">{size}</span>
                        <span className="text-[8px] font-bold uppercase opacity-60">ISO Standard</span>
                      </button>
                    ))}
                  </div>
                </section>

                <section>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-4">Orientation</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => setNewReportParams({ ...newReportParams, orientation: 'portrait' })}
                      className={cn(
                        "p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-4",
                        newReportParams.orientation === 'portrait'
                          ? "bg-stone-900 border-stone-900 text-white shadow-xl"
                          : "bg-stone-50 border-stone-50 text-stone-400 hover:border-mustard"
                      )}
                    >
                      <div className="w-12 h-16 border-2 border-current rounded-sm opacity-60 flex items-center justify-center">
                        <div className="w-1 h-8 bg-current opacity-20" />
                      </div>
                      <span className="text-xs font-black uppercase tracking-widest">Portrait</span>
                    </button>
                    <button 
                      onClick={() => setNewReportParams({ ...newReportParams, orientation: 'landscape' })}
                      className={cn(
                        "p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-4",
                        newReportParams.orientation === 'landscape'
                          ? "bg-stone-900 border-stone-900 text-white shadow-xl"
                          : "bg-stone-50 border-stone-50 text-stone-400 hover:border-mustard"
                      )}
                    >
                      <div className="w-16 h-12 border-2 border-current rounded-sm opacity-60 flex items-center justify-center">
                        <div className="w-8 h-1 bg-current opacity-20" />
                      </div>
                      <span className="text-xs font-black uppercase tracking-widest">Landscape</span>
                    </button>
                  </div>
                </section>

                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => setIsCreating(false)}
                    className="flex-1 h-14 bg-stone-50 text-stone-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-stone-100 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={confirmCreation}
                    className="flex-[2] h-14 bg-mustard text-stone-900 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-mustard/20 hover:scale-105 active:scale-95 transition-all"
                  >
                    Open Canvas
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className="w-80 bg-stone-950 p-10 flex flex-col hidden lg:flex">
        <div className="mb-12">
           <div className="w-12 h-12 bg-[#E8B931] text-stone-950 rounded-xl flex items-center justify-center mb-6 shadow-lg rotate-3">
              <LayoutDashboard size={24} />
           </div>
           <h2 className="text-2xl font-black text-white tracking-tighter">Workspace</h2>
           <p className="text-stone-500 text-[10px] font-black uppercase tracking-widest mt-2">{auth.currentUser?.email}</p>
        </div>

        <nav className="flex-1 space-y-2">
          <button className="w-full flex items-center gap-4 p-4 bg-[#E8B931] text-stone-950 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-mustard/10 transition-all">
            <LayoutDashboard size={18} />
            My Reports
          </button>
          <button 
            onClick={() => signOut(auth)}
            className="w-full flex items-center gap-4 p-4 text-stone-400 hover:text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </nav>

        <div className="mt-auto pt-10 border-t border-stone-800">
           <p className="text-[10px] font-black text-stone-600 uppercase tracking-widest mb-4">Storage Usage</p>
           <div className="h-2 bg-stone-800 rounded-full overflow-hidden">
             <div className="w-1/3 h-full bg-[#E8B931]" />
           </div>
           <p className="text-[9px] font-bold text-stone-500 mt-2">12.5 MB of 1GB Used</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-screen overflow-y-auto p-10 md:p-20">
        <div className="max-w-6xl mx-auto">
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
            <div>
              <h1 className="text-5xl md:text-7xl font-black text-stone-950 tracking-tighter leading-none mb-4">
                My Reports.
              </h1>
              <p className="text-stone-400 font-bold max-w-md">
                Manage your professional email analytic reports. Created, shared, and stored securely with Firebase.
              </p>
            </div>
            <button 
              onClick={handleStartCreation}
              className="px-10 h-16 bg-stone-950 text-[#E8B931] rounded-2xl flex items-center justify-center gap-3 font-black text-sm uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all"
            >
              <Plus size={20} />
              Create New
            </button>
          </header>

          <div className="relative mb-12">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-300" size={20} />
            <input 
              type="text" 
              placeholder="Search reports by title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-18 bg-white border-2 border-transparent focus:border-[#E8B931] rounded-[28px] pl-16 pr-8 outline-none shadow-sm font-bold text-stone-950 transition-all"
            />
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <Loader2 className="animate-spin text-[#E8B931]" size={48} />
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest tracking-tighter">Accessing Database...</p>
            </div>
          ) : filteredReports.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredReports.map((report) => (
                <motion.div 
                  key={report.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -5 }}
                  className="bg-white p-8 rounded-[40px] shadow-sm border border-stone-100 group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4 z-20">
                    <button 
                      onClick={(e) => handleDelete(e, report.id)}
                      disabled={deletingId === report.id}
                      className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-md hover:shadow-lg active:scale-90",
                        deletingId === report.id 
                          ? "bg-stone-100 text-stone-300 cursor-not-allowed" 
                          : "bg-white/90 backdrop-blur-sm border border-stone-200 text-stone-400 hover:text-red-500 hover:border-red-200"
                      )}
                      title="Delete Report"
                    >
                      {deletingId === report.id ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                         <Trash2 size={18} />
                      )}
                    </button>
                  </div>

                  <div className="w-14 h-14 bg-stone-50 rounded-2xl flex items-center justify-center text-stone-400 mb-6 group-hover:bg-[#E8B931] group-hover:text-stone-950 transition-colors">
                    <FileText size={24} />
                  </div>
                  
                  <h3 className="text-xl font-black text-stone-950 tracking-tighter mb-2 truncate">
                    {report.reportTitle}
                  </h3>
                  
                  <div className="space-y-2 mb-8">
                    <div className="flex items-center gap-2 text-stone-400 font-bold text-[10px] uppercase tracking-widest">
                      <Clock size={12} />
                      Updated {report.updatedAt?.toDate().toLocaleDateString() || report.createdAt?.toDate().toLocaleDateString() || 'Recently'}
                    </div>
                    <div className="flex items-center gap-2 text-stone-400 font-bold text-[10px] uppercase tracking-widest">
                      <Calendar size={12} />
                      {report.datePeriod}
                    </div>
                  </div>

                  <button 
                    onClick={() => onSelectReport(report.id)}
                    className="w-full h-14 border-2 border-stone-100 rounded-2xl flex items-center justify-center gap-2 text-stone-500 font-black text-[10px] uppercase tracking-widest hover:bg-stone-50 hover:border-[#E8B931] hover:text-stone-950 transition-all"
                  >
                    Open Editor <ChevronRight size={14} />
                  </button>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-[48px] p-20 text-center border-2 border-dashed border-stone-200">
               <div className="w-20 h-20 bg-stone-50 rounded-3xl flex items-center justify-center mx-auto mb-8 text-stone-300">
                  <FileText size={40} />
               </div>
               <h3 className="text-2xl font-black text-stone-950 tracking-tighter mb-4">No reports found.</h3>
               <p className="text-stone-400 font-bold mb-8 max-w-xs mx-auto">Start by creating your first email marketing analytic report.</p>
               <button 
                 onClick={handleStartCreation}
                 className="px-8 h-14 bg-stone-950 text-[#E8B931] rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 transition-all"
               >
                 Create New Report
               </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
