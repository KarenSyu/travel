import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Itinerary, DayPlan } from '../types';
import { DEFAULT_ITINERARY } from '../constants';

interface ItineraryContextType {
  itinerary: Itinerary;
  updateItinerary: (newItinerary: Itinerary) => void;
  updateDayPlan: (dayIndex: number, newDayPlan: DayPlan) => void;
}

const ItineraryContext = createContext<ItineraryContextType | undefined>(undefined);

// ✨ 修改 1: 定義 Props 型別，加入 initialData (設為可選 ?)
interface ItineraryProviderProps {
  children: ReactNode;
  initialData?: Itinerary | null;
}

// ✨ 修改 2: 在參數中解構出 initialData
export const ItineraryProvider: React.FC<ItineraryProviderProps> = ({ children, initialData }) => {
  
  // 初始化時，如果有傳入 initialData 就優先使用，否則使用 DEFAULT_ITINERARY
  const [itinerary, setItinerary] = useState<Itinerary>(initialData || DEFAULT_ITINERARY);

  // 這是你原本的邏輯 (讀取 LocalStorage 快取)
  useEffect(() => {
    // 如果沒有外部傳入的資料 (例如離線時)，才嘗試讀取快取
    // 這樣可以避免快取舊資料蓋過 Google Sheet 的新資料
    if (!initialData) {
      const cached = localStorage.getItem('okinawa_itinerary_2026_hardcoded');
      if (cached) {
        try {
          setItinerary(JSON.parse(cached));
        } catch (e) {
          console.error("Failed to parse cached itinerary", e);
        }
      }
    }
  }, [initialData]); // 加入依賴

  // ✨ 修改 3: 新增這個 Effect，監聽外部傳入的資料
  // 當 App.tsx 抓完 Google Sheet 資料後，這裡會收到通知並更新狀態
  useEffect(() => {
    if (initialData) {
      setItinerary(initialData);
      // 同步更新到 LocalStorage，這樣下次離線開啟時也能看到最新版
      localStorage.setItem('okinawa_itinerary_2026_hardcoded', JSON.stringify(initialData));
    }
  }, [initialData]);

  const updateItinerary = (newItinerary: Itinerary) => {
    setItinerary(newItinerary);
    localStorage.setItem('okinawa_itinerary_2026_hardcoded', JSON.stringify(newItinerary));
  };

  const updateDayPlan = (dayIndex: number, newDayPlan: DayPlan) => {
    const newItinerary = { ...itinerary };
    // Find the correct index in array or map by dayNumber
    const arrayIndex = newItinerary.days.findIndex(d => d.dayNumber === newDayPlan.dayNumber);
    if (arrayIndex !== -1) {
       newItinerary.days[arrayIndex] = newDayPlan;
    } else {
       // fallback if dayIndex is array index
       if (newItinerary.days[dayIndex]) {
         newItinerary.days[dayIndex] = newDayPlan;
       }
    }
    updateItinerary(newItinerary);
  };

  return (
    <ItineraryContext.Provider value={{ itinerary, updateItinerary, updateDayPlan }}>
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