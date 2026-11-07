import React, { useState, useEffect } from 'react';
import { 
  ArrowUpRight, ArrowDownLeft, ArrowRightLeft, 
  Search, CheckCircle, Clock, XCircle, DollarSign, 
  Plus, X, Shield, Wallet, FileText, Check, AlertCircle,
  HelpCircle, Printer, Sparkles, User, Info, Building2
} from 'lucide-react';
import { storage } from '../services/storageService';
import { Customer, Account, Transaction } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function FlexibleTransactions() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [allAccountsList, setAllAccountsList] = useState<Account[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selection States
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  
  // Transaction Workspace States
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdrawal' | 'transfer'>('deposit');
  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState<'Cash' | 'Cheque' | 'Wire'>('Cash');
  const [description, setDescription] = useState('');
  const [targetAccountRef, setTargetAccountRef] = useState('');
  const [targetAccountSearch, setTargetAccountSearch] = useState('');

  // Receipt Modal
  const [receiptTx, setReceiptTx] = useState<Transaction | null>(null);
  const [receiptCustomerName, setReceiptCustomerName] = useState('');
  const [receiptAccountType, setReceiptAccountType] = useState('');

  // Status/Alerts
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const currentUser = storage.getCurrentUser();

  const fetchData = () => {
    const custs = storage.getCustomers();
    const accs = storage.getAccounts();
    setCustomers(custs);
    setAllAccountsList(accs);
    
    // Maintain selections if they still exist
    if (selectedCustomer) {
      const updatedCust = custs.find(c => c.id === selectedCustomer.id);
      if (updatedCust) setSelectedCustomer(updatedCust);
      
      const custAccs = accs.filter(a => a.customerId === selectedCustomer.id);
      setAccounts(custAccs);
      
      if (selectedAccount) {
        const updatedAcc = custAccs.find(a => a.id === selectedAccount.id);
        if (updatedAcc) setSelectedAccount(updatedAcc);
      }
    }
  };

  useEffect(() => {
    fetchData();
    window.addEventListener('storage-update', fetchData);
    return () => window.removeEventListener('storage-update', fetchData);
  }, [selectedCustomer, selectedAccount]);

  // Handle choosing a customer
  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    const custAccs = allAccountsList.filter(a => a.customerId === customer.id);
    setAccounts(custAccs);
    setSelectedAccount(custAccs.length > 0 ? custAccs[0] : null);
    setError('');
    setSuccess('');
    setAmount('');
    setDescription('');
    setTargetAccountRef('');
  };

  // Preset quick-amounts for Deposits/Withdrawals
  const presetAmounts = [100, 500, 1000, 5000];

  const handlePresetClick = (val: number) => {
    const current = parseFloat(amount) || 0;
    setAmount((current + val).toString());
  };

  const handleClearAmount = () => {
    setAmount('');
  };

  // Submit deposit
  const handleProcessDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedAccount) {
      setError('Please select a valid target account.');
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('Please provide a positive transaction amount.');
      return;
    }

    try {
      const memoText = description.trim() || `Flexible On-Demand Deposit via ${mode}`;
      
      const newTx = storage.processTransaction({
        accountId: selectedAccount.id,
        amount: numericAmount,
        type: 'Deposit',
        description: memoText
      });

      // Update local storage capital
      const capital = storage.getCapital();
      capital.liquidCash += numericAmount;
      storage.updateCapital(capital);

      // Audit Log
      storage.logAction(
        currentUser?.uid || 'system',
        currentUser?.name || 'CSR Desk',
        'Deposit Actioned',
        `On-demand deposit of $${numericAmount} credited to Account #${selectedAccount.id} for client ${selectedCustomer?.name}`,
        'Medium'
      );

      // Add Notification
      storage.addNotification(
        selectedCustomer?.id || '',
        'Credit Deposit Processed',
        `An amount of ${formatCurrency(numericAmount)} was successfully credited to your ${selectedAccount.type} account (#${selectedAccount.id}).`
      );

      setSuccess(`Deposit of ${formatCurrency(numericAmount)} posted successfully!`);
      
      // Trigger Receipt Modal
      setReceiptTx(newTx);
      setReceiptCustomerName(selectedCustomer?.name || 'Valued Member');
      setReceiptAccountType(selectedAccount.type);
      
      setAmount('');
      setDescription('');
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Error occurred while processing deposit.');
    }
  };

  // Submit withdrawal
  const handleProcessWithdrawal = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedAccount) {
      setError('Please select an active source account.');
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('Please enter a positive numeric value.');
      return;
    }

    if (selectedAccount.balance < numericAmount) {
      setError(`Insufficient liquid reserves. Maximum available withdrawal is ${formatCurrency(selectedAccount.balance)}.`);
      return;
    }

    try {
      const memoText = description.trim() || `Flexible On-Demand Withdrawal via ${mode}`;
      
      const newTx = storage.processTransaction({
        accountId: selectedAccount.id,
        amount: numericAmount,
        type: 'Withdrawal',
        description: memoText
      });

      // Update local storage capital
      const capital = storage.getCapital();
      if (capital.liquidCash >= numericAmount) {
        capital.liquidCash -= numericAmount;
        storage.updateCapital(capital);
      }

      // Audit Log
      storage.logAction(
        currentUser?.uid || 'system',
        currentUser?.name || 'CSR Desk',
        'Withdrawal Actioned',
        `On-demand withdrawal of $${numericAmount} debited from Account #${selectedAccount.id} for client ${selectedCustomer?.name}`,
        'High'
      );

      // Add Notification
      storage.addNotification(
        selectedCustomer?.id || '',
        'Debit Withdrawal Processed',
        `An on-demand cash withdrawal of ${formatCurrency(numericAmount)} was authorized from your ${selectedAccount.type} account (#${selectedAccount.id}).`
      );

      setSuccess(`Withdrawal of ${formatCurrency(numericAmount)} processed successfully!`);
      
      // Trigger Receipt Modal
      setReceiptTx(newTx);
      setReceiptCustomerName(selectedCustomer?.name || 'Valued Member');
      setReceiptAccountType(selectedAccount.type);

      setAmount('');
      setDescription('');
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Error executing withdrawal ledger posting.');
    }
  };

  // Submit inter-account/external transfer
  const handleProcessTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedAccount) {
      setError('Please choose a valid funding account.');
      return;
    }

    if (!targetAccountRef) {
      setError('Please select an endpoint recipient account.');
      return;
    }

    if (selectedAccount.id === targetAccountRef) {
      setError('Funding source and target recipient accounts must be distinct.');
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('Please specify a positive transfer amount.');
      return;
    }

    if (selectedAccount.balance < numericAmount) {
      setError(`Overdraft protection limit breached. Available funding balance is ${formatCurrency(selectedAccount.balance)}.`);
      return;
    }

    // Verify recipient account exists in all accounts list
    const targetAccount = allAccountsList.find(a => a.id === targetAccountRef);
    if (!targetAccount) {
      setError('Target recipient account identifier could not be validated.');
      return;
    }

    const targetCustomer = customers.find(c => c.id === targetAccount.customerId);

    try {
      // Process Transfer - Debit From Source
      const debitTx = storage.processTransaction({
        accountId: selectedAccount.id,
        amount: numericAmount,
        type: 'Transfer',
        description: `Transfer out to #${targetAccountRef} [${description.trim() || 'No notes'}]`,
        toAccountId: targetAccountRef
      });

      // Credit To Target
      storage.processTransaction({
        accountId: targetAccountRef,
        amount: numericAmount,
        type: 'Deposit',
        description: `Transfer in from #${selectedAccount.id} [${description.trim() || 'No notes'}]`,
        toAccountId: selectedAccount.id
      });

      // Audit Log
      storage.logAction(
        currentUser?.uid || 'system',
        currentUser?.name || 'CSR Desk',
        'Book Transfer Processed',
        `On-demand ledger transfer of $${numericAmount} from Account #${selectedAccount.id} to Account #${targetAccountRef}`,
        'Medium'
      );

      // Notify Source
      storage.addNotification(
        selectedCustomer?.id || '',
        'Fund Transfer Sent',
        `You successfully sent ${formatCurrency(numericAmount)} to account #${targetAccountRef}.`
      );

      // Notify Target
      if (targetCustomer) {
        storage.addNotification(
          targetCustomer.id,
          'Funds Received',
          `You received a credit of ${formatCurrency(numericAmount)} from account #${selectedAccount.id}.`
        );
      }

      setSuccess(`Cooperative transfer of ${formatCurrency(numericAmount)} posted instantly!`);
      
      // Trigger Receipt Modal for sender
      setReceiptTx(debitTx);
      setReceiptCustomerName(selectedCustomer?.name || 'Valued Member');
      setReceiptAccountType(selectedAccount.type);

      setAmount('');
      setDescription('');
      setTargetAccountRef('');
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Error occurred during transfer distribution.');
    }
  };

  // Filtered customer list
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Eligible targets for transfer (all accounts excluding the selected source account)
  const eligibleTransferTargets = allAccountsList.filter(acc => {
    if (!selectedAccount) return false;
    if (acc.id === selectedAccount.id) return false;
    
    // Optionally filter by account target search query
    if (targetAccountSearch) {
      const owner = customers.find(c => c.id === acc.customerId);
      const ownerName = owner ? owner.name.toLowerCase() : '';
      return acc.id.includes(targetAccountSearch) || ownerName.includes(targetAccountSearch.toLowerCase());
    }
    return true;
  });

  // Calculate simulated ending balance
  const currentAmt = parseFloat(amount) || 0;
  const projectedBalance = selectedAccount 
    ? (activeTab === 'deposit' 
        ? selectedAccount.balance + currentAmt 
        : selectedAccount.balance - currentAmt)
    : 0;

  return (
    <div className="space-y-8 p-6 bg-gray-50 min-h-screen">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-950 tracking-tight">On-Demand Transactions Desk</h2>
          <p className="text-gray-500 mt-1">Submit flexible deposits, cash withdrawals, and book transfers instantly.</p>
        </div>
        <div className="flex items-center gap-3 bg-indigo-50 px-4 py-2 rounded-2xl border border-indigo-100 shadow-xs">
          <Shield className="w-5 h-5 text-indigo-600" />
          <span className="text-xs font-black text-indigo-700 uppercase tracking-widest">Cooperative Ledger Engine</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Hand: Customer Directory Lookup & Account Selection */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Customer Directory Search */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-4">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-500" />
              Customer Portfolio Search
            </h3>
            
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold text-xs"
              />
            </div>

            {/* Quick customer selection dropdown list */}
            <div className="max-h-56 overflow-y-auto space-y-1.5 pt-2 pr-1 divide-y divide-gray-55">
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map(cust => (
                  <button
                    key={cust.id}
                    onClick={() => handleSelectCustomer(cust)}
                    className={cn(
                      "w-full text-left p-3 rounded-2xl flex items-center gap-3 transition-all",
                      selectedCustomer?.id === cust.id 
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" 
                        : "hover:bg-gray-50 text-gray-800"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-xl font-bold flex items-center justify-center text-xs shadow-xs",
                      selectedCustomer?.id === cust.id ? "bg-white/20 text-white" : "bg-indigo-50 text-indigo-600"
                    )}>
                      {cust.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold truncate">{cust.name}</p>
                      <p className={cn("text-[9px] font-medium truncate mt-0.5", selectedCustomer?.id === cust.id ? "text-indigo-200" : "text-gray-400")}>
                        {cust.email} • ID: {cust.id}
                      </p>
                    </div>
                    {selectedCustomer?.id === cust.id && <Check className="w-4 h-4 shrink-0" />}
                  </button>
                ))
              ) : (
                <div className="text-center py-6 text-gray-400">
                  <p className="text-xs font-bold uppercase">No Customers Found</p>
                </div>
              )}
            </div>
          </div>

          {/* Liquid Capital & Vault Tracker (Decorative & functional KPI) */}
          <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 text-white rounded-[2rem] p-6 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-700/10 rounded-full blur-xl" />
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-300" />
                <h4 className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Aaravland Vault Liquidity</h4>
              </div>
              <div>
                <span className="text-xs text-indigo-200">Instant Cash Reserve Holdings</span>
                <p className="text-3xl font-black tabular-nums mt-1">{formatCurrency(storage.getCapital().liquidCash)}</p>
              </div>
              <div className="w-full bg-indigo-950/40 rounded-full h-1.5 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '68%' }} />
              </div>
              <div className="flex justify-between text-[9px] font-bold text-indigo-300">
                <span>68% Limit Buffer</span>
                <span className="text-emerald-400">Status: Solid</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Hand: Action desk, account cards, workspace */}
        <div className="lg:col-span-8 space-y-6">
          {selectedCustomer ? (
            <div className="space-y-6">
              
              {/* Selected Customer Banner */}
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-xl font-bold text-indigo-600">
                    {selectedCustomer.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-gray-950">{selectedCustomer.name}</h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400 font-bold uppercase mt-0.5">
                      <span>KYC Status:</span>
                      <span className={cn(
                        "text-[10px] px-2 py-0.5 rounded-md",
                        selectedCustomer.kycStatus === 'Verified' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                      )}>{selectedCustomer.kycStatus}</span>
                      <span>• Branch: {selectedCustomer.branch}</span>
                    </div>
                  </div>
                </div>
                <div className="text-left md:text-right">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Total Liquid Balance</span>
                  <span className="text-2xl font-black text-indigo-600 tabular-nums">
                    {formatCurrency(accounts.reduce((sum, a) => sum + a.balance, 0))}
                  </span>
                </div>
              </div>

              {/* Flex Accounts Carousel Cards */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Select Source / Target Account</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {accounts.length > 0 ? (
                    accounts.map(acc => (
                      <button
                        key={acc.id}
                        onClick={() => setSelectedAccount(acc)}
                        className={cn(
                          "relative text-left p-5 rounded-[2rem] border transition-all overflow-hidden group flex flex-col justify-between h-40",
                          selectedAccount?.id === acc.id 
                            ? "bg-gradient-to-br from-indigo-900 via-indigo-950 to-gray-900 border-transparent text-white shadow-lg scale-[1.02]" 
                            : "bg-white border-gray-100 text-gray-900 hover:border-gray-200 shadow-xs"
                        )}
                      >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        
                        <div className="w-full flex justify-between items-start">
                          <div className={cn(
                            "p-2 rounded-xl border text-xs font-bold uppercase tracking-wider",
                            selectedAccount?.id === acc.id 
                              ? "bg-white/10 border-white/10 text-indigo-300" 
                              : "bg-indigo-50 border-indigo-100 text-indigo-600"
                          )}>
                            {acc.type}
                          </div>
                          <span className={cn(
                            "text-[9px] font-black uppercase tracking-wider rounded-md px-2 py-0.5",
                            acc.status === 'Active' ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"
                          )}>
                            {acc.status}
                          </span>
                        </div>

                        <div className="space-y-1 mt-4">
                          <span className={cn("text-[10px] font-black uppercase tracking-widest block", selectedAccount?.id === acc.id ? "text-indigo-200" : "text-gray-400")}>
                            Liquid Funds Balance
                          </span>
                          <span className="text-2xl font-black tracking-tight tabular-nums">
                            {formatCurrency(acc.balance)}
                          </span>
                        </div>

                        <div className={cn("text-[9px] font-mono mt-2 flex justify-between items-center w-full", selectedAccount?.id === acc.id ? "text-indigo-300" : "text-gray-400")}>
                          <span>VOUCHER #{acc.id}</span>
                          <span>{acc.interestRate}% APY</span>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="col-span-3 p-8 bg-white border border-gray-100 rounded-3xl text-center text-gray-400">
                      <p className="text-xs font-bold">No Demand Accounts Found</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Transactions Tab Desk Workspace */}
              {selectedAccount && (
                <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xs overflow-hidden">
                  
                  {/* Custom Tab Selector Bar */}
                  <div className="grid grid-cols-3 bg-gray-50/50 border-b border-gray-100">
                    <button
                      onClick={() => { setActiveTab('deposit'); setError(''); setSuccess(''); }}
                      className={cn(
                        "py-4 font-black text-xs uppercase tracking-wider transition-all border-b-2 flex items-center justify-center gap-2",
                        activeTab === 'deposit' 
                          ? "border-indigo-600 text-indigo-600 bg-white" 
                          : "border-transparent text-gray-500 hover:text-gray-900"
                      )}
                    >
                      <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
                      Flexible Deposit
                    </button>
                    <button
                      onClick={() => { setActiveTab('withdrawal'); setError(''); setSuccess(''); }}
                      className={cn(
                        "py-4 font-black text-xs uppercase tracking-wider transition-all border-b-2 flex items-center justify-center gap-2",
                        activeTab === 'withdrawal' 
                          ? "border-indigo-600 text-indigo-600 bg-white" 
                          : "border-transparent text-gray-500 hover:text-gray-900"
                      )}
                    >
                      <ArrowUpRight className="w-4 h-4 text-red-500" />
                      Cash Withdrawal
                    </button>
                    <button
                      onClick={() => { setActiveTab('transfer'); setError(''); setSuccess(''); }}
                      className={cn(
                        "py-4 font-black text-xs uppercase tracking-wider transition-all border-b-2 flex items-center justify-center gap-2",
                        activeTab === 'transfer' 
                          ? "border-indigo-600 text-indigo-600 bg-white" 
                          : "border-transparent text-gray-500 hover:text-gray-900"
                      )}
                    >
                      <ArrowRightLeft className="w-4 h-4 text-blue-500" />
                      Cooperative Transfer
                    </button>
                  </div>

                  <div className="p-8">
                    {/* Active Form */}
                    <form 
                      onSubmit={
                        activeTab === 'deposit' ? handleProcessDeposit :
                        activeTab === 'withdrawal' ? handleProcessWithdrawal :
                        handleProcessTransfer
                      }
                      className="space-y-6"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* Transaction Amount Inputs with Live Projections */}
                        <div className="space-y-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Transaction Capital ($)</label>
                            <div className="relative">
                              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                              <input
                                required
                                type="number"
                                step="0.01"
                                min="0.10"
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full pl-11 pr-12 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-extrabold text-sm"
                              />
                              {amount && (
                                <button
                                  type="button"
                                  onClick={handleClearAmount}
                                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Preset Buttons */}
                          <div className="flex flex-wrap gap-2">
                            {presetAmounts.map(val => (
                              <button
                                key={val}
                                type="button"
                                onClick={() => handlePresetClick(val)}
                                className="px-3.5 py-1.5 bg-gray-50 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl text-xs font-bold text-gray-600 transition-colors"
                              >
                                +${val}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Projection Statement Card */}
                        <div className="bg-indigo-50/40 border border-indigo-100/50 rounded-3xl p-5 flex flex-col justify-between space-y-4">
                          <div className="space-y-1.5">
                            <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest block">Ledger Balance Forecast</span>
                            <div className="flex items-center gap-3">
                              <Wallet className="w-5 h-5 text-indigo-500" />
                              <div>
                                <span className="text-[10px] text-gray-450 block font-bold uppercase">Current Ending balance</span>
                                <span className="text-xs text-gray-600 font-black tabular-nums">{formatCurrency(selectedAccount.balance)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="border-t border-indigo-100/50 pt-3 flex items-center justify-between">
                            <div>
                              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Projected Balance</span>
                              <span className={cn(
                                "text-lg font-black tracking-tight tabular-nums block",
                                projectedBalance < 0 ? "text-red-600 animate-pulse" : "text-indigo-950"
                              )}>
                                {formatCurrency(projectedBalance)}
                              </span>
                            </div>
                            <div className="p-2.5 bg-white border border-indigo-100/30 text-indigo-600 rounded-xl">
                              <Sparkles className="w-4 h-4" />
                            </div>
                          </div>
                        </div>

                      </div>

                      {/* Tab Specific Inputs */}
                      {activeTab !== 'transfer' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Channel/Mode */}
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Transaction Method Channel</label>
                            <div className="grid grid-cols-3 bg-gray-50 rounded-xl border border-gray-100 p-1">
                              {['Cash', 'Cheque', 'Wire'].map(m => (
                                <button
                                  key={m}
                                  type="button"
                                  onClick={() => setMode(m as any)}
                                  className={cn(
                                    "py-1.5 font-bold text-[10px] uppercase tracking-wider rounded-lg transition-all",
                                    mode === m ? "bg-indigo-600 text-white shadow-xs" : "text-gray-500 hover:text-gray-900"
                                  )}
                                >
                                  {m}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Memo / Description */}
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Reference Memo / Description</label>
                            <input
                              type="text"
                              placeholder="e.g. CSR Desk Cash Deposit"
                              value={description}
                              onChange={(e) => setDescription(e.target.value)}
                              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 focus:border-indigo-500 rounded-xl outline-none font-bold text-xs"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          
                          {/* Search target accounts */}
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Search Target Account</label>
                              <span className="text-[9px] text-indigo-600 font-bold uppercase">All Bank Members</span>
                            </div>
                            
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input
                                type="text"
                                placeholder="Type Customer Name or ID..."
                                value={targetAccountSearch}
                                onChange={(e) => {
                                  setTargetAccountSearch(e.target.value);
                                  setTargetAccountRef(''); // Clear selection on search
                                }}
                                className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-100 focus:border-indigo-500 rounded-xl outline-none font-bold text-xs"
                              />
                            </div>

                            {/* Dropdown with results */}
                            <select
                              value={targetAccountRef}
                              onChange={(e) => setTargetAccountRef(e.target.value)}
                              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 focus:border-indigo-500 rounded-xl outline-none font-bold text-xs mt-1"
                            >
                              <option value="">-- Choose Recipient Account --</option>
                              {eligibleTransferTargets.map(acc => {
                                const owner = customers.find(c => c.id === acc.customerId);
                                return (
                                  <option key={acc.id} value={acc.id}>
                                    {owner ? owner.name : 'Unknown Owner'} - {acc.type} #{acc.id} (Ending in *{acc.id.slice(-4)})
                                  </option>
                                );
                              })}
                            </select>
                          </div>

                          {/* Memo / Description */}
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Transfer Note / Memo</label>
                            <input
                              type="text"
                              placeholder="e.g. Split bills / Reimbursement"
                              value={description}
                              onChange={(e) => setDescription(e.target.value)}
                              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 focus:border-indigo-500 rounded-xl outline-none font-bold text-xs h-[84px]"
                            />
                          </div>
                        </div>
                      )}

                      {/* Success / Error Messages */}
                      {error && (
                        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-700 text-xs font-bold">
                          <XCircle className="w-5 h-5 shrink-0" />
                          <span>{error}</span>
                        </div>
                      )}

                      {success && (
                        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 text-emerald-700 text-xs font-bold">
                          <CheckCircle className="w-5 h-5 shrink-0" />
                          <span>{success}</span>
                        </div>
                      )}

                      {/* Submit */}
                      <button
                        type="submit"
                        className={cn(
                          "w-full py-4 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-md transition-all hover:scale-[1.01] active:scale-[0.99]",
                          activeTab === 'deposit' ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100" :
                          activeTab === 'withdrawal' ? "bg-red-600 hover:bg-red-700 shadow-red-100" :
                          "bg-blue-600 hover:bg-blue-700 shadow-blue-100"
                        )}
                      >
                        {activeTab === 'deposit' ? 'Dispatch Deposit Credit' :
                         activeTab === 'withdrawal' ? 'Authorize Cash Withdrawal' :
                         'Execute Book Transfer'}
                      </button>

                    </form>
                  </div>

                </div>
              )}

            </div>
          ) : (
            /* Empty State */
            <div className="bg-white rounded-[2.5rem] border-2 border-dashed border-gray-200 p-20 text-center flex flex-col items-center justify-center space-y-4">
              <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mb-2">
                <Wallet className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-950">Select Bank Customer</h3>
                <p className="text-gray-400 text-xs font-medium max-w-sm mx-auto mt-1 leading-relaxed">
                  Search and choose any customer portfolio from the left search directory to begin flexible on-demand deposits, withdrawals, or inter-account cash transfers.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Printable Receipt Modal Overlay */}
      <AnimatePresence>
        {receiptTx && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setReceiptTx(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden"
              id="print-receipt-overlay"
            >
              <div className="p-8 bg-indigo-900 text-white text-center space-y-2">
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto text-white">
                  <Check className="w-6 h-6 stroke-[3px]" />
                </div>
                <h3 className="text-2xl font-black tracking-tight">Receipt Of Deposit/Withdrawal</h3>
                <p className="text-indigo-200 text-xs font-semibold">International Bank Of Aaravland</p>
              </div>

              <div className="p-8 space-y-6">
                
                {/* Visual Barcode Accent */}
                <div className="flex flex-col items-center justify-center space-y-1 border-b border-gray-100 pb-4">
                  <div className="font-mono text-[9px] tracking-[0.4em] text-gray-400">||||| ||| |||| || |||| ||||||</div>
                  <span className="text-[10px] font-mono font-bold text-gray-500 uppercase">TX REFERENCE: {receiptTx.id}</span>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between text-xs border-b border-gray-50 pb-2">
                    <span className="text-gray-400 font-bold uppercase">Customer Account</span>
                    <span className="text-gray-900 font-black">{receiptCustomerName}</span>
                  </div>

                  <div className="flex justify-between text-xs border-b border-gray-50 pb-2">
                    <span className="text-gray-400 font-bold uppercase">Account Type</span>
                    <span className="text-gray-900 font-black">{receiptAccountType} Account</span>
                  </div>

                  <div className="flex justify-between text-xs border-b border-gray-50 pb-2">
                    <span className="text-gray-400 font-bold uppercase">Account ID Reference</span>
                    <span className="text-gray-900 font-mono font-bold">{receiptTx.accountId}</span>
                  </div>

                  <div className="flex justify-between text-xs border-b border-gray-50 pb-2">
                    <span className="text-gray-400 font-bold uppercase">Transaction Type</span>
                    <span className={cn(
                      "font-black uppercase tracking-wider text-[10px]",
                      receiptTx.type === 'Deposit' ? "text-emerald-600" : "text-red-600"
                    )}>{receiptTx.type}</span>
                  </div>

                  <div className="flex justify-between text-xs border-b border-gray-50 pb-2">
                    <span className="text-gray-400 font-bold uppercase">Execution Timestamp</span>
                    <span className="text-gray-900 font-bold">{new Date(receiptTx.timestamp).toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between text-xs border-b border-gray-50 pb-2">
                    <span className="text-gray-400 font-bold uppercase">Memo Note</span>
                    <span className="text-gray-900 font-bold italic">"{receiptTx.description}"</span>
                  </div>

                  <div className="flex justify-between text-sm pt-2">
                    <span className="text-gray-500 font-extrabold uppercase">Net Posting Value</span>
                    <span className="text-xl font-black text-indigo-600 tabular-nums">
                      {formatCurrency(receiptTx.amount)}
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-2xl text-center text-[10px] text-gray-400 leading-relaxed font-semibold">
                  This transaction receipt represents a formal posting in the Aaravland Interbank cooperative ledger systems. All holdings are locally persistent and protected.
                </div>

                <div className="flex gap-3 no-print pt-2">
                  <button
                    onClick={() => setReceiptTx(null)}
                    className="flex-1 py-3.5 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-xl font-bold text-xs uppercase"
                  >
                    Dismiss Receipt
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs uppercase flex items-center justify-center gap-2 shadow-md shadow-indigo-100"
                  >
                    <Printer className="w-4 h-4" />
                    Print Copy
                  </button>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
