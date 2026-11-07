import React, { useState, useEffect } from 'react';
import { 
  Wallet, ArrowUpRight, ArrowDownLeft, CreditCard, 
  History, PieChart, Landmark, ArrowRight,
  TrendingUp, ShieldCheck, Clock, Calculator, HelpCircle, AlertCircle, Sparkles, X, CheckSquare
} from 'lucide-react';
import { storage } from '../services/storageService';
import { Account, Transaction } from '../types';
import { formatCurrency, formatPercent, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function PersonalBanking() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [allAccountsList, setAllAccountsList] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Transfer interactive states
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [fromAcc, setFromAcc] = useState('');
  const [destAccMode, setDestAccMode] = useState<'Internal' | 'External'>('Internal');
  const [destAccId, setDestAccId] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferMemo, setTransferMemo] = useState('');
  const [transferError, setTransferError] = useState('');
  const [transferSuccess, setTransferSuccess] = useState('');

  // Loan/FD Calculator states
  const [calcTab, setCalcTab] = useState<'Investment' | 'Mortgage'>('Investment');
  const [calcAmount, setCalcAmount] = useState(10000);
  const [calcTerm, setCalcTerm] = useState(12); // Months
  const [calcRate, setCalcRate] = useState(5.5); // APR percentage

  // Benefit flow states
  const [activeBenefit, setActiveBenefit] = useState<string | null>(null);
  const [benefitAmount, setBenefitAmount] = useState('2000');
  const [benefitMessage, setBenefitMessage] = useState('');
  const [benefitSuccess, setBenefitSuccess] = useState('');
  const [benefitLoading, setBenefitLoading] = useState(false);

  const currentUser = storage.getCurrentUser();

  const fetchData = () => {
    if (currentUser) {
      const allBnkAccs = storage.getAccounts();
      setAllAccountsList(allBnkAccs);
      const userAccounts = allBnkAccs.filter(a => a.customerId === currentUser.uid);
      setAccounts(userAccounts);
      
      const allTransactions = storage.get<Transaction[]>('aaravland_bank_transactions', [])
        .filter(t => userAccounts.some(a => a.id === t.accountId || a.id === t.toAccountId));
      setTransactions(allTransactions.reverse());
      
      if (userAccounts.length > 0 && !fromAcc) {
        setFromAcc(userAccounts[0].id);
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    window.addEventListener('storage-update', fetchData);
    return () => window.removeEventListener('storage-update', fetchData);
  }, [currentUser]);

  if (!currentUser) return null;

  const totalBalance = accounts.reduce((acc, curr) => acc + curr.balance, 0);

  // Submit Interactive Fund Transfer
  const handlePerformTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    setTransferError('');
    setTransferSuccess('');

    if (!fromAcc || !destAccId || !transferAmount) {
      setTransferError('Please provide all fund source, target account references, and deposit amount.');
      return;
    }

    const numericAmount = parseFloat(transferAmount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setTransferError('Please specify a positive transfer capital.');
      return;
    }

    const sourceAccount = accounts.find(a => a.id === fromAcc);
    if (!sourceAccount) {
      setTransferError('Source account could not be resolved.');
      return;
    }

    if (sourceAccount.balance < numericAmount) {
      setTransferError('Insufficient funds in the selected account.');
      return;
    }

    if (fromAcc === destAccId) {
      setTransferError('Source account and destination account cannot be identical.');
      return;
    }

    // Attempt to verify target account
    const targetAccount = allAccountsList.find(a => a.id === destAccId);
    if (!targetAccount) {
      setTransferError('Destination account reference is invalid or could not be found within Aaravland Bank.');
      return;
    }

    try {
      // Process Transfer: Withdrawal from source, Deposit to target
      storage.processTransaction({
        accountId: fromAcc,
        amount: numericAmount,
        type: 'Withdrawal',
        description: `Transfer to Account #${destAccId} [${transferMemo || 'Immediate Transfer'}]`,
        toAccountId: destAccId
      });

      storage.processTransaction({
        accountId: destAccId,
        amount: numericAmount,
        type: 'Deposit',
        description: `Transfer from Account #${fromAcc} [${transferMemo || 'Immediate Transfer'}]`,
        toAccountId: fromAcc
      });

      storage.logAction(
        currentUser.uid,
        currentUser.name,
        'Internal Transfer Initiated',
        `Transferred $${numericAmount} from Account #${fromAcc} to Account #${destAccId}`,
        'Medium'
      );

      setTransferSuccess(`Successfully transferred ${formatCurrency(numericAmount)}!`);
      setTransferAmount('');
      setTransferMemo('');
      fetchData();
    } catch (err: any) {
      setTransferError(err.message || 'Error occurred while dispatching ledger transaction transfer.');
    }
  };

  // Submit Salary Advance benefit or payroll adjustments
  const handleBenefitDisbursement = (e: React.FormEvent) => {
    e.preventDefault();
    setBenefitSuccess('');
    setBenefitLoading(true);

    const amount = parseFloat(benefitAmount);
    if (isNaN(amount) || amount <= 0 || amount > 10000) {
      alert('Advance amount exceeds allowed limit of $10,000.');
      setBenefitLoading(false);
      return;
    }

    // Simulate approval duration
    setTimeout(() => {
      try {
        const targetCheckingAcc = accounts.find(a => a.type === 'Checking') || accounts[0];
        if (!targetCheckingAcc) {
          alert('Could not resolve an eligible Checking account for salary posting.');
          setBenefitLoading(false);
          return;
        }

        // Post simulated compensation credit
        storage.processTransaction({
          accountId: targetCheckingAcc.id,
          amount: amount,
          type: 'Deposit',
          description: `SIMULATED INSTITUTION BENEFITS: ${activeBenefit} Approved`
        });

        storage.logAction(
          currentUser.uid,
          currentUser.name,
          'Benefit Advance Approved',
          `Salary advance allocation approved and disbursed for credit: $${amount}`,
          'High'
        );

        setBenefitSuccess(`Institutional pre-approval completed! credited ${formatCurrency(amount)} instantly into Account ${targetCheckingAcc.id}.`);
        setBenefitLoading(false);
        fetchData();
      } catch (err: any) {
        alert(err.message || 'Validation error requesting benefit advance.');
        setBenefitLoading(false);
      }
    }, 1200);
  };

  // Live projections calculators calculations
  const calculatedOutput = React.useMemo(() => {
    if (calcTab === 'Investment') {
      const termYears = calcTerm / 12;
      const totalGains = calcAmount * (calcRate / 100) * termYears;
      return {
        metricLabel: 'Projected Gains',
        metricValue: totalGains,
        totalLabel: 'Cumulative Yield',
        totalValue: calcAmount + totalGains
      };
    } else {
      // Mortgage/Loan payment compound interest formula
      const i = (calcRate / 100) / 12;
      const compoundFactor = Math.pow(1 + i, calcTerm);
      const monthlyPmt = i > 0 ? (calcAmount * i * compoundFactor) / (compoundFactor - 1) : calcAmount / calcTerm;
      const cumulativePayments = monthlyPmt * calcTerm;
      return {
        metricLabel: 'Monthly Installment',
        metricValue: monthlyPmt,
        totalLabel: 'Cumulative Re-Payments',
        totalValue: cumulativePayments
      };
    }
  }, [calcTab, calcAmount, calcTerm, calcRate]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-8">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-950 tracking-tight">Personal Banking</h1>
          <p className="text-gray-500 font-medium">Manage your personal staff holdings, interbank transfers, and compensation.</p>
        </div>
        <div className="flex items-center gap-3 bg-[gradient-to-r] from-emerald-500/10 to-teal-500/10 px-4 py-2 rounded-2xl border border-emerald-500/20 shadow-sm">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <span className="text-xs font-black text-emerald-700 uppercase tracking-widest">Verified Institutional Account</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Dashboard Summary Premium Card */}
          <div className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-gray-950 rounded-[3rem] p-10 text-white shadow-xl shadow-indigo-100">
            <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/15 rounded-full blur-[120px] -mr-40 -mt-20" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-600/10 rounded-full blur-[90px] -ml-32 -mb-20" />
            
            <div className="relative z-10 space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/10">
                    <Landmark className="w-5 h-5 text-white animate-pulse" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-200">Aaravland Cooperative</p>
                    <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">Institutional Vault Active</p>
                  </div>
                </div>
                <CreditCard className="w-8 h-8 opacity-40 hover:opacity-100 transition-opacity cursor-pointer text-indigo-300" />
              </div>

              <div className="space-y-2">
                <p className="text-xs font-black uppercase tracking-widest text-indigo-300">Sum Liquid Balance Holdings</p>
                <h2 className="text-6xl font-black tracking-tighter tabular-nums text-white">
                  {formatCurrency(totalBalance)}
                </h2>
              </div>

              {/* Action Triggers */}
              <div className="flex flex-wrap gap-4 pt-4">
                <button 
                  onClick={() => {
                    setTransferError('');
                    setTransferSuccess('');
                    setIsTransferOpen(true);
                  }}
                  className="flex items-center gap-2.5 px-6 py-4 bg-white text-gray-950 rounded-2xl font-black text-xs uppercase tracking-wider transition-all hover:shadow-xl hover:scale-105 active:scale-95"
                >
                  <ArrowUpRight className="w-4 h-4 text-emerald-600 stroke-[3px]" />
                  Transfer Liquidity
                </button>
                <button 
                  onClick={() => setIsTransferOpen(true)}
                  className="flex items-center gap-2.5 px-6 py-4 bg-white/10 backdrop-blur-md text-white rounded-2xl font-black text-xs uppercase tracking-wider border border-white/10 hover:bg-white/20 transition-all hover:scale-105"
                >
                  <PieChart className="w-4 h-4 text-indigo-400" />
                  Account Allocations
                </button>
              </div>
            </div>
          </div>

          {/* Savings vs Checking Account Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {accounts.map((acc) => (
              <div key={acc.id} className="relative overflow-hidden bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/40 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center justify-between mb-6">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center border",
                    acc.type === 'Savings' 
                      ? "bg-blue-50 text-blue-600 border-blue-100" 
                      : "bg-indigo-50 text-indigo-600 border-indigo-100"
                  )}>
                    <Wallet className="w-6 h-6" />
                  </div>
                  <span className={cn(
                    "px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg border",
                    acc.type === 'Savings' 
                      ? "bg-blue-100 text-blue-800 border-blue-200" 
                      : "bg-slate-100 text-slate-800 border-slate-200"
                  )}>
                    {acc.type}
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-black text-gray-950 tabular-nums">{formatCurrency(acc.balance)}</p>
                  <div className="flex items-center justify-between text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    <span>Voucher #{acc.id}</span>
                    <span className="text-emerald-600">{acc.interestRate}% Interest APY</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Interactive Sliders Projection Planner */}
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-50 pb-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-950 text-base">Capital Compound & Amortization Projections</h3>
                  <span className="text-xs text-gray-400 block mt-0.5">Simulate growth ratios and loan repayment metrics instantly</span>
                </div>
              </div>

              {/* Selector */}
              <div className="grid grid-cols-2 bg-gray-50 rounded-xl border border-gray-100 p-1 w-64 text-center">
                <button
                  onClick={() => setCalcTab('Investment')}
                  className={cn(
                    "py-1.5 font-black text-[10px] uppercase tracking-wider rounded-lg transition-all",
                    calcTab === 'Investment' ? "bg-indigo-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-950"
                  )}
                >
                  Yield Accruals
                </button>
                <button
                  onClick={() => setCalcTab('Mortgage')}
                  className={cn(
                    "py-1.5 font-black text-[10px] uppercase tracking-wider rounded-lg transition-all",
                    calcTab === 'Mortgage' ? "bg-indigo-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-950"
                  )}
                >
                  Loan Amortize
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Controls Sliders */}
              <div className="space-y-5">
                {/* Principal Amount slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-gray-700">
                    <span>Principal Capital Value</span>
                    <span className="text-indigo-600 tracking-tight font-black">{formatCurrency(calcAmount)}</span>
                  </div>
                  <input 
                    type="range"
                    min="1000"
                    max="100000"
                    step="1000"
                    value={calcAmount}
                    onChange={(e) => setCalcAmount(Number(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-gray-100 rounded-lg"
                  />
                  <div className="flex justify-between text-[9px] text-gray-400 font-black">
                    <span>$1,000</span>
                    <span>$100,000</span>
                  </div>
                </div>

                {/* Term months slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-gray-700">
                    <span>Maturity Term (Duration)</span>
                    <span className="text-indigo-600 tracking-tight font-black">{calcTerm} Months</span>
                  </div>
                  <input 
                    type="range"
                    min="3"
                    max="60"
                    step="1"
                    value={calcTerm}
                    onChange={(e) => setCalcTerm(Number(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-gray-100 rounded-lg"
                  />
                  <div className="flex justify-between text-[9px] text-gray-400 font-black">
                    <span>3 Mos</span>
                    <span>5 Years (60 Mos)</span>
                  </div>
                </div>

                {/* Rates slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-gray-700">
                    <span>Annual Percentage % Rate (APR)</span>
                    <span className="text-indigo-600 tracking-tight font-black">{calcRate}% APR</span>
                  </div>
                  <input 
                    type="range"
                    min="1"
                    max="18"
                    step="0.1"
                    value={calcRate}
                    onChange={(e) => setCalcRate(Number(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-gray-100 rounded-lg"
                  />
                  <div className="flex justify-between text-[9px] text-gray-400 font-black">
                    <span>1.0% Min</span>
                    <span>18.0% Max</span>
                  </div>
                </div>
              </div>

              {/* Calculated Outputs Visualization Card */}
              <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{calcTab === 'Investment' ? 'Total Yield Interest Accrual (Est)' : 'Individual Monthly Payments'}</span>
                  <div className="text-4xl font-black text-gray-900 tracking-tighter tabular-nums">
                    {formatCurrency(calculatedOutput.metricValue)}
                  </div>
                  <p className="text-[11px] text-gray-450 font-medium">Estimated calculations assuming standard monthly compounding periods</p>
                </div>

                <div className="border-t border-slate-200/60 pt-4 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">{calculatedOutput.totalLabel}</span>
                    <span className="text-lg font-black text-indigo-950 block">{formatCurrency(calculatedOutput.totalValue)}</span>
                  </div>
                  <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Sparkles className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity history list */}
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-gray-50 flex items-center justify-between">
              <h3 className="text-lg font-black text-gray-950 flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-600" />
                Transaction Vault History
              </h3>
              <span className="px-3 py-1 bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-400 rounded-lg">Last Completed</span>
            </div>
            <div className="divide-y divide-gray-50">
              {transactions.length > 0 ? transactions.map((t) => (
                <div key={t.id} className="p-6 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center border",
                      t.type === 'Deposit' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-red-50 text-red-600 border-red-105"
                    )}>
                      {t.type === 'Deposit' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="text-sm font-black text-gray-900">{t.description || t.type}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">Reference Ref: {t.id} • {new Date(t.timestamp).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <p className={cn(
                    "text-sm font-black tabular-nums",
                    t.type === 'Deposit' ? "text-emerald-600" : "text-gray-900"
                  )}>
                    {t.type === 'Deposit' ? '+' : '-'}{formatCurrency(t.amount)}
                  </p>
                </div>
              )) : (
                <div className="p-20 text-center">
                  <Clock className="w-12 h-12 text-gray-205 mx-auto mb-4 opacity-50" />
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No recent transactions tracked in personal scope</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Institutional Benefits overview */}
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 rounded-[2.5rem] text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-xl" />
            <h3 className="text-lg font-black mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Staff Benefit Privileges
            </h3>
            <div className="space-y-6">
              <div className="p-4 bg-white/10 rounded-2xl border border-white/10">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Cooperative Housing APR</p>
                <p className="text-2xl font-black">2.8% <span className="text-xs font-semibold opacity-60">Fixed-Tier</span></p>
              </div>
              <div className="p-4 bg-white/10 rounded-2xl border border-white/10">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Max Benefit Loan Cap</p>
                <p className="text-2xl font-black">{formatCurrency(75000)}</p>
              </div>
              <div className="p-3.5 bg-yellow-400/10 border border-yellow-400/20 rounded-2xl text-yellow-200 text-xs font-medium space-y-1">
                <p className="font-bold flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-yellow-300" /> Executive Notice</p>
                <p className="opacity-80 leading-relaxed">Direct salary advances, direct deposit updates, and tax setting alterations apply instantly on your ledger records.</p>
              </div>
            </div>
          </div>

          {/* Quick Actions buttons with live simulated approval overlays */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <h3 className="text-lg font-black text-gray-950 mb-6">Eligible Quick Actions</h3>
            <div className="space-y-3">
              {[
                { title: 'Request Salary Advance', type: 'salary_advance' },
                { title: 'Direct Deposit Route', type: 'direct_deposit' },
                { title: 'Update Tax Declaration', type: 'tax_update' },
                { title: 'Adjust Account Overdraft', type: 'overdraft_limit' }
              ].map((act) => (
                <button 
                  key={act.type} 
                  onClick={() => {
                    setActiveBenefit(act.title);
                    setBenefitSuccess('');
                    setBenefitAmount('2000');
                    setBenefitMessage('');
                  }}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 rounded-2xl transition-all group text-left"
                >
                  <span className="text-xs font-bold text-gray-750 group-hover:text-indigo-950">{act.title}</span>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 transition-transform group-hover:translate-x-1" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Fund Transfer Modal Draw Layout */}
      <AnimatePresence>
        {isTransferOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTransferOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 bg-indigo-600 text-white flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-black tracking-tight flex items-center gap-2">
                    <ArrowUpRight className="w-6 h-6 shrink-0" />
                    Internal Transfer Desk
                  </h3>
                  <p className="text-indigo-100 text-xs font-semibold mt-1">Submit high-density inter-account transfers instantly with persistent validation.</p>
                </div>
                <button 
                  onClick={() => setIsTransferOpen(false)}
                  className="p-1 hover:bg-white/10 rounded-lg text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handlePerformTransfer} className="p-8 space-y-5">
                {/* Source Account selection */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Choose Funding Source</label>
                  <select
                    value={fromAcc}
                    onChange={(e) => setFromAcc(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 focus:border-indigo-500 rounded-xl outline-none font-bold text-xs"
                  >
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.type} account #{acc.id} ({formatCurrency(acc.balance)})</option>
                    ))}
                  </select>
                </div>

                {/* Mode Selector */}
                <div className="grid grid-cols-2 bg-gray-50 rounded-xl border border-gray-100 p-1 w-full text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setDestAccMode('Internal');
                      setDestAccId('');
                    }}
                    className={cn(
                      "py-1.5 font-bold text-[10px] uppercase tracking-wider rounded-lg transition-all",
                      destAccMode === 'Internal' ? "bg-white text-gray-900 border border-gray-200/50 shadow-xs" : "text-gray-500 hover:text-gray-900"
                    )}
                  >
                    Transfer to Self
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDestAccMode('External');
                      setDestAccId('');
                    }}
                    className={cn(
                      "py-1.5 font-bold text-[10px] uppercase tracking-wider rounded-lg transition-all",
                      destAccMode === 'External' ? "bg-white text-gray-900 border border-gray-200/50 shadow-xs" : "text-gray-500 hover:text-gray-900"
                    )}
                  >
                    Find Other Member
                  </button>
                </div>

                {/* Destination selection based on mode */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Destination Account ID</label>
                  {destAccMode === 'Internal' ? (
                    <select
                      value={destAccId}
                      onChange={(e) => setDestAccId(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 focus:border-indigo-500 rounded-xl outline-none font-bold text-xs"
                    >
                      <option value="">-- Choose Target Account --</option>
                      {accounts.filter(a => a.id !== fromAcc).map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.type} account #{acc.id} ({formatCurrency(acc.balance)})</option>
                      ))}
                    </select>
                  ) : (
                    <select
                      value={destAccId}
                      onChange={(e) => setDestAccId(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 focus:border-indigo-500 rounded-xl outline-none font-bold text-xs"
                    >
                      <option value="">-- Choose Bank Member Account --</option>
                      {allAccountsList.filter(a => a.customerId !== currentUser.uid).map(acc => (
                        <option key={acc.id} value={acc.id}>Account Reference #{acc.id} ({acc.type})</option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Amount */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block font-sans">Transfer Amount ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="1.00"
                      placeholder="e.g. 1500.00"
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 focus:border-indigo-500 rounded-xl outline-none font-bold text-xs"
                    />
                  </div>

                  {/* Memo */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Transfer Memo Note</label>
                    <input
                      type="text"
                      placeholder="e.g. Compensation shift"
                      value={transferMemo}
                      onChange={(e) => setTransferMemo(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 focus:border-indigo-500 rounded-xl outline-none font-bold text-xs"
                    />
                  </div>
                </div>

                {transferError && (
                  <div className="p-3 bg-red-100 text-red-700 rounded-xl font-bold text-xs border border-red-200">
                    {transferError}
                  </div>
                )}

                {transferSuccess && (
                  <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl font-bold text-xs border border-emerald-200">
                    {transferSuccess}
                  </div>
                )}

                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsTransferOpen(false)}
                    className="flex-1 py-3.5 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-xl font-bold text-xs uppercase"
                  >
                    Cancel Desk
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs uppercase shadow-md shadow-indigo-100"
                  >
                    Dispatch Funds
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Benefit Action Overlay Modal */}
      <AnimatePresence>
        {activeBenefit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveBenefit(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 bg-blue-600 text-white">
                <h3 className="text-xl font-black tracking-tight">{activeBenefit}</h3>
                <p className="text-blue-100 text-xs font-medium mt-1">Review pre-approval ratios for institutional cooperative staff members.</p>
              </div>

              <form onSubmit={handleBenefitDisbursement} className="p-8 space-y-5">
                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl space-y-1">
                  <span className="text-[9px] font-black text-indigo-700 uppercase tracking-widest block">Compensation Terms</span>
                  <p className="text-xs text-indigo-950 font-bold leading-relaxed">As a verified cooperative employee, your pre-approved balance limit ranges dynamically up to a maximum request margin of $10,000.00.</p>
                </div>

                <div className="space-y-11.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Advance Request Margin Capital ($)</label>
                  <input
                    type="number"
                    max="10000"
                    min="100"
                    placeholder="e.g. 2500"
                    value={benefitAmount}
                    onChange={(e) => setBenefitAmount(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 focus:border-indigo-500 rounded-xl outline-none font-bold text-xs"
                  />
                  <span className="text-[9px] text-gray-400 block mt-1">Inter-cooperative interest rates apply at exactly 0.0% APR</span>
                </div>

                {benefitSuccess && (
                  <div className="p-3.5 bg-emerald-100 text-emerald-800 rounded-2xl text-xs font-bold border border-emerald-250">
                    {benefitSuccess}
                  </div>
                )}

                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setActiveBenefit(null)}
                    disabled={benefitLoading}
                    className="flex-1 py-3 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-xl font-bold text-xs uppercase"
                  >
                    Cancel Action
                  </button>
                  <button
                    type="submit"
                    disabled={benefitLoading || !!benefitSuccess}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs uppercase shadow-md flex items-center justify-center gap-2"
                  >
                    {benefitLoading ? 'Authorizing...' : 'Request Credit Approved'}
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
