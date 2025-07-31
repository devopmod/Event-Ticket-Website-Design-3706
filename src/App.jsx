import React from 'react';
import {HashRouter as Router, Routes, Route} from 'react-router-dom';
import './App.css';
import './i18n';

// Public Pages
import Home from './pages/Home';
import ConcertList from './pages/ConcertList';
import ConcertDetail from './pages/ConcertDetail';
import SeatSelectionPage from './pages/SeatSelectionPage';
import Checkout from './pages/Checkout';

// Admin Pages
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminConcerts from './pages/admin/AdminConcerts';
import AdminVenues from './pages/admin/AdminVenues';
import AdminOrders from './pages/admin/AdminOrders';
import AdminUsers from './pages/admin/AdminUsers';
import AdminSettings from './pages/admin/AdminSettings';

// Admin Components
import EventDashboard from './components/admin/EventDashboard';

// Components
import ProtectedRoute from './components/common/ProtectedRoute';

const App = () => {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/concerts" element={<ConcertList />} />
          <Route path="/concert/:id" element={<ConcertDetail />} />
          <Route path="/seat-selection/:id" element={<SeatSelectionPage />} />
          <Route path="/checkout/:id" element={<Checkout />} />
          
          {/* For backward compatibility */}
          <Route path="/event/:id" element={<ConcertDetail />} />
          
          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/concerts" element={
            <ProtectedRoute>
              <AdminConcerts />
            </ProtectedRoute>
          } />
          <Route path="/admin/events/:id/dashboard" element={
            <ProtectedRoute>
              <EventDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/venues" element={
            <ProtectedRoute>
              <AdminVenues />
            </ProtectedRoute>
          } />
          <Route path="/admin/orders" element={
            <ProtectedRoute>
              <AdminOrders />
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute>
              <AdminUsers />
            </ProtectedRoute>
          } />
          <Route path="/admin/settings" element={
            <ProtectedRoute>
              <AdminSettings />
            </ProtectedRoute>
          } />
          
          {/* Fallback Route */}
          <Route path="*" element={<Home />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;