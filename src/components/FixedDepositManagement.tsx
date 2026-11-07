import React, { useState, useEffect } from 'react';
import { 
  Lock, Calendar, DollarSign, Plus, Search, 
  Filter, MoreVertical, CheckCircle, Clock, 
  ArrowRight, RefreshCw, AlertCircle
} from 'lucide-react';
import { storage } from '../services/storageService';
import { FixedDeposit, Customer } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function FixedDepositManagement() {
  const [fds, setFds] = useState<FixedDeposit[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAddingFD, setIsAddingFD] = useState(false);
  const [newFD, setNewFD] = useState({
    customerId: '',
    amount: 0,
    termMonths: 12,
    interestRate: 6.5,
    autoRenew: true
  });

  const currentUser = storage.getCurrentUser();

  useEffect(() => {
    const fetchData = () => {
      setFds(storage.getFixedDeposits());
      setCustomers(storage.getCustomers());
      setLoading(false);
    };

    fetchData();
    window.addEventListener('storage-update', fetchData);
    return () => window.removeEventListener('storage-update', fetchData);
  }, []);

  const handleAddFD = () => {
    if (!newFD.customerId || newFD.amount <= 0) {
      alert('Please select a customer and enter a valid amount.');
      return;
    }

    const startDate = new Date();
    const maturityDate = new Date();
    maturityDate.setMonth(startDate.getMonth() + newFD.termMonths);

    const fd: FixedDeposit = {
      id: `fd_${Date.now()}`,
      customerId: newFD.customerId,
      amount: newFD.amount,
      interestRate: newFD.interestRate,
      termMonths: newFD.termMonths,
      startDate: startDate.toISOString(),
      maturityDate: maturityDate.toISOString(),
      status: 'Active',
      autoRenew: newFD.autoRenew
    };

    storage.updateFixedDeposit(fd);
    
    storage.logAction(
      currentUser!.uid,
      currentUser!.name,
      'Create Fixed Deposit',
      `Created FD for customer ${newFD.customerId} of ${formatCurrency(newFD.amount)}`,
      'Medium'
    );

    setIsAddingFD(false);
    setNewFD({ customerId: '', amount: 0, termMonths: 12, interestRate: 6.5, autoRenew: true });
  };

  const getCustomerName = (id: string) => {
    return customers.find(c => c.id === id)?.name || 'Unknown Customer';
  };

  const filteredFDs = fds.filter(fd => {
    const customerName = getCustomerName(fd.customerId).toLowerCase();
    return customerName.includes(searchQuery.toLowerCase()) || fd.id.toLowerCase().includes(searchQuery.toLowerCase());
  });

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
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Fixed Deposits</h2>
          <p className="text-gray-500 mt-1">Manage high-yield term deposits for bank clients.</p>
        </div>
        <button 
          onClick={() => setIsAddingFD(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
        >
          <Plus className="w-4 h-4" />
          New Fixed Deposit
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50 bg-gray-50/30">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by customer name or FD ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Customer</th>
                <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Amount</th>
                <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Rate & Term</th>
                <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Maturity</th>
                <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredFDs.map((fd) => (
                <tr key={fd.id} className="group hover:bg-gray-50/50 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                        <Lock className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">{getCustomerName(fd.customerId)}</div>
                        <div className="text-[10px] text-gray-400 font-medium">ID: {fd.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="font-bold text-gray-900 text-lg">{formatCurrency(fd.amount)}</div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="text-sm font-bold text-gray-700">{fd.interestRate}% p.a.</div>
                    <div className="text-[10px] text-gray-400 font-medium">{fd.termMonths} Months</div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="text-sm font-medium text-gray-700">
                      {new Date(fd.maturityDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    {fd.autoRenew && (
                      <div className="flex items-center gap-1 text-[10px] text-blue-500 font-bold uppercase tracking-wider">
                        <RefreshCw className="w-3 h-3" />
                        Auto-Renew
                      </div>
                    )}
                  </td>
                  <td className="px-8 py-6">
                    <span className={cn(
                      "px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 w-fit",
                      fd.status === 'Active' ? "bg-emerald-100 text-emerald-700" :
                      fd.status === 'Matured' ? "bg-blue-100 text-blue-700" :
                      "bg-gray-100 text-gray-700"
                    )}>
                      {fd.status === 'Active' ? <Clock className="w-3 h-3" /> :
                       fd.status === 'Matured' ? <CheckCircle className="w-3 h-3" /> :
                       <AlertCircle className="w-3 h-3" />}
                      {fd.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
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

      {/* Add FD Modal */}
      <AnimatePresence>
        {isAddingFD && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddingFD(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 bg-blue-600 text-white">
                <h2 className="text-2xl font-black tracking-tight">New Fixed Deposit</h2>
                <p className="text-blue-100 text-sm font-medium">Create a high-yield term deposit</p>
              </div>

              <div className="p-10 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Select Customer</label>
                  <select 
                    value={newFD.customerId}
                    onChange={(e) => setNewFD({...newFD, customerId: e.target.value})}
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                  >
                    <option value="">Choose a customer...</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.id})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Deposit Amount</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="number" 
                      value={newFD.amount}
                      onChange={(e) => setNewFD({...newFD, amount: Number(e.target.value)})}
                      className="w-full pl-10 pr-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                      placeholder="Enter amount..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Term (Months)</label>
                    <select 
                      value={newFD.termMonths}
                      onChange={(e) => setNewFD({...newFD, termMonths: Number(e.target.value)})}
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                    >
                      <option value={6}>6 Months</option>
                      <option value={12}>12 Months</option>
                      <option value={24}>24 Months</option>
                      <option value={36}>36 Months</option>
                      <option value={60}>60 Months</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Interest Rate (%)</label>
                    <input 
                      type="number" 
                      value={newFD.interestRate}
                      onChange={(e) => setNewFD({...newFD, interestRate: Number(e.target.value)})}
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                  <input 
                    type="checkbox" 
                    id="autoRenew"
                    checked={newFD.autoRenew}
                    onChange={(e) => setNewFD({...newFD, autoRenew: e.target.checked})}
                    className="w-5 h-5 rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="autoRenew" className="text-sm font-bold text-blue-700 cursor-pointer">
                    Enable Auto-Renewal at maturity
                  </label>
                </div>

                <button 
                  onClick={handleAddFD}
                  className="w-full py-5 bg-blue-600 text-white rounded-3xl font-black text-lg shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-[0.98]"
                >
                  Open Fixed Deposit
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
