import React, { useState } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../components/common/SafeIcon';
import AdminNavBar from '../../components/admin/AdminNavBar';

const { FiSearch, FiUserPlus, FiEdit, FiTrash2, FiMail, FiLock } = FiIcons;

const AdminUsers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Mock users data
  const mockUsers = [
    {
      id: 1,
      name: 'Admin User',
      email: 'admin@example.com',
      role: 'admin',
      lastLogin: '2025-08-05 14:32',
      status: 'active'
    },
    {
      id: 2,
      name: 'Staff Member',
      email: 'staff@example.com',
      role: 'staff',
      lastLogin: '2025-08-04 09:15',
      status: 'active'
    },
    {
      id: 3,
      name: 'Content Editor',
      email: 'editor@example.com',
      role: 'editor',
      lastLogin: '2025-08-03 16:45',
      status: 'active'
    },
    {
      id: 4,
      name: 'Former Employee',
      email: 'former@example.com',
      role: 'staff',
      lastLogin: '2025-07-25 11:20',
      status: 'inactive'
    }
  ];

  // Filter users based on search term
  const filteredUsers = mockUsers.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Function to get status badge style
  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-400';
      case 'inactive':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };
  
  // Function to get role badge style
  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-500/20 text-purple-400';
      case 'staff':
        return 'bg-blue-500/20 text-blue-400';
      case 'editor':
        return 'bg-primary-500/20 text-primary-400';
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
            <h1 className="text-2xl font-bold">User Management</h1>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              <div className="relative">
                <SafeIcon 
                  icon={FiSearch} 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg w-full sm:w-64 focus:outline-none focus:border-primary-400"
                />
              </div>
              
              <button
                className="flex items-center justify-center bg-primary-400 hover:bg-primary-500 text-black px-4 py-2 rounded-lg transition-colors"
              >
                <SafeIcon icon={FiUserPlus} className="mr-2" />
                Add User
              </button>
            </div>
          </div>
          
          {/* Users Table */}
          <div className="bg-zinc-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-zinc-700/50">
                    <th className="text-left py-3 px-4 font-medium">Name</th>
                    <th className="text-left py-3 px-4 font-medium">Email</th>
                    <th className="text-left py-3 px-4 font-medium">Role</th>
                    <th className="text-left py-3 px-4 font-medium">Last Login</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                    <th className="text-right py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-t border-zinc-700 hover:bg-zinc-700/30">
                      <td className="py-3 px-4 font-medium">{user.name}</td>
                      <td className="py-3 px-4 text-gray-300">{user.email}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${getRoleBadgeStyle(user.role)}`}>
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-300">{user.lastLogin}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeStyle(user.status)}`}>
                          {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button className="p-2 hover:bg-zinc-700 rounded-lg mr-1" title="Edit User">
                          <SafeIcon icon={FiEdit} className="w-5 h-5 text-blue-400" />
                        </button>
                        <button className="p-2 hover:bg-zinc-700 rounded-lg mr-1" title="Reset Password">
                          <SafeIcon icon={FiLock} className="w-5 h-5 text-primary-400" />
                        </button>
                        <button className="p-2 hover:bg-zinc-700 rounded-lg mr-1" title="Send Email">
                          <SafeIcon icon={FiMail} className="w-5 h-5 text-green-400" />
                        </button>
                        <button className="p-2 hover:bg-zinc-700 rounded-lg" title="Delete User">
                          <SafeIcon icon={FiTrash2} className="w-5 h-5 text-red-400" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {filteredUsers.length === 0 && (
              <div className="py-8 text-center text-gray-400">
                No users found matching your search criteria
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;