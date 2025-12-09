import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Itinerary, DayPlan, Activity } from '../types';

interface ItineraryContextType {
  itinerary: Itinerary | null;
  loading: boolean;
  hasUnsavedChanges: boolean; // ✨ 新增：告訴 UI 有沒有未儲存的變更
  updateItinerary: (newItinerary: Itinerary) => void;
  saveChanges: () => Promise<void>;   // ✨ 新增：手動儲存
  revertChanges: () => void;          // ✨ 新增：還原變更
  // CRUD
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
  const [originalItinerary, setOriginalItinerary] = useState<Itinerary | null>(null); // ✨ 用來對照的原始檔

  // 初始化邏輯
  useEffect(() => {
    if (initialData) {
      setItinerary(initialData);
      setOriginalItinerary(JSON.parse(JSON.stringify(initialData))); // 建立副本作為基準點
      localStorage.setItem('okinawa_itinerary_2026_sheet_cache', JSON.stringify(initialData));
    } else {
      const cached = localStorage.getItem('okinawa_itinerary_2026_sheet_cache');
      if (cached) {
        try { 
          const parsed = JSON.parse(cached);
          setItinerary(parsed); 
          setOriginalItinerary(JSON.parse(JSON.stringify(parsed))); // 建立副本
        } catch (e) { console.error(e); }
      }
    }
  }, [initialData]);

  // 判斷是否有變更 (簡易比對)
  const hasUnsavedChanges = JSON.stringify(itinerary) !== JSON.stringify(originalItinerary);

  // ✨ 統一更新入口：只更新本地 State，不觸發上傳
  const updateItinerary = useCallback((newItinerary: Itinerary) => {
    //只更新畫面
    setItinerary(newItinerary);
    // 我們可以選擇是否要同步更新 localStorage 作為「Draft (草稿)」，
    // 但為了簡單符合你的「取消」需求，這裡我們先不覆寫 'sheet_cache'，
    // 這樣如果不小心重整網頁，就會回到上次存檔的狀態 (即變相的取消)。
  }, []);

  // ✨ 手動儲存到雲端(實際觸發同步雲端)
  const saveChanges = useCallback(async () => {
    if (!itinerary || !onSaveToSheet) return;
    
    try {
      console.log("Saving changes to Cloud...");
      await onSaveToSheet(itinerary);
      
      // 儲存成功後，把現在的狀態變成新的「原始狀態」
      setOriginalItinerary(JSON.parse(JSON.stringify(itinerary)));
      
      // 同步更新快取
      localStorage.setItem('okinawa_itinerary_2026_sheet_cache', JSON.stringify(itinerary));
      console.log("Changes saved and committed.");
    } catch (error) {
      console.error("Failed to save:", error);
      alert("儲存失敗，請檢查網路");
    }
  }, [itinerary, onSaveToSheet]);

  // ✨ 新增：取消/還原
  const revertChanges = useCallback(() => {
    if (originalItinerary) {
      // 恢復成原始狀態
      setItinerary(JSON.parse(JSON.stringify(originalItinerary)));
      console.log("Changes reverted.");
    }
  }, [originalItinerary]);

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
      hasUnsavedChanges, // 匯出這個狀態
      updateItinerary,
      saveChanges,       // 匯出儲存
      revertChanges,     // 匯出取消
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