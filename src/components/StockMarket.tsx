import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Search, Newspaper, ArrowUpRight, ArrowDownRight,
  Activity, Globe, Briefcase, RefreshCw
} from 'lucide-react';
import { getStockMarketData } from '../services/stockService';
import { StockData } from '../types';
import { formatCurrency, formatPercent } from '../lib/utils';
import { motion } from 'motion/react';

export default function StockMarket() {
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStock, setSelectedStock] = useState<StockData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchStocks = async () => {
    setLoading(true);
    const data = await getStockMarketData(['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA']);
    setStocks(data);
    if (!selectedStock) setSelectedStock(data[0]);
    setLoading(false);
  };

  useEffect(() => {
    fetchStocks();
    const interval = setInterval(fetchStocks, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const filteredStocks = stocks.filter(s => 
    s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Stock Market Terminal</h1>
          <p className="text-gray-500">Real-time market data and portfolio tracking</p>
        </div>
        <button 
          onClick={fetchStocks}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span className="text-sm font-medium">Refresh Data</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sidebar: Stock List */}
        <div className="lg:col-span-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search symbols or companies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
            />
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-bottom border-gray-100 bg-gray-50/50">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Watchlist</h3>
            </div>
            <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
              {filteredStocks.map((stock) => (
                <button
                  key={stock.symbol}
                  onClick={() => setSelectedStock(stock)}
                  className={`w-full p-4 flex items-center justify-between hover:bg-blue-50/50 transition-colors text-left ${selectedStock?.symbol === stock.symbol ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center font-bold text-gray-600">
                      {stock.symbol[0]}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{stock.symbol}</p>
                      <p className="text-xs text-gray-500 truncate w-32">{stock.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{formatCurrency(stock.price)}</p>
                    <div className={`flex items-center justify-end gap-1 text-xs font-medium ${stock.change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {stock.change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {formatPercent(Math.abs(stock.changePercent) / 100)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main: Details & Charts */}
        <div className="lg:col-span-8 space-y-6">
          {selectedStock ? (
            <>
              <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm space-y-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h2 className="text-4xl font-black text-gray-900 tracking-tight">{selectedStock.symbol}</h2>
                      <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-sm font-bold uppercase">{selectedStock.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-5xl font-bold text-gray-900">{formatCurrency(selectedStock.price)}</p>
                      <div className={`flex items-center gap-1 text-xl font-bold ${selectedStock.change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {selectedStock.change >= 0 ? '+' : ''}{selectedStock.change.toFixed(2)} ({formatPercent(Math.abs(selectedStock.changePercent) / 100)})
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <div className="px-4 py-2 bg-gray-50 rounded-xl border border-gray-100 text-center">
                      <p className="text-[10px] uppercase font-bold text-gray-400">Market Cap</p>
                      <p className="font-bold text-gray-700">2.4T</p>
                    </div>
                    <div className="px-4 py-2 bg-gray-50 rounded-xl border border-gray-100 text-center">
                      <p className="text-[10px] uppercase font-bold text-gray-400">P/E Ratio</p>
                      <p className="font-bold text-gray-700">28.4</p>
                    </div>
                    <div className="px-4 py-2 bg-gray-50 rounded-xl border border-gray-100 text-center">
                      <p className="text-[10px] uppercase font-bold text-gray-400">Dividend</p>
                      <p className="font-bold text-gray-700">0.8%</p>
                    </div>
                  </div>
                </div>

                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={selectedStock.history}>
                      <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={selectedStock.change >= 0 ? "#10b981" : "#ef4444"} stopOpacity={0.2}/>
                          <stop offset="95%" stopColor={selectedStock.change >= 0 ? "#10b981" : "#ef4444"} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                      <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: number) => [formatCurrency(value), 'Price']}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="price" 
                        stroke={selectedStock.change >= 0 ? "#10b981" : "#ef4444"} 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorPrice)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-6">
                    <Newspaper className="w-5 h-5 text-blue-500" />
                    <h3 className="text-lg font-bold text-gray-900">Latest News</h3>
                  </div>
                  <div className="space-y-6">
                    {selectedStock.news.map((n, i) => (
                      <div key={i} className="group cursor-pointer">
                        <p className="text-xs font-bold text-blue-600 uppercase mb-1">{n.date}</p>
                        <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-2 leading-tight">{n.title}</h4>
                        <p className="text-sm text-gray-500 line-clamp-2">{n.summary}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-6">
                    <Activity className="w-5 h-5 text-emerald-500" />
                    <h3 className="text-lg font-bold text-gray-900">Market Sentiment</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                      <div className="flex items-center gap-3">
                        <TrendingUp className="w-5 h-5 text-emerald-600" />
                        <span className="font-bold text-emerald-900">Strong Buy</span>
                      </div>
                      <span className="text-sm font-bold text-emerald-600">84% Analyst Consensus</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Volume</p>
                        <p className="font-bold text-gray-700">52.4M</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Avg Vol</p>
                        <p className="font-bold text-gray-700">48.2M</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center bg-white rounded-3xl border border-gray-200 border-dashed">
              <div className="text-center space-y-4">
                <Globe className="w-16 h-16 text-gray-200 mx-auto" />
                <p className="text-gray-400 font-medium">Select a stock to view detailed market analysis</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
