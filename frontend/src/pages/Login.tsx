import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hexagon, Mail, Lock, User, ArrowRight } from 'lucide-react';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isRedirecting, setIsRedirecting] = useState(false);
  const navigate = useNavigate();

  // Handle OAuth Redirect Return
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('access_token=')) {
      // Clear the hash for security/cleanliness
      window.location.hash = '';
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userName', 'Google User');
      navigate('/workflows', { replace: true });
    }
  }, [navigate]);

  const handleGoogleLogin = () => {
    setIsRedirecting(true);
    // Simulate an authorized JavaScript redirect to an OAuth provider
    setTimeout(() => {
      window.location.href = `${window.location.origin}/login#state=pass-through&access_token=ya29.mockGoogleAuthToken12345&token_type=Bearer`;
    }, 800); // 800ms artificial delay to show loading state
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock login — just save a flag and redirect
    if (email && password) {
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userName', isLogin ? 'Demo User' : name || 'New User');
      navigate('/workflows');
    }
  };

  return (
    <div className="login-container">
      {/* Background with abstract glowing orbs */}
      <div className="login-bg-mesh">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>

      <div className="login-content">
        {/* Left Side: Branding */}
        <div className="login-brand-panel">
          <div className="login-logo-wrapper">
            <img src="/halleyx_logo.jpeg" alt="Halleyx" style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'contain' }} />
            <div>
              <h1 className="login-brand-name">Halleyx</h1>
              <p className="login-brand-sub">WORKFLOW ENGINE</p>
            </div>
          </div>
          <div className="login-brand-text">
            <h2>Automate the impossible.</h2>
            <p>Design, execute, and monitor complex business logic with zero friction. The most powerful visual workflow engine built for modern teams.</p>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="login-form-panel glass-card">
          <div className="login-form-header">
            <h3>{isLogin ? 'Welcome back' : 'Create an account'}</h3>
            <p>{isLogin ? 'Sign in to access your dashboard' : 'Join Halleyx to start automating'}</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {!isLogin && (
              <div className="input-group">
                <label>Full Name</label>
                <div className="login-input-wrapper">
                  <User size={16} className="login-input-icon" />
                  <input
                    type="text"
                    className="input-field"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            <div className="input-group">
              <label>Email Address</label>
              <div className="login-input-wrapper">
                <Mail size={16} className="login-input-icon" />
                <input
                  type="email"
                  className="input-field"
                  placeholder="hello@halleyx.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <div className="flex justify-between items-center w-full">
                <label>Password</label>
                {isLogin && <a href="#" className="forgot-password">Forgot password?</a>}
              </div>
              <div className="login-input-wrapper">
                <Lock size={16} className="login-input-icon" />
                <input
                  type="password"
                  className="input-field"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary login-submit-btn" disabled={isRedirecting}>
              {isLogin ? 'Sign In' : 'Create Account'}
              <ArrowRight size={16} />
            </button>

            <div className="flex items-center justify-center gap-4" style={{ margin: '8px 0' }}>
              <div style={{ flex: 1, height: 1, background: 'var(--glass-border)' }} />
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>OR</span>
              <div style={{ flex: 1, height: 1, background: 'var(--glass-border)' }} />
            </div>

            <button 
              type="button" 
              className="btn btn-secondary login-submit-btn" 
              onClick={handleGoogleLogin}
              disabled={isRedirecting}
            >
              {isRedirecting ? (
                <div className="spinner" style={{ width: 16, height: 16, borderColor: 'rgba(255,255,255,0.2)', borderTopColor: '#fff' }} />
              ) : (
                <img src="https://fonts.gstatic.com/s/i/productlogos/googleg/v6/24px.svg" alt="G" style={{ width: 18, height: 18 }} />
              )}
              {isRedirecting ? 'Authorizing...' : 'Sign in with Google'}
            </button>
          </form>

          <div className="login-form-footer">
            <p>
              {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
              <button 
                type="button" 
                className="toggle-auth-mode"
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
