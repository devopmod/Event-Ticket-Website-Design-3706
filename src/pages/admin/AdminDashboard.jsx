import React from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../components/common/SafeIcon';
import AdminNavBar from '../../components/admin/AdminNavBar';

const { 
  FiDollarSign, 
  FiUsers, 
  FiCalendar, 
  FiClock,
  FiPieChart,
  FiTrendingUp
} = FiIcons;

const AdminDashboard = () => {
  // Mock data for dashboard
  const stats = [
    { 
      title: "Today's Sales", 
      value: "€4,385", 
      change: "+12%", 
      icon: FiDollarSign,
      color: "bg-green-500/20 text-green-400"
    },
    { 
      title: "Total Customers", 
      value: "2,847", 
      change: "+5%", 
      icon: FiUsers,
      color: "bg-blue-500/20 text-blue-400"
    },
    { 
      title: "Active Events", 
      value: "24", 
      change: "+2", 
      icon: FiCalendar,
      color: "bg-purple-500/20 text-purple-400"
    },
    { 
      title: "Avg. Response Time", 
      value: "1.2h", 
      change: "-10%", 
      icon: FiClock,
      color: "bg-primary-500/20 text-primary-400"
    }
  ];

  const recentEvents = [
    { id: 1, title: "MAX KORZH", date: "09 August 2025", sales: 458, total: "€22,900" },
    { id: 2, title: "DVIZH ТУСА", date: "09 August 2025", sales: 312, total: "€15,600" },
    { id: 3, title: "Bustour Berlin-Warsaw", date: "08 August 2025", sales: 187, total: "€8,415" }
  ];

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      <AdminNavBar />
      
      <div className="ml-0 lg:ml-64 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold mb-8">Dashboard</h1>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-zinc-800 rounded-lg p-6"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-gray-400 text-sm">{stat.title}</p>
                    <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
                    <span className={`inline-block mt-2 text-xs px-2 py-1 rounded-full ${stat.color}`}>
                      {stat.change}
                    </span>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.color}`}>
                    <SafeIcon icon={stat.icon} className="w-6 h-6" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Sales */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-zinc-800 rounded-lg p-6 lg:col-span-2"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold">Recent Sales</h2>
                <button className="text-sm text-primary-400 hover:text-primary-300">
                  View All
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-700">
                      <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Event</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">Date</th>
                      <th className="text-right py-3 px-4 text-gray-400 font-medium text-sm">Tickets Sold</th>
                      <th className="text-right py-3 px-4 text-gray-400 font-medium text-sm">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentEvents.map(event => (
                      <tr key={event.id} className="border-b border-zinc-700/50 last:border-0">
                        <td className="py-3 px-4">{event.title}</td>
                        <td className="py-3 px-4 text-gray-400">{event.date}</td>
                        <td className="py-3 px-4 text-right">{event.sales}</td>
                        <td className="py-3 px-4 text-right font-medium">{event.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
            
            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-zinc-800 rounded-lg p-6"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold">Revenue Breakdown</h2>
                <SafeIcon icon={FiPieChart} className="text-gray-400" />
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Concerts</span>
                    <span>€38,500</span>
                  </div>
                  <div className="w-full bg-zinc-700 rounded-full h-2">
                    <div className="bg-primary-400 h-2 rounded-full" style={{ width: '65%' }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Bus Tours</span>
                    <span>€12,800</span>
                  </div>
                  <div className="w-full bg-zinc-700 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '22%' }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Parties</span>
                    <span>€7,650</span>
                  </div>
                  <div className="w-full bg-zinc-700 rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: '13%' }}></div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-zinc-700">
                <div className="flex items-center">
                  <SafeIcon icon={FiTrendingUp} className="text-green-400 mr-2" />
                  <span className="text-sm">Total revenue is up 24% from last month</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;