import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../../services/firebase';
import loginImg from '../../../assets/images/login_lion.png';
import brandLogo from '../../../assets/images/Logo.png';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);
    
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess(true);
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/user-not-found') {
          setErrorMsg('No account found with that email address.');
      } else {
          setErrorMsg('Failed to send reset email. Please try again later.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Image */}
      <div className="hidden lg:flex lg:w-3/5 xl:w-2/3 relative">
        <img
          src={loginImg}
          alt="Majestic lion"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/20" />
        <div className="absolute inset-0 flex flex-col justify-end p-12">
          <Link to="/" className="absolute top-8 left-8 flex items-center gap-2">
            <img src={brandLogo} alt="WildWoods Logo" className="h-14 w-14 object-contain" />
            <span className="text-xl font-bold tracking-tight text-white">Wildwood Zoo</span>
          </Link>
          <div className="max-w-md mt-auto">
            <h2 className="text-3xl font-bold text-white mb-4 m-0">
              Recover Your Account
            </h2>
            <p className="text-white/80 text-lg m-0">
              Get back to managing wildlife, tracking your favorites, and experiencing the zoo.
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex flex-col bg-background relative overflow-y-auto">
        {/* Mobile Header */}
        <div className="lg:hidden p-4 border-b border-border">
          <Link to="/" className="flex items-center gap-2 text-decoration-none">
            <img src={brandLogo} alt="WildWoods Logo" className="h-14 w-14 object-contain" />
            <span className="text-lg font-bold tracking-tight text-foreground">Wildwood Zoo</span>
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center p-6 lg:p-8">
          <div className="w-full max-w-md">
            <Link 
              to="/login" 
              className="inline-flex flex-row items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors text-decoration-none"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </Link>

            <div className="mb-4">
              <h1 className="text-3xl font-bold text-foreground mb-1 m-0">Reset Password</h1>
              <p className="text-muted-foreground m-0">
                Enter your email address and we'll send you a link to reset your password.
              </p>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm text-center">
                {errorMsg}
              </div>
            )}

            {success ? (
              <div className="p-6 bg-green-50 border border-green-200 rounded-lg text-center flex flex-col items-center">
                <CheckCircle2 className="h-12 w-12 text-green-500 mb-3" />
                <h3 className="text-lg font-semibold text-green-800 m-0 mb-2">Email Sent!</h3>
                <p className="text-green-700 m-0 text-sm mb-4">
                  Check your inbox for a link to reset your password. If it doesn't appear within a few minutes, check your spam folder.
                </p>
                <Link to="/login" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors text-decoration-none">
                  Return to Sign In
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 flex flex-col">
                <div className="space-y-1 flex flex-col items-start relative w-full mb-4">
                  <label className="text-sm font-medium text-foreground mb-1">
                    Email Address
                  </label>
                  <div className="relative w-full">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 h-11 bg-background border border-border rounded-md text-sm outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full h-11 bg-primary border-none cursor-pointer text-primary-foreground font-semibold rounded-md hover:bg-primary/90 transition-colors text-base flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
