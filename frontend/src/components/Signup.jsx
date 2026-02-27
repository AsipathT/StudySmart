import { useState, useContext, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import { 
  UserIcon, 
  EnvelopeIcon, 
  LockClosedIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  AcademicCapIcon,
  BookOpenIcon,
  UsersIcon,
  SparklesIcon,
  GlobeAltIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';

// Import your background image (you can replace this with your own image URL)
const backgroundImage = "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80";

const Signup = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    hasMinLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });
  const [touchedFields, setTouchedFields] = useState({});
  const [imageLoaded, setImageLoaded] = useState(false);

  // Password strength checker
  useEffect(() => {
    const password = formData.password;
    setPasswordStrength({
      score: calculatePasswordStrength(password),
      hasMinLength: password.length >= 6,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    });
  }, [formData.password]);

  // Preload background image
  useEffect(() => {
    const img = new Image();
    img.src = backgroundImage;
    img.onload = () => setImageLoaded(true);
  }, []);

  const calculatePasswordStrength = (password) => {
    let score = 0;
    if (password.length >= 6) score += 1;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
    return Math.min(score, 4);
  };

  const getPasswordStrengthColor = () => {
    const colors = {
      0: 'bg-gray-200',
      1: 'bg-red-500',
      2: 'bg-orange-500',
      3: 'bg-yellow-500',
      4: 'bg-green-500',
    };
    return colors[passwordStrength.score] || 'bg-gray-200';
  };

  const getPasswordStrengthText = () => {
    const texts = {
      0: 'Very Weak',
      1: 'Weak',
      2: 'Fair',
      3: 'Good',
      4: 'Strong',
    };
    return texts[passwordStrength.score] || 'Enter password';
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleBlur = (field) => {
    setTouchedFields({ ...touchedFields, [field]: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Enhanced validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    if (formData.name.trim().length < 2) {
      setError("Name must be at least 2 characters long");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/signup",
        {
          name: formData.name.trim(),
          email: formData.email.toLowerCase().trim(),
          password: formData.password,
        }
      );

      if (response.data.success) {
        login(response.data.user, response.data.token);

        // Navigate based on user role
        if (response.data.user.role === 'admin') {
          navigate("/admin");
        } else {
          navigate("/dashboard");
        }
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "An error occurred during signup"
      );
    } finally {
      setLoading(false);
    }
  };

  // Features list for the left panel
  const features = [
    {
      icon: <UsersIcon className="w-6 h-6" />,
      title: "Find Study Partners",
      description: "Connect with students who share your academic interests"
    },
    {
      icon: <BookOpenIcon className="w-6 h-6" />,
      title: "Shared Resources",
      description: "Access and share study materials, notes, and practice tests"
    },
    {
      icon: <ChatBubbleLeftRightIcon className="w-6 h-6" />,
      title: "Group Discussions",
      description: "Join study groups and collaborate in real-time"
    },
    {
      icon: <ClockIcon className="w-6 h-6" />,
      title: "Smart Scheduling",
      description: "Coordinate study sessions that work for everyone"
    },
    {
      icon: <GlobeAltIcon className="w-6 h-6" />,
      title: "Global Community",
      description: "Connect with learners from around the world"
    },
    {
      icon: <SparklesIcon className="w-6 h-6" />,
      title: "AI Recommendations",
      description: "Get personalized study partner suggestions"
    }
  ];

  return (
    <div className="relative flex items-center justify-center min-h-screen overflow-hidden bg-gray-900">
      {/* Background Image with Blur and Overlay */}
      <div 
        className="absolute inset-0 transition-opacity duration-1000 bg-center bg-no-repeat bg-cover"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          filter: 'blur(8px)',
          transform: 'scale(1.1)',
        }}
      />
      
      {/* Dark Overlay for better contrast */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/50 via-purple-900/50 to-pink-800/50 animate-gradient" />

      {/* Floating study-related icons */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-[10%] text-white/10 animate-float-slow">
          <BookOpenIcon className="w-32 h-32" />
        </div>
        <div className="absolute bottom-20 right-[10%] text-white/10 animate-float">
          <UsersIcon className="w-40 h-40" />
        </div>
        <div className="absolute top-1/3 right-1/4 text-white/10 animate-float-delayed">
          <AcademicCapIcon className="w-24 h-24" />
        </div>
        <div className="absolute bottom-1/3 left-1/4 text-white/10 animate-float-slow">
          <ChatBubbleLeftRightIcon className="h-28 w-28" />
        </div>
      </div>

      {/* Main Content - Landscape Two-Column Layout */}
      <div className="relative z-10 w-full max-w-6xl px-4 py-6 mx-auto sm:px-6 lg:px-8">
        <div className="grid items-stretch grid-cols-1 gap-6 lg:grid-cols-2">
          
          {/* Left Panel - Features/Branding (Hidden on mobile, visible on landscape) */}
          <div className="hidden lg:block">
            <div className="flex flex-col h-full p-8 border shadow-2xl bg-white/90 backdrop-blur-xl rounded-2xl border-white/20">
              {/* Brand Header */}
              <div className="flex items-center mb-8 space-x-3">
                <div className="p-3 shadow-lg bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl">
                  <AcademicCapIcon className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text">
                    Study Buddy Finder
                  </h1>
                  <p className="text-sm text-gray-600">Learn together, grow together</p>
                </div>
              </div>

              {/* Welcome Message */}
              <div className="mb-8">
                <h2 className="mb-3 text-3xl font-bold text-gray-800">
                  Join Our Learning Community
                </h2>
                <p className="leading-relaxed text-gray-600">
                  Thousands of students are already connecting, sharing knowledge, 
                  and achieving their academic goals together. Be part of something bigger.
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="p-3 text-center rounded-lg bg-indigo-50/50">
                  <div className="text-2xl font-bold text-indigo-600">10k+</div>
                  <div className="text-xs text-gray-600">Active Students</div>
                </div>
                <div className="p-3 text-center rounded-lg bg-purple-50/50">
                  <div className="text-2xl font-bold text-purple-600">500+</div>
                  <div className="text-xs text-gray-600">Study Groups</div>
                </div>
                <div className="p-3 text-center rounded-lg bg-pink-50/50">
                  <div className="text-2xl font-bold text-pink-600">50+</div>
                  <div className="text-xs text-gray-600">Universities</div>
                </div>
              </div>

              {/* Features Grid */}
              <div className="grid flex-grow grid-cols-2 gap-4">
                {features.map((feature, index) => (
                  <div 
                    key={index}
                    className="p-3 transition-all duration-200 rounded-lg cursor-default bg-white/50 hover:bg-white/80 group"
                  >
                    <div className="mb-2 text-indigo-600 transition-transform duration-200 group-hover:scale-110">
                      {feature.icon}
                    </div>
                    <h3 className="mb-1 text-sm font-semibold text-gray-800">
                      {feature.title}
                    </h3>
                    <p className="text-xs text-gray-600">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>

              {/* Testimonial */}
              <div className="p-4 mt-6 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50">
                <p className="text-sm italic text-gray-700">
                  "Found my perfect study partner within days. My grades have improved significantly!"
                </p>
                <div className="flex items-center mt-2">
                  <div className="flex items-center justify-center w-8 h-8 text-sm font-bold text-white rounded-full bg-gradient-to-r from-indigo-600 to-purple-600">
                    SJ
                  </div>
                  <div className="ml-2">
                    <p className="text-xs font-semibold text-gray-800">Sarah Johnson</p>
                    <p className="text-xs text-gray-600">Computer Science Student</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Signup Form */}
          <div className="p-6 border shadow-2xl bg-white/90 backdrop-blur-xl sm:p-8 rounded-2xl border-white/20">
            {/* Header with icon - Mobile visible */}
            <div className="text-center lg:text-left">
              <div className="flex justify-center mb-3 lg:justify-start">
                <div className="p-3 shadow-lg bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl lg:hidden">
                  <AcademicCapIcon className="w-10 h-10 text-white" />
                </div>
              </div>
              <h2 className="text-2xl font-extrabold text-transparent lg:text-3xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text">
                Create Account
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Join our community of learners and achievers
              </p>
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              {/* Error message with animation */}
              {error && (
                <div className="px-4 py-2 text-red-700 border-l-4 border-red-500 rounded-lg shadow-md bg-red-50/90 backdrop-blur-sm animate-slideDown">
                  <div className="flex items-center">
                    <XCircleIcon className="flex-shrink-0 w-5 h-5 mr-2 text-red-500" />
                    <p className="text-sm">{error}</p>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {/* Name field */}
                <div>
                  <label htmlFor="name" className="block mb-1 text-sm font-semibold text-gray-700">
                    Full Name
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <UserIcon className="w-5 h-5 text-gray-400 transition-colors group-focus-within:text-indigo-500" />
                    </div>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      onBlur={() => handleBlur('name')}
                      className={`appearance-none block w-full pl-10 pr-3 py-2.5 border ${
                        touchedFields.name && formData.name.length < 2
                          ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                          : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                      } rounded-lg shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 transition-all duration-200 bg-white/50 backdrop-blur-sm`}
                      placeholder="John Doe"
                    />
                  </div>
                  {touchedFields.name && formData.name.length < 2 && formData.name.length > 0 && (
                    <p className="mt-1 text-xs text-red-600 animate-fadeIn">Name must be at least 2 characters</p>
                  )}
                </div>

                {/* Email field */}
                <div>
                  <label htmlFor="email" className="block mb-1 text-sm font-semibold text-gray-700">
                    Email Address
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <EnvelopeIcon className="w-5 h-5 text-gray-400 transition-colors group-focus-within:text-indigo-500" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      onBlur={() => handleBlur('email')}
                      className="appearance-none block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                {/* Password field */}
                <div>
                  <label htmlFor="password" className="block mb-1 text-sm font-semibold text-gray-700">
                    Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <LockClosedIcon className="w-5 h-5 text-gray-400 transition-colors group-focus-within:text-indigo-500" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="appearance-none block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                      placeholder="Create a password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3"
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="w-5 h-5 text-gray-400 transition-colors hover:text-gray-600" />
                      ) : (
                        <EyeIcon className="w-5 h-5 text-gray-400 transition-colors hover:text-gray-600" />
                      )}
                    </button>
                  </div>

                  {/* Password strength meter */}
                  {formData.password.length > 0 && (
                    <div className="mt-2 space-y-2 animate-slideDown">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 h-2 overflow-hidden bg-gray-200 rounded-full">
                          <div
                            className={`h-full ${getPasswordStrengthColor()} transition-all duration-300`}
                            style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                          ></div>
                        </div>
                        <span className="ml-2 text-xs font-medium text-gray-600">
                          {getPasswordStrengthText()}
                        </span>
                      </div>

                      {/* Password requirements checklist - Compact for landscape */}
                      <div className="grid grid-cols-2 gap-2 p-2 text-xs rounded-lg bg-white/50 backdrop-blur-sm">
                        <div className="flex items-center">
                          {passwordStrength.hasMinLength ? (
                            <CheckCircleIcon className="flex-shrink-0 w-3 h-3 mr-1 text-green-500" />
                          ) : (
                            <XCircleIcon className="flex-shrink-0 w-3 h-3 mr-1 text-gray-300" />
                          )}
                          <span className={passwordStrength.hasMinLength ? 'text-green-700' : 'text-gray-500'}>
                            6+ chars
                          </span>
                        </div>
                        <div className="flex items-center">
                          {passwordStrength.hasUpperCase ? (
                            <CheckCircleIcon className="flex-shrink-0 w-3 h-3 mr-1 text-green-500" />
                          ) : (
                            <XCircleIcon className="flex-shrink-0 w-3 h-3 mr-1 text-gray-300" />
                          )}
                          <span className={passwordStrength.hasUpperCase ? 'text-green-700' : 'text-gray-500'}>
                            A-Z
                          </span>
                        </div>
                        <div className="flex items-center">
                          {passwordStrength.hasLowerCase ? (
                            <CheckCircleIcon className="flex-shrink-0 w-3 h-3 mr-1 text-green-500" />
                          ) : (
                            <XCircleIcon className="flex-shrink-0 w-3 h-3 mr-1 text-gray-300" />
                          )}
                          <span className={passwordStrength.hasLowerCase ? 'text-green-700' : 'text-gray-500'}>
                            a-z
                          </span>
                        </div>
                        <div className="flex items-center">
                          {passwordStrength.hasNumber ? (
                            <CheckCircleIcon className="flex-shrink-0 w-3 h-3 mr-1 text-green-500" />
                          ) : (
                            <XCircleIcon className="flex-shrink-0 w-3 h-3 mr-1 text-gray-300" />
                          )}
                          <span className={passwordStrength.hasNumber ? 'text-green-700' : 'text-gray-500'}>
                            0-9
                          </span>
                        </div>
                        <div className="flex items-center col-span-2">
                          {passwordStrength.hasSpecialChar ? (
                            <CheckCircleIcon className="flex-shrink-0 w-3 h-3 mr-1 text-green-500" />
                          ) : (
                            <XCircleIcon className="flex-shrink-0 w-3 h-3 mr-1 text-gray-300" />
                          )}
                          <span className={passwordStrength.hasSpecialChar ? 'text-green-700' : 'text-gray-500'}>
                            Special char (!@#$%^&*)
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password field */}
                <div>
                  <label htmlFor="confirmPassword" className="block mb-1 text-sm font-semibold text-gray-700">
                    Confirm Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <LockClosedIcon className="w-5 h-5 text-gray-400 transition-colors group-focus-within:text-indigo-500" />
                    </div>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`appearance-none block w-full pl-10 pr-10 py-2.5 border ${
                        formData.confirmPassword && formData.password !== formData.confirmPassword
                          ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                          : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                      } rounded-lg shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 transition-all duration-200 bg-white/50 backdrop-blur-sm`}
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3"
                    >
                      {showConfirmPassword ? (
                        <EyeSlashIcon className="w-5 h-5 text-gray-400 transition-colors hover:text-gray-600" />
                      ) : (
                        <EyeIcon className="w-5 h-5 text-gray-400 transition-colors hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                  {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <p className="mt-1 text-xs text-red-600 animate-fadeIn">Passwords do not match</p>
                  )}
                </div>
              </div>

              {/* Submit button */}
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:from-indigo-400 disabled:to-purple-400 disabled:cursor-not-allowed transform transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-3 -ml-1 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating account...
                    </div>
                  ) : (
                    "Create Account"
                  )}
                </button>
              </div>

              {/* Sign in link */}
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    className="font-semibold text-indigo-600 transition-colors duration-200 hover:text-indigo-500 hover:underline"
                  >
                    Sign in here
                  </Link>
                </p>
              </div>

              {/* Terms and conditions */}
              <div className="text-xs text-center text-gray-500">
                By creating an account, you agree to our{" "}
                <a href="/terms" className="text-indigo-600 hover:text-indigo-500 hover:underline">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="/privacy" className="text-indigo-600 hover:text-indigo-500 hover:underline">
                  Privacy Policy
                </a>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Add these styles to your global CSS or in a style tag */}
      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-slow {
          animation: float 8s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float 7s ease-in-out infinite;
          animation-delay: 2s;
        }
        @keyframes gradient {
          0% {
            opacity: 0.5;
          }
          50% {
            opacity: 0.8;
          }
          100% {
            opacity: 0.5;
          }
        }
        .animate-gradient {
          animation: gradient 5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default Signup;