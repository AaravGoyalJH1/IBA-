import React, { useState, useEffect } from 'react';
import { 
  CreditCard as CardIcon, Plus, Search, 
  Filter, MoreVertical, CheckCircle, XCircle, 
  AlertCircle, Shield, DollarSign, Calendar,
  CreditCard, Lock, CreditCard as Card
} from 'lucide-react';
import { storage } from '../services/storageService';
import { CreditCard as CreditCardType, Customer } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function CreditCardManagement() {
  const [cards, setCards] = useState<CreditCardType[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCard, setNewCard] = useState({
    customerId: '',
    cardType: 'Classic' as CreditCardType['cardType'],
    creditLimit: 2000
  });

  const currentUser = storage.getCurrentUser();

  useEffect(() => {
    const fetchData = () => {
      setCards(storage.getCreditCards());
      setCustomers(storage.getCustomers());
      setLoading(false);
    };

    fetchData();
    window.addEventListener('storage-update', fetchData);
    return () => window.removeEventListener('storage-update', fetchData);
  }, []);

  const handleAddCard = () => {
    if (!newCard.customerId || newCard.creditLimit <= 0) {
      alert('Please select a customer and enter a valid limit.');
      return;
    }

    const cardNumber = `4532-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const expiryDate = `12/${new Date().getFullYear() + 4 - 2000}`;
    const cvv = Math.floor(100 + Math.random() * 900).toString();

    const card: CreditCardType = {
      id: `cc_${Date.now()}`,
      customerId: newCard.customerId,
      cardNumber,
      cardType: newCard.cardType,
      creditLimit: newCard.creditLimit,
      currentBalance: 0,
      expiryDate,
      cvv,
      status: 'Active',
      billingCycleDay: 15
    };

    storage.updateCreditCard(card);
    
    storage.logAction(
      currentUser!.uid,
      currentUser!.name,
      'Issue Credit Card',
      `Issued ${newCard.cardType} card to customer ${newCard.customerId} with limit ${formatCurrency(newCard.creditLimit)}`,
      'Medium'
    );

    setIsAddingCard(false);
    setNewCard({ customerId: '', cardType: 'Classic', creditLimit: 2000 });
  };

  const getCustomerName = (id: string) => {
    return customers.find(c => c.id === id)?.name || 'Unknown Customer';
  };

  const filteredCards = cards.filter(card => {
    const customerName = getCustomerName(card.customerId).toLowerCase();
    return customerName.includes(searchQuery.toLowerCase()) || card.cardNumber.includes(searchQuery);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Credit Card Portfolio</h2>
          <p className="text-gray-500 mt-1">Manage institutional credit lines and card issuance.</p>
        </div>
        <button 
          onClick={() => setIsAddingCard(true)}
          className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-2xl font-bold text-sm hover:bg-black transition-all shadow-lg shadow-gray-200"
        >
          <Plus className="w-4 h-4" />
          Issue New Card
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {filteredCards.map((card) => (
          <div key={card.id} className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden group hover:shadow-xl hover:shadow-blue-50 transition-all duration-500">
            <div className="p-8 flex flex-col md:flex-row gap-8">
              {/* Card Visual */}
              <div className={cn(
                "w-full md:w-72 h-44 rounded-3xl p-6 text-white flex flex-col justify-between relative overflow-hidden shadow-2xl transition-transform group-hover:scale-105 duration-500",
                card.cardType === 'Infinite' ? "bg-gradient-to-br from-gray-900 via-gray-800 to-black" :
                card.cardType === 'Platinum' ? "bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800" :
                card.cardType === 'Gold' ? "bg-gradient-to-br from-amber-600 via-amber-500 to-amber-700" :
                "bg-gradient-to-br from-blue-600 via-blue-500 to-blue-700"
              )}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                <div className="flex justify-between items-start relative z-10">
                  <div className="w-10 h-8 bg-amber-400/80 rounded-md border border-amber-300/50 flex items-center justify-center">
                    <div className="w-6 h-4 border border-amber-600/30 rounded-sm" />
                  </div>
                  <div className="text-xs font-black italic tracking-widest opacity-80">{card.cardType}</div>
                </div>
                <div className="space-y-1 relative z-10">
                  <div className="text-lg font-bold tracking-[0.2em]">{card.cardNumber}</div>
                  <div className="flex justify-between items-end">
                    <div className="text-[10px] font-medium opacity-70 uppercase tracking-widest">
                      {getCustomerName(card.customerId)}
                    </div>
                    <div className="text-[10px] font-bold tracking-widest">
                      EXP: {card.expiryDate}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Info */}
              <div className="flex-1 space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-black text-gray-900 tracking-tight">{getCustomerName(card.customerId)}</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Customer ID: {card.customerId}</p>
                  </div>
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                    card.status === 'Active' ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                  )}>
                    {card.status}
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-gray-500">Credit Utilization</span>
                      <span className="text-gray-900">{((card.currentBalance / card.creditLimit) * 100).toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all duration-1000",
                          (card.currentBalance / card.creditLimit) > 0.8 ? "bg-red-500" : "bg-blue-600"
                        )}
                        style={{ width: `${(card.currentBalance / card.creditLimit) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-2xl">
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Current Balance</div>
                      <div className="text-lg font-black text-gray-900 tracking-tight">{formatCurrency(card.currentBalance)}</div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-2xl">
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Credit Limit</div>
                      <div className="text-lg font-black text-gray-900 tracking-tight">{formatCurrency(card.creditLimit)}</div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button className="flex-1 py-3 bg-gray-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-black transition-all">
                    View Statement
                  </button>
                  <button className="p-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-all">
                    <Lock className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Issue Card Modal */}
      <AnimatePresence>
        {isAddingCard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddingCard(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 bg-gray-900 text-white">
                <h2 className="text-2xl font-black tracking-tight">Issue Credit Card</h2>
                <p className="text-gray-400 text-sm font-medium">Provision a new credit line for a client</p>
              </div>

              <div className="p-10 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Select Customer</label>
                  <select 
                    value={newCard.customerId}
                    onChange={(e) => setNewCard({...newCard, customerId: e.target.value})}
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                  >
                    <option value="">Choose a customer...</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.id})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Card Type</label>
                    <select 
                      value={newCard.cardType}
                      onChange={(e) => setNewCard({...newCard, cardType: e.target.value as any})}
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                    >
                      <option value="Classic">Classic</option>
                      <option value="Gold">Gold</option>
                      <option value="Platinum">Platinum</option>
                      <option value="Infinite">Infinite</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Credit Limit</label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input 
                        type="number" 
                        value={newCard.creditLimit}
                        onChange={(e) => setNewCard({...newCard, creditLimit: Number(e.target.value)})}
                        className="w-full pl-10 pr-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <Shield className="w-5 h-5 text-blue-600 shrink-0" />
                  <p className="text-[10px] font-bold text-gray-500 leading-relaxed">
                    Credit issuance requires a minimum credit score of 650 and verified KYC documentation.
                  </p>
                </div>

                <button 
                  onClick={handleAddCard}
                  className="w-full py-5 bg-gray-900 text-white rounded-3xl font-black text-lg shadow-xl shadow-gray-100 hover:bg-black transition-all active:scale-[0.98]"
                >
                  Issue Credit Card
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
