import { useState, useContext, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import backgroundImg from "../assets/studdy1.jpg";
import { 
  EnvelopeIcon, 
  LockClosedIcon,
  XCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  AcademicCapIcon,
  ArrowRightIcon,
  SparklesIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

// Different background image - modern study space
const backgroundImage = "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1973&q=80";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [emailValid, setEmailValid] = useState(true);
  const [passwordValid, setPasswordValid] = useState(true);

  // Preload background image
  useEffect(() => {
    const img = new Image();
    img.src = backgroundImage;
  }, []);

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError("");
    
    // Real-time validation
    if (name === 'email') {
      setEmailValid(validateEmail(value) || value === '');
    }
    if (name === 'password') {
      setPasswordValid(value.length >= 6 || value === '');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate before submission
    if (!validateEmail(formData.email)) {
      setError("Please enter a valid email address");
      return;
    }
    
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/login",
        formData
      );

      if (response.data.success) {
        login(response.data.user, response.data.token);

        if (response.data.user.role === 'admin') {
          navigate("/admin");
        } else {
          navigate("/dashboard");
        }
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Invalid email or password"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex relative overflow-hidden bg-slate-50">
      {/* Left side - Decorative panel with gradient and image */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Blurry Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src={backgroundImg} 
            alt="studdy1.jpg" 
            className="w-full h-full object-cover"
            style={{ filter: 'blur(2px)' }}
          />
          <div className="absolute inset-0 bg-blue-900/60"></div>
        </div>
        
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10 z-[1]">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }} />
        </div>
        
        {/* Floating shapes */}
        <div className="absolute inset-0 z-[2]">
          <div className="absolute top-20 left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-40 right-40 w-48 h-48 bg-white/10 rounded-full blur-2xl animate-pulse delay-500"></div>
        </div>

        {/* Content */}
        <div className="relative z-[3] flex flex-col items-center justify-center w-full p-12 text-white">
          <div className="max-w-md">
            {/* Animated icon */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="absolute inset-0 bg-white/30 rounded-full blur-2xl animate-ping"></div>
                <div className="relative bg-white/20 backdrop-blur-sm p-4 rounded-2xl">
                  <AcademicCapIcon className="h-16 w-16 text-white" />
                </div>
              </div>
            </div>

            <h1 className="text-4xl font-bold text-center mb-4">
              Study Buddy Finder
            </h1>
            
            <p className="text-xl text-center text-white/90 mb-8">
              Connect with fellow students, form study groups, and achieve academic excellence together.
            </p>

            {/* Features list */}
            <div className="space-y-4">
              {[
                "Find study partners in your courses",
                "Create and join study groups",
                "Share resources and notes",
                "Track your learning progress"
              ].map((feature, index) => (
                <div key={index} className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm rounded-lg p-3 animate-slideIn" style={{ animationDelay: `${index * 100}ms` }}>
                  <SparklesIcon className="h-5 w-5 text-yellow-300" />
                  <span className="text-white/90">{feature}</span>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="mt-8 grid grid-cols-3 gap-4 text-center">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <div className="text-2xl font-bold">10K+</div>
                <div className="text-xs text-white/80">Active Students</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <div className="text-2xl font-bold">500+</div>
                <div className="text-xs text-white/80">Study Groups</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <div className="text-2xl font-bold">95%</div>
                <div className="text-xs text-white/80">Success Rate</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-16 overflow-y-auto">
        <div className="w-full max-w-md my-auto">
          {/* Mobile header (visible only on mobile) */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-block bg-gradient-to-r from-indigo-600 to-purple-600 p-3 rounded-2xl shadow-lg mb-4">
              <AcademicCapIcon className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Study Buddy Finder
            </h2>
            <p className="mt-2 text-gray-600">Welcome back! Please sign in to continue.</p>
          </div>

          {/* Desktop header (hidden on mobile) */}
          <div className="hidden lg:block mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>
            <p className="mt-2 text-gray-600">Please enter your credentials to access your account.</p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg shadow-md animate-shake">
              <div className="flex items-center">
                <XCircleIcon className="h-5 w-5 mr-2 text-red-500 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email field */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <EnvelopeIcon className={`h-5 w-5 transition-colors duration-200 ${
                    formData.email ? 'text-indigo-500' : 'text-gray-400 group-focus-within:text-indigo-500'
                  }`} />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-3 py-3 border-2 ${
                    !emailValid && formData.email
                      ? 'border-red-300 bg-red-50 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-200 bg-gray-50 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white'
                  } rounded-xl shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 transition-all duration-200`}
                  placeholder="you@example.com"
                />
              </div>
              {!emailValid && formData.email && (
                <p className="mt-1 text-xs text-red-600 animate-fadeIn">
                  Please enter a valid email address
                </p>
              )}
            </div>

            {/* Password field */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className={`h-5 w-5 transition-colors duration-200 ${
                    formData.password ? 'text-indigo-500' : 'text-gray-400 group-focus-within:text-indigo-500'
                  }`} />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-12 py-3 border-2 ${
                    !passwordValid && formData.password
                      ? 'border-red-300 bg-red-50 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-200 bg-gray-50 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white'
                  } rounded-xl shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 transition-all duration-200`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                  )}
                </button>
              </div>
              {!passwordValid && formData.password && (
                <p className="mt-1 text-xs text-red-600 animate-fadeIn">
                  Password must be at least 6 characters
                </p>
              )}
            </div>

            {/* Remember me and Forgot password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded transition-colors duration-200"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>

              <Link
                to="/forgot-password"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors duration-200 hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:from-indigo-400 disabled:to-purple-400 disabled:cursor-not-allowed transform transition-all duration-200 hover:shadow-xl overflow-hidden"
            >
              {/* Animated background effect */}
              <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              
              {loading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  Sign in
                  <ArrowRightIcon className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                </div>
              )}
            </button>

            {/* Security badge */}
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
              <ShieldCheckIcon className="h-4 w-4 text-green-500" />
              <span>Your information is secure and encrypted</span>
            </div>

            {/* Sign up link */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{" "}
                <Link
                  to="/signup"
                  className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors duration-200 hover:underline"
                >
                  Create free account
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* Add these styles */}
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
          20%, 40%, 60%, 80% { transform: translateX(2px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-slideIn {
          animation: slideIn 0.5s ease-out forwards;
          opacity: 0;
        }
        .delay-500 {
          animation-delay: 500ms;
        }
        .delay-1000 {
          animation-delay: 1000ms;
        }
      `}</style>
    </div>
  );
};

export default Login;