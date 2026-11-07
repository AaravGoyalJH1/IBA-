import React, { useState, useEffect } from 'react';
import { 
  DollarSign, TrendingUp, Users, Building, 
  PieChart as PieChartIcon, ArrowUpRight, ArrowDownRight, 
  Activity, Shield, Briefcase, CreditCard,
  Save, Edit2, CheckCircle, XCircle, AlertCircle,
  BarChart3, LineChart, Wallet
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, Tooltip, 
  AreaChart, Area, CartesianGrid 
} from 'recharts';
import { storage, STORAGE_KEYS } from '../services/storageService';
import { BankBudget, Employee, BankCapital, AuditLog, Loan } from '../types';
import { cn, formatCurrency } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminDashboard() {
  const [capital, setCapital] = useState<BankCapital | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [budgets, setBudgets] = useState<BankBudget[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isEditingCapital, setIsEditingCapital] = useState(false);
  const [editCapitalData, setEditCapitalData] = useState({ totalAssets: 0, liquidCash: 0 });
  const [editingSalaryId, setEditingSalaryId] = useState<string | null>(null);
  const [newSalary, setNewSalary] = useState(0);

  const currentUser = storage.getCurrentUser();

  useEffect(() => {
    const fetchData = () => {
      setCapital(storage.getCapital());
      setEmployees(storage.getEmployees());
      setBudgets(storage.getBudget());
      setLoans(storage.getLoans());
      setAuditLogs(storage.getAuditLogs().slice(-10).reverse());
    };

    fetchData();
    window.addEventListener('storage-update', fetchData);
    return () => window.removeEventListener('storage-update', fetchData);
  }, []);

  const handleUpdateCapital = () => {
    if (!capital || !currentUser) return;
    storage.updateCapital({
      ...capital,
      totalAssets: editCapitalData.totalAssets,
      liquidCash: editCapitalData.liquidCash
    });
    storage.logAction(
      currentUser.uid,
      currentUser.name,
      'Update Capital',
      `Manual adjustment of bank capital: Assets to ${editCapitalData.totalAssets}, Cash to ${editCapitalData.liquidCash}`,
      'High'
    );
    setIsEditingCapital(false);
  };

  const handleUpdateSalary = (empId: string) => {
    const emp = employees.find(e => e.id === empId);
    if (!emp || !currentUser) return;
    
    const updatedEmp = { ...emp, salary: newSalary };
    storage.updateEmployee(updatedEmp);
    storage.logAction(
      currentUser.uid,
      currentUser.name,
      'Update Salary',
      `Adjusted salary for ${emp.name} to ${newSalary}`,
      'Medium'
    );
    setEditingSalaryId(null);
  };

  const handlePaySalary = (empId: string) => {
    try {
      storage.paySalary(empId);
      // Success notification would be nice here
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleProcessInterest = () => {
    const accounts = storage.getAccounts();
    let totalInterest = 0;
    let processedCount = 0;

    accounts.forEach(acc => {
      if (acc.interestRate > 0 && acc.status === 'Active') {
        const interest = storage.applyInterest(acc.id);
        if (interest) {
          totalInterest += interest;
          processedCount++;
        }
      }
    });

    if (processedCount > 0) {
      storage.logAction(
        currentUser!.uid,
        currentUser!.name,
        'Interest Processing',
        `Processed monthly interest for ${processedCount} accounts. Total disbursed: ${formatCurrency(totalInterest)}`,
        'Medium'
      );
      alert(`Successfully processed interest for ${processedCount} accounts.\nTotal Interest Disbursed: ${formatCurrency(totalInterest)}`);
    } else {
      alert('No active accounts with positive interest rates found.');
    }
  };

  if (!capital) return null;

  const riskData = [
    { name: 'Low', value: loans.filter(l => l.riskLevel === 'Low').length, color: '#10b981' },
    { name: 'Medium', value: loans.filter(l => l.riskLevel === 'Medium').length, color: '#f59e0b' },
    { name: 'High', value: loans.filter(l => l.riskLevel === 'High').length, color: '#ef4444' },
    { name: 'Critical', value: loans.filter(l => l.riskLevel === 'Critical').length, color: '#7f1d1d' },
  ].filter(d => d.value > 0);

  const budgetData = budgets.map(b => ({
    name: b.category,
    allocated: b.allocated,
    spent: b.spent
  }));

  const revenueData = [
    { month: 'Jan', revenue: 450000, expenses: 320000 },
    { month: 'Feb', revenue: 520000, expenses: 340000 },
    { month: 'Mar', revenue: 480000, expenses: 310000 },
    { month: 'Apr', revenue: 610000, expenses: 380000 },
    { month: 'May', revenue: 590000, expenses: 360000 },
    { month: 'Jun', revenue: 680000, expenses: 410000 },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Institutional Management</h1>
          <p className="text-gray-500 font-medium">Global oversight of bank capital, payroll, and operations</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-widest">System Online</span>
          </div>
        </div>
      </div>

      {/* Top Stats: Institutional Capital */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-blue-500/20 transition-all" />
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="p-3 bg-white/10 rounded-2xl">
                <Building className="w-6 h-6 text-blue-400" />
              </div>
              {currentUser?.role === 'Administrator' && (
                <button 
                  onClick={() => {
                    setEditCapitalData({ totalAssets: capital.totalAssets, liquidCash: capital.liquidCash });
                    setIsEditingCapital(true);
                  }}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                >
                  <Edit2 className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Assets</p>
              <h2 className="text-3xl font-black tracking-tight">{formatCurrency(capital.totalAssets)}</h2>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-200 shadow-sm relative overflow-hidden group">
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="p-3 bg-emerald-50 rounded-2xl">
                <Wallet className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Liquid Reserves</p>
              <h2 className="text-3xl font-black text-gray-900 tracking-tight">{formatCurrency(capital.liquidCash)}</h2>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-200 shadow-sm relative overflow-hidden group">
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="p-3 bg-purple-50 rounded-2xl">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Monthly Payroll</p>
              <h2 className="text-3xl font-black text-gray-900 tracking-tight">
                {formatCurrency(employees.reduce((acc, emp) => acc + emp.salary, 0))}
              </h2>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-200 shadow-sm relative overflow-hidden group">
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="p-3 bg-amber-50 rounded-2xl">
                <Shield className="w-6 h-6 text-amber-600" />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Compliance Rate</p>
              <h2 className="text-3xl font-black text-gray-900 tracking-tight">94.2%</h2>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black text-gray-900 tracking-tight">Revenue vs Operating Expenses</h3>
              <p className="text-sm font-medium text-gray-500">H1 2024 Performance Overview</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-600" />
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Revenue</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-300" />
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Expenses</span>
              </div>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#9ca3af' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#9ca3af' }}
                  tickFormatter={(value) => `$${value/1000}k`}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 700 }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="expenses" stroke="#d1d5db" strokeWidth={3} fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-200 shadow-sm">
          <h3 className="text-xl font-black text-gray-900 tracking-tight mb-8">Loan Risk Distribution</h3>
          <div className="h-64 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {riskData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-gray-900">{loans.length}</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Loans</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            {riskData.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{item.name}</span>
                <span className="text-xs font-black text-gray-900 ml-auto">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Payroll Management */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-gray-900 tracking-tight">Payroll & Salary Management</h3>
                <p className="text-sm font-medium text-gray-500">Manage employee compensation and disbursements</p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-xs font-black uppercase tracking-widest">
                <CreditCard className="w-4 h-4" />
                Monthly Cycle
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Employee</th>
                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Position</th>
                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Monthly Salary</th>
                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Last Paid</th>
                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {employees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center font-black text-gray-500">
                            {emp.name[0]}
                          </div>
                          <p className="font-black text-gray-900 tracking-tight">{emp.name}</p>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
                          {emp.position}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        {editingSalaryId === emp.id ? (
                          <div className="flex items-center gap-2">
                            <input 
                              type="number" 
                              value={newSalary}
                              onChange={(e) => setNewSalary(Number(e.target.value))}
                              className="w-24 px-2 py-1 border border-blue-200 rounded-lg font-bold text-sm"
                            />
                            <button onClick={() => handleUpdateSalary(emp.id)} className="text-emerald-600 hover:text-emerald-700">
                              <Save className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 group">
                            <span className="font-bold text-gray-900">{formatCurrency(emp.salary)}</span>
                            {currentUser?.role === 'Administrator' && (
                              <button 
                                onClick={() => {
                                  setEditingSalaryId(emp.id);
                                  setNewSalary(emp.salary);
                                }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded"
                              >
                                <Edit2 className="w-3 h-3 text-gray-400" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-xs font-medium text-gray-500">
                          {emp.lastPaidAt ? new Date(emp.lastPaidAt).toLocaleDateString() : 'Never'}
                        </p>
                      </td>
                      <td className="px-8 py-6">
                        <button 
                          onClick={() => handlePaySalary(emp.id)}
                          className="px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-md hover:shadow-lg active:scale-95"
                        >
                          Pay Salary
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Audit & Budget Summary */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-200 shadow-sm">
            <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-blue-600" />
              Budget Allocation
            </h3>
            <div className="space-y-6">
              {budgets.map((budget) => (
                <div key={budget.id} className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-gray-600">{budget.category}</span>
                    <span className="text-gray-900">{((budget.spent / budget.allocated) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full rounded-full transition-all duration-1000",
                        (budget.spent / budget.allocated) > 0.9 ? "bg-red-500" : "bg-blue-600"
                      )}
                      style={{ width: `${(budget.spent / budget.allocated) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-medium text-gray-400">
                    <span>Spent: {formatCurrency(budget.spent)}</span>
                    <span>Total: {formatCurrency(budget.allocated)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-900 p-8 rounded-[2.5rem] text-white shadow-xl">
            <h3 className="text-lg font-black mb-6 flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-400" />
              Security Audit
            </h3>
            <div className="space-y-6">
              {auditLogs.map((log) => (
                <div key={log.id} className="relative pl-6 border-l border-white/10 space-y-1">
                  <div className={cn(
                    "absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-gray-900",
                    log.severity === 'High' ? 'bg-red-500' : log.severity === 'Medium' ? 'bg-yellow-500' : 'bg-blue-500'
                  )} />
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">{log.action}</p>
                    <p className="text-[8px] font-bold text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</p>
                  </div>
                  <p className="text-xs font-bold text-gray-200 line-clamp-1">{log.details}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Capital Modal */}
      <AnimatePresence>
        {isEditingCapital && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditingCapital(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 bg-gray-900 text-white flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black tracking-tight">Adjust Capital</h2>
                  <p className="text-gray-400 text-sm font-medium">Manual institutional balance override</p>
                </div>
                <button onClick={() => setIsEditingCapital(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="p-10 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Assets</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="number" 
                      value={editCapitalData.totalAssets}
                      onChange={(e) => setEditCapitalData({...editCapitalData, totalAssets: Number(e.target.value)})}
                      className="w-full pl-10 pr-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Liquid Cash Reserves</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="number" 
                      value={editCapitalData.liquidCash}
                      onChange={(e) => setEditCapitalData({...editCapitalData, liquidCash: Number(e.target.value)})}
                      className="w-full pl-10 pr-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                  <p className="text-[10px] font-bold text-amber-700 leading-relaxed">
                    WARNING: Manual capital adjustments are high-severity events and will be logged for regulatory audit.
                  </p>
                </div>

                <button 
                  onClick={handleUpdateCapital}
                  className="w-full py-5 bg-blue-600 text-white rounded-3xl font-black text-lg shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-[0.98]"
                >
                  Confirm Adjustment
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
