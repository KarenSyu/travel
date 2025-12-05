import React from 'react';
import { View } from '../types';
import { CalendarDays, Calculator, Receipt } from 'lucide-react';

interface BottomNavProps {
  currentView: View;
  onViewChange: (view: View) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentView, onViewChange }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 pb-safe pt-2 px-6 z-50">
      <div className="flex justify-around items-center h-16">
        <button
          onClick={() => onViewChange(View.ITINERARY)}
          className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-1 rounded-2xl transition-all active:scale-95 ${
            currentView === View.ITINERARY ? 'bg-blue-50 text-okinawa-blue' : 'text-gray-400 hover:bg-gray-50'
          }`}
        >
          <CalendarDays size={24} strokeWidth={currentView === View.ITINERARY ? 2.5 : 2} />
          <span className="text-[11px] font-bold">我的行程</span>
        </button>

        <button
          onClick={() => onViewChange(View.ACCOUNTING)}
          className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-1 rounded-2xl transition-all active:scale-95 ${
            currentView === View.ACCOUNTING ? 'bg-orange-50 text-orange-500' : 'text-gray-400 hover:bg-gray-50'
          }`}
        >
          <Receipt size={24} strokeWidth={currentView === View.ACCOUNTING ? 2.5 : 2} />
          <span className="text-[11px] font-bold">記帳</span>
        </button>

        <button
          onClick={() => onViewChange(View.CURRENCY)}
          className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-1 rounded-2xl transition-all active:scale-95 ${
            currentView === View.CURRENCY ? 'bg-green-50 text-green-600' : 'text-gray-400 hover:bg-gray-50'
          }`}
        >
          <Calculator size={24} strokeWidth={currentView === View.CURRENCY ? 2.5 : 2} />
          <span className="text-[11px] font-bold">匯率換算</span>
        </button>
      </div>
    </div>
  );
};