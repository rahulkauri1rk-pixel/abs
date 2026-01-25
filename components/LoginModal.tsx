
import React, { useState } from 'react';
import { X, LogIn, AlertCircle, Loader2, KeyRound, ArrowLeft, CheckCircle2, UserPlus } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { useSite } from '../contexts/SiteContext';

type AuthMode = 'login' | 'signup' | 'forgot-password';

const LoginModal: React.FC = () => {
  const { isLoginModalOpen, closeLoginModal } = useSite();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isLoginModalOpen) return null;

  const resetState = () => {
    setError(null);
    setSuccessMessage(null);
    setLoading(false);
  };

  const handleClose = () => {
    closeLoginModal();
    setTimeout(() => {
        setEmail('');
        setPassword('');
        setFullName('');
        setMode('login');
        resetState();
    }, 300);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    resetState();
    setLoading(true);

    try {
      if (mode === 'signup') {
         const userCredential = await createUserWithEmailAndPassword(auth, email, password);
         
         if (fullName) {
             await updateProfile(userCredential.user, { displayName: fullName });
         }

         // Attempt Firestore sync but don't block login if permissions are slow to propagate
         try {
             await setDoc(doc(db, 'user_permissions', email.toLowerCase()), {
               role: 'client',
               uid: userCredential.user.uid,
               email: email.toLowerCase(),
               displayName: fullName || email.split('@')[0],
               createdAt: serverTimestamp()
             });
         } catch (fsErr) {
             console.warn("Initial Firestore sync deferred to SiteContext:", fsErr);
         }

      } else {
         await signInWithEmailAndPassword(auth, email, password);
      }
      handleClose();
    } catch (err: any) {
      console.error("Auth System Trace:", err.code, err.message);
      
      // Map Firebase codes to user-friendly messages
      if (err.code === 'auth/invalid-credential') {
        setError('Authentication Failed: Incorrect password or email. If this is a developer setup, ensure this domain is added to Authorized Domains in Firebase Console.');
      } else if (err.code === 'auth/user-not-found') {
        setError('No account found with this email.');
      } else if (err.code === 'auth/wrong-password') {
        setError('Incorrect password.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please sign in instead.');
      } else if (err.code === 'auth/weak-password') {
        setError('Security Error: Password must be at least 6 characters.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Account temporarily locked due to many failed attempts. Try again later.');
      } else {
        setError('Authentication System Error: ' + (err.message || 'Please check your connection.'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    resetState();
    if (!email) { setError("Please enter your email address."); return; }
    setLoading(true);
    try {
        await sendPasswordResetEmail(auth, email);
        setSuccessMessage("Identity verification link sent! Check your inbox.");
    } catch (err: any) {
        if (err.code === 'auth/user-not-found') setError("No account found with this email.");
        else setError("Failed to send reset email. Please try again.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={handleClose}></div>
      <div className="relative w-full max-w-md bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-slate-700/50 overflow-hidden animate-fade-in-up">
        <div className="p-6 sm:p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold font-heading text-slate-900 dark:text-white">
                {mode === 'login' ? 'Panel Access' : mode === 'signup' ? 'Join ABS' : 'Reset Access'}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                {mode === 'login' ? 'Sign in to manage your workspace' : mode === 'signup' ? 'Create a staff or client profile' : 'Enter email for reset link'}
              </p>
            </div>
            <button onClick={handleClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-white/20 dark:hover:bg-slate-800 transition-colors">
              <X size={24} />
            </button>
          </div>

          {error && (
            <div className="mb-6 bg-red-500/10 backdrop-blur-md border border-red-500/20 text-red-600 dark:text-red-400 p-4 rounded-xl flex items-start gap-3 text-xs leading-relaxed animate-fade-in">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 bg-green-500/10 backdrop-blur-md border border-green-500/20 text-green-600 dark:text-green-400 p-4 rounded-xl flex items-start gap-3 text-sm animate-fade-in">
              <CheckCircle2 size={20} className="shrink-0 mt-0.5" />
              {successMessage}
            </div>
          )}

          {mode === 'login' || mode === 'signup' ? (
            <form onSubmit={handleAuth} className="space-y-5">
              {mode === 'signup' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Full Name</label>
                  <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200/50 dark:border-slate-700/50 bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" placeholder="Enter your name" />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email Address</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200/50 dark:border-slate-700/50 bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" placeholder="name@company.com" />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
                    {mode === 'login' && <button type="button" onClick={() => { setMode('forgot-password'); resetState(); }} className="text-xs font-medium text-primary hover:text-primary-dark transition-colors">Forgot Password?</button>}
                </div>
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200/50 dark:border-slate-700/50 bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" placeholder="••••••••" />
              </div>

              <button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-primary/20 hover:shadow-primary/40 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
                {loading ? <><Loader2 size={20} className="animate-spin" /> Processing...</> : <>{mode === 'login' ? <LogIn size={20} /> : <UserPlus size={20} />} {mode === 'login' ? 'Sign In' : 'Register Member'}</>}
              </button>

              <div className="text-center pt-2">
                 {mode === 'login' ? <button type="button" onClick={() => { setMode('signup'); resetState(); }} className="text-sm text-slate-500 hover:text-primary font-medium">Need an account? Sign Up</button> : <button type="button" onClick={() => { setMode('login'); resetState(); }} className="text-sm text-slate-500 hover:text-primary font-medium">Already registered? Sign In</button>}
              </div>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-5">
               <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email Address</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200/50 dark:border-slate-700/50 bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" placeholder="Enter your email" />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
                {loading ? <><Loader2 size={20} className="animate-spin" /> Sending...</> : <><KeyRound size={20} /> Send Reset Link</>}
              </button>
              <button type="button" onClick={() => { setMode('login'); resetState(); }} className="w-full flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-colors py-2"><ArrowLeft size={16} /> Back to Login</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
