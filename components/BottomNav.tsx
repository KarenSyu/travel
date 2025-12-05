import React from 'react';
import { View } from '../types';
import { CalendarDays, MessageCircle, Camera } from 'lucide-react';

interface BottomNavProps {
  currentView: View;
  onViewChange: (view: View) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentView, onViewChange }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-200 pb-safe pt-2 px-6 z-50">
      <div className="flex justify-around items-center h-14">
        <button
          onClick={() => onViewChange(View.ITINERARY)}
          className={`flex flex-col items-center gap-1 transition-colors ${
            currentView === View.ITINERARY ? 'text-okinawa-blue' : 'text-gray-400'
          }`}
        >
          <CalendarDays size={24} strokeWidth={currentView === View.ITINERARY ? 2.5 : 2} />
          <span className="text-[10px] font-medium">行程</span>
        </button>

        <button
          onClick={() => onViewChange(View.PHOTO)}
          className={`flex flex-col items-center gap-1 transition-colors ${
            currentView === View.PHOTO ? 'text-okinawa-blue' : 'text-gray-400'
          }`}
        >
          <Camera size={24} strokeWidth={currentView === View.PHOTO ? 2.5 : 2} />
          <span className="text-[10px] font-medium">相機</span>
        </button>

        <button
          onClick={() => onViewChange(View.CHAT)}
          className={`flex flex-col items-center gap-1 transition-colors ${
            currentView === View.CHAT ? 'text-okinawa-blue' : 'text-gray-400'
          }`}
        >
          <MessageCircle size={24} strokeWidth={currentView === View.CHAT ? 2.5 : 2} />
          <span className="text-[10px] font-medium">問 AI</span>
        </button>
      </div>
    </div>
  );
};
