import React, { useState, useEffect } from 'react';
import { 
  FileText, CheckCircle, XCircle, Clock, DollarSign, 
  Search, Filter, Plus, MoreVertical, User, Calendar,
  X, Info, Edit2, Save
} from 'lucide-react';
import { storage, STORAGE_KEYS } from '../services/storageService';
import { Loan, UserProfile } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const STATUS_COLORS = {
  'Pending': 'bg-yellow-100 text-yellow-700',
  'Approved': 'bg-emerald-100 text-emerald-700',
  'Rejected': 'bg-red-100 text-red-700',
  'Defaulted': 'bg-gray-900 text-white',
  'Paid': 'bg-blue-100 text-blue-700'
};

export default function LoanManagement() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  
  const [newRequest, setNewRequest] = useState({
    customerId: '',
    amount: 5000,
    term: 12,
    reason: '',
    isCustomerLoan: false,
    riskLevel: 'Medium' as Loan['riskLevel'],
    purpose: 'Personal',
    collateral: ''
  });

  const currentUser = storage.getCurrentUser();

  const canApproveLoan = (user: UserProfile | null, loan: Loan) => {
    if (!user) return false;
    if (user.role === 'Administrator') return true;
    if (user.role === 'Loan Officer') return loan.amount < 50000;
    if (user.role === 'Branch Manager') return loan.amount >= 50000;
    return false;
  };

  useEffect(() => {
    const fetchData = () => {
      setLoans(storage.getLoans());
      setCustomers(storage.getCustomers());
      setLoading(false);
    };

    fetchData();
    window.addEventListener('storage-update', fetchData);
    return () => window.removeEventListener('storage-update', fetchData);
  }, []);

  const updateLoanStatus = (loanId: string, status: Loan['status']) => {
    if (!currentUser) return;

    const loan = loans.find(l => l.id === loanId);
    if (!loan) return;

    if (!canApproveLoan(currentUser, loan)) {
      alert(`Permission Denied: As a ${currentUser.role}, you can only approve loans ${currentUser.role === 'Loan Officer' ? 'under $50,000' : 'of $50,000 or more'}.`);
      return;
    }

    if (status === 'Approved') {
      try {
        storage.disburseLoan(loanId);
      } catch (error: any) {
        alert(error.message);
        return;
      }
    } else {
      const updatedLoan = { 
        ...loan, 
        status,
        disbursedAt: null
      };
      storage.updateLoan(updatedLoan);
      
      // Log action
      storage.logAction(
        currentUser.uid,
        currentUser.name,
        'Loan Decision',
        `${status} loan for ${loan.customerName} (${formatCurrency(loan.amount)})`,
        'Low'
      );
    }

    // Notify user if it's an employee loan
    if (loan.isEmployeeLoan) {
      storage.addNotification(
        loan.customerId,
        `Loan ${status}`,
        `Your loan request for ${formatCurrency(loan.amount)} has been ${status.toLowerCase()}.`
      );
    }
  };

  const handleEditClick = (loan: Loan) => {
    setEditingLoan({ ...loan });
    setIsEditModalOpen(true);
  };

  const handleUpdateLoan = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingLoan && currentUser) {
      // Recalculate monthly payment if amount or term changed
      const updatedLoan = {
        ...editingLoan,
        monthlyPayment: (editingLoan.amount * (1 + editingLoan.interestRate / 100)) / editingLoan.termMonths
      };
      storage.updateLoan(updatedLoan);
      storage.logAction(
        currentUser.uid,
        currentUser.name,
        'Update Loan',
        `Updated details for loan ${editingLoan.id.slice(0, 8)}`,
        'Medium'
      );
      setIsEditModalOpen(false);
      setEditingLoan(null);
    }
  };

  const handleRequestLoan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const isInstitutional = currentUser.role === 'Administrator' || currentUser.role === 'CSR';
    const targetCustomer = isInstitutional && newRequest.isCustomerLoan 
      ? customers.find(c => c.id === newRequest.customerId)
      : null;

    const loan: Loan = {
      id: `loan_${Date.now()}`,
      customerId: targetCustomer ? targetCustomer.id : currentUser.uid,
      customerName: targetCustomer ? targetCustomer.name : currentUser.name,
      amount: newRequest.amount,
      interestRate: targetCustomer ? 6.5 : 3.5, // Standard rate for customers, preferential for staff
      termMonths: newRequest.term,
      status: 'Pending',
      monthlyPayment: (newRequest.amount * (targetCustomer ? 1.065 : 1.035)) / newRequest.term,
      remainingBalance: newRequest.amount,
      isEmployeeLoan: !targetCustomer,
      riskLevel: newRequest.riskLevel,
      purpose: newRequest.purpose,
      collateral: newRequest.collateral
    };

    storage.save(STORAGE_KEYS.LOANS, loan);
    
    storage.logAction(
      currentUser.uid,
      currentUser.name,
      'Loan Creation',
      `${currentUser.role} created a ${targetCustomer ? 'customer' : 'staff'} loan of ${formatCurrency(newRequest.amount)} for ${loan.customerName}`,
      'Medium'
    );

    // If CSR created it, notify Admin
    if (currentUser.role === 'CSR') {
      const admins = storage.getUsers().filter(u => u.role === 'Administrator');
      admins.forEach(admin => {
        storage.addNotification(
          admin.uid,
          'New Loan Application',
          `CSR ${currentUser.name} has submitted a new loan application for ${loan.customerName}.`
        );
      });
    }

    setIsRequestModalOpen(false);
    setNewRequest({ customerId: '', amount: 5000, term: 12, reason: '', isCustomerLoan: false });
  };

  const filteredLoans = loans.filter(l => 
    (l.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || l.id.includes(searchQuery)) &&
    (statusFilter === 'All' || l.status === statusFilter)
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Loan Portfolio</h1>
          <p className="text-gray-500 font-medium">Manage applications, approvals, and risk assessment</p>
        </div>
        <button 
          onClick={() => {
            setNewRequest(prev => ({ ...prev, isCustomerLoan: currentUser?.role === 'Administrator' || currentUser?.role === 'CSR' }));
            setIsRequestModalOpen(true);
          }}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl font-bold"
        >
          <Plus className="w-5 h-5" />
          <span>{(currentUser?.role === 'Administrator' || currentUser?.role === 'CSR') ? 'New Loan Application' : 'Request Personal Loan'}</span>
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by customer name or loan ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-3xl focus:ring-2 focus:ring-blue-500 shadow-sm font-medium"
          />
        </div>
        <div className="flex items-center gap-2 bg-white px-6 py-2 rounded-3xl border border-gray-200 shadow-sm">
          <Filter className="w-4 h-4 text-gray-400" />
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm font-bold bg-transparent border-none focus:ring-0 cursor-pointer text-gray-700"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Defaulted">Defaulted</option>
            <option value="Paid">Paid</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer / Employee</th>
                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Financials</th>
                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Duration</th>
                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Governance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLoans.map((loan) => (
                <tr key={loan.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm",
                        loan.isEmployeeLoan ? "bg-purple-50 text-purple-600" : "bg-blue-50 text-blue-600"
                      )}>
                        <User className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-black text-gray-900 tracking-tight">{loan.customerName}</p>
                          {loan.isEmployeeLoan && (
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[8px] font-black uppercase rounded-md tracking-widest">Staff</span>
                          )}
                        </div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">ID: {loan.id.slice(0, 8)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-1">
                      <p className="text-lg font-black text-gray-900 tabular-nums">{formatCurrency(loan.amount)}</p>
                      <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">{loan.interestRate}% Interest</p>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 text-sm font-bold text-gray-600">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {loan.termMonths} Months
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={cn("px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest", STATUS_COLORS[loan.status])}>
                      {loan.status}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      {currentUser?.role === 'Administrator' && (
                        <button 
                          onClick={() => handleEditClick(loan)}
                          className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-all hover:scale-110"
                          title="Edit Loan Details"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                      )}
                      {loan.status === 'Pending' ? (
                        canApproveLoan(currentUser, loan) ? (
                          <>
                            <button 
                              onClick={() => updateLoanStatus(loan.id, 'Approved')}
                              className="p-2.5 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all hover:scale-110"
                              title="Approve Application"
                            >
                              <CheckCircle className="w-6 h-6" />
                            </button>
                            <button 
                              onClick={() => updateLoanStatus(loan.id, 'Rejected')}
                              className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-all hover:scale-110"
                              title="Reject Application"
                            >
                              <XCircle className="w-6 h-6" />
                            </button>
                          </>
                        ) : (
                          <div className="flex flex-col items-start gap-1">
                            <div className="flex items-center gap-2 text-gray-400 italic text-[10px] font-medium">
                              <Clock className="w-3 h-3" />
                              Awaiting {loan.amount >= 50000 ? 'Manager' : 'Officer'}
                            </div>
                            {['Loan Officer', 'Branch Manager'].includes(currentUser?.role || '') && (
                              <span className="text-[8px] font-black text-amber-500 uppercase tracking-tighter">
                                Limit: {currentUser?.role === 'Loan Officer' ? '<$50k' : '≥$50k'}
                              </span>
                            )}
                          </div>
                        )
                      ) : (
                        <button className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors">
                          <MoreVertical className="w-5 h-5 text-gray-400" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredLoans.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <FileText className="w-16 h-16 mx-auto mb-4 text-gray-200" />
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">No institutional loan records</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Loan Request Modal */}
      <AnimatePresence>
        {isRequestModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsRequestModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 bg-blue-600 text-white flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black tracking-tight">
                    {(currentUser?.role === 'Administrator' || currentUser?.role === 'CSR') ? 'Loan Application' : 'Personal Loan Request'}
                  </h2>
                  <p className="text-blue-100 text-sm font-medium">
                    {(currentUser?.role === 'Administrator' || currentUser?.role === 'CSR') ? 'Institutional lending processing' : 'Preferential staff lending program'}
                  </p>
                </div>
                <button onClick={() => setIsRequestModalOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleRequestLoan} className="p-10 space-y-8">
                {(currentUser?.role === 'Administrator' || currentUser?.role === 'CSR') && (
                  <div className="flex bg-gray-100 p-1 rounded-2xl">
                    <button
                      type="button"
                      onClick={() => setNewRequest(prev => ({ ...prev, isCustomerLoan: true }))}
                      className={cn(
                        "flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                        newRequest.isCustomerLoan ? "bg-white text-blue-600 shadow-sm" : "text-gray-400"
                      )}
                    >
                      Customer Loan
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewRequest(prev => ({ ...prev, isCustomerLoan: false }))}
                      className={cn(
                        "flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                        !newRequest.isCustomerLoan ? "bg-white text-blue-600 shadow-sm" : "text-gray-400"
                      )}
                    >
                      Staff Loan
                    </button>
                  </div>
                )}

                {newRequest.isCustomerLoan ? (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Select Customer</label>
                    <select 
                      required
                      value={newRequest.customerId}
                      onChange={(e) => setNewRequest({...newRequest, customerId: e.target.value})}
                      className="w-full px-6 py-5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-lg appearance-none"
                    >
                      <option value="">Choose a customer...</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 flex gap-4">
                    <Info className="w-6 h-6 text-blue-600 shrink-0" />
                    <p className="text-xs font-bold text-blue-900 leading-relaxed">
                      Staff loans are subject to Administrator approval. You are eligible for a preferential interest rate of 3.5% APR.
                    </p>
                  </div>
                )}

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Requested Amount</label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input 
                        required
                        type="number" 
                        value={newRequest.amount}
                        onChange={(e) => setNewRequest({...newRequest, amount: Number(e.target.value)})}
                        className="w-full pl-12 pr-6 py-5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-2xl font-black"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Repayment Term (Months)</label>
                    <select 
                      value={newRequest.term}
                      onChange={(e) => setNewRequest({...newRequest, term: Number(e.target.value)})}
                      className="w-full px-6 py-5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-lg appearance-none"
                    >
                      <option value={6}>6 Months</option>
                      <option value={12}>12 Months</option>
                      <option value={24}>24 Months</option>
                      <option value={36}>36 Months</option>
                      <option value={48}>48 Months</option>
                      <option value={60}>60 Months</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Risk Level</label>
                      <select 
                        value={newRequest.riskLevel}
                        onChange={(e) => setNewRequest({...newRequest, riskLevel: e.target.value as any})}
                        className="w-full px-6 py-5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-lg appearance-none"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Purpose</label>
                      <select 
                        value={newRequest.purpose}
                        onChange={(e) => setNewRequest({...newRequest, purpose: e.target.value})}
                        className="w-full px-6 py-5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-lg appearance-none"
                      >
                        <option value="Personal">Personal</option>
                        <option value="Business">Business</option>
                        <option value="Education">Education</option>
                        <option value="Home">Home</option>
                        <option value="Vehicle">Vehicle</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Collateral (Optional)</label>
                    <input 
                      type="text" 
                      value={newRequest.collateral}
                      onChange={(e) => setNewRequest({...newRequest, collateral: e.target.value})}
                      className="w-full px-6 py-5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-lg"
                      placeholder="e.g. Property, Vehicle, Gold..."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Reason for Loan</label>
                    <textarea 
                      required
                      value={newRequest.reason}
                      onChange={(e) => setNewRequest({...newRequest, reason: e.target.value})}
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-sm min-h-[100px]"
                      placeholder="Briefly describe the purpose of this loan..."
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <div className="flex items-center justify-between mb-4 px-2">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Estimated Monthly</p>
                    <p className="text-xl font-black text-gray-900">{formatCurrency((newRequest.amount * 1.035) / newRequest.term)}</p>
                  </div>
                  <button 
                    type="submit"
                    className="w-full py-5 bg-gray-900 text-white rounded-3xl font-black text-lg shadow-xl hover:bg-black transition-all active:scale-[0.98]"
                  >
                    Submit Application
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Loan Modal */}
      <AnimatePresence>
        {isEditModalOpen && editingLoan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 bg-gray-900 text-white flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black tracking-tight">Edit Loan Details</h2>
                  <p className="text-gray-400 text-sm font-medium">Modify institutional lending parameters</p>
                </div>
                <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleUpdateLoan} className="p-10 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Loan Amount</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      required
                      type="number" 
                      value={editingLoan.amount}
                      onChange={(e) => setEditingLoan({...editingLoan, amount: Number(e.target.value)})}
                      className="w-full pl-10 pr-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Interest Rate (%)</label>
                    <input 
                      required
                      type="number" 
                      step="0.1"
                      value={editingLoan.interestRate}
                      onChange={(e) => setEditingLoan({...editingLoan, interestRate: Number(e.target.value)})}
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Term (Months)</label>
                    <input 
                      required
                      type="number" 
                      value={editingLoan.termMonths}
                      onChange={(e) => setEditingLoan({...editingLoan, termMonths: Number(e.target.value)})}
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Loan Status</label>
                  <select 
                    value={editingLoan.status}
                    onChange={(e) => setEditingLoan({...editingLoan, status: e.target.value as Loan['status']})}
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold appearance-none"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Defaulted">Defaulted</option>
                    <option value="Paid">Paid</option>
                  </select>
                </div>

                <div className="pt-6">
                  <button 
                    type="submit"
                    className="w-full py-5 bg-blue-600 text-white rounded-3xl font-black text-lg shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    Save Loan Changes
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
