import React, { useState, useEffect } from 'react';
import { UserProfile, UserRole } from './types';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import CustomerManagement from './components/CustomerManagement';
import LoanManagement from './components/LoanManagement';
import FixedDepositManagement from './components/FixedDepositManagement';
import FlexibleTransactions from './components/FlexibleTransactions';
import CreditCardManagement from './components/CreditCardManagement';
import SupportManagement from './components/SupportManagement';
import StockMarket from './components/StockMarket';
import UserManagement from './components/UserManagement';
import CurrencyExchange from './components/CurrencyExchange';
import PersonalBanking from './components/PersonalBanking';
import TransactionLedger from './components/TransactionLedger';
import AdminDashboard from './components/AdminDashboard';
import { Landmark, ShieldCheck, ArrowRight, Loader2, User, Key, Briefcase, Landmark as BankIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { storage } from './services/storageService';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize local storage with mock data if empty
    storage.init();
    
    // Check for existing session
    const currentUser = storage.getCurrentUser();
    setUser(currentUser);
    setLoading(false);

    // Listen for storage updates (e.g., logout from other tabs or components)
    const handleStorageUpdate = () => {
      setUser(storage.getCurrentUser());
    };
    window.addEventListener('storage-update', handleStorageUpdate);
    return () => window.removeEventListener('storage-update', handleStorageUpdate);
  }, []);

  const handleLogin = (role: UserRole) => {
    const mockUser: UserProfile = {
      uid: role === 'Administrator' ? 'admin_1' : role === 'Loan Officer' ? 'staff_1' : role === 'Branch Manager' ? 'manager_1' : 'csr_1',
      email: `${role.toLowerCase().replace(' ', '_')}@aaravlandbank.com`,
      name: role,
      role: role,
      branch: 'Main',
      department: role === 'Administrator' ? 'Management' : role === 'Loan Officer' ? 'Lending' : role === 'Branch Manager' ? 'Operations' : 'Customer Service'
    };
    
    storage.setCurrentUser(mockUser);
    setUser(mockUser);
  };

  const handleLogout = () => {
    storage.setCurrentUser(null);
    setUser(null);
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Initializing Secure Banking Environment...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50 p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-blue-100 border border-gray-100 text-center space-y-8"
        >
          <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-blue-200">
            <Landmark className="w-10 h-10 text-white" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">International Bank of Aaravland</h1>
            <p className="text-gray-500">Enterprise-grade institutional management system</p>
          </div>

          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-1 gap-3">
              <button 
                onClick={() => handleLogin('Administrator')}
                className="w-full flex items-center justify-center gap-3 py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all hover:shadow-xl group"
              >
                <ShieldCheck className="w-5 h-5 text-blue-400" />
                Login as Administrator
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={() => handleLogin('CSR')}
                className="w-full flex items-center justify-center gap-3 py-4 bg-white border-2 border-gray-100 text-gray-700 rounded-2xl font-bold hover:bg-gray-50 transition-all hover:shadow-lg group"
              >
                <User className="w-5 h-5 text-gray-400" />
                Login as Customer Service (CSR)
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={() => handleLogin('Loan Officer')}
                className="w-full flex items-center justify-center gap-3 py-4 bg-white border-2 border-gray-100 text-gray-700 rounded-2xl font-bold hover:bg-gray-50 transition-all hover:shadow-lg group"
              >
                <Briefcase className="w-5 h-5 text-emerald-400" />
                Login as Loan Officer
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={() => handleLogin('Branch Manager')}
                className="w-full flex items-center justify-center gap-3 py-4 bg-white border-2 border-gray-100 text-gray-700 rounded-2xl font-bold hover:bg-gray-50 transition-all hover:shadow-lg group"
              >
                <BankIcon className="w-5 h-5 text-purple-400" />
                Login as Branch Manager
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
            
            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest flex items-center justify-center gap-2">
              <Key className="w-3 h-3" />
              Local Storage Persistent Session
            </p>
          </div>

          <div className="pt-8 border-t border-gray-50 grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900">99.9%</p>
              <p className="text-[8px] text-gray-400 uppercase font-bold">Uptime</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900">Tier 4</p>
              <p className="text-[8px] text-gray-400 uppercase font-bold">Data Center</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900">PCI</p>
              <p className="text-[8px] text-gray-400 uppercase font-bold">Compliant</p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'personal': return <PersonalBanking />;
      case 'customers': return <CustomerManagement />;
      case 'loans': return <LoanManagement />;
      case 'fds': return <FixedDepositManagement />;
      case 'flexible_tx': return <FlexibleTransactions />;
      case 'cards': return <CreditCardManagement />;
      case 'support': return <SupportManagement />;
      case 'stocks': return <StockMarket />;
      case 'exchange': return <CurrencyExchange />;
      case 'transactions': return <TransactionLedger />;
      case 'users': return <UserManagement />;
      case 'admin': return <AdminDashboard />;
      default: return <Dashboard />;
    }
  };

  return (
    <Layout user={user} activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout}>
      {renderContent()}
    </Layout>
  );
}
