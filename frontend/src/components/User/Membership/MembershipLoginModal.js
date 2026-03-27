import { useState, useEffect } from 'react';
import { X, Mail, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../../../services/firebase';
import { API_BASE_URL } from '../../../services/apiClient';
import { toast } from 'sonner';
import './MembershipLoginModal.css';

const MembershipLoginModal = ({ isOpen, onClose, onSuccess, planName }) => {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  // Fire the notification toast as soon as the modal opens
  useEffect(() => {
    if (isOpen) {
      toast.info('Sign in required to purchase a membership.', { duration: 4000 });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const syncAndContinue = async (userCredential) => {
    const token = await userCredential.user.getIdToken(true);
    const res   = await fetch(`${API_BASE_URL}/api/auth/sync`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
    const data = await res.json();
    if (data.isStaff) {
      toast.error('Staff accounts cannot purchase memberships.');
      return;
    }
    onSuccess();
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      await syncAndContinue(cred);
    } catch {
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const cred = await signInWithPopup(auth, new GoogleAuthProvider());
      await syncAndContinue(cred);
    } catch {
      setError('Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="mlm-overlay"
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="mlm-modal">
        {/* Close */}
        <button className="mlm-close" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>

        {/* Icon + heading */}
        <div className="mlm-header">
          <div className="mlm-icon">
            <ShieldCheck size={26} strokeWidth={1.8} />
          </div>
          <h2 className="mlm-title">Sign in to continue</h2>
          <p className="mlm-subtitle">
            You need an account to purchase the&nbsp;
            <strong>{planName}</strong> membership.
          </p>
        </div>

        {/* Notice banner */}
        <div className="mlm-notice">
          🎟 Members-only checkout — sign in to unlock your plan
        </div>

        {/* Error */}
        {error && <div className="mlm-error">{error}</div>}

        {/* Form */}
        <form onSubmit={handleEmailLogin} className="mlm-form">
          <div className="mlm-field">
            <label>Email Address</label>
            <div className="mlm-input-wrap">
              <Mail size={16} className="mlm-input-icon" />
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="mlm-field">
            <label>Password</label>
            <div className="mlm-input-wrap">
              <Lock size={16} className="mlm-input-icon" />
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="mlm-eye"
                onClick={() => setShowPass(v => !v)}
                tabIndex={-1}
              >
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button type="submit" className="mlm-btn-primary" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div className="mlm-divider"><span>or</span></div>

        <button className="mlm-btn-google" onClick={handleGoogleLogin} disabled={loading}>
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 12 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <p className="mlm-footer">
          Don't have an account?&nbsp;
          <a href="/signup" className="mlm-link">Create one</a>
        </p>
      </div>
    </div>
  );
};

export default MembershipLoginModal;
