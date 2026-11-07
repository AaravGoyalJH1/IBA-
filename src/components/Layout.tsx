import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, Landmark, Briefcase, 
  TrendingUp, Shield, LogOut, Menu, X, Bell,
  Search, ChevronRight, PieChart, DollarSign,
  ArrowRightLeft, Check, Clock, History,
  Lock, CreditCard, MessageSquare
} from 'lucide-react';
import { UserProfile, Notification } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { storage } from '../services/storageService';

interface LayoutProps {
  children: React.ReactNode;
  user: UserProfile | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
}

const MENU_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Administrator', 'Branch Manager', 'Loan Officer', 'CSR'] },
  { id: 'personal', label: 'Personal Banking', icon: DollarSign, roles: ['Administrator', 'Branch Manager', 'Loan Officer', 'CSR'] },
  { id: 'customers', label: 'Customers', icon: Users, roles: ['Administrator', 'Branch Manager', 'CSR'] },
  { id: 'loans', label: 'Loans', icon: Briefcase, roles: ['Administrator', 'Branch Manager', 'Loan Officer', 'CSR'] },
  { id: 'fds', label: 'Fixed Deposits', icon: Lock, roles: ['Administrator', 'Branch Manager', 'Loan Officer', 'CSR'] },
  { id: 'flexible_tx', label: 'Flexible Transactions', icon: ArrowRightLeft, roles: ['Administrator', 'Branch Manager', 'Loan Officer', 'CSR'] },
  { id: 'cards', label: 'Credit Cards', icon: CreditCard, roles: ['Administrator', 'Branch Manager', 'Loan Officer', 'CSR'] },
  { id: 'support', label: 'Support', icon: MessageSquare, roles: ['Administrator', 'Branch Manager', 'CSR'] },
  { id: 'transactions', label: 'Transactions', icon: History, roles: ['Administrator', 'Branch Manager', 'Loan Officer', 'CSR'] },
  { id: 'stocks', label: 'Stock Market', icon: TrendingUp, roles: ['Administrator', 'Branch Manager', 'Loan Officer', 'CSR'] },
  { id: 'exchange', label: 'Exchange', icon: ArrowRightLeft, roles: ['Administrator', 'Branch Manager', 'Loan Officer', 'CSR'] },
  { id: 'users', label: 'Staff Management', icon: Shield, roles: ['Administrator', 'Branch Manager'] },
  { id: 'admin', label: 'Bank Management', icon: PieChart, roles: ['Administrator', 'Branch Manager'] },
];

