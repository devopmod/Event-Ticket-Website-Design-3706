import React, { useState } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../components/common/SafeIcon';
import AdminNavBar from '../../components/admin/AdminNavBar';

const { FiSave, FiGlobe, FiCreditCard, FiMail, FiServer } = FiIcons;

const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState('general');
  
  const tabs = [
    { id: 'general', label: 'General', icon: FiGlobe },
    { id: 'payment', label: 'Payment', icon: FiCreditCard },
    { id: 'notifications', label: 'Notifications', icon: FiMail },
    { id: 'system', label: 'System', icon: FiServer }
  ];
  
  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      <AdminNavBar />
      
      <div className="ml-0 lg:ml-64 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold mb-8">Settings</h1>
          
          <div className="bg-zinc-800 rounded-lg overflow-hidden">
            {/* Tabs */}
            <div className="border-b border-zinc-700">
              <div className="flex overflow-x-auto scrollbar-hide">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center px-6 py-4 transition-colors ${
                      activeTab === tab.id
                        ? 'text-primary-400 border-b-2 border-primary-400'
                        : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    <SafeIcon icon={tab.icon} className="mr-2" />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'general' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-lg font-medium mb-4">Site Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Site Name</label>
                        <input
                          type="text"
                          defaultValue="FANATICKA"
                          className="w-full px-4 py-2 bg-zinc-700 border border-zinc-600 rounded-lg focus:outline-none focus:border-primary-400"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Site URL</label>
                        <input
                          type="text"
                          defaultValue="https://fanaticka.com"
                          className="w-full px-4 py-2 bg-zinc-700 border border-zinc-600 rounded-lg focus:outline-none focus:border-primary-400"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-zinc-700">
                    <h2 className="text-lg font-medium mb-4">Localization</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Default Language</label>
                        <select className="w-full px-4 py-2 bg-zinc-700 border border-zinc-600 rounded-lg focus:outline-none focus:border-primary-400">
                          <option value="en">English</option>
                          <option value="ru">Russian</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Default Currency</label>
                        <select className="w-full px-4 py-2 bg-zinc-700 border border-zinc-600 rounded-lg focus:outline-none focus:border-primary-400">
                          <option value="EUR">Euro (€)</option>
                          <option value="USD">US Dollar ($)</option>
                          <option value="RUB">Russian Ruble (₽)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              
              {activeTab === 'payment' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-lg font-medium mb-4">Payment Gateways</h2>
                    <div className="space-y-4">
                      <div className="flex items-center p-4 border border-zinc-700 rounded-lg">
                        <input
                          type="checkbox"
                          id="stripe"
                          defaultChecked
                          className="w-4 h-4 text-primary-400 bg-transparent border-gray-500 focus:ring-primary-400"
                        />
                        <label htmlFor="stripe" className="ml-3 flex-1">Stripe</label>
                        <button className="text-sm text-primary-400">Configure</button>
                      </div>
                      
                      <div className="flex items-center p-4 border border-zinc-700 rounded-lg">
                        <input
                          type="checkbox"
                          id="paypal"
                          className="w-4 h-4 text-primary-400 bg-transparent border-gray-500 focus:ring-primary-400"
                        />
                        <label htmlFor="paypal" className="ml-3 flex-1">PayPal</label>
                        <button className="text-sm text-primary-400">Configure</button>
                      </div>
                      
                      <div className="flex items-center p-4 border border-zinc-700 rounded-lg">
                        <input
                          type="checkbox"
                          id="applepay"
                          defaultChecked
                          className="w-4 h-4 text-primary-400 bg-transparent border-gray-500 focus:ring-primary-400"
                        />
                        <label htmlFor="applepay" className="ml-3 flex-1">Apple Pay</label>
                        <button className="text-sm text-primary-400">Configure</button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-zinc-700">
                    <h2 className="text-lg font-medium mb-4">Service Fees</h2>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Service Fee (%)</label>
                      <input
                        type="number"
                        defaultValue="5"
                        min="0"
                        max="100"
                        className="w-full px-4 py-2 bg-zinc-700 border border-zinc-600 rounded-lg focus:outline-none focus:border-primary-400"
                      />
                      <p className="mt-1 text-xs text-gray-400">
                        This fee will be added to the ticket price during checkout
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
              
              {activeTab === 'notifications' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-lg font-medium mb-4">Email Settings</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Email From</label>
                        <input
                          type="email"
                          defaultValue="no-reply@fanaticka.com"
                          className="w-full px-4 py-2 bg-zinc-700 border border-zinc-600 rounded-lg focus:outline-none focus:border-primary-400"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Reply-To Email</label>
                        <input
                          type="email"
                          defaultValue="support@fanaticka.com"
                          className="w-full px-4 py-2 bg-zinc-700 border border-zinc-600 rounded-lg focus:outline-none focus:border-primary-400"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-zinc-700">
                    <h2 className="text-lg font-medium mb-4">Notification Templates</h2>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-4 border border-zinc-700 rounded-lg">
                        <div>
                          <h3 className="font-medium">Order Confirmation</h3>
                          <p className="text-sm text-gray-400">Sent when a customer completes an order</p>
                        </div>
                        <button className="text-sm text-primary-400">Edit Template</button>
                      </div>
                      
                      <div className="flex justify-between items-center p-4 border border-zinc-700 rounded-lg">
                        <div>
                          <h3 className="font-medium">Ticket Delivery</h3>
                          <p className="text-sm text-gray-400">Sent when tickets are ready for download</p>
                        </div>
                        <button className="text-sm text-primary-400">Edit Template</button>
                      </div>
                      
                      <div className="flex justify-between items-center p-4 border border-zinc-700 rounded-lg">
                        <div>
                          <h3 className="font-medium">Event Reminder</h3>
                          <p className="text-sm text-gray-400">Sent 24 hours before the event</p>
                        </div>
                        <button className="text-sm text-primary-400">Edit Template</button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              
              {activeTab === 'system' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-lg font-medium mb-4">System Information</h2>
                    <div className="bg-zinc-700 p-4 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Version:</span>
                          <span>1.2.5</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Last Updated:</span>
                          <span>August 1, 2025</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Database:</span>
                          <span>Supabase</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Storage:</span>
                          <span>S3 Compatible</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-zinc-700">
                    <h2 className="text-lg font-medium mb-4">System Maintenance</h2>
                    <div className="space-y-4">
                      <button className="w-full p-3 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-left flex justify-between items-center">
                        <span>Clear System Cache</span>
                        <span className="text-sm text-gray-400">Last cleared: 2 days ago</span>
                      </button>
                      
                      <button className="w-full p-3 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-left flex justify-between items-center">
                        <span>Database Backup</span>
                        <span className="text-sm text-gray-400">Last backup: Today</span>
                      </button>
                      
                      <button className="w-full p-3 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-left flex justify-between items-center">
                        <span>Update System</span>
                        <span className="text-sm text-green-400">Up to date</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
              
              <div className="mt-8 pt-4 border-t border-zinc-700 flex justify-end">
                <button className="px-6 py-2 bg-primary-400 hover:bg-primary-500 text-black rounded-lg flex items-center">
                  <SafeIcon icon={FiSave} className="mr-2" />
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;