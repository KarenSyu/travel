import React, { useState, useEffect } from 'react';
import { useItinerary } from '../contexts/ItineraryContext';
import { Plane, MapPin, Calendar, Smartphone, FileText, ExternalLink, Train, Footprints, Clock } from 'lucide-react';

export const ItineraryView: React.FC = () => {
  const { itinerary } = useItinerary();
  const [activeDay, setActiveDay] = useState<number>(1);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getFormattedTime = (timeZone: string) => {
    try {
      return new Intl.DateTimeFormat('en-US', {
        timeZone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).format(time);
    } catch (e) {
      return "--:--";
    }
  };

  const currentDayPlan = itinerary.days.find(d => d.dayNumber === activeDay);

  const getGoogleMapsUrl = (query: string) => {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 relative">
      {/* Header Image Area - Sticky */}
      <div className="relative h-44 w-full bg-blue-200 overflow-hidden shrink-0">
        <img 
          src="https://picsum.photos/800/400?random=1" 
          alt="Okinawa Header" 
          className="w-full h-full object-cover opacity-90"
        />
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-black/30 via-transparent to-gray-900/90 z-10"></div>
        
        {/* Dual Clocks */}
        <div className="absolute top-0 right-4 z-20 pt-safe mt-3 flex flex-col items-end gap-2">
          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/20 shadow-lg">
            <span className="text-lg mr-1 leading-none shadow-sm">🇯🇵</span>
            <div className="text-right">
              <div className="text-[10px] text-gray-200 font-medium leading-none mb-0.5">日本時間</div>
              <div className="text-white font-mono font-bold text-sm tracking-widest leading-none drop-shadow-md">{getFormattedTime('Asia/Tokyo')}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/20 shadow-lg">
            <span className="text-lg mr-1 leading-none shadow-sm">🇹🇼</span>
            <div className="text-right">
              <div className="text-[10px] text-gray-200 font-medium leading-none mb-0.5">台北時間</div>
              <div className="text-white font-mono font-bold text-sm tracking-widest leading-none drop-shadow-md">{getFormattedTime('Asia/Taipei')}</div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 w-full p-4 z-20">
          <h1 className="text-white text-2xl font-bold tracking-tight drop-shadow-md">沖繩之旅 Okinawa</h1>
          <p className="text-white/90 text-xs flex items-center gap-1 mt-1 font-medium">
            <Calendar size={12} /> 2026.01.09 - 01.12
          </p>
        </div>
      </div>

      {/* Day Tabs */}
      <div className="bg-white border-b border-gray-200 px-2 pt-2 sticky top-0 z-30 shadow-sm overflow-x-auto no-scrollbar">
        <div className="flex space-x-2 pb-2">
          {itinerary.days.map((day) => (
            <button
              key={day.dayNumber}
              onClick={() => setActiveDay(day.dayNumber)}
              className={`flex-1 min-w-[80px] py-2 px-3 rounded-xl text-center transition-all ${
                activeDay === day.dayNumber 
                  ? 'bg-okinawa-blue text-white shadow-md' 
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              <div className="text-xs opacity-80">Day {day.dayNumber}</div>
              <div className="text-sm font-bold whitespace-nowrap">{day.date.split('-').slice(1).join('/')}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Content Scroll Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-24 px-4 py-4 space-y-4">
        
        {/* Important Reminders (Only on Day 1) */}
        {activeDay === 1 && (
          <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-100 rounded-2xl p-4 shadow-sm">
            <h3 className="text-orange-800 font-bold mb-3 text-sm flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              出發前必辦事項
            </h3>
            <div className="space-y-3">
              <a 
                href="https://vjw-lp.digital.go.jp/zh-hant/" 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center justify-between bg-white p-3 rounded-xl border border-orange-200 active:scale-[0.98] transition-transform"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                    <FileText size={18} />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-gray-800 text-sm">填寫入境卡</div>
                    <div className="text-[10px] text-gray-500">Visit Japan Web</div>
                  </div>
                </div>
                <ExternalLink size={14} className="text-gray-400" />
              </a>

              <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-orange-200">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-2 rounded-full text-green-600">
                    <Smartphone size={18} />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-gray-800 text-sm">購買網卡/漫遊</div>
                    <div className="text-[10px] text-gray-500">確認已開通日本漫遊</div>
                  </div>
                </div>
                <div className="w-4 h-4 rounded-full border-2 border-gray-300"></div>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Timeline */}
        <div className="relative pl-2">
           {/* Vertical Line */}
           <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-gray-200"></div>
           {currentDayPlan?.activities.map((activity, idx) => (
             <div key={idx} className="relative mb-6 last:mb-0 group/card">

               <div className="flex gap-4">
                 {/* Timeline Node */}
                 <div className="relative z-10 shrink-0 mt-1">
                   <div className="w-8 h-8 rounded-full bg-white border-2 border-okinawa-blue flex items-center justify-center text-lg shadow-sm">
                     {activity.icon}
                   </div>
                 </div>

                 {/* Content Card (Read Only) */}
                 <div className="flex-1 min-w-0">
                    <div className="relative">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="font-mono text-lg font-bold text-okinawa-blue">{activity.time}</span>
                      </div>
                      
                      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 active:bg-gray-50 transition-colors relative">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-bold text-gray-800 text-base">{activity.title}</h4>
                          <div className="flex gap-2">
                             <a href={getGoogleMapsUrl(activity.location)} target="_blank" rel="noreferrer">
                               <ExternalLink size={14} className="text-gray-300 hover:text-okinawa-blue" />
                             </a>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
                          <MapPin size={12} className="text-okinawa-coral shrink-0" />
                          <span className="truncate">{activity.location}</span>
                        </div>
                        
                        <p className="text-sm text-gray-600 leading-relaxed border-t border-gray-50 pt-2 mt-1">
                          {activity.description}
                        </p>
                      </div>
                    </div>
                 </div>
               </div>
              {/* Transport info between nodes */}
                  {activity.transportSuggestion && (
                    <div className="ml-10 mb-2 flex items-center gap-2 text-[10px] text-gray-500 bg-gray-100/80 self-start px-2 py-1 rounded-md w-fit">
                      {activity.transportSuggestion.includes('步') ? <Footprints size={10} /> : <Train size={10} />}
                      {activity.transportSuggestion}
                    </div>
                  )}
             </div>
           ))}
        </div>
      </div>
    </div>
  );
};
