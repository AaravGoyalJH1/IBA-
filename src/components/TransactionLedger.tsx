import React, { useState, useEffect } from 'react';
import { 
  ArrowUpRight, ArrowDownLeft, ArrowRightLeft, 
  Search, Filter, Calendar, Download, MoreVertical,
  CheckCircle, Clock, XCircle, DollarSign, FileText,
  Printer, Info, AlertCircle, Plus, ChevronDown, ChevronUp,
  TrendingUp, TrendingDown, Activity, FileSpreadsheet, PlusCircle, X
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid 
} from 'recharts';
import { storage } from '../services/storageService';
import { Transaction, Customer, Account, SupportTicket } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function TransactionLedger() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<Transaction['type'] | 'All'>('All');
  const [loading, setLoading] = useState(true);

  // Advanced feature states
  const [selectedReceiptTx, setSelectedReceiptTx] = useState<Transaction | null>(null);
  const [isPostingDeskOpen, setIsPostingDeskOpen] = useState(false);
  const [disputeTx, setDisputeTx] = useState<Transaction | null>(null);
  const [disputeReason, setDisputeReason] = useState('');

  // Simulation form states
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [simCustomerId, setSimCustomerId] = useState('');
  const [simAccountId, setSimAccountId] = useState('');
  const [simType, setSimType] = useState<'Deposit' | 'Withdrawal'>('Deposit');
  const [simAmount, setSimAmount] = useState('');
  const [simDescription, setSimDescription] = useState('');
  const [simError, setSimError] = useState('');
  const [simSuccess, setSimSuccess] = useState('');

  const currentUser = storage.getCurrentUser();

  const fetchData = () => {
    setTransactions(storage.getTransactions().sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ));
    setCustomers(storage.getCustomers());
    setAccounts(storage.getAccounts());
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    window.addEventListener('storage-update', fetchData);
    return () => window.removeEventListener('storage-update', fetchData);
  }, []);

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = 
      tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.accountId.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterType === 'All' || tx.type === filterType;
    
    return matchesSearch && matchesType;
  });

  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'Deposit': return <ArrowDownLeft className="w-5 h-5 text-emerald-500" />;
      case 'Withdrawal': return <ArrowUpRight className="w-5 h-5 text-red-500" />;
      case 'Transfer': return <ArrowRightLeft className="w-5 h-5 text-blue-500" />;
      case 'Loan Payment': return <DollarSign className="w-5 h-5 text-indigo-500" />;
      case 'Stock Purchase': return <ArrowUpRight className="w-5 h-5 text-amber-500" />;
      case 'Stock Sale': return <ArrowDownLeft className="w-5 h-5 text-emerald-500" />;
      default: return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTransactionColor = (type: Transaction['type']) => {
    switch (type) {
      case 'Deposit': 
      case 'Stock Sale': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Withdrawal': 
      case 'Stock Purchase': return 'bg-red-50 text-red-700 border-red-100';
      case 'Transfer': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'Loan Payment': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      default: return 'bg-gray-50 text-gray-700 border-gray-100';
    }
  };

  // Metrics calculators
  const metrics = React.useMemo(() => {
    let inflow = 0;
    let outflow = 0;
    let disputedCount = 0;

    transactions.forEach(tx => {
      const isDisputed = tx.description.includes('[DISPUTED]');
      if (isDisputed) disputedCount++;

      if (tx.status === 'Completed') {
        if (tx.type === 'Deposit' || tx.type === 'Stock Sale') {
          inflow += tx.amount;
        } else {
          outflow += tx.amount;
        }
      }
    });

    return {
      inflow,
      outflow,
      net: inflow - outflow,
      disputedCount,
      totalCount: transactions.length
    };
  }, [transactions]);

  // Chart aggregation for last 10 days
  const chartData = React.useMemo(() => {
    const days: { [key: string]: { date: string; inflow: number; outflow: number } } = {};
    const last10Days = Array.from({ length: 11 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return { key, date: d };
    }).reverse();

    last10Days.forEach(day => {
      days[day.key] = { date: day.key, inflow: 0, outflow: 0 };
    });

    transactions.forEach(tx => {
      if (tx.status !== 'Completed') return;
      const txDate = new Date(tx.timestamp);
      const key = txDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (days[key]) {
        if (tx.type === 'Deposit' || tx.type === 'Stock Sale') {
          days[key].inflow += tx.amount;
        } else {
          days[key].outflow += tx.amount;
        }
      }
    });

    return Object.values(days);
  }, [transactions]);

  // Export ledger to standard CSV
  const handleExportCSV = () => {
    const headers = ['Transaction ID', 'Account ID', 'Target Account ID', 'Type', 'Description', 'Amount ($)', 'Timestamp', 'Status'];
    const rows = filteredTransactions.map(tx => [
      tx.id,
      tx.accountId,
      tx.toAccountId || 'N/A',
      tx.type,
      `"${tx.description.replace(/"/g, '""')}"`,
      tx.amount,
      tx.timestamp,
      tx.status
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `aaravland_bank_ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    if (currentUser) {
      storage.logAction(
        currentUser.uid,
        currentUser.name,
        'Export Ledger',
        `Exported ${filteredTransactions.length} transaction logs to CSV file successfully`,
        'Low'
      );
    }
  };

  // Submit direct transaction posting via Simulator Desk
  const handlePostTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    setSimError('');
    setSimSuccess('');

    if (!simAccountId || !simAmount || !simDescription) {
      setSimError('Please fill in check/account field credentials, amount, and statement description.');
      return;
    }

    const numericAmount = parseFloat(simAmount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setSimError('Please specify a valid transaction amount.');
      return;
    }

    try {
      storage.processTransaction({
        accountId: simAccountId,
        amount: numericAmount,
        type: simType,
        description: simDescription
      });

      setSimSuccess('Transaction posted and account balance synchronized successfully!');
      setSimAmount('');
      setSimDescription('');
      
      if (currentUser) {
        storage.logAction(
          currentUser.uid,
          currentUser.name,
          'Manual Ledger Entry',
          `Manual ${simType} posted on Account ${simAccountId} for $${numericAmount}`,
          'High'
        );
      }
      
      fetchData();
    } catch (err: any) {
      setSimError(err.message || 'Validation error processing direct ledger execution.');
    }
  };

  // File transaction dispute linked directly with Support ticket platform
  const handleRaiseDispute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeTx || !disputeReason.trim()) return;

    // Create unique support ticket immediately associated with account owner
    const matchedAccount = accounts.find(a => a.id === disputeTx.accountId);
    
    const newTicket: SupportTicket = {
      id: `t_${Date.now()}`,
      customerId: matchedAccount?.customerId || 'cust_unknown',
      subject: `Transaction Dispute: Ref ${disputeTx.id}`,
      message: `DISPUTE REPORTED BY DESK OFFICE\n\nTransaction Reference ID: ${disputeTx.id}\nOriginal Transaction: ${disputeTx.type} - ${disputeTx.description}\nAmount: ${formatCurrency(disputeTx.amount)}\nTimestamp: ${new Date(disputeTx.timestamp).toLocaleString()}\n\nDispute Reasoning Statement:\n"${disputeReason}"`,
      category: 'Account',
      priority: 'Urgent',
      status: 'Open',
      createdAt: new Date().toISOString()
    };

    // Save ticket
    storage.save('aaravland_bank_support_tickets', newTicket);

    // Update Transaction Description to flag dispute text
    const updatedTx = {
      ...disputeTx,
      description: `[DISPUTED] ${disputeTx.description}`
    };
    storage.save('aaravland_bank_transactions', updatedTx);

    // Audit trace
    if (currentUser) {
      storage.logAction(
        currentUser.uid,
        currentUser.name,
        'Dispute Lodged',
        `Dispute Ticket generated for Tx ID ${disputeTx.id}. Priority: Urgent. Support Room linked.`,
        'Medium'
      );
    }

    setDisputeTx(null);
    setDisputeReason('');
    fetchData();
  };

  const handlePrintTrigger = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Filter accounts belonging to selected simulation customer
  const filteredSimAccounts = accounts.filter(a => a.customerId === simCustomerId);

  return (
    <div className="space-y-8">
      {/* Dynamic print inline styles overrides */}
      {selectedReceiptTx && (
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body * {
              visibility: hidden !important;
            }
            #print-receipt-overlay, #print-receipt-overlay * {
              visibility: visible !important;
            }
            #print-receipt-overlay {
              position: fixed !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              height: 100% !important;
              background: white !important;
              margin: 0 !important;
              padding: 0 !important;
              z-index: 9999999 !important;
              box-shadow: none !important;
              border: none !important;
            }
            .no-print {
              display: none !important;
            }
          }
        `}} />
      )}

      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-950 tracking-tight">Financial Ledger</h2>
          <p className="text-gray-500 mt-1">Audit trail of all bank-wide transactions, manual postings, and movements.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsPostingDeskOpen(!isPostingDeskOpen)}
            className={cn(
              "flex items-center gap-2 px-5 py-3 rounded-2xl border transition-all font-bold text-xs uppercase tracking-wider",
              isPostingDeskOpen 
                ? "bg-amber-50 text-amber-900 border-amber-200"
                : "bg-white hover:bg-gray-50 text-gray-700 border-gray-200 shadow-sm"
            )}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Posting Desk</span>
          </button>
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-5 py-3 bg-gray-900 text-white rounded-2xl font-bold text-xs uppercase tracking-wider hover:bg-gray-800 transition-all shadow-md shadow-gray-200"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Live Financial Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Total Liquid Inflows</span>
            <span className="text-2xl font-black text-emerald-600 block">{formatCurrency(metrics.inflow)}</span>
          </div>
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-100">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Total Outflows</span>
            <span className="text-2xl font-black text-red-600 block">{formatCurrency(metrics.outflow)}</span>
          </div>
          <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center border border-red-100">
            <TrendingDown className="w-5 h-5 text-red-600" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Net Cash Delta</span>
            <span className={cn(
              "text-2xl font-black block",
              metrics.net >= 0 ? "text-blue-600" : "text-amber-600"
            )}>{formatCurrency(metrics.net)}</span>
          </div>
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-100">
            <Activity className="w-5 h-5 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Disputed Logs</span>
            <span className="text-2xl font-black text-orange-600 block">{metrics.disputedCount}</span>
          </div>
          <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center border border-orange-105">
            <AlertCircle className="w-5 h-5 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Collapsible Simulation Posting Desk Section */}
      <AnimatePresence>
        {isPostingDeskOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-gradient-to-br from-amber-50/50 to-orange-50/30 border border-amber-200/60 rounded-3xl"
          >
            <div className="p-8">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-amber-200/40">
                <div>
                  <h3 className="font-extrabold text-amber-950 text-base flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-amber-700" />
                    Internal Simulated Transaction Posting Engine
                  </h3>
                  <p className="text-xs text-amber-700 font-medium">Instantly post financial vouchers to keep records synchronized.</p>
                </div>
                <button 
                  onClick={() => setIsPostingDeskOpen(false)}
                  className="p-1 hover:bg-amber-100 border border-transparent hover:border-amber-200 rounded-lg text-amber-900 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handlePostTransaction} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Select Customer */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-amber-900 uppercase tracking-wider block">Customer Association</label>
                    <select
                      value={simCustomerId}
                      onChange={(e) => {
                        setSimCustomerId(e.target.value);
                        setSimAccountId('');
                      }}
                      className="w-full px-4 py-3 bg-white border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 font-bold text-xs"
                    >
                      <option value="">-- Choose Account Owner --</option>
                      {customers.map(cust => (
                        <option key={cust.id} value={cust.id}>{cust.name} ({cust.id})</option>
                      ))}
                    </select>
                  </div>

                  {/* Select account */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-amber-900 uppercase tracking-wider block">Target Account Code</label>
                    <select
                      disabled={!simCustomerId}
                      value={simAccountId}
                      onChange={(e) => setSimAccountId(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 disabled:opacity-55 font-bold text-xs"
                    >
                      <option value="">-- Address Account Type --</option>
                      {filteredSimAccounts.map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.type} - #{acc.id} (Balance: {formatCurrency(acc.balance)})</option>
                      ))}
                    </select>
                  </div>

                  {/* Ledger Posting Type */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-amber-900 uppercase tracking-wider block">Transaction Class</label>
                    <div className="grid grid-cols-2 bg-white rounded-xl border border-amber-200 overflow-hidden p-1">
                      <button
                        type="button"
                        onClick={() => setSimType('Deposit')}
                        className={cn(
                          "py-2 font-black text-[10px] uppercase tracking-wider rounded-lg transition-colors",
                          simType === 'Deposit' ? "bg-emerald-600 text-white" : "text-gray-500 hover:bg-gray-50"
                        )}
                      >
                        Deposit (+)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSimType('Withdrawal')}
                        className={cn(
                          "py-2 font-black text-[10px] uppercase tracking-wider rounded-lg transition-colors",
                          simType === 'Withdrawal' ? "bg-red-600 text-white" : "text-gray-500 hover:bg-gray-50"
                        )}
                      >
                        Debit (-)
                      </button>
                    </div>
                  </div>

                  {/* Transaction Amount */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-amber-900 uppercase tracking-wider block">Posting Capital ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.10"
                      placeholder="e.g. 500.00"
                      value={simAmount}
                      onChange={(e) => setSimAmount(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 font-bold text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div className="md:col-span-3 space-y-1.55">
                    <label className="text-[10px] font-black text-amber-900 uppercase tracking-wider block">Voucher Memo / Statement Description</label>
                    <input
                      type="text"
                      placeholder="e.g. Deposit check no. 1045 - ATM Cash deposit transfer"
                      value={simDescription}
                      onChange={(e) => setSimDescription(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 font-bold text-xs"
                    />
                  </div>
                  <div>
                    <button
                      type="submit"
                      className="w-full py-3 bg-amber-700 hover:bg-amber-800 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-[0.99]"
                    >
                      Process Ledger Entry
                    </button>
                  </div>
                </div>

                {simError && (
                  <div className="p-3 bg-red-100 text-red-700 rounded-lg text-xs font-bold border border-red-200">
                    {simError}
                  </div>
                )}
                {simSuccess && (
                  <div className="p-3 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold border border-emerald-200">
                    {simSuccess}
                  </div>
                )}
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Visual Recharts Cumulative Daily Trends */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-extrabold text-gray-950 text-base">Liquidity Transmission Trends</h3>
            <span className="text-xs text-gray-400 block mt-0.5">Aggregated inflow and outflow performance compiled spanning last 10 operating days</span>
          </div>
          <div className="flex gap-4 text-xs font-bold">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Inflows</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Outflows</span>
          </div>
        </div>

        <div className="h-64 md:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorInflow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorOutflow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} fontWeight="bold" strokeWidth={0} />
              <YAxis stroke="#94a3b8" fontSize={10} fontWeight="bold" strokeWidth={0} tickFormatter={(v) => `$${v}`} />
              <Tooltip 
                formatter={(val: number) => [formatCurrency(val), 'Capital']}
                labelStyle={{ fontSize: '11px', fontWeight: 'bold', color: '#1e293b' }}
                contentStyle={{ borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontFamily: 'Inter' }}
              />
              <Area type="monotone" dataKey="inflow" stroke="#10b981" fillOpacity={1} fill="url(#colorInflow)" strokeWidth={2.5} name="Total Influx" />
              <Area type="monotone" dataKey="outflow" stroke="#ef4444" fillOpacity={1} fill="url(#colorOutflow)" strokeWidth={2.5} name="Total Outflow" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Main Ledger Table Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50 bg-gray-50/30">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by statement memo, Reference ID or associated Account ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold text-sm"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-bold"
              >
                <option value="All">All Transactions Types</option>
                <option value="Deposit">Deposits (+)</option>
                <option value="Withdrawal">Withdrawals (-)</option>
                <option value="Transfer">Interbank Transfers</option>
                <option value="Loan Payment">Loan Payments</option>
                <option value="Stock Purchase">Asset Purchases</option>
                <option value="Stock Sale">Asset Liquidations</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-8 py-4 text-xs font-bold text-gray-450 uppercase tracking-wider">Transaction Ledger Details</th>
                <th className="px-8 py-4 text-xs font-bold text-gray-450 uppercase tracking-wider">Type / Class</th>
                <th className="px-8 py-4 text-xs font-bold text-gray-450 uppercase tracking-wider">Disbursement Value</th>
                <th className="px-8 py-4 text-xs font-bold text-gray-450 uppercase tracking-wider">Date & Log Time</th>
                <th className="px-8 py-4 text-xs font-bold text-gray-450 uppercase tracking-wider">Ledger Status</th>
                <th className="px-8 py-4 text-xs font-bold text-gray-450 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 font-sans">
              {filteredTransactions.map((tx) => {
                const isDisputed = tx.description.includes('[DISPUTED]');
                return (
                  <tr key={tx.id} className="group hover:bg-gray-50/55 transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center border shrink-0",
                          getTransactionColor(tx.type)
                        )}>
                          {getTransactionIcon(tx.type)}
                        </div>
                        <div className="truncate max-w-[280px] md:max-w-md">
                          <div className={cn(
                            "font-extrabold text-gray-900 flex items-center gap-2",
                            isDisputed && "text-orange-950"
                          )}>
                            {tx.description}
                            {isDisputed && (
                              <span className="px-2 py-0.5 bg-orange-100 text-[9px] text-orange-700 rounded font-black tracking-widest uppercase">
                                Contested
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-gray-400 font-bold font-mono">Ref ID: {tx.id} • Account: {tx.accountId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                        getTransactionColor(tx.type)
                      )}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className={cn(
                        "font-black text-[15px]",
                        tx.type === 'Deposit' || tx.type === 'Stock Sale' ? "text-emerald-600" : "text-red-600"
                      )}>
                        {tx.type === 'Deposit' || tx.type === 'Stock Sale' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="text-xs font-bold text-gray-800">
                        {new Date(tx.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <div className="text-[10px] text-gray-400 font-bold font-mono">
                        {new Date(tx.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={cn(
                        "px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 w-fit",
                        tx.status === 'Completed' ? "bg-emerald-100 text-emerald-700" :
                        tx.status === 'Pending' ? "bg-amber-100 text-amber-700" :
                        "bg-red-100 text-red-700"
                      )}>
                        {tx.status === 'Completed' ? <CheckCircle className="w-3 h-3" /> :
                         tx.status === 'Pending' ? <Clock className="w-3 h-3" /> :
                         <XCircle className="w-3 h-3" />}
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right whitespace-nowrap">
                      <div className="flex justify-end gap-2">
                        {/* Print utility */}
                        <button 
                          title="Print Receipt Voucher"
                          onClick={() => setSelectedReceiptTx(tx)}
                          className="p-2 bg-gray-50 hover:bg-blue-50 text-gray-500 hover:text-blue-600 border border-gray-100 hover:border-blue-100 rounded-xl transition-all"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        
                        {/* Raise support dispute linked */}
                        {!isDisputed && tx.status === 'Completed' && (
                          <button 
                            title="Dispute Transaction"
                            onClick={() => {
                              setDisputeTx(tx);
                              setDisputeReason('');
                            }}
                            className="p-2 bg-gray-50 hover:bg-orange-50 text-gray-500 hover:text-orange-600 border border-gray-100 hover:border-orange-100 rounded-xl transition-all"
                          >
                            <AlertCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {filteredTransactions.length === 0 && (
          <div className="p-20 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-gray-900 font-extrabold">No Auditor Logs Recorded</h3>
            <p className="text-gray-500 text-sm mt-1 font-medium">Try configuring alternative search terms or list parameters.</p>
          </div>
        )}
      </div>

      {/* Transaction Printer friendly slip modal overlay */}
      <AnimatePresence>
        {selectedReceiptTx && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black/60 backdrop-blur-xs no-print">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden"
              id="print-receipt-overlay"
            >
              {/* Receipt Body */}
              <div className="p-8 space-y-6">
                {/* Teller top decor */}
                <div className="text-center pb-5 border-b-2 border-dashed border-gray-200">
                  <div className="text-xs font-black tracking-[0.2em] text-blue-600 uppercase mb-2">Secure Institutional Voucher</div>
                  <h3 className="text-lg font-black text-gray-950 tracking-tight">AARAVLAND SECURE COOPERATIVE BANK</h3>
                  <p className="text-[10px] text-gray-400 font-bold mt-1 font-mono">Main Transit Branch • SWIFT: ALCOUPNYXXX</p>
                </div>

                {/* Simulated Ledger Slip Data */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Transaction Ref ID</span>
                    <span className="text-xs font-bold font-mono text-gray-950">{selectedReceiptTx.id}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Account Destination</span>
                    <span className="text-xs font-bold font-mono text-gray-950">{selectedReceiptTx.accountId}</span>
                  </div>

                  {selectedReceiptTx.toAccountId && (
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Transferred Target</span>
                      <span className="text-xs font-bold font-mono text-gray-950">{selectedReceiptTx.toAccountId}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Voucher Entry Class</span>
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border",
                      getTransactionColor(selectedReceiptTx.type)
                    )}>
                      {selectedReceiptTx.type}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Timestamp Recorded</span>
                    <span className="text-xs font-bold text-gray-800">{new Date(selectedReceiptTx.timestamp).toLocaleString()}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Transaction Status</span>
                    <span className="text-xs font-extrabold text-emerald-600">{selectedReceiptTx.status}</span>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Memo Statement</span>
                    <span className="text-xs font-bold text-gray-900 max-w-[200px] truncate" title={selectedReceiptTx.description}>{selectedReceiptTx.description}</span>
                  </div>

                  <div className="py-4 border-t border-b border-gray-100 text-center space-y-1">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Liquid Value Transferred</span>
                    <span className="text-3xl font-black text-gray-950 block">{formatCurrency(selectedReceiptTx.amount)}</span>
                  </div>
                </div>

                {/* CSS Barcode Placeholder */}
                <div className="flex flex-col items-center justify-center pt-3 gap-2">
                  <div className="flex items-end justify-center gap-[2px] h-10 w-44 no-print">
                    <span className="w-[3px] bg-gray-950 h-full" />
                    <span className="w-[1px] bg-gray-950 h-8" />
                    <span className="w-[2px] bg-gray-950 h-9" />
                    <span className="w-[4px] bg-gray-950 h-full" />
                    <span className="w-[1px] bg-gray-950 h-5" />
                    <span className="w-[3px] bg-gray-950 h-8" />
                    <span className="w-[2px] bg-gray-950 h-10" />
                    <span className="w-[1px] bg-gray-950 h-6" />
                    <span className="w-[4px] bg-gray-950 h-full" />
                    <span className="w-[2px] bg-gray-950 h-8" />
                    <span className="w-[1px] bg-gray-950 h-9" />
                    <span className="w-[3px] bg-gray-950 h-7" />
                  </div>
                  <span className="text-[8px] font-black font-mono tracking-[0.3em] text-gray-400">*{selectedReceiptTx.id.toUpperCase()}*</span>
                </div>

                {/* Audit Signature space block */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-dashed border-gray-200">
                  <div className="text-center pt-3">
                    <div className="h-6 border-b border-gray-300 w-32 mx-auto" />
                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mt-1">Authorized Audit Lead</span>
                  </div>
                  <div className="text-center pt-3">
                    <div className="h-6 border-b border-gray-300 w-32 mx-auto" />
                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mt-1">Acquirer Signature</span>
                  </div>
                </div>

                {/* Overlay modal footer actions */}
                <div className="pt-4 flex gap-3 no-print">
                  <button 
                    onClick={() => setSelectedReceiptTx(null)}
                    className="flex-1 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-xl font-bold text-xs uppercase"
                  >
                    Close Sheet
                  </button>
                  <button 
                    onClick={handlePrintTrigger}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase flex items-center justify-center gap-1.5 shadow-md shadow-blue-100 rounded-xl"
                  >
                    <Printer className="w-4 h-4" />
                    Print Receipt
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Raised Dispute Dialog modal */}
      <AnimatePresence>
        {disputeTx && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-3xl shadow-xl overflow-hidden p-6 space-y-4"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-orange-100 text-orange-600 rounded-xl shrink-0">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-950 text-base">File Transaction Contest / Dispute</h3>
                  <p className="text-xs text-gray-400 mt-1">Explain the grounds for dispute. This creates an immediate investigation ledger support ticket linked to Customer Accounts Room.</p>
                </div>
              </div>

              <div className="p-3 bg-yellow-50/50 rounded-xl border border-yellow-101 space-y-1">
                <span className="text-[9px] font-black text-yellow-800 uppercase tracking-widest block">Original Slip Details</span>
                <span className="text-xs font-bold text-gray-850 block">{disputeTx.type} • {disputeTx.description}</span>
                <span className="text-[10px] text-gray-500 font-bold block">{formatCurrency(disputeTx.amount)} on {new Date(disputeTx.timestamp).toLocaleString()}</span>
              </div>

              <form onSubmit={handleRaiseDispute} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">Contestation Reason Memo</label>
                  <textarea
                    required
                    placeholder="Provide specific reasons (e.g. Unidentified duplicate fee, Unauthorized payment charge-back requested, calculation discrepancy)..."
                    rows={3}
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none rounded-xl text-xs font-medium"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setDisputeTx(null)}
                    className="flex-1 py-3 bg-gray-50 hover:bg-gray-100 hover:text-gray-900 text-gray-500 rounded-xl font-bold text-xs uppercase tracking-wider"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-extrabold text-xs uppercase tracking-wider shadow-md shadow-orange-100"
                  >
                    Lodge Dispute Ticket
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
