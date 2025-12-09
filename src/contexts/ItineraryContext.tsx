import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Itinerary, DayPlan, Activity } from '../types';

interface ItineraryContextType {
  itinerary: Itinerary | null;
  loading: boolean;
  updateItinerary: (newItinerary: Itinerary) => void;
  addActivity: (dayNumber: number, activity: Activity) => void;
  editActivity: (dayNumber: number, activityIndex: number, updatedActivity: Activity) => void;
  deleteActivity: (dayNumber: number, activityIndex: number) => void;
  moveActivity: (sourceDayNum: number, sourceIndex: number, destDayNum: number, destIndex: number) => void;
}

const ItineraryContext = createContext<ItineraryContextType | undefined>(undefined);

interface ItineraryProviderProps {
  children: ReactNode;
  initialData?: Itinerary | null;
  isLoading?: boolean;
  onSaveToSheet?: (itinerary: Itinerary) => Promise<void>; // 這是 App.tsx 傳進來的儲存函數
}

export const ItineraryProvider: React.FC<ItineraryProviderProps> = ({ 
  children, 
  initialData, 
  isLoading = true,
  onSaveToSheet // ✨ 確保這裡有接收到
}) => {
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);

  // 初始化邏輯
  useEffect(() => {
    if (initialData) {
      setItinerary(initialData);
      localStorage.setItem('okinawa_itinerary_2026_sheet_cache', JSON.stringify(initialData));
    } else {
      const cached = localStorage.getItem('okinawa_itinerary_2026_sheet_cache');
      if (cached) {
        try { setItinerary(JSON.parse(cached)); } catch (e) { console.error(e); }
      }
    }
  }, [initialData]);

  // ✨ 核心修正 1: 統一更新入口
  const updateItinerary = useCallback((newItinerary: Itinerary) => {
    // 1. 先更新畫面 (讓使用者覺得很快)
    setItinerary(newItinerary);
    
    // 2. 更新 LocalStorage
    localStorage.setItem('okinawa_itinerary_2026_sheet_cache', JSON.stringify(newItinerary));
    
    // 3. ✨ 觸發雲端儲存 (這就是你之前缺少的！)
    if (onSaveToSheet) {
      console.log("Triggering Cloud Save..."); // 除錯用
      onSaveToSheet(newItinerary).catch(err => {
        console.error("Cloud save failed:", err);
        // 這裡未來可以加一個 Toast 提示使用者儲存失敗
      });
    }
  }, [onSaveToSheet]);

  // --- CRUD 實作 (現在都統一呼叫 updateItinerary) ---

  const addActivity = (dayNumber: number, activity: Activity) => {
    if (!itinerary) return;
    const newItinerary = JSON.parse(JSON.stringify(itinerary)); // 深拷貝
    const day = newItinerary.days.find((d: DayPlan) => d.dayNumber === dayNumber);
    if (day) {
      day.activities.push(activity);
      updateItinerary(newItinerary); // 呼叫統一入口
    }
  };

  const editActivity = (dayNumber: number, activityIndex: number, updatedActivity: Activity) => {
    if (!itinerary) return;
    const newItinerary = JSON.parse(JSON.stringify(itinerary));
    const day = newItinerary.days.find((d: DayPlan) => d.dayNumber === dayNumber);
    if (day && day.activities[activityIndex]) {
      day.activities[activityIndex] = updatedActivity;
      updateItinerary(newItinerary); // 呼叫統一入口
    }
  };

  const deleteActivity = (dayNumber: number, activityIndex: number) => {
    if (!itinerary) return;
    const newItinerary = JSON.parse(JSON.stringify(itinerary));
    const day = newItinerary.days.find((d: DayPlan) => d.dayNumber === dayNumber);
    if (day) {
      day.activities.splice(activityIndex, 1);
      updateItinerary(newItinerary); // 呼叫統一入口
    }
  };

  // ✨ 核心修正 2: moveActivity 也要呼叫 updateItinerary
  const moveActivity = (sourceDayNum: number, sourceIndex: number, destDayNum: number, destIndex: number) => {
    if (!itinerary) return;

    // 深拷貝一份資料 (確保 React 偵測到變化)
    const newItinerary = JSON.parse(JSON.stringify(itinerary));

    const sourceDay = newItinerary.days.find((d: DayPlan) => d.dayNumber === sourceDayNum);
    const destDay = newItinerary.days.find((d: DayPlan) => d.dayNumber === destDayNum);

    if (!sourceDay || !destDay) return;

    // 移動邏輯
    const [movedActivity] = sourceDay.activities.splice(sourceIndex, 1);
    destDay.activities.splice(destIndex, 0, movedActivity);

    // ✨ 關鍵：把計算完的結果傳給 updateItinerary，它會幫你存到雲端
    updateItinerary(newItinerary);
  };

  return (
    <ItineraryContext.Provider value={{ 
      itinerary, 
      loading: isLoading && !itinerary, 
      updateItinerary,
      addActivity,
      editActivity,
      deleteActivity,
      moveActivity
    }}>
      {children}
    </ItineraryContext.Provider>
  );
};

export const useItinerary = () => {
    const context = useContext(ItineraryContext);
    if (context === undefined) throw new Error('useItinerary must be used within an ItineraryProvider');
    return context;
};