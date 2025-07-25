import React, { useState } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../components/common/SafeIcon';
import AdminNavBar from '../../components/admin/AdminNavBar';

const { FiSearch, FiDownload, FiCalendar, FiFilter } = FiIcons;

const AdminOrders = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Mock orders data
  const mockOrders = [
    {
      id: 'ORD-2025-001',
      customerName: 'John Smith',
      customerEmail: 'john.smith@example.com',
      date: '2025-08-05',
      event: 'MAX KORZH',
      tickets: 2,
      total: '€240',
      status: 'completed'
    },
    {
      id: 'ORD-2025-002',
      customerName: 'Maria Garcia',
      customerEmail: 'maria.g@example.com',
      date: '2025-08-04',
      event: 'DVIZH ТУСА',
      tickets: 3,
      total: '€135',
      status: 'completed'
    },
    {
      id: 'ORD-2025-003',
      customerName: 'Alex Johnson',
      customerEmail: 'alex.j@example.com',
      date: '2025-08-04',
      event: 'Bustour Berlin-Warsaw-Berlin',
      tickets: 1,
      total: '€45',
      status: 'pending'
    },
    {
      id: 'ORD-2025-004',
      customerName: 'Emma Wilson',
      customerEmail: 'emma.w@example.com',
      date: '2025-08-03',
      event: 'MAX KORZH',
      tickets: 4,
      total: '€480',
      status: 'completed'
    },
    {
      id: 'ORD-2025-005',
      customerName: 'Robert Brown',
      customerEmail: 'robert.b@example.com',
      date: '2025-08-03',
      event: 'Bustour Riga-Warsaw-Riga',
      tickets: 2,
      total: '€90',
      status: 'cancelled'
    }
  ];

  // Filter orders based on search and filters
  const filteredOrders = mockOrders.filter(order => {
    // Search filter
    const matchesSearch = 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.event.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Date filter
    const matchesDate = dateFilter === 'all' ? true : order.date === dateFilter;
    
    // Status filter
    const matchesStatus = statusFilter === 'all' ? true : order.status === statusFilter;
    
    return matchesSearch && matchesDate && matchesStatus;
  });
  
  // Function to get status badge style
  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-400';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'cancelled':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      <AdminNavBar />
      
      <div className="ml-0 lg:ml-64 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <h1 className="text-2xl font-bold">Order Management</h1>
            
            <button
              className="flex items-center justify-center bg-primary-400 hover:bg-primary-500 text-black px-4 py-2 rounded-lg transition-colors"
            >
              <SafeIcon icon={FiDownload} className="mr-2" />
              Export CSV
            </button>
          </div>
          
          {/* Filters */}
          <div className="bg-zinc-800 p-4 rounded-lg mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <SafeIcon 
                  icon={FiSearch} 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-zinc-700 border border-zinc-700 rounded-lg w-full focus:outline-none focus:border-primary-400"
                />
              </div>
              
              <div className="relative">
                <SafeIcon 
                  icon={FiCalendar} 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-zinc-700 border border-zinc-700 rounded-lg w-full focus:outline-none focus:border-primary-400 appearance-none"
                >
                  <option value="all">All Dates</option>
                  <option value="2025-08-05">August 5, 2025</option>
                  <option value="2025-08-04">August 4, 2025</option>
                  <option value="2025-08-03">August 3, 2025</option>
                </select>
              </div>
              
              <div className="relative">
                <SafeIcon 
                  icon={FiFilter} 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-zinc-700 border border-zinc-700 rounded-lg w-full focus:outline-none focus:border-primary-400 appearance-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Orders Table */}
          <div className="bg-zinc-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-zinc-700/50">
                    <th className="text-left py-3 px-4 font-medium">Order ID</th>
                    <th className="text-left py-3 px-4 font-medium">Customer</th>
                    <th className="text-left py-3 px-4 font-medium">Date</th>
                    <th className="text-left py-3 px-4 font-medium">Event</th>
                    <th className="text-center py-3 px-4 font-medium">Tickets</th>
                    <th className="text-right py-3 px-4 font-medium">Total</th>
                    <th className="text-center py-3 px-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="border-t border-zinc-700 hover:bg-zinc-700/30">
                      <td className="py-3 px-4 font-medium">{order.id}</td>
                      <td className="py-3 px-4">
                        <div>
                          <div>{order.customerName}</div>
                          <div className="text-gray-400 text-sm">{order.customerEmail}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-300">{order.date}</td>
                      <td className="py-3 px-4 text-gray-300">{order.event}</td>
                      <td className="py-3 px-4 text-center">{order.tickets}</td>
                      <td className="py-3 px-4 text-right font-medium">{order.total}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeStyle(order.status)}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {filteredOrders.length === 0 && (
              <div className="py-8 text-center text-gray-400">
                No orders found matching your search criteria
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOrders;