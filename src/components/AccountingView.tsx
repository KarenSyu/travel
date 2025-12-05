import React, { useState, useEffect } from 'react';
import { Expense } from '../types';
import { Plus, Trash2, Receipt, TrendingUp, DollarSign } from 'lucide-react';

export const AccountingView: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [item, setItem] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('餐飲');
  const [rate, setRate] = useState<number>(0.22);

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
  }, []);

  const saveExpenses = (newExpenses: Expense[]) => {
    setExpenses(newExpenses);
    localStorage.setItem('okinawa_expenses', JSON.stringify(newExpenses));
  };

  const handleAdd = () => {
    if (!item || !amount) return;

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

  const totalJPY = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalTWD = Math.round(totalJPY * rate);

  return (
    <div className="flex flex-col h-full bg-gray-50 pt-safe pb-[80px] overflow-hidden">
        {/* Header */}
      <div className="px-5 py-4 bg-white border-b border-gray-100 shadow-sm shrink-0">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Receipt className="text-okinawa-blue" /> 記帳本
        </h2>
        <div className="mt-2 flex items-baseline gap-2">
            <span className="text-sm text-gray-500">總支出</span>
            <span className="text-2xl font-bold text-gray-900">¥{totalJPY.toLocaleString()}</span>
            <span className="text-sm text-gray-400">≈ NT${totalTWD.toLocaleString()}</span>
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white m-4 rounded-2xl shadow-sm border border-gray-200 shrink-0">
        <div className="flex gap-2 mb-3">
            <input 
                type="text" 
                placeholder="品項 (如: 拉麵)" 
                className="flex-[2] bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-okinawa-blue"
                value={item}
                onChange={e => setItem(e.target.value)}
            />
             <input 
                type="number" 
                placeholder="金額 (日幣)" 
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-okinawa-blue"
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
                className="bg-okinawa-coral text-white p-2 rounded-full shadow-md active:scale-95 transition-transform"
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
                <div key={exp.id} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold
                            ${exp.category === '餐飲' ? 'bg-orange-100 text-orange-600' : 
                              exp.category === '交通' ? 'bg-blue-100 text-blue-600' :
                              exp.category === '購物' ? 'bg-pink-100 text-pink-600' : 'bg-gray-100 text-gray-600'}
                        `}>
                            {exp.category === '餐飲' ? '🍜' : 
                             exp.category === '交通' ? '🚆' :
                             exp.category === '購物' ? '🛍️' : '📝'}
                        </div>
                        <div>
                            <div className="font-bold text-gray-800">{exp.item}</div>
                            <div className="text-xs text-gray-400">{new Date(exp.date).toLocaleDateString()}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
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
         * 資料目前儲存於手機。若要同步 Google Sheet 需設定 Apps Script。
      </div>
    </div>
  );
};
