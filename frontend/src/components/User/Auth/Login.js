import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../../../services/firebase';
import { useAuth } from '../../../context/AuthContext';
import { API_BASE_URL } from '../../../services/apiClient';
import loginImg from '../../../assets/images/login_lion.png';
import brandLogo from '../../../assets/images/Logo.png';

const Login = () => {
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [remember, setRemember]   = useState(false);
  const [errorMsg, setErrorMsg]   = useState('');
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken(true);
      
      const response = await fetch(`${API_BASE_URL}/api/auth/sync`, {
          method: 'POST',
          headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
          }
      });
      
      const data = await response.json();
      if (data.isStaff) {
          navigate('/admin');
      } else {
          navigate('/');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Invalid email or password. Please try again.');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setErrorMsg('');
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const token = await userCredential.user.getIdToken(true);
      
      const response = await fetch(`${API_BASE_URL}/api/auth/sync`, {
          method: 'POST',
          headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
          }
      });
      
      const data = await response.json();
      if (data.isStaff) {
          navigate('/admin');
      } else {
          navigate('/');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Google sign-in failed. Please try again.');
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
              Welcome Back to the Wild
            </h2>
            <p className="text-white/80 text-lg m-0">
              Sign in to access exclusive member benefits, track your visits, and stay connected with our conservation efforts.
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
            {/* Back Link */}
            <Link 
              to="/" 
              className="inline-flex flex-row items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors text-decoration-none"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>

            <div className="mb-4">
              <h1 className="text-3xl font-bold text-foreground mb-1 m-0">Sign In</h1>
              <p className="text-muted-foreground m-0">
                Enter your credentials to access your account
              </p>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm text-center">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 flex flex-col">
              {/* Email Field */}
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
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1 flex flex-col relative w-full mb-4">
                <div className="flex items-center justify-between w-full mb-1">
                  <label className="text-sm font-medium text-foreground m-0">
                    Password
                  </label>
                  <Link 
                    to="/forgot-password" 
                    className="text-sm text-primary hover:text-primary/80 transition-colors text-decoration-none"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative w-full">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    type={showPass ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 h-11 bg-background border border-border rounded-md text-sm outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors bg-transparent border-none p-0 cursor-pointer"
                  >
                    {showPass ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center gap-2 mb-4">
                <input
                  type="checkbox"
                  id="remember"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-primary cursor-pointer accent-primary"
                />
                <label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer select-none m-0">
                  Remember me for 30 days
                </label>
              </div>

              {/* Submit Button */}
              <button type="submit" className="w-full h-11 bg-primary border-none cursor-pointer text-primary-foreground font-semibold rounded-md hover:bg-primary/90 transition-colors text-base flex items-center justify-center">
                Sign In
              </button>

              {/* Divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-background px-4 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>

              {/* Social Login */}
              <div className="grid grid-cols-1 gap-4 mb-2">
                <button 
                  type="button" 
                  onClick={handleGoogleLogin}
                  className="h-11 w-full bg-background border border-border rounded-md hover:bg-muted/50 cursor-pointer transition-colors flex items-center justify-center text-sm font-medium text-foreground"
                >
                  <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </button>
              </div>
            </form>

            {/* Sign Up Link */}
            <p className="mt-4 text-center text-sm text-muted-foreground mb-4">
              Don't have an account?{" "}
              <Link 
                to="/signup" 
                className="font-medium text-primary hover:text-primary/80 transition-colors text-decoration-none"
              >
                Create an account
              </Link>
            </p>

            {/* Member Benefits */}
            <div className="mt-2 p-3 bg-muted/50 border border-border rounded-lg">
              <h3 className="text-sm font-medium text-foreground mb-2 m-0">Member Benefits</h3>
              <ul className="text-sm text-muted-foreground space-y-2 m-0 mt-2 list-none p-0 flex flex-col items-start text-left">
                <li>• Early access to special events</li>
                <li>• 10% discount at the Gift Shop</li>
                <li>• Free parking on all visits</li>
                <li>• Exclusive behind-the-scenes tours</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
