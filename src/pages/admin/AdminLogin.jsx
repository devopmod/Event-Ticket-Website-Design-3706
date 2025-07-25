import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../components/common/SafeIcon';

const {FiUser, FiLock, FiArrowRight, FiClipboard} = FiIcons;

const AdminLogin = () => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Admin credentials for demo
  const ADMIN_CREDENTIALS = {
    email: 'admin@fanaticka.com',
    password: 'admin123'
  };

  const handleChange = (e) => {
    const {name, value} = e.target;
    setCredentials(prev => ({...prev, [name]: value}));
  };

  // Автозаполнение учетных данных
  const autofillCredentials = () => {
    setCredentials({
      email: ADMIN_CREDENTIALS.email,
      password: ADMIN_CREDENTIALS.password
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      if (
        credentials.email === ADMIN_CREDENTIALS.email &&
        credentials.password === ADMIN_CREDENTIALS.password
      ) {
        localStorage.setItem('adminToken', 'demo-token-123');
        navigate('/admin/dashboard');
      } else {
        setError('Invalid email or password');
      }
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-zinc-900 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-400 mb-2">FANATICKA</h1>
          <p className="text-gray-400">Admin Dashboard</p>
        </div>

        <div className="bg-zinc-800 rounded-lg p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-white mb-6">Sign In</h2>

          {/* Demo Credentials Display with Autofill Button */}
          <div className="bg-zinc-700/50 border border-zinc-600 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium text-primary-400">Demo Credentials:</h3>
              <button 
                onClick={autofillCredentials}
                className="flex items-center px-2 py-1 text-xs bg-primary-400 hover:bg-primary-500 text-black rounded transition-colors"
              >
                <SafeIcon icon={FiClipboard} className="mr-1 w-3 h-3" />
                Autofill
              </button>
            </div>
            <div className="text-sm text-gray-300">
              <div><strong>Email:</strong> admin@fanaticka.com</div>
              <div><strong>Password:</strong> admin123</div>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-400 text-sm mb-2">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <SafeIcon icon={FiUser} className="text-gray-500" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={credentials.email}
                  onChange={handleChange}
                  className="w-full bg-zinc-700 border border-zinc-600 rounded-lg py-3 px-4 pl-10 text-white focus:outline-none focus:border-primary-400"
                  placeholder="admin@fanaticka.com"
                  required
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-gray-400 text-sm mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <SafeIcon icon={FiLock} className="text-gray-500" />
                </div>
                <input
                  type="password"
                  name="password"
                  value={credentials.password}
                  onChange={handleChange}
                  className="w-full bg-zinc-700 border border-zinc-600 rounded-lg py-3 px-4 pl-10 text-white focus:outline-none focus:border-primary-400"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-400 hover:bg-primary-500 text-black font-medium py-3 px-4 rounded-lg flex items-center justify-center transition-colors"
            >
              {loading ? 'Signing in...' : (
                <>
                  Sign In
                  <SafeIcon icon={FiArrowRight} className="ml-2" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <a href="/" className="text-primary-400 hover:text-primary-300 text-sm">
              Return to Website
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;