export default function Layout({ children, user, activeTab, setActiveTab, onLogout }: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (user) {
      const fetchNotifications = () => {
        setNotifications(storage.getNotifications(user.uid).reverse());
      };
      fetchNotifications();
      window.addEventListener('storage-update', fetchNotifications);
      return () => window.removeEventListener('storage-update', fetchNotifications);
    }
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = (id: string) => {
    storage.markNotificationAsRead(id);
  };

  const handleRankInterchange = (role: string) => {
    const mockUser: UserProfile = {
      uid: role === 'Administrator' ? 'admin_1' : role === 'Loan Officer' ? 'staff_1' : role === 'Branch Manager' ? 'manager_1' : 'csr_1',
      email: `${role.toLowerCase().replace(' ', '_')}@aaravlandbank.com`,
      name: role,
      role: role as any,
      branch: 'Main',
      department: role === 'Administrator' ? 'Management' : role === 'Loan Officer' ? 'Lending' : role === 'Branch Manager' ? 'Operations' : 'Customer Service'
    };
    
    // Check if new role has access to current tab
    const selectedMenuItem = MENU_ITEMS.find(item => item.id === activeTab);
    if (selectedMenuItem && !selectedMenuItem.roles.includes(role)) {
      setActiveTab('dashboard');
    }
    
    storage.setCurrentUser(mockUser);
  };

  const filteredMenu = MENU_ITEMS.filter(item => 
    user && item.roles.includes(user.role)
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-72 bg-white border-r border-gray-200">
        <div className="p-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
              <Landmark className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">AARAVLAND</h1>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {filteredMenu.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-200 group",
                activeTab === item.id 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-100" 
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <item.icon className={cn("w-5 h-5", activeTab === item.id ? "text-white" : "text-gray-400 group-hover:text-gray-900")} />
              {item.label}
              {activeTab === item.id && (
                <motion.div layoutId="active-pill" className="ml-auto">
                  <ChevronRight className="w-4 h-4" />
                </motion.div>
              )}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-gray-100">
          <div className="bg-gray-50 p-4 rounded-2xl flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600">
              {user?.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">{user?.name}</p>
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">{user?.role}</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-3 text-sm font-bold text-red-500 hover:bg-red-50 rounded-2xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 z-10">
          <div className="flex items-center gap-4 lg:hidden">
            <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 hover:bg-gray-100 rounded-xl">
              <Menu className="w-6 h-6 text-gray-600" />
            </button>
            <Landmark className="w-8 h-8 text-blue-600" />
          </div>

          <div className="hidden md:flex items-center gap-3 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search anything..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Quick Rank Interchange Selector */}
            <div className="relative">
              <div className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border border-blue-200 rounded-2xl transition-all shadow-sm">
                <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider">Interchange Rank:</span>
                <select
                  value={user?.role}
                  onChange={(e) => handleRankInterchange(e.target.value)}
                  className="bg-transparent text-xs font-black text-gray-800 outline-none border-none cursor-pointer uppercase tracking-wider pr-1"
                >
                  <option value="Administrator">Administrator</option>
                  <option value="Branch Manager">Branch Manager</option>
                  <option value="Loan Officer">Loan Officer</option>
                  <option value="CSR">CSR</option>
                </select>
              </div>
            </div>

            <div className="relative">
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="relative p-2 hover:bg-gray-50 rounded-xl transition-colors"
              >
                <Bell className="w-5 h-5 text-gray-500" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                )}
              </button>

              <AnimatePresence>
                {isNotificationsOpen && (
                  <>
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setIsNotificationsOpen(false)}
                      className="fixed inset-0 z-20"
                    />
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-80 bg-white rounded-[2rem] shadow-2xl border border-gray-100 z-30 overflow-hidden"
                    >
                      <div className="p-6 bg-gray-900 text-white flex items-center justify-between">
                        <h3 className="font-black text-sm uppercase tracking-widest">Notifications</h3>
                        <span className="px-2 py-0.5 bg-blue-500 text-[10px] font-black rounded-md">{unreadCount} New</span>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length > 0 ? (
                          notifications.map((n) => (
                            <div 
                              key={n.id} 
                              onClick={() => handleMarkAsRead(n.id)}
                              className={cn(
                                "p-6 border-b border-gray-50 cursor-pointer transition-colors hover:bg-gray-50",
                                !n.read && "bg-blue-50/30"
                              )}
                            >
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <p className="text-xs font-black text-gray-900">{n.title}</p>
                                {!n.read && <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-1 shrink-0" />}
                              </div>
                              <p className="text-[11px] font-medium text-gray-500 leading-relaxed mb-2">{n.message}</p>
                              <div className="flex items-center gap-2 text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                                <Clock className="w-3 h-3" />
                                {new Date(n.timestamp).toLocaleTimeString()}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-10 text-center">
                            <Bell className="w-10 h-10 text-gray-100 mx-auto mb-4" />
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">All caught up!</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            <div className="h-8 w-px bg-gray-100 mx-2"></div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-gray-900">{user?.branch} Branch</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Operational</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} alt="avatar" />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              className="fixed inset-y-0 left-0 w-72 bg-white z-50 lg:hidden flex flex-col"
            >
              <div className="p-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Landmark className="w-8 h-8 text-blue-600" />
                  <h1 className="text-xl font-black text-gray-900">AARAVLAND</h1>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl">
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>
              <nav className="flex-1 px-4 space-y-1">
                {filteredMenu.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all",
                      activeTab === item.id ? "bg-blue-600 text-white" : "text-gray-500"
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </button>
                ))}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
