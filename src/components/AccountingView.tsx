import React, { useState, useEffect } from 'react';
import { Expense } from '../types';
import { Plus, Trash2, Receipt, TrendingUp, DollarSign, CloudUpload, Settings, Check, X, Loader2, RefreshCw } from 'lucide-react';

export const AccountingView: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [item, setItem] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('餐飲');
  const [rate, setRate] = useState<number>(0.22);
  
  // Sync States
  const [showSettings, setShowSettings] = useState(false);
  const [scriptUrl, setScriptUrl] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const categories = ['餐飲', '交通', '購物', '住宿', '其他'];

  useEffect(() => {
    const savedExpenses = localStorage.getItem('okinawa_expenses');
    if (savedExpenses) {
      setExpenses(JSON.parse(savedExpenses));
    }
    const savedRate = localStorage.getItem('okinawa_currency_rate');
    if (savedRate) {
        setRate(parseFloat(savedRate));
    }
    const savedUrl = localStorage.getItem('okinawa_gsheet_url');
    if (savedUrl) {
      setScriptUrl(savedUrl);
    }
  }, []);

  const saveExpenses = (newExpenses: Expense[]) => {
    setExpenses(newExpenses);
    localStorage.setItem('okinawa_expenses', JSON.stringify(newExpenses));
  };

  const handleAdd = () => {
    if (!item || !amount) return;

    // Use a simpler ID for readability if debugging, but timestamp is fine for uniqueness in small groups
    const newExpense: Expense = {
      id: Date.now().toString(), 
      item,
      amount: parseFloat(amount),
      category,
      date: Date.now()
    };

    const updated = [newExpense, ...expenses];
    saveExpenses(updated);
    
    // Reset form
    setItem('');
    setAmount('');
  };

  const handleDelete = (id: string) => {
    const updated = expenses.filter(e => e.id !== id);
    saveExpenses(updated);
  };

  const handleSaveSettings = () => {
    localStorage.setItem('okinawa_gsheet_url', scriptUrl);
    setShowSettings(false);
    setSyncStatus('idle');
  };

  const handleSync = async () => {
    if (!scriptUrl) {
      setShowSettings(true);
      return;
    }

    setIsSyncing(true);
    setSyncStatus('idle');

    try {
      // Use standard CORS request. 
      // GAS script MUST return ContentService.createTextOutput(...) JSON
      const response = await fetch(scriptUrl, {
        method: 'POST',
        // IMPORTANT: sending as text/plain prevents browser from sending preflight OPTIONS request
        // which GAS sometimes handles poorly. We parse it as JSON in the script.
        headers: {
          'Content-Type': 'text/plain;charset=utf-8', 
        },
        body: JSON.stringify({ expenses })
      });
      
      const data = await response.json();
      
      if (data.status === 'success' && Array.isArray(data.expenses)) {
        // Update local state with the MERGED data from server
        // This ensures we get what friends added
        saveExpenses(data.expenses);
        setSyncStatus('success');
      } else {
        throw new Error(data.message || 'Unknown error');
      }

      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (error) {
      console.error("Sync failed", error);
      setSyncStatus('error');
    } finally {
      setIsSyncing(false);
    }
  };

  const totalJPY = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalTWD = Math.round(totalJPY * rate);

  return (
    <div className="flex flex-col h-full bg-gray-50 pt-safe pb-[80px] overflow-hidden relative">
        
      {/* Settings Modal Overlay */}
      {showSettings && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-2xl p-5 shadow-xl">
            <h3 className="font-bold text-lg mb-2">設定 Google Sheet 同步</h3>
            <p className="text-xs text-gray-500 mb-4">
              請輸入 Google Apps Script 部署後的 Web App URL。
              <br/>
              (擴充功能 &gt; Apps Script &gt; 部署為網頁應用程式)
            </p>
            <input 
              type="text" 
              value={scriptUrl}
              onChange={(e) => setScriptUrl(e.target.value)}
              placeholder="https://script.google.com/..."
              className="w-full border border-gray-300 rounded-lg p-2 text-sm mb-4 focus:ring-2 focus:ring-okinawa-blue outline-none"
            />
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 text-gray-500 text-sm font-medium"
              >
                取消
              </button>
              <button 
                onClick={handleSaveSettings}
                className="px-4 py-2 bg-okinawa-blue text-white rounded-lg text-sm font-bold shadow-md"
              >
                儲存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="px-5 py-4 bg-white border-b border-gray-100 shadow-sm shrink-0 flex justify-between items-start">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Receipt className="text-okinawa-blue" /> 記帳本
          </h2>
          <div className="mt-2 flex items-baseline gap-2">
              <span className="text-sm text-gray-500">總支出</span>
              <span className="text-2xl font-bold text-gray-900">¥{totalJPY.toLocaleString()}</span>
              <span className="text-sm text-gray-400">≈ NT${totalTWD.toLocaleString()}</span>
          </div>
        </div>
        
        <div className="flex gap-2">
           <button 
            onClick={handleSync}
            disabled={isSyncing}
            className={`p-2 rounded-full border transition-all relative
              ${syncStatus === 'success' ? 'bg-green-50 border-green-200 text-green-600' : 
                syncStatus === 'error' ? 'bg-red-50 border-red-200 text-red-600' :
                'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'}
            `}
           >
             {isSyncing ? <Loader2 size={20} className="animate-spin text-okinawa-blue" /> : 
              syncStatus === 'success' ? <Check size={20} /> :
              syncStatus === 'error' ? <X size={20} /> :
              <CloudUpload size={20} />
             }
           </button>
           <button 
             onClick={() => setShowSettings(true)}
             className="p-2 text-gray-400 hover:text-gray-600 active:scale-95 transition-transform"
           >
             <Settings size={20} />
           </button>
        </div>
      </div>

      {/* Sync Status Banner */}
      {syncStatus === 'error' && (
         <div className="bg-red-50 text-red-600 text-xs px-4 py-1 text-center">
            同步失敗，請檢查網路或 URL 設定。
         </div>
      )}
      {syncStatus === 'success' && (
         <div className="bg-green-50 text-green-600 text-xs px-4 py-1 text-center">
            同步完成！已合併最新資料。
         </div>
      )}

      {/* Input Area */}
      <div className="p-4 bg-white m-4 rounded-2xl shadow-sm border border-gray-200 shrink-0">
        <div className="flex gap-2 mb-3">
            <input 
                type="text" 
                placeholder="品項 (如: 拉麵)" 
                className="flex-[2] min-w-0 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-base focus:outline-none focus:border-okinawa-blue"
                value={item}
                onChange={e => setItem(e.target.value)}
            />
             <input 
                type="number" 
                placeholder="金額 (日幣)" 
                className="flex-1 min-w-0 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-base focus:outline-none focus:border-okinawa-blue"
                value={amount}
                onChange={e => setAmount(e.target.value)}
            />
        </div>
        <div className="flex gap-2 justify-between">
            <div className="flex gap-1 overflow-x-auto no-scrollbar py-1">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setCategory(cat)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                            category === cat ? 'bg-okinawa-blue text-white' : 'bg-gray-100 text-gray-500'
                        }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>
            <button 
                onClick={handleAdd}
                className="bg-okinawa-coral text-white p-2 rounded-full shadow-md active:scale-95 transition-transform shrink-0"
            >
                <Plus size={20} />
            </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3 no-scrollbar">
        {expenses.length === 0 ? (
            <div className="text-center text-gray-400 mt-10">
                <Receipt size={48} className="mx-auto mb-2 opacity-20" />
                <p>還沒有記帳紀錄</p>
            </div>
        ) : (
            expenses.map(exp => (
                <div key={exp.id} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold shrink-0
                            ${exp.category === '餐飲' ? 'bg-orange-100 text-orange-600' : 
                              exp.category === '交通' ? 'bg-blue-100 text-blue-600' :
                              exp.category === '購物' ? 'bg-pink-100 text-pink-600' : 'bg-gray-100 text-gray-600'}
                        `}>
                            {exp.category === '餐飲' ? '🍜' : 
                             exp.category === '交通' ? '🚆' :
                             exp.category === '購物' ? '🛍️' : '📝'}
                        </div>
                        <div className="min-w-0">
                            <div className="font-bold text-gray-800 truncate">{exp.item}</div>
                            <div className="text-xs text-gray-400">{new Date(exp.date).toLocaleDateString()}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                            <div className="font-bold text-gray-900">¥{exp.amount}</div>
                            <div className="text-xs text-gray-400">≈ ${Math.round(exp.amount * rate)}</div>
                        </div>
                        <button onClick={() => handleDelete(exp.id)} className="text-gray-300 hover:text-red-500 p-1">
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
            ))
        )}
      </div>

      <div className="px-4 text-center text-[10px] text-gray-400 pb-2">
         * 點擊上方雲端圖示同步，可取得朋友新增的紀錄。
      </div>
    </div>
  );
};