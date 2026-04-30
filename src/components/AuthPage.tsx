import React, { useState } from 'react';
import { auth } from '../lib/firebase';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail
} from 'firebase/auth';
import { Mail, Lock, LogIn, UserPlus, Chrome, ArrowRight, Loader2, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface AuthPageProps {
  onSuccess: () => void;
}

export function AuthPage({ onSuccess }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgot, setShowForgot] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      onSuccess();
    } catch (err: any) {
      if (err.code === 'auth/unauthorized-domain') {
        setError(`Domain Unauthorized: Please add "${window.location.hostname}" to your Firebase Console (Auth > Settings > Authorized Domains).`);
      } else if (err.code === 'auth/operation-not-allowed') {
        setError("Sign-in method disabled: Please enable 'Google' in your Firebase Console (Authentication > Sign-in method).");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (showForgot) {
        await sendPasswordResetEmail(auth, email);
        setError("Password reset email sent!");
        setShowForgot(false);
      } else if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        onSuccess();
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        onSuccess();
      }
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        setError("Email/Password disabled: Please enable 'Email/Password' in your Firebase Console (Authentication > Sign-in method).");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center p-6 font-sans relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#E8B931] rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-stone-800 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[440px] bg-white rounded-[48px] shadow-2xl p-10 md:p-14 relative z-10"
      >
        <div className="mb-10 text-center">
          <div className="w-16 h-16 bg-stone-950 text-[#E8B931] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl transform -rotate-6">
            <Mail size={32} />
          </div>
          <h1 className="text-3xl font-black text-stone-950 tracking-tighter mb-2">
            Ajunaidi Report Builder
          </h1>
          <p className="text-stone-500 font-bold text-sm uppercase tracking-widest opacity-60">
            Professional Email Analytics CRM
          </p>
        </div>

        <button 
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full h-14 bg-stone-50 border-2 border-stone-100 rounded-2xl flex items-center justify-center gap-3 text-stone-700 font-black text-sm uppercase tracking-widest hover:bg-white hover:border-[#E8B931] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : <Chrome size={20} className="text-[#4285F4]" />}
          Continue with Google
        </button>

        <div className="my-8 flex items-center gap-4">
          <div className="h-px flex-1 bg-stone-100" />
          <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">or email auth</span>
          <div className="h-px flex-1 bg-stone-100" />
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div>
            <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 px-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full h-14 bg-stone-50 border-2 border-stone-100 rounded-2xl pl-12 pr-4 outline-none focus:border-[#E8B931] focus:bg-white transition-all text-stone-950 font-bold"
              />
            </div>
          </div>

          {!showForgot && (
            <div>
              <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 px-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-14 bg-stone-50 border-2 border-stone-100 rounded-2xl pl-12 pr-4 outline-none focus:border-[#E8B931] focus:bg-white transition-all text-stone-950 font-bold"
                />
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 rounded-xl flex gap-3 text-red-600 text-xs font-bold items-start">
              <Info size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full h-14 bg-stone-950 text-[#E8B931] rounded-2xl flex items-center justify-center gap-3 font-black text-sm uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] shadow-xl hover:shadow-2xl transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (showForgot ? 'Reset Password' : isLogin ? 'Sign In' : 'Create Account')}
            {!loading && <ArrowRight size={20} />}
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-stone-100 text-center">
          {!showForgot && (
            <div className="space-y-4">
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
                {isLogin ? "New to Ajunaidi?" : "Already a member?"}
              </p>
              <button 
                onClick={() => setIsLogin(!isLogin)}
                className="w-full h-12 rounded-xl border-2 border-stone-100 flex items-center justify-center gap-2 text-[10px] font-black text-stone-950 uppercase tracking-widest hover:border-[#E8B931] hover:bg-stone-50 transition-all"
              >
                {isLogin ? (
                  <>
                    <UserPlus size={14} />
                    Create an Account
                  </>
                ) : (
                  <>
                    <LogIn size={14} />
                    Back to Sign In
                  </>
                )}
              </button>
            </div>
          )}
          
          <button 
            onClick={() => setShowForgot(!showForgot)}
            className="mt-6 text-[10px] font-black text-stone-400 uppercase tracking-widest hover:text-stone-950 transition-colors"
          >
            {showForgot ? "Back to Login" : "Forgot Password?"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
