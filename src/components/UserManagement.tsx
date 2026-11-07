import React, { useState, useEffect } from 'react';
import { 
  Users, Shield, UserPlus, Search, MoreVertical, 
  Mail, Building, Briefcase, CheckCircle, XCircle,
  Plus, X, DollarSign, Activity, Edit2, Save
} from 'lucide-react';
import { storage, STORAGE_KEYS } from '../services/storageService';
import { UserProfile, UserRole, AuditLog, Account } from '../types';
import { cn, formatCurrency } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  'CSR': ['View Accounts', 'View Transactions', 'Create Customers'],
  'Loan Officer': ['View Loans', 'Approve Loans', 'View Customer Credit'],
  'Branch Manager': ['View Branch Budget', 'Manage Branch Staff', 'Approve Large Loans'],
  'Administrator': ['Full System Access', 'Manage All Users', 'View Bank Budget', 'System Config']
};

const ROLE_COLORS: Record<UserRole, string> = {
  'CSR': 'bg-blue-100 text-blue-700',
  'Loan Officer': 'bg-emerald-100 text-emerald-700',
  'Branch Manager': 'bg-purple-100 text-purple-700',
  'Administrator': 'bg-red-100 text-red-700'
};

export default function UserManagement() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    role: 'CSR' as UserRole,
    branch: 'Main',
    department: 'Operations',
    initialDeposit: 1000,
    salary: 5000
  });

  const currentUser = storage.getCurrentUser();

  useEffect(() => {
    const fetchData = () => {
      setUsers(storage.getUsers());
      setAuditLogs(storage.getAuditLogs().slice(-10).reverse());
      setLoading(false);
    };

    fetchData();
    window.addEventListener('storage-update', fetchData);
    return () => window.removeEventListener('storage-update', fetchData);
  }, []);

  const handleRoleChange = (uid: string, newRole: UserRole) => {
    const user = users.find(u => u.uid === uid);
    if (user && currentUser) {
      const updatedUser = { ...user, role: newRole };
      storage.updateUser(updatedUser);
      storage.logAction(
        currentUser.uid,
        currentUser.name,
        'Update Role',
        `Changed role of ${user.name} to ${newRole}`,
        'Medium'
      );
    }
  };

  const handleEditClick = (user: UserProfile) => {
    setEditingUser({ ...user });
    setIsEditModalOpen(true);
  };

  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser && currentUser) {
      storage.updateUser(editingUser);
      
      // Also update employee record if it exists
      const employees = storage.getEmployees();
      const empIndex = employees.findIndex(e => e.userId === editingUser.uid);
      if (empIndex > -1) {
        const updatedEmployee = {
          ...employees[empIndex],
          name: editingUser.name,
          position: editingUser.role,
          department: editingUser.department,
          branch: editingUser.branch
        };
        storage.updateEmployee(updatedEmployee);
      }

      storage.logAction(
        currentUser.uid,
        currentUser.name,
        'Update Staff',
        `Updated details for ${editingUser.name}`,
        'Medium'
      );
      setIsEditModalOpen(false);
      setEditingUser(null);
    }
  };

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const newUid = `user_${Date.now()}`;
    const newUser: UserProfile = {
      uid: newUid,
      name: newStaff.name,
      email: newStaff.email,
      role: newStaff.role,
      branch: newStaff.branch,
      department: newStaff.department
    };

    // Save user
    const allUsers = storage.getUsers();
    allUsers.push(newUser);
    storage.set('aaravland_bank_all_users', allUsers);

    // Create employee record
    const newEmployee = {
      id: `emp_${Date.now()}`,
      userId: newUid,
      name: newStaff.name,
      position: newStaff.role,
      department: newStaff.department,
      branch: newStaff.branch,
      productivityScore: 100,
      hiredAt: new Date().toISOString(),
      salary: newStaff.salary
    };
    storage.save(STORAGE_KEYS.EMPLOYEES, newEmployee);

    // Create personal bank account for employee
    const newAccount: Account = {
      id: `acc_emp_${Date.now()}`,
      customerId: newUid,
      type: 'Checking',
      balance: newStaff.initialDeposit,
      interestRate: 1.5, // Default staff interest rate
      currency: 'USD',
      status: 'Active',
      createdAt: new Date().toISOString()
    };
    storage.save(STORAGE_KEYS.ACCOUNTS, newAccount);

    // Log action
    storage.logAction(
      currentUser.uid,
      currentUser.name,
      'Add Staff',
      `Added new staff member ${newStaff.name} with ${newStaff.role} role`,
      'High'
    );

    setIsAddModalOpen(false);
    setNewStaff({
      name: '',
      email: '',
      role: 'Aarav Goyal',
      branch: 'Main',
      department: 'Operations',
      initialDeposit: 1000,
      salary: 5000
    });
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Staff & Governance</h1>
          <p className="text-gray-500 font-medium">Manage institutional access, roles, and audit trails</p>
        </div>
        {currentUser?.role === 'Administrator' && (
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-2xl hover:bg-black transition-all shadow-lg hover:shadow-xl font-bold"
          >
            <UserPlus className="w-5 h-5" />
            <span>Onboard New Staff</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Role Matrix & Audit Log */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-200 shadow-sm">
            <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              Access Matrix
            </h3>
            <div className="space-y-8">
              {(Object.keys(ROLE_PERMISSIONS) as UserRole[]).map((role) => (
                <div key={role} className="space-y-3">
                  <span className={cn("px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest", ROLE_COLORS[role])}>
                    {role}
                  </span>
                  <ul className="space-y-2">
                    {ROLE_PERMISSIONS[role].map((p, i) => (
                      <li key={i} className="text-xs font-medium text-gray-500 flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-gray-300" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Audit Log Feature */}
          <div className="bg-gray-900 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-blue-100">
            <h3 className="text-lg font-black mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-400" />
              System Audit Trail
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
                  <p className="text-xs font-bold text-gray-200">{log.details}</p>
                  <p className="text-[10px] font-medium text-gray-500">By {log.userName}</p>
                </div>
              ))}
              {auditLogs.length === 0 && (
                <p className="text-xs text-center text-gray-500 py-4 italic">No recent system activity</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Staff List */}
        <div className="lg:col-span-8 space-y-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search institutional staff..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-3xl focus:ring-2 focus:ring-blue-500 transition-all shadow-sm font-medium"
            />
          </div>

          <div className="bg-white rounded-[2.5rem] border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Staff Member</th>
                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Clearance Level</th>
                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Branch & Dept</th>
                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map((user) => (
                    <tr key={user.uid} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center font-black text-blue-600 text-lg shadow-sm">
                            {user.name[0]}
                          </div>
                          <div>
                            <p className="font-black text-gray-900 tracking-tight">{user.name}</p>
                            <p className="text-xs font-medium text-gray-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <select 
                          value={user.role}
                          disabled={currentUser?.role !== 'Administrator'}
                          onChange={(e) => handleRoleChange(user.uid, e.target.value as UserRole)}
                          className={cn(
                            "text-[10px] font-black px-4 py-2 rounded-xl border-none focus:ring-2 focus:ring-blue-500 cursor-pointer uppercase tracking-widest", 
                            ROLE_COLORS[user.role],
                            currentUser?.role !== 'Administrator' && "opacity-80 cursor-not-allowed"
                          )}
                        >
                          <option value="CSR">CSR</option>
                          <option value="Loan Officer">Loan Officer</option>
                          <option value="Branch Manager">Branch Manager</option>
                          <option value="Administrator">Administrator</option>
                        </select>
                      </td>
                      <td className="px-8 py-6">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                            <Building className="w-3.5 h-3.5 text-gray-400" />
                            {user.branch}
                          </div>
                          <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                            <Briefcase className="w-3.5 h-3.5 text-gray-300" />
                            {user.department}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          {currentUser?.role === 'Administrator' && (
                            <button 
                              onClick={() => handleEditClick(user)}
                              className="p-2 hover:bg-blue-50 text-blue-600 rounded-xl transition-colors"
                              title="Edit Staff Details"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                            <MoreVertical className="w-4 h-4 text-gray-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Onboarding Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 bg-gray-900 text-white flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black tracking-tight">Staff Onboarding</h2>
                  <p className="text-gray-400 text-sm font-medium">Register new institutional member</p>
                </div>
                <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleAddStaff} className="p-10 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Full Name</label>
                    <input 
                      required
                      type="text" 
                      value={newStaff.name}
                      onChange={(e) => setNewStaff({...newStaff, name: e.target.value})}
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                      placeholder="e.g. John Smith"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email Address</label>
                    <input 
                      required
                      type="email" 
                      value={newStaff.email}
                      onChange={(e) => setNewStaff({...newStaff, email: e.target.value})}
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                      placeholder="john@aaravlandbank.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Assigned Role</label>
                    <select 
                      value={newStaff.role}
                      onChange={(e) => setNewStaff({...newStaff, role: e.target.value as UserRole})}
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold appearance-none"
                    >
                      <option value="CSR">CSR</option>
                      <option value="Loan Officer">Loan Officer</option>
                      <option value="Branch Manager">Branch Manager</option>
                      <option value="Administrator">Administrator</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Initial Account Deposit</label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input 
                        type="number" 
                        value={newStaff.initialDeposit}
                        onChange={(e) => setNewStaff({...newStaff, initialDeposit: Number(e.target.value)})}
                        className="w-full pl-10 pr-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Branch</label>
                    <input 
                      type="text" 
                      value={newStaff.branch}
                      onChange={(e) => setNewStaff({...newStaff, branch: e.target.value})}
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Department</label>
                    <input 
                      type="text" 
                      value={newStaff.department}
                      onChange={(e) => setNewStaff({...newStaff, department: e.target.value})}
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                    />
                  </div>
                </div>

                <div className="pt-6">
                  <button 
                    type="submit"
                    className="w-full py-5 bg-blue-600 text-white rounded-3xl font-black text-lg shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-[0.98]"
                  >
                    Complete Onboarding
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Staff Modal */}
      <AnimatePresence>
        {isEditModalOpen && editingUser && (
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
              className="relative bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 bg-blue-600 text-white flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black tracking-tight">Edit Staff Member</h2>
                  <p className="text-blue-100 text-sm font-medium">Update institutional access and profile</p>
                </div>
                <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleUpdateUser} className="p-10 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Full Name</label>
                    <input 
                      required
                      type="text" 
                      value={editingUser.name}
                      onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email Address</label>
                    <input 
                      required
                      type="email" 
                      value={editingUser.email}
                      onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Role</label>
                    <select 
                      value={editingUser.role}
                      onChange={(e) => setEditingUser({...editingUser, role: e.target.value as UserRole})}
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold appearance-none"
                    >
                      <option value="CSR">CSR</option>
                      <option value="Loan Officer">Loan Officer</option>
                      <option value="Branch Manager">Branch Manager</option>
                      <option value="Administrator">Administrator</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Branch</label>
                    <input 
                      required
                      type="text" 
                      value={editingUser.branch}
                      onChange={(e) => setEditingUser({...editingUser, branch: e.target.value})}
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Department</label>
                  <input 
                    required
                    type="text" 
                    value={editingUser.department}
                    onChange={(e) => setEditingUser({...editingUser, department: e.target.value})}
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                  />
                </div>

                <div className="pt-6">
                  <button 
                    type="submit"
                    className="w-full py-5 bg-blue-600 text-white rounded-3xl font-black text-lg shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    Save Staff Changes
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
