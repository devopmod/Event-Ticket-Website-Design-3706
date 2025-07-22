import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../../components/common/SafeIcon';

const { FiHome, FiCalendar, FiShoppingBag, FiUsers, FiSettings, FiLogOut, FiMenu, FiX, FiMap } = FiIcons;

const AdminNavBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: FiHome },
    { path: '/admin/concerts', label: 'Concerts', icon: FiCalendar },
    { path: '/admin/venues', label: 'Venues', icon: FiMap },
    { path: '/admin/orders', label: 'Orders', icon: FiShoppingBag },
    { path: '/admin/users', label: 'Users', icon: FiUsers },
    { path: '/admin/settings', label: 'Settings', icon: FiSettings }
  ];

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between bg-zinc-800 p-4 border-b border-zinc-700">
        <div className="flex items-center">
          <button
            onClick={toggleSidebar}
            className="p-2 mr-4 rounded-lg hover:bg-zinc-700"
          >
            <SafeIcon icon={isSidebarOpen ? FiX : FiMenu} className="w-6 h-6" />
          </button>
          <Link to="/admin/dashboard" className="text-xl font-bold text-primary-400">
            FANATICKA
          </Link>
        </div>
      </div>

      {/* Sidebar - Desktop (fixed) and Mobile (overlay) */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-zinc-800 border-r border-zinc-700 transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-zinc-700">
          <Link to="/admin/dashboard" className="flex items-center">
            <div className="text-xl font-bold text-primary-400">FANATICKA</div>
            <div className="ml-2 text-xs bg-zinc-700 px-2 py-1 rounded-md">Admin</div>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="mt-6">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center px-4 py-3 text-gray-300 hover:bg-zinc-700/50 ${
                      isActive
                        ? 'bg-primary-400/10 text-primary-400 border-r-4 border-primary-400'
                        : ''
                    }`}
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <SafeIcon
                      icon={item.icon}
                      className={`w-5 h-5 mr-3 ${
                        isActive ? 'text-primary-400' : 'text-gray-400'
                      }`}
                    />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sidebar Footer */}
        <div className="absolute bottom-0 w-full p-4 border-t border-zinc-700">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 text-gray-400 hover:text-white hover:bg-zinc-700/50 rounded-lg"
          >
            <SafeIcon icon={FiLogOut} className="w-5 h-5 mr-3" />
            Logout
          </button>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}
    </>
  );
};

export default AdminNavBar;