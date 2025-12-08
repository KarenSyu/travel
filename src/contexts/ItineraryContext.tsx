import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Itinerary, DayPlan } from '../types';
// import { DEFAULT_ITINERARY } from '../constants';

interface ItineraryContextType {
  itinerary: Itinerary | null; // 允許為 null (表示還沒載入)
  loading: boolean;            // ✨ 新增: 讓 UI 知道是否正在載入
  error: string | null;
  updateItinerary: (newItinerary: Itinerary) => void;
  updateDayPlan: (dayIndex: number, newDayPlan: DayPlan) => void;
}

const ItineraryContext = createContext<ItineraryContextType | undefined>(undefined);

// ✨ 修改 1: 定義 Props 型別，加入 initialData (設為可選 ?)
interface ItineraryProviderProps {
  children: ReactNode;
  initialData?: Itinerary | null; // 這是從 App.tsx 傳進來的 Google Sheet 資料
  isLoading?: boolean;            // App.tsx 告訴我們是否還在抓資料
}

// ✨ 修改 2: 在參數中解構出 initialData
export const ItineraryProvider: React.FC<ItineraryProviderProps> = ({ children, initialData, isLoading = true }) => {
  
  // 1. 初始化 State logic:
  // 嘗試從 LocalStorage 讀取舊資料當作「暫時畫面」，不使用 DEFAULT_ITINERARY
  const [itinerary, setItinerary] = useState<Itinerary | null>(() => {
    // 如果 App.tsx 已經把資料傳進來了，直接用
    if (initialData) return initialData;

    // 否則，嘗試讀取快取 (Offline support)
    const cached = localStorage.getItem('okinawa_itinerary_2026_sheet_cache');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        console.error("Failed to parse cached itinerary", e);
        return null;
      }
    }
    return null;
  });

  // 2. 當 Google Sheet 資料 (initialData) 改變時的 Effect
  useEffect(() => {
    if (initialData) {
      console.log("Google Sheet data received, updating context...");
      setItinerary(initialData);
      // 更新快取，並改用新的 key 避免混淆
      localStorage.setItem('okinawa_itinerary_2026_sheet_cache', JSON.stringify(initialData));
    }
  }, [initialData]);

  const updateItinerary = (newItinerary: Itinerary) => {
    setItinerary(newItinerary);
    localStorage.setItem('okinawa_itinerary_2026_sheet_cache', JSON.stringify(newItinerary));
  };

  const updateDayPlan = (dayIndex: number, newDayPlan: DayPlan) => {
    if (!itinerary) return; // 防呆

    const newItinerary = { ...itinerary };
    const arrayIndex = newItinerary.days.findIndex(d => d.dayNumber === newDayPlan.dayNumber);
    
    if (arrayIndex !== -1) {
       newItinerary.days[arrayIndex] = newDayPlan;
    } else {
       if (newItinerary.days[dayIndex]) {
         newItinerary.days[dayIndex] = newDayPlan;
       }
    }
    updateItinerary(newItinerary);
  };

  return (
    <ItineraryContext.Provider value={{ 
      itinerary, 
      updateItinerary, 
      updateDayPlan,
      // 如果沒有 itinerary 資料 且 外部還在 loading，才算真正的 loading 狀態
      // (這樣如果我們有快取資料，使用者就不會看到 Loading 轉圈圈，體驗較好)
      loading: isLoading && !itinerary, 
      error: null
    }}>
      {children}
    </ItineraryContext.Provider>
  );
};

export const useItinerary = () => {
  const context = useContext(ItineraryContext);
  if (context === undefined) {
    throw new Error('useItinerary must be used within an ItineraryProvider');
  }
  return context;
};