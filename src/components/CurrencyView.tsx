import React, { useState, useEffect } from 'react';
import { ArrowRightLeft, Delete, Calculator, RefreshCw } from 'lucide-react';

export const CurrencyView: React.FC = () => {
  // Default JPY to TWD
  const [direction, setDirection] = useState<'JPY_TO_TWD' | 'TWD_TO_JPY'>('JPY_TO_TWD');
  const [amount, setAmount] = useState<string>('');
  // Default rate fallback
  const [rate, setRate] = useState<number>(0.22);
  const [isEditingRate, setIsEditingRate] = useState(false);
  const [isLoadingRate, setIsLoadingRate] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  // Helper to format time to UTC+8 (Taipei)
  const formatTime = (timestamp: number) => {
    try {
      const timeStr = new Intl.DateTimeFormat('zh-TW', {
        timeZone: 'Asia/Taipei',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).format(new Date(timestamp));
      return `更新於台北時間 ${timeStr}`;
    } catch (e) {
      // Fallback if browser doesn't support timeZone
      const date = new Date(timestamp);
      const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
      return `更新於台北時間 ${timeStr}`;
    }
  };

  // Fetch rate from API
  const fetchLiveRate = async () => {
    setIsLoadingRate(true);
    // Add a minimum delay of 500ms so the user sees the spinner
    const minDelay = new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      // Free API for exchange rates. Base: JPY
      const [response] = await Promise.all([
        fetch('https://open.er-api.com/v6/latest/JPY'),
        minDelay
      ]);
      
      const data = await response.json();
      if (data && data.rates && data.rates.TWD) {
        const newRate = data.rates.TWD;
        // Keep 4 decimal places for precision but cleaner look
        const roundedRate = Math.round(newRate * 10000) / 10000;
        
        setRate(roundedRate);
        const now = Date.now();
        setLastUpdated(now);
        
        localStorage.setItem('okinawa_currency_rate', roundedRate.toString());
        localStorage.setItem('okinawa_currency_last_updated', now.toString());
      }
    } catch (error) {
      console.error("Failed to fetch rate", error);
    } finally {
      setIsLoadingRate(false);
    }
  };

  useEffect(() => {
    const savedRate = localStorage.getItem('okinawa_currency_rate');
    const savedTimestamp = localStorage.getItem('okinawa_currency_last_updated');
    
    // Load saved rate first
    if (savedRate) {
      setRate(parseFloat(savedRate));
    }

    if (savedTimestamp) {
      setLastUpdated(parseInt(savedTimestamp, 10));
    }

    // Check if we need to update (older than 1 hour or no data)
    const ONE_HOUR = 60 * 60 * 1000;
    const now = Date.now();
    
    if (!savedTimestamp || (now - parseInt(savedTimestamp || '0', 10) > ONE_HOUR)) {
      fetchLiveRate();
    }
  }, []);

  const handleRateChange = (newRate: string) => {
    const val = parseFloat(newRate);
    if (!isNaN(val) && val > 0) {
      setRate(val);
      const now = Date.now();
      setLastUpdated(now);
      localStorage.setItem('okinawa_currency_rate', val.toString());
      localStorage.setItem('okinawa_currency_last_updated', now.toString());
    }
  };

  const toggleDirection = () => {
    setDirection(prev => prev === 'JPY_TO_TWD' ? 'TWD_TO_JPY' : 'JPY_TO_TWD');
  };

  const result = amount ? (parseFloat(amount) * (direction === 'JPY_TO_TWD' ? rate : 1/rate)).toLocaleString('zh-TW', { maximumFractionDigits: 0 }) : '0';
  
  // Custom Keypad Logic
  const handleNumPress = (num: string) => {
    if (amount.length > 8) return; 
    if (num === '.' && amount.includes('.')) return;
    setAmount(prev => prev + num);
  };

  const handleDelete = () => {
    setAmount(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setAmount('');
  };

  const quickAdd = (val: number) => {
    const current = parseFloat(amount || '0');
    setAmount((current + val).toString());
  };

  const sourceSymbol = direction === 'JPY_TO_TWD' ? '¥' : 'NT$';
  const targetSymbol = direction === 'JPY_TO_TWD' ? 'NT$' : '¥';

  return (
    // Outer container: Fixed height (100%), no scrolling, padding bottom for Nav bar
    <div className="flex flex-col h-full bg-gray-50 pt-safe pb-[70px] overflow-hidden">
      
      {/* Header: Compact */}
      <div className="flex justify-between items-start px-5 py-3 shrink-0">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 mt-1">
          <Calculator className="text-okinawa-blue w-5 h-5" /> 匯率換算
        </h2>
        
        {/* Rate Editor & Refresh Container */}
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-full shadow-sm border border-gray-200">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider ml-1">匯率</span>
            
            {isEditingRate ? (
              <input 
                type="number" 
                className="w-14 text-center border-b border-okinawa-blue outline-none text-sm font-bold text-gray-700 p-0"
                defaultValue={rate}
                onBlur={(e) => {
                  handleRateChange(e.target.value);
                  setIsEditingRate(false);
                }}
                autoFocus
                step="0.0001"
              />
            ) : (
              <button 
                onClick={() => setIsEditingRate(true)}
                className="text-sm font-bold text-gray-700 min-w-[2.5rem] text-center px-1"
              >
                {rate}
              </button>
            )}

            <button 
              onClick={fetchLiveRate}
              disabled={isLoadingRate}
              className={`p-1 rounded-full text-gray-400 hover:text-okinawa-blue hover:bg-blue-50 transition-colors ${isLoadingRate ? 'animate-spin text-okinawa-blue' : ''}`}
            >
              <RefreshCw size={12} />
            </button>
          </div>
          {/* Last Updated Time */}
          {lastUpdated && (
            <span className="text-[10px] text-gray-400 mt-1 mr-1 font-medium">
              {formatTime(lastUpdated)}
            </span>
          )}
        </div>
      </div>

      {/* Display Card: Compact */}
      <div className="mx-4 bg-white rounded-2xl shadow-sm border border-gray-200 p-4 shrink-0 relative overflow-hidden">
        {/* Top Row: Source Label + Swap */}
        <div className="flex justify-between items-center mb-1 relative z-10">
          <span className="text-xs text-gray-500 font-medium">{direction === 'JPY_TO_TWD' ? '日幣 JPY' : '台幣 TWD'}</span>
          <button 
            onClick={toggleDirection} 
            className="p-1.5 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors active:scale-90"
          >
            <ArrowRightLeft size={14} className="text-gray-600" />
          </button>
        </div>
        
        {/* Input Value */}
        <div className="text-3xl font-bold text-gray-800 tracking-tight break-all mb-1 h-9 flex items-center relative z-10">
          <span className="text-lg text-gray-400 mr-1">{sourceSymbol}</span>
          {amount ? Number(amount).toLocaleString() : '0'}
          <span className="animate-pulse text-gray-300 ml-0.5 text-2xl font-light">|</span>
        </div>

        {/* Divider */}
        <div className="h-px w-full bg-gray-100 my-2 relative z-10"></div>

        {/* Result Row */}
        <div className="flex justify-between items-end relative z-10">
          <span className="text-xs text-gray-500 font-medium mb-1">
            {direction === 'JPY_TO_TWD' ? '約合台幣' : '約合日幣'}
          </span>
          <div className="text-4xl font-bold text-okinawa-blue tracking-tight leading-none">
            <span className="text-xl text-okinawa-blue/60 mr-1">{targetSymbol}</span>
            {result}
          </div>
        </div>
        
        {/* Decorative BG */}
        <div className="absolute -bottom-4 -right-4 text-gray-50 opacity-10 pointer-events-none z-0">
           <Calculator size={100} />
        </div>
      </div>

      {/* Quick Add Buttons (Conditional) */}
      <div className="mx-4 mt-3 mb-2 shrink-0 h-10">
        {direction === 'JPY_TO_TWD' ? (
          <div className="grid grid-cols-3 gap-2 h-full">
            {[1000, 5000, 10000].map(val => (
              <button 
                key={val}
                onClick={() => quickAdd(val)}
                className="bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[11px] font-bold transition-colors active:scale-95 border border-blue-100 flex items-center justify-center"
              >
                + ¥{val.toLocaleString()}
              </button>
            ))}
          </div>
        ) : (
          <div className="h-full"></div> // Spacer to keep layout stable if switched
        )}
      </div>

      {/* Numeric Keypad - Flex grow to fill remaining space */}
      <div className="flex-1 px-4 pb-2 min-h-0">
        <div className="grid grid-cols-4 gap-2 h-full">
          {['7', '8', '9'].map(num => (
            <KeypadButton key={num} label={num} onClick={() => handleNumPress(num)} />
          ))}
          <button onClick={handleClear} className="bg-red-50 text-red-500 rounded-xl flex items-center justify-center font-bold text-lg active:bg-red-100 transition-colors border border-red-100">
            C
          </button>

          {['4', '5', '6'].map(num => (
            <KeypadButton key={num} label={num} onClick={() => handleNumPress(num)} />
          ))}
           <button onClick={handleDelete} className="bg-gray-100 text-gray-600 rounded-xl flex items-center justify-center active:bg-gray-200 transition-colors border border-gray-200">
            <Delete size={20} />
          </button>

          {['1', '2', '3'].map(num => (
            <KeypadButton key={num} label={num} onClick={() => handleNumPress(num)} />
          ))}
          {/* Dot Button */}
          <KeypadButton label="." onClick={() => handleNumPress('.')} className="bg-gray-50 text-gray-800" />
          
          {/* Zero Buttons */}
          <KeypadButton label="0" onClick={() => handleNumPress('0')} className="col-span-2" />
          <KeypadButton label="00" onClick={() => handleNumPress('00')} />
        </div>
      </div>

    </div>
  );
};

const KeypadButton: React.FC<{ label: string; onClick: () => void; className?: string }> = ({ label, onClick, className }) => (
  <button 
    onClick={onClick}
    className={`bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] border border-gray-200 text-xl font-semibold text-gray-700 rounded-xl active:bg-gray-50 active:scale-95 transition-all touch-manipulation select-none flex items-center justify-center h-full w-full ${className}`}
  >
    {label}
  </button>
);