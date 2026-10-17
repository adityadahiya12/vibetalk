import { useState } from 'react';
import { FaUser, FaEnvelope, FaLock } from 'react-icons/fa';
import toast, { Toaster } from 'react-hot-toast';
import apiClient from '../../apiClient';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContextApi';

// CyberPharma Color Palette
const cyberColors = {
  electricBlue: '#4a6bff',
  neonCyan: '#00f5d4',
  deepMidnight: '#0a0f2e',
  softGlitch: '#8a9eff',
  cyberWhite: '#f0f4ff',
  pulsePink: '#ff3e9d',
  cyberPurple: '#8a2be2',
  emergencyRed: '#ff3a3a'
};

const AuthForm = ({ type }) => {
  const { updateUser } = useUser();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullname: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    gender: 'male',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (type === 'signup' && formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match!');
      return;
    }
    setLoading(true);
    try {
      const endpoint = type === 'signup' ? '/auth/signup' : '/auth/login';
      const response = await apiClient.post(endpoint, formData);
      toast.success(response.data.message || 'Success!');
      if (type === 'signup') {
        navigate('/login')
      }
      if (type === 'login') {
        updateUser(response.data)
        const date = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        const expires = "expires=" + date.toUTCString();
        document.cookie = `jwt=${response.data.token}; path=/; ${expires}`;
        navigate('/')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Something went wrong!');
    } finally {
      setLoading(false);
    }
  };

  // CyberPharma Styles
  const cyberStyles = {
    mainContainer: {
      background: `linear-gradient(135deg, ${cyberColors.deepMidnight} 0%, #1a1f4a 100%)`,
      minHeight: '100vh',
      position: 'relative',
      overflow: 'hidden'
    },
    formContainer: {
      background: 'rgba(138, 158, 255, 0.1)',
      backdropFilter: 'blur(10px)',
      border: `1px solid rgba(138, 158, 255, 0.3)`,
      borderRadius: '20px',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
    },
    gradientText: {
      background: `linear-gradient(90deg, ${cyberColors.electricBlue}, ${cyberColors.neonCyan})`,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundSize: '300% 300%',
      animation: 'gradientBG 8s ease infinite'
    },
    inputField: {
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(138, 158, 255, 0.3)',
      color: cyberColors.cyberWhite,
      transition: 'all 0.3s ease'
    },
    inputFocus: {
      borderColor: cyberColors.neonCyan,
      boxShadow: '0 0 0 3px rgba(0, 245, 212, 0.2)'
    },
    primaryButton: {
      background: `linear-gradient(90deg, ${cyberColors.electricBlue}, ${cyberColors.neonCyan})`,
      color: cyberColors.deepMidnight,
      boxShadow: '0 4px 15px rgba(74, 107, 255, 0.4)',
      transition: 'all 0.3s ease'
    },
    buttonHover: {
      transform: 'translateY(-3px)',
      boxShadow: '0 6px 20px rgba(74, 107, 255, 0.6)'
    },
    radioButton: {
      accentColor: cyberColors.neonCyan
    },
    linkText: {
      color: cyberColors.neonCyan,
      transition: 'all 0.3s ease'
    },
    linkHover: {
      color: cyberColors.electricBlue
    }
  };

  return (
    <div style={cyberStyles.mainContainer} className="min-h-screen flex items-center justify-center relative">
      {/* Animated Background Glow Effects */}
      <div style={{
        position: 'fixed',
        width: '300px',
        height: '300px',
        background: `radial-gradient(circle, ${cyberColors.electricBlue} 0%, transparent 70%)`,
        filter: 'blur(80px)',
        opacity: '0.3',
        top: '-50px',
        left: '-50px',
        zIndex: '-1'
      }}></div>
      <div style={{
        position: 'fixed',
        width: '300px',
        height: '300px',
        background: `radial-gradient(circle, ${cyberColors.neonCyan} 0%, transparent 70%)`,
        filter: 'blur(80px)',
        opacity: '0.3',
        bottom: '-50px',
        right: '-50px',
        zIndex: '-1'
      }}></div>
      <div style={{
        position: 'fixed',
        width: '300px',
        height: '300px',
        background: `radial-gradient(circle, ${cyberColors.pulsePink} 0%, transparent 70%)`,
        filter: 'blur(80px)',
        opacity: '0.3',
        top: '50%',
        left: '30%',
        zIndex: '-1'
      }}></div>

      <div style={cyberStyles.formContainer} className="p-8 w-full max-w-md m-4">
        <h2 style={cyberStyles.gradientText} className="text-3xl font-extrabold text-center mb-6">
          {type === 'signup' ? 'Join CyberPharma' : 'Welcome Back'}
        </h2>
        <p className="text-center mb-6 opacity-80" style={{ color: cyberColors.cyberWhite }}>
          {type === 'signup' ? 'Create your secure healthcare account' : 'Access your healthcare dashboard'}
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {type === 'signup' && (
            <>
              <div className="flex items-center rounded-lg p-3" style={cyberStyles.inputField}>
                <FaUser style={{ color: cyberColors.neonCyan }} className="mr-3" />
                <input
                  type="text"
                  name="fullname"
                  placeholder="Full Name"
                  style={{ 
                    background: 'transparent',
                    color: cyberColors.cyberWhite,
                    width: '100%'
                  }}
                  className="focus:outline-none placeholder-opacity-70"
                  onChange={handleChange}
                  required
                  onFocus={(e) => {
                    e.target.parentElement.style.borderColor = cyberColors.neonCyan;
                    e.target.parentElement.style.boxShadow = '0 0 0 3px rgba(0, 245, 212, 0.2)';
                  }}
                  onBlur={(e) => {
                    e.target.parentElement.style.borderColor = 'rgba(138, 158, 255, 0.3)';
                    e.target.parentElement.style.boxShadow = 'none';
                  }}
                />
              </div>
              <div className="flex items-center rounded-lg p-3" style={cyberStyles.inputField}>
                <FaUser style={{ color: cyberColors.neonCyan }} className="mr-3" />
                <input
                  type="text"
                  name="username"
                  placeholder="Username"
                  style={{ 
                    background: 'transparent',
                    color: cyberColors.cyberWhite,
                    width: '100%'
                  }}
                  className="focus:outline-none placeholder-opacity-70"
                  onChange={handleChange}
                  required
                  onFocus={(e) => {
                    e.target.parentElement.style.borderColor = cyberColors.neonCyan;
                    e.target.parentElement.style.boxShadow = '0 0 0 3px rgba(0, 245, 212, 0.2)';
                  }}
                  onBlur={(e) => {
                    e.target.parentElement.style.borderColor = 'rgba(138, 158, 255, 0.3)';
                    e.target.parentElement.style.boxShadow = 'none';
                  }}
                />
              </div>
            </>
          )}
          
          <div className="flex items-center rounded-lg p-3" style={cyberStyles.inputField}>
            <FaEnvelope style={{ color: cyberColors.neonCyan }} className="mr-3" />
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              style={{ 
                background: 'transparent',
                color: cyberColors.cyberWhite,
                width: '100%'
              }}
              className="focus:outline-none placeholder-opacity-70"
              onChange={handleChange}
              required
              onFocus={(e) => {
                e.target.parentElement.style.borderColor = cyberColors.neonCyan;
                e.target.parentElement.style.boxShadow = '0 0 0 3px rgba(0, 245, 212, 0.2)';
              }}
              onBlur={(e) => {
                e.target.parentElement.style.borderColor = 'rgba(138, 158, 255, 0.3)';
                e.target.parentElement.style.boxShadow = 'none';
              }}
            />
          </div>
          
          <div className="flex items-center rounded-lg p-3" style={cyberStyles.inputField}>
            <FaLock style={{ color: cyberColors.neonCyan }} className="mr-3" />
            <input
              type="password"
              name="password"
              placeholder="Password"
              style={{ 
                background: 'transparent',
                color: cyberColors.cyberWhite,
                width: '100%'
              }}
              className="focus:outline-none placeholder-opacity-70"
              onChange={handleChange}
              required
              onFocus={(e) => {
                e.target.parentElement.style.borderColor = cyberColors.neonCyan;
                e.target.parentElement.style.boxShadow = '0 0 0 3px rgba(0, 245, 212, 0.2)';
              }}
              onBlur={(e) => {
                e.target.parentElement.style.borderColor = 'rgba(138, 158, 255, 0.3)';
                e.target.parentElement.style.boxShadow = 'none';
              }}
            />
          </div>
          
          {type === 'signup' && (
            <>
              <div className="flex items-center rounded-lg p-3" style={cyberStyles.inputField}>
                <FaLock style={{ color: cyberColors.neonCyan }} className="mr-3" />
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  style={{ 
                    background: 'transparent',
                    color: cyberColors.cyberWhite,
                    width: '100%'
                  }}
                  className="focus:outline-none placeholder-opacity-70"
                  onChange={handleChange}
                  required
                  onFocus={(e) => {
                    e.target.parentElement.style.borderColor = cyberColors.neonCyan;
                    e.target.parentElement.style.boxShadow = '0 0 0 3px rgba(0, 245, 212, 0.2)';
                  }}
                  onBlur={(e) => {
                    e.target.parentElement.style.borderColor = 'rgba(138, 158, 255, 0.3)';
                    e.target.parentElement.style.boxShadow = 'none';
                  }}
                />
              </div>
              
              <div className="flex items-center space-x-6 justify-center">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    value="male"
                    checked={formData.gender === 'male'}
                    onChange={handleChange}
                    className="mr-2"
                    style={cyberStyles.radioButton}
                  />
                  <span style={{ color: cyberColors.cyberWhite }}>Male</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    value="female"
                    checked={formData.gender === 'female'}
                    onChange={handleChange}
                    className="mr-2"
                    style={cyberStyles.radioButton}
                  />
                  <span style={{ color: cyberColors.cyberWhite }}>Female</span>
                </label>
              </div>
            </>
          )}
          
          <button
            type="submit"
            style={cyberStyles.primaryButton}
            className="w-full py-3 rounded-lg font-semibold transition-all duration-300 hover:transform hover:-translate-y-1"
            disabled={loading}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.transform = 'translateY(-3px)';
                e.target.style.boxShadow = '0 6px 20px rgba(74, 107, 255, 0.6)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 15px rgba(74, 107, 255, 0.4)';
              }
            }}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Processing...
              </div>
            ) : type === 'signup' ? 'Create Account' : 'Access Dashboard'}
          </button>
        </form>
        
        <p className="text-center text-sm mt-6" style={{ color: cyberColors.cyberWhite, opacity: '0.8' }}>
          {type === 'signup' ? (
            <>
              Already have an account?{' '}
              <Link to="/login">
                <span 
                  style={cyberStyles.linkText}
                  className="underline font-semibold transition-colors duration-300 hover:opacity-80"
                  onMouseEnter={(e) => e.target.style.color = cyberColors.electricBlue}
                  onMouseLeave={(e) => e.target.style.color = cyberColors.neonCyan}
                >
                  Sign In
                </span>
              </Link>
            </>
          ) : (
            <>
              New to CyberPharma?{' '}
              <Link to="/signup">
                <span 
                  style={cyberStyles.linkText}
                  className="underline font-semibold transition-colors duration-300 hover:opacity-80"
                  onMouseEnter={(e) => e.target.style.color = cyberColors.electricBlue}
                  onMouseLeave={(e) => e.target.style.color = cyberColors.neonCyan}
                >
                  Create Account
                </span>
              </Link>
            </>
          )}
        </p>

        {/* Security Badge */}
        <div className="text-center mt-6 pt-4 border-t" style={{ borderColor: 'rgba(138, 158, 255, 0.2)' }}>
          <p className="text-xs opacity-60" style={{ color: cyberColors.cyberWhite }}>
            🔒 Secure & Encrypted • HIPAA Compliant
          </p>
        </div>
      </div>

      {/* Add CSS animation for gradient text */}
      <style>
        {`
          @keyframes gradientBG {
            0% { background-position: 0% 50% }
            50% { background-position: 100% 50% }
            100% { background-position: 0% 50% }
          }
          
          input::placeholder {
            color: rgba(240, 244, 255, 0.6) !important;
          }
        `}
      </style>

      <Toaster 
        position="top-center"
        toastOptions={{
          style: {
            background: cyberColors.deepMidnight,
            color: cyberColors.cyberWhite,
            border: `1px solid ${cyberColors.neonCyan}`,
            borderRadius: '10px',
          },
          success: {
            iconTheme: {
              primary: cyberColors.neonCyan,
              secondary: cyberColors.deepMidnight,
            },
          },
          error: {
            iconTheme: {
              primary: cyberColors.emergencyRed,
              secondary: cyberColors.deepMidnight,
            },
          },
        }}
      />
    </div>
  );
};

export default AuthForm;