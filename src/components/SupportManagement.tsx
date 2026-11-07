import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, Plus, Search, Filter, 
  MoreVertical, CheckCircle, Clock, AlertCircle,
  User, Tag, Flag, Send, ChevronRight
} from 'lucide-react';
import { storage } from '../services/storageService';
import { SupportTicket, Customer } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function SupportManagement() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [isAddingTicket, setIsAddingTicket] = useState(false);
  const [newTicket, setNewTicket] = useState({
    customerId: '',
    subject: '',
    message: '',
    category: 'Account' as SupportTicket['category'],
    priority: 'Medium' as SupportTicket['priority']
  });

  const currentUser = storage.getCurrentUser();

  useEffect(() => {
    const fetchData = () => {
      setTickets(storage.getSupportTickets());
      setCustomers(storage.getCustomers());
      setLoading(false);
    };

    fetchData();
    window.addEventListener('storage-update', fetchData);
    return () => window.removeEventListener('storage-update', fetchData);
  }, []);

  const handleAddTicket = () => {
    if (!newTicket.customerId || !newTicket.subject || !newTicket.message) {
      alert('Please fill in all required fields.');
      return;
    }

    const ticket: SupportTicket = {
      id: `t_${Date.now()}`,
      customerId: newTicket.customerId,
      subject: newTicket.subject,
      message: newTicket.message,
      category: newTicket.category,
      priority: newTicket.priority,
      status: 'Open',
      createdAt: new Date().toISOString()
    };

    storage.updateSupportTicket(ticket);
    
    storage.logAction(
      currentUser!.uid,
      currentUser!.name,
      'Create Support Ticket',
      `Created ticket for customer ${newTicket.customerId}: ${newTicket.subject}`,
      'Low'
    );

    setIsAddingTicket(false);
    setNewTicket({ customerId: '', subject: '', message: '', category: 'Account', priority: 'Medium' });
  };

  const handleUpdateStatus = (ticket: SupportTicket, status: SupportTicket['status']) => {
    const updatedTicket = { ...ticket, status };
    storage.updateSupportTicket(updatedTicket);
    setSelectedTicket(updatedTicket);
  };

  const getCustomerName = (id: string) => {
    return customers.find(c => c.id === id)?.name || 'Unknown Customer';
  };

  const filteredTickets = tickets.filter(t => {
    const customerName = getCustomerName(t.customerId).toLowerCase();
    return customerName.includes(searchQuery.toLowerCase()) || t.subject.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-120px)] flex gap-6">
      {/* Ticket List */}
      <div className="w-1/3 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Support Desk</h2>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Manage customer inquiries</p>
          </div>
          <button 
            onClick={() => setIsAddingTicket(true)}
            className="p-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm flex-1 flex flex-col overflow-hidden">
          <div className="p-6 border-b border-gray-50">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search tickets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-blue-500/20 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none text-sm font-bold"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredTickets.map((ticket) => (
              <button
                key={ticket.id}
                onClick={() => setSelectedTicket(ticket)}
                className={cn(
                  "w-full text-left p-5 rounded-[2rem] transition-all border-2",
                  selectedTicket?.id === ticket.id 
                    ? "bg-blue-50 border-blue-100 shadow-sm" 
                    : "bg-white border-transparent hover:bg-gray-50"
                )}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={cn(
                    "px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest",
                    ticket.priority === 'Urgent' ? "bg-red-100 text-red-700" :
                    ticket.priority === 'High' ? "bg-amber-100 text-amber-700" :
                    "bg-blue-100 text-blue-700"
                  )}>
                    {ticket.priority}
                  </span>
                  <span className="text-[10px] font-bold text-gray-400">
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <h4 className="font-black text-gray-900 text-sm mb-1 truncate">{ticket.subject}</h4>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{getCustomerName(ticket.customerId)}</p>
                
                <div className="mt-3 flex items-center justify-between">
                  <span className={cn(
                    "px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest",
                    ticket.status === 'Open' ? "bg-emerald-100 text-emerald-700" :
                    ticket.status === 'In Progress' ? "bg-blue-100 text-blue-700" :
                    "bg-gray-100 text-gray-700"
                  )}>
                    {ticket.status}
                  </span>
                  <ChevronRight className={cn(
                    "w-4 h-4 transition-transform",
                    selectedTicket?.id === ticket.id ? "text-blue-600 translate-x-1" : "text-gray-300"
                  )} />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Ticket Detail */}
      <div className="flex-1">
        {selectedTicket ? (
          <div className="h-full bg-white rounded-[3rem] border border-gray-100 shadow-sm flex flex-col overflow-hidden">
            <div className="p-8 border-b border-gray-50 bg-gray-50/30">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                      selectedTicket.priority === 'Urgent' ? "bg-red-100 text-red-700" :
                      selectedTicket.priority === 'High' ? "bg-amber-100 text-amber-700" :
                      "bg-blue-100 text-blue-700"
                    )}>
                      {selectedTicket.priority} Priority
                    </span>
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                      {selectedTicket.category}
                    </span>
                  </div>
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight">{selectedTicket.subject}</h2>
                </div>
                <div className="flex gap-2">
                  <select 
                    value={selectedTicket.status}
                    onChange={(e) => handleUpdateStatus(selectedTicket, e.target.value as any)}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                    <User className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Customer</p>
                    <p className="text-xs font-bold text-gray-900">{getCustomerName(selectedTicket.customerId)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                    <Clock className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Created At</p>
                    <p className="text-xs font-bold text-gray-900">{new Date(selectedTicket.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                    <Tag className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Ticket ID</p>
                    <p className="text-xs font-bold text-gray-900">{selectedTicket.id}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 p-8 overflow-y-auto space-y-8">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-black text-xs shrink-0">
                    {getCustomerName(selectedTicket.customerId).charAt(0)}
                  </div>
                  <div className="bg-gray-50 p-6 rounded-[2rem] rounded-tl-none flex-1">
                    <p className="text-sm font-medium text-gray-700 leading-relaxed">
                      {selectedTicket.message}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 border-t border-gray-50">
              <div className="relative">
                <textarea 
                  placeholder="Type your response..."
                  className="w-full pl-6 pr-20 py-5 bg-gray-50 border border-transparent rounded-[2rem] focus:bg-white focus:border-blue-500/20 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none text-sm font-bold resize-none h-24"
                />
                <button className="absolute right-4 bottom-4 p-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full bg-white rounded-[3rem] border border-dashed border-gray-200 flex flex-col items-center justify-center text-center p-12">
            <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center mb-6">
              <MessageSquare className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-black text-gray-900 tracking-tight">Select a ticket to view details</h3>
            <p className="text-sm font-medium text-gray-500 mt-2 max-w-xs">
              Choose a customer inquiry from the list on the left to start resolving their issue.
            </p>
          </div>
        )}
      </div>

      {/* Add Ticket Modal */}
      <AnimatePresence>
        {isAddingTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddingTicket(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 bg-blue-600 text-white">
                <h2 className="text-2xl font-black tracking-tight">Create Support Ticket</h2>
                <p className="text-blue-100 text-sm font-medium">Log a new customer inquiry</p>
              </div>

              <div className="p-10 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Select Customer</label>
                  <select 
                    value={newTicket.customerId}
                    onChange={(e) => setNewTicket({...newTicket, customerId: e.target.value})}
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                  >
                    <option value="">Choose a customer...</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.id})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Subject</label>
                  <input 
                    type="text" 
                    value={newTicket.subject}
                    onChange={(e) => setNewTicket({...newTicket, subject: e.target.value})}
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                    placeholder="Brief summary of the issue..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Category</label>
                    <select 
                      value={newTicket.category}
                      onChange={(e) => setNewTicket({...newTicket, category: e.target.value as any})}
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                    >
                      <option value="Account">Account</option>
                      <option value="Loan">Loan</option>
                      <option value="Card">Card</option>
                      <option value="Technical">Technical</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Priority</label>
                    <select 
                      value={newTicket.priority}
                      onChange={(e) => setNewTicket({...newTicket, priority: e.target.value as any})}
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Message</label>
                  <textarea 
                    value={newTicket.message}
                    onChange={(e) => setNewTicket({...newTicket, message: e.target.value})}
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold h-32 resize-none"
                    placeholder="Detailed description..."
                  />
                </div>

                <button 
                  onClick={handleAddTicket}
                  className="w-full py-5 bg-blue-600 text-white rounded-3xl font-black text-lg shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-[0.98]"
                >
                  Create Ticket
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
