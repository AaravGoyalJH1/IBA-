import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, TrendingUp, TrendingDown, Clock, 
  ArrowRightLeft, DollarSign, Euro, PoundSterling, 
  JapaneseYen, IndianRupee, Globe, Search, Filter
} from 'lucide-react';
import { getExchangeRates } from '../services/currencyService';
import { ExchangeRate } from '../types';
import { formatPercent } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const CURRENCY_ICONS: Record<string, any> = {
  'USD': DollarSign,
  'EUR': Euro,
  'GBP': PoundSterling,
  'JPY': JapaneseYen,
  'INR': IndianRupee,
  'AAN': RefreshCw,
  'AYD': ArrowRightLeft,
  'DEFAULT': Globe
};

export default function CurrencyExchange() {
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [baseCurrency, setBaseCurrency] = useState('USD');
  const [searchQuery, setSearchQuery] = useState('');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const [amount, setAmount] = useState<number>(1000);
  const [targetCurrency, setTargetCurrency] = useState<string>('EUR');
  const [convertedValue, setConvertedValue] = useState<number>(0);

  const fetchRates = async () => {
    setLoading(true);
    const data = await getExchangeRates(baseCurrency);
    setRates(data);
    if (data.length > 0) {
      setLastUpdated(data[0].timestamp);
      // Update target currency if not in new rates
      if (!data.find(r => r.to === targetCurrency)) {
        setTargetCurrency(data[0].to);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    const rate = rates.find(r => r.to === targetCurrency);
    if (rate) {
      setConvertedValue(amount * rate.rate);
    } else {
      setConvertedValue(0);
    }
  }, [amount, targetCurrency, rates]);

  useEffect(() => {
    fetchRates();
    const interval = setInterval(fetchRates, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, [baseCurrency]);

  const filteredRates = rates.filter(r => 
    r.to.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getIcon = (symbol: string) => {
    return CURRENCY_ICONS[symbol] || CURRENCY_ICONS['DEFAULT'];
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Global Exchange Terminal</h1>
          <p className="text-gray-500 font-medium">Real-time institutional currency rates</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-gray-200 shadow-sm">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Base</span>
            <select 
              value={baseCurrency}
              onChange={(e) => setBaseCurrency(e.target.value)}
              className="text-sm font-bold bg-transparent border-none focus:ring-0 cursor-pointer text-blue-600"
            >
              {['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'INR', 'SGD', 'AAN', 'AYD'].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          
          <button 
            onClick={fetchRates}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-2xl hover:bg-black transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="text-sm font-bold">Sync Rates</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Rates Table */}
        <div className="lg:col-span-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search target currency..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-3xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm font-medium"
            />
          </div>

          <div className="bg-white rounded-[2.5rem] border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-500" />
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Market Pairs</h3>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                <Clock className="w-3 h-3" />
                Last Updated: {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : 'N/A'}
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Currency Pair</th>
                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Exchange Rate</th>
                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Inverse</th>
                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  <AnimatePresence mode="popLayout">
                    {filteredRates.map((rate, idx) => {
                      const Icon = getIcon(rate.to);
                      const BaseIcon = getIcon(rate.from);
                      return (
                        <motion.tr 
                          key={rate.to}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="hover:bg-gray-50/50 transition-colors group cursor-pointer"
                        >
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <div className="flex -space-x-3">
                                <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-100 z-10 border-2 border-white">
                                  <BaseIcon className="w-5 h-5 text-white" />
                                </div>
                                <div className="w-10 h-10 rounded-2xl bg-gray-900 flex items-center justify-center shadow-lg shadow-gray-100 border-2 border-white">
                                  <Icon className="w-5 h-5 text-white" />
                                </div>
                              </div>
                              <div>
                                <p className="font-black text-gray-900 tracking-tight">{rate.from}/{rate.to}</p>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Spot Market</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <p className="text-xl font-black text-gray-900 tabular-nums">
                              {rate.rate.toFixed(4)}
                            </p>
                          </td>
                          <td className="px-8 py-6">
                            <p className="text-sm font-bold text-gray-400 tabular-nums">
                              {(1 / rate.rate).toFixed(4)}
                            </p>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Live</span>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Quick Converter Widget */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-gray-900 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-blue-100 space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <ArrowRightLeft className="w-32 h-32" />
            </div>
            
            <div className="relative z-10">
              <h3 className="text-xl font-black tracking-tight mb-2">Quick Converter</h3>
              <p className="text-gray-400 text-sm font-medium">Instant institutional conversion</p>
            </div>

            <div className="space-y-4 relative z-10">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Amount</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-2xl font-black focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 px-3 py-1 bg-white/10 rounded-lg text-xs font-bold">
                    {baseCurrency}
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/50">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Target Currency</label>
                <select 
                  value={targetCurrency}
                  onChange={(e) => setTargetCurrency(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-xl font-black focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none"
                >
                  {rates.map(r => (
                    <option key={r.to} value={r.to} className="bg-gray-900">{r.to}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4">
                <div className="p-6 bg-blue-600 rounded-3xl space-y-1">
                  <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest">Estimated Value</p>
                  <p className="text-3xl font-black tracking-tight">
                    {convertedValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {targetCurrency}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Market Sentiment / Info */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-200 shadow-sm space-y-6">
            <h3 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              Market Pulse
            </h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Volatility</p>
                  <p className="text-sm font-bold text-emerald-900">Low (0.2%)</p>
                </div>
                <TrendingDown className="w-5 h-5 text-emerald-400" />
              </div>
              
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Liquidity</p>
                  <p className="text-sm font-bold text-blue-900">High (Tier 1)</p>
                </div>
                <Globe className="w-5 h-5 text-blue-400" />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <p className="text-[10px] text-gray-400 font-bold uppercase leading-relaxed">
                Rates are sourced from institutional liquidity providers and updated every 5 minutes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
