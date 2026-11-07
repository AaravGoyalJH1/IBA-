import React, { useState, useEffect } from 'react';
import { 
  User, Mail, Phone, MapPin, Calendar, Shield, 
  Search, Filter, MoreVertical, CheckCircle, XCircle, 
  Clock, CreditCard, DollarSign, Briefcase, Plus, FileText, X
} from 'lucide-react';
import { storage } from '../services/storageService';
import { Customer, Account } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function CustomerManagement() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState<Partial<Customer>>({
    name: '',
    email: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    occupation: '',
    monthlyIncome: 0,
    branch: 'Main',
    status: 'Active',
    kycStatus: 'Pending',
    creditScore: 700
  });

  const currentUser = storage.getCurrentUser();

  useEffect(() => {
    const fetchData = () => {
      setCustomers(storage.getCustomers());
      setAccounts(storage.getAccounts());
      setLoading(false);
    };

    fetchData();
    window.addEventListener('storage-update', fetchData);
    return () => window.removeEventListener('storage-update', fetchData);
  }, []);

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = 
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'All' || customer.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getCustomerAccounts = (customerId: string) => {
    return accounts.filter(a => a.customerId === customerId);
  };

  const getTotalBalance = (customerId: string) => {
    return getCustomerAccounts(customerId).reduce((sum, acc) => sum + acc.balance, 0);
  };

  const updateKYCStatus = (customerId: string, status: Customer['kycStatus']) => {
    if (!['Administrator', 'Branch Manager'].includes(currentUser?.role || '')) {
      alert('Permission Denied: Only Managers can update KYC status.');
      return;
    }

    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      const updatedCustomer = { ...customer, kycStatus: status };
      storage.updateCustomer(updatedCustomer);
      
      storage.logAction(
        currentUser!.uid,
        currentUser!.name,
        'KYC Update',
        `Updated KYC status for ${customer.name} to ${status}`,
        'Medium'
      );
    }
  };

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name || !newCustomer.email) return;

    const customer: Customer = {
      ...newCustomer as Customer,
      id: `cust_${Date.now()}`,
      joinedAt: new Date().toISOString(),
    };

    const updatedCustomers = [...customers, customer];
    storage.set('aaravland_bank_customers', updatedCustomers);
    
    storage.logAction(
      currentUser!.uid,
      currentUser!.name,
      'Add Customer',
      `Onboarded new customer: ${customer.name}`,
      'Medium'
    );

    setIsAddModalOpen(false);
    setNewCustomer({
      name: '',
      email: '',
      phone: '',
      address: '',
      dateOfBirth: '',
      occupation: '',
      monthlyIncome: 0,
      branch: 'Main',
      status: 'Active',
      kycStatus: 'Pending',
      creditScore: 700
    });
  };

  const handleFileUpload = (customerId: string, type: 'id' | 'address', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Simulate upload by creating a local URL
    const url = URL.createObjectURL(file);
    
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      const updatedCustomer = { 
        ...customer, 
        [type === 'id' ? 'idProofUrl' : 'addressProofUrl']: url 
      };
      storage.updateCustomer(updatedCustomer);
      setSelectedCustomer(updatedCustomer);
      
      storage.logAction(
        currentUser!.uid,
        currentUser!.name,
        'KYC Document Upload',
        `Uploaded ${type === 'id' ? 'ID' : 'Address'} proof for ${customer.name}`,
        'Low'
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Customer Portfolio</h2>
          <p className="text-gray-500 mt-1">Manage bank clients and verify KYC documentation.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 font-bold"
        >
          <Plus className="w-5 h-5" />
          <span>Onboard Customer</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Customer List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50 bg-gray-50/30">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, email or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
                  >
                    <option value="All">All Status</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Customer</th>
                    <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">KYC Status</th>
                    <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Credit Score</th>
                    <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Total Assets</th>
                    <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredCustomers.map((customer) => (
                    <tr 
                      key={customer.id} 
                      onClick={() => setSelectedCustomer(customer)}
                      className={cn(
                        "group hover:bg-blue-50/30 transition-colors cursor-pointer",
                        selectedCustomer?.id === customer.id && "bg-blue-50/50"
                      )}
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-200">
                            {customer.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{customer.name}</div>
                            <div className="text-sm text-gray-500">{customer.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={cn(
                          "px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 w-fit",
                          customer.kycStatus === 'Verified' ? "bg-emerald-100 text-emerald-700" :
                          customer.kycStatus === 'Pending' ? "bg-amber-100 text-amber-700" :
                          "bg-red-100 text-red-700"
                        )}>
                          {customer.kycStatus === 'Verified' ? <CheckCircle className="w-3 h-3" /> :
                           customer.kycStatus === 'Pending' ? <Clock className="w-3 h-3" /> :
                           <XCircle className="w-3 h-3" />}
                          {customer.kycStatus}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden max-w-[80px]">
                            <div 
                              className={cn(
                                "h-full rounded-full",
                                customer.creditScore >= 720 ? "bg-emerald-500" :
                                customer.creditScore >= 650 ? "bg-amber-500" : "bg-red-500"
                              )}
                              style={{ width: `${((customer.creditScore - 300) / 550) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-bold text-gray-700">{customer.creditScore}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="font-bold text-gray-900">{formatCurrency(getTotalBalance(customer.id))}</div>
                        <div className="text-[10px] text-gray-400 font-medium">{getCustomerAccounts(customer.id).length} Accounts</div>
                      </td>
                      <td className="px-8 py-6">
                        <button className="p-2.5 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-gray-100">
                          <MoreVertical className="w-5 h-5 text-gray-400" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Details Sidebar */}
        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {selectedCustomer ? (
              <motion.div
                key={selectedCustomer.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden sticky top-8"
              >
                <div className="p-8 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-md flex items-center justify-center text-3xl font-bold border border-white/20">
                      {selectedCustomer.name.charAt(0)}
                    </div>
                    <div className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border",
                      selectedCustomer.status === 'Active' ? "border-emerald-400/50 text-emerald-400" : "border-red-400/50 text-red-400"
                    )}>
                      {selectedCustomer.status}
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold">{selectedCustomer.name}</h3>
                  <p className="text-gray-400 text-sm mt-1">ID: {selectedCustomer.id}</p>
                </div>

                <div className="p-8 space-y-8">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-2xl">
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">KYC Status</div>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "w-2 h-2 rounded-full",
                          selectedCustomer.kycStatus === 'Verified' ? "bg-emerald-500" : "bg-amber-500"
                        )} />
                        <span className="text-sm font-bold text-gray-700">{selectedCustomer.kycStatus}</span>
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-2xl">
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Credit Score</div>
                      <div className="text-sm font-bold text-gray-700">{selectedCustomer.creditScore}</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Contact Information</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <Mail className="w-4 h-4 text-gray-400" />
                        {selectedCustomer.email}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <Phone className="w-4 h-4 text-gray-400" />
                        {selectedCustomer.phone}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        {selectedCustomer.address}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        Date of Birth: {selectedCustomer.dateOfBirth || "N/A"}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <Briefcase className="w-4 h-4 text-gray-400" />
                        {selectedCustomer.occupation}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">KYC Verification Documents</h4>
                    <div className="space-y-3">
                      {/* ID Proof */}
                      <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">ID Proof (Passport/Driving License)</span>
                          {selectedCustomer.idProofUrl ? (
                            <span className="px-2 py-0.5 bg-emerald-100 text-[10px] font-black text-emerald-700 uppercase tracking-wider rounded-md">Supplied</span>
                          ) : (
                            <span className="px-2 py-0.5 bg-red-100 text-[10px] font-black text-red-700 uppercase tracking-wider rounded-md">Required</span>
                          )}
                        </div>
                        {selectedCustomer.idProofUrl ? (
                          <div className="flex items-center justify-between gap-2 bg-white p-3 rounded-xl border border-gray-100">
                            <div className="flex items-center gap-2 truncate">
                              <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                              <span className="text-xs font-bold text-gray-700 truncate">ID_Verification_Document.png</span>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <a href={selectedCustomer.idProofUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-600 hover:underline">View</a>
                              <label className="text-xs font-bold text-gray-500 hover:text-gray-900 hover:underline cursor-pointer">
                                Replace
                                <input type="file" className="hidden" accept="image/*,application/pdf" onChange={(e) => handleFileUpload(selectedCustomer.id, 'id', e)} />
                              </label>
                            </div>
                          </div>
                        ) : (
                          <label className="flex items-center justify-center gap-2 py-3 bg-white hover:bg-gray-100/50 border border-dashed border-gray-300 rounded-xl cursor-pointer transition-colors text-xs font-bold text-gray-600">
                            <Plus className="w-4 h-4 text-gray-400" />
                            Upload ID Proof
                            <input type="file" className="hidden" accept="image/*,application/pdf" onChange={(e) => handleFileUpload(selectedCustomer.id, 'id', e)} />
                          </label>
                        )}
                      </div>

                      {/* Address Proof */}
                      <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Address Proof (Utility Bill/Bank Statement)</span>
                          {selectedCustomer.addressProofUrl ? (
                            <span className="px-2 py-0.5 bg-emerald-100 text-[10px] font-black text-emerald-700 uppercase tracking-wider rounded-md">Supplied</span>
                          ) : (
                            <span className="px-2 py-0.5 bg-red-100 text-[10px] font-black text-red-700 uppercase tracking-wider rounded-md">Required</span>
                          )}
                        </div>
                        {selectedCustomer.addressProofUrl ? (
                          <div className="flex items-center justify-between gap-2 bg-white p-3 rounded-xl border border-gray-100">
                            <div className="flex items-center gap-2 truncate">
                              <FileText className="w-4 h-4 text-purple-500 shrink-0" />
                              <span className="text-xs font-bold text-gray-700 truncate">Address_Proof_Document.png</span>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <a href={selectedCustomer.addressProofUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-600 hover:underline">View</a>
                              <label className="text-xs font-bold text-gray-500 hover:text-gray-900 hover:underline cursor-pointer">
                                Replace
                                <input type="file" className="hidden" accept="image/*,application/pdf" onChange={(e) => handleFileUpload(selectedCustomer.id, 'address', e)} />
                              </label>
                            </div>
                          </div>
                        ) : (
                          <label className="flex items-center justify-center gap-2 py-3 bg-white hover:bg-gray-100/50 border border-dashed border-gray-300 rounded-xl cursor-pointer transition-colors text-xs font-bold text-gray-600">
                            <Plus className="w-4 h-4 text-gray-400" />
                            Upload Address Proof
                            <input type="file" className="hidden" accept="image/*,application/pdf" onChange={(e) => handleFileUpload(selectedCustomer.id, 'address', e)} />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Financial Profile</h4>
                    <div className="p-5 bg-blue-50 rounded-2xl border border-blue-100">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-sm font-medium text-blue-700">Monthly Income</span>
                        <span className="text-lg font-bold text-blue-900">{formatCurrency(selectedCustomer.monthlyIncome)}</span>
                      </div>
                      <div className="space-y-3">
                        {getCustomerAccounts(selectedCustomer.id).map(acc => (
                          <div key={acc.id} className="flex justify-between items-center text-xs">
                            <span className="text-gray-500">{acc.type} Account</span>
                            <span className="font-bold text-gray-700">{formatCurrency(acc.balance)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {['Administrator', 'Branch Manager'].includes(currentUser?.role || '') && selectedCustomer.kycStatus === 'Pending' && (
                    <div className="flex gap-3 pt-4">
                      <button 
                        onClick={() => updateKYCStatus(selectedCustomer.id, 'Verified')}
                        className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Verify KYC
                      </button>
                      <button 
                        onClick={() => updateKYCStatus(selectedCustomer.id, 'Rejected')}
                        className="flex-1 py-3 bg-red-50 text-red-600 rounded-xl font-bold text-sm hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-gray-300" />
                </div>
                <h3 className="text-gray-900 font-bold">Select a Customer</h3>
                <p className="text-gray-500 text-sm mt-1">Click on a customer from the list to view their full profile and financial data.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Onboarding Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden z-10 my-8"
            >
              <div className="p-8 bg-blue-600 text-white flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black tracking-tight">Onboard New Customer</h2>
                  <p className="text-blue-100 text-sm font-medium">Register client portfolio and record KYC details</p>
                </div>
                <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleAddCustomer} className="p-8 space-y-6 max-h-[75vh] overflow-y-auto">
                {/* Basic Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.55">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Full Name</label>
                    <input 
                      required
                      type="text" 
                      placeholder="e.g. Liam Henderson"
                      value={newCustomer.name}
                      onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-sm"
                    />
                  </div>
                  <div className="space-y-1.55">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email Address</label>
                    <input 
                      required
                      type="email" 
                      placeholder="e.g. liam@example.com"
                      value={newCustomer.email}
                      onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.55">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Phone Number</label>
                    <input 
                      required
                      type="tel" 
                      placeholder="e.g. +1 (555) 124-5678"
                      value={newCustomer.phone}
                      onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-sm"
                    />
                  </div>
                  <div className="space-y-1.55">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Date of Birth</label>
                    <input 
                      required
                      type="date" 
                      value={newCustomer.dateOfBirth}
                      onChange={(e) => setNewCustomer({...newCustomer, dateOfBirth: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.55">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Residential Address</label>
                  <input 
                    required
                    type="text" 
                    placeholder="e.g. 789 Pine Lane, Suite 4B, New York, NY"
                    value={newCustomer.address}
                    onChange={(e) => setNewCustomer({...newCustomer, address: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-sm"
                  />
                </div>

                {/* Financial profile */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.55">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Occupation</label>
                    <input 
                      required
                      type="text" 
                      placeholder="e.g. Investment Analyst"
                      value={newCustomer.occupation}
                      onChange={(e) => setNewCustomer({...newCustomer, occupation: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-sm"
                    />
                  </div>
                  <div className="space-y-1.55">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Monthly Income ($)</label>
                    <input 
                      required
                      type="number" 
                      placeholder="e.g. 6200"
                      value={newCustomer.monthlyIncome === 0 ? '' : newCustomer.monthlyIncome}
                      onChange={(e) => setNewCustomer({...newCustomer, monthlyIncome: Number(e.target.value)})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.55">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Assigned Branch</label>
                    <select 
                      value={newCustomer.branch}
                      onChange={(e) => setNewCustomer({...newCustomer, branch: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm"
                    >
                      <option value="Main">Main Branch</option>
                      <option value="North">North Field Branch</option>
                      <option value="South">South Sector Branch</option>
                    </select>
                  </div>
                  <div className="space-y-1.55">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Credit Score (Est.)</label>
                    <input 
                      required
                      type="number" 
                      min="300"
                      max="850"
                      placeholder="720"
                      value={newCustomer.creditScore}
                      onChange={(e) => setNewCustomer({...newCustomer, creditScore: Number(e.target.value)})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-sm"
                    />
                  </div>
                  <div className="space-y-1.55">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Initial KYC Status</label>
                    <select 
                      value={newCustomer.kycStatus}
                      onChange={(e) => setNewCustomer({...newCustomer, kycStatus: e.target.value as any})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm"
                    >
                      <option value="Pending">Pending Verification</option>
                      <option value="Verified">Pre-Verified</option>
                    </select>
                  </div>
                </div>

                {/* KYC Documents Upload during onboarding */}
                <div className="p-5 bg-blue-50/50 rounded-3xl border border-blue-100 flex flex-col gap-4">
                  <h4 className="text-xs font-black text-blue-900 uppercase tracking-widest">KYC Attachments (Optional)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* ID Proof Attach */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider">ID Proof Document</span>
                      {newCustomer.idProofUrl ? (
                        <div className="bg-white p-3 rounded-2xl border border-blue-200 flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-700 truncate">ID_Document.png</span>
                          <button 
                            type="button" 
                            onClick={() => setNewCustomer(prev => ({...prev, idProofUrl: undefined}))}
                            className="text-xs font-bold text-red-500 hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <label className="flex items-center justify-center gap-2 py-3 bg-white hover:bg-gray-100/50 border border-dashed border-gray-300 rounded-xl cursor-pointer transition-colors text-xs font-bold text-gray-650">
                          <Plus className="w-4 h-4 text-gray-400" />
                          Upload ID Proof
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*,application/pdf" 
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) {
                                setNewCustomer(prev => ({...prev, idProofUrl: URL.createObjectURL(f)}));
                              }
                            }} 
                          />
                        </label>
                      )}
                    </div>

                    {/* Address Proof Attach */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Address Proof Document</span>
                      {newCustomer.addressProofUrl ? (
                        <div className="bg-white p-3 rounded-2xl border border-blue-200 flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-700 truncate">Address_Utility.png</span>
                          <button 
                            type="button" 
                            onClick={() => setNewCustomer(prev => ({...prev, addressProofUrl: undefined}))}
                            className="text-xs font-bold text-red-500 hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <label className="flex items-center justify-center gap-2 py-3 bg-white hover:bg-gray-100/50 border border-dashed border-gray-300 rounded-xl cursor-pointer transition-colors text-xs font-bold text-gray-655">
                          <Plus className="w-4 h-4 text-gray-400" />
                          Upload Address Proof
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*,application/pdf" 
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) {
                                setNewCustomer(prev => ({...prev, addressProofUrl: URL.createObjectURL(f)}));
                              }
                            }} 
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex gap-4">
                  <button 
                    type="button" 
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-black text-sm transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-[0.98]"
                  >
                    Complete Onboarding
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
