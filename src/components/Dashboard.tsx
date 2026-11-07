import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Users, Landmark, Briefcase, 
  AlertCircle, DollarSign, PieChart as PieIcon, Filter, Calendar
} from 'lucide-react';
import { formatCurrency, formatPercent } from '../lib/utils';
import { storage } from '../services/storageService';
import { Account, Loan, Customer, Employee, BankBudget } from '../types';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function Dashboard() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [budget, setBudget] = useState<BankBudget[]>([]);
  const [dateRange, setDateRange] = useState('30d');
  const [branchFilter, setBranchFilter] = useState('All');

  useEffect(() => {
    // Initial fetch
    setAccounts(storage.getAccounts());
    setLoans(storage.getLoans());
    setCustomers(storage.getCustomers());
    setEmployees(storage.getEmployees());
    setBudget(storage.getBudget());

    // Listen for storage updates
    const handleStorageUpdate = () => {
      setAccounts(storage.getAccounts());
      setLoans(storage.getLoans());
      setCustomers(storage.getCustomers());
      setEmployees(storage.getEmployees());
      setBudget(storage.getBudget());
    };

    window.addEventListener('storage-update', handleStorageUpdate);
    return () => window.removeEventListener('storage-update', handleStorageUpdate);
  }, []);

  const totalDeposits = accounts.reduce((acc, curr) => acc + curr.balance, 0);
  const totalLoans = loans.reduce((acc, curr) => acc + curr.amount, 0);
  const defaultedLoans = loans.filter(l => l.status === 'Defaulted').length;
  const defaultRate = loans.length > 0 ? defaultedLoans / loans.length : 0;
  const avgProductivity = employees.length > 0 
    ? employees.reduce((acc, curr) => acc + curr.productivityScore, 0) / employees.length 
    : 0;

  const depositData = [
    { name: 'Savings', value: accounts.filter(a => a.type === 'Savings').reduce((acc, curr) => acc + curr.balance, 0) },
    { name: 'Checking', value: accounts.filter(a => a.type === 'Checking').reduce((acc, curr) => acc + curr.balance, 0) },
    { name: 'Business', value: accounts.filter(a => a.type === 'Business').reduce((acc, curr) => acc + curr.balance, 0) },
  ];

  const loanStatusData = [
    { name: 'Approved', value: loans.filter(l => l.status === 'Approved').length },
    { name: 'Pending', value: loans.filter(l => l.status === 'Pending').length },
    { name: 'Defaulted', value: loans.filter(l => l.status === 'Defaulted').length },
    { name: 'Paid', value: loans.filter(l => l.status === 'Paid').length },
  ];

  const kpis = [
    { label: 'Total Deposits', value: formatCurrency(totalDeposits), icon: Landmark, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Total Loans', value: formatCurrency(totalLoans), icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Default Rate', value: formatPercent(defaultRate), icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Customers', value: customers.length, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Avg Productivity', value: `${avgProductivity.toFixed(1)}%`, icon: Briefcase, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Executive Dashboard</h1>
          <p className="text-gray-500">Real-time banking performance metrics</p>
        </div>
        
        <div className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 px-3 py-1.5 border-r border-gray-200">
            <Calendar className="w-4 h-4 text-gray-400" />
            <select 
              value={dateRange} 
              onChange={(e) => setDateRange(e.target.value)}
              className="text-sm font-medium bg-transparent border-none focus:ring-0 cursor-pointer"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="1y">Last Year</option>
            </select>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5">
            <Filter className="w-4 h-4 text-gray-400" />
            <select 
              value={branchFilter} 
              onChange={(e) => setBranchFilter(e.target.value)}
              className="text-sm font-medium bg-transparent border-none focus:ring-0 cursor-pointer"
            >
              <option value="All">All Branches</option>
              <option value="Main">Main Office</option>
              <option value="North">North Branch</option>
              <option value="South">South Branch</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className={`p-3 rounded-xl ${kpi.bg}`}>
              <kpi.icon className={`w-6 h-6 ${kpi.color}`} />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{kpi.label}</p>
              <p className="text-xl font-bold text-gray-900">{kpi.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deposit Distribution */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Deposit Distribution</h3>
            <PieIcon className="w-5 h-5 text-gray-400" />
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={depositData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {depositData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            {depositData.map((d, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                <span className="text-sm text-gray-600">{d.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Loan Status */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Loan Portfolio Status</h3>
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={loanStatusData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <Tooltip cursor={{ fill: '#f9fafb' }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {loanStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Productivity & Budget */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Employee Productivity Trends</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={employees.map((e, i) => ({ name: e.name, score: e.productivityScore }))}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" hide />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Area type="monotone" dataKey="score" stroke="#8884d8" fillOpacity={1} fill="url(#colorScore)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Budget vs Actual</h3>
          <div className="space-y-6">
            {budget.map((b, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-700">{b.category}</span>
                  <span className="text-gray-500">{formatCurrency(b.spent)} / {formatCurrency(b.allocated)}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${b.spent > b.allocated ? 'bg-red-500' : 'bg-blue-500'}`}
                    style={{ width: `${Math.min((b.spent / b.allocated) * 100, 100)}%` }}
                  />
                </div>
              </div>
            ))}
            {budget.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <Landmark className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p>No budget data available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
