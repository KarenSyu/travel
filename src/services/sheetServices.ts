import Papa from 'papaparse';
import { Itinerary, DayPlan, Activity } from '../types';

// 1. 原本的 CSV 網址 (用於快速讀取)
const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQrgmGdqW_izWuVlt19HWYZ6QOP5ZJKWZHwq1YVGPwqYDPC4iODs58eAnFtzXj5PyLfPdpby9Nlk6Hg/pub?output=csv';

// 2. ✨ 新增: Google Apps Script Web App 網址 (用於寫入)
// ⚠️ 請注意：這需要你部署 GAS 後取得，稍後我會教你怎麼做
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzVc9Rql_PTxp3yJ_rimPF8ESsMD0k41mXYw6WY-PrOzkTC2adk65f8kQsq2vNNHP0v/exec';

interface SheetRow {
  dayNumber: string;
  date: string;
  dayTitle: string;
  time: string;
  activityTitle: string;
  description: string;
  location: string;
  icon: string;
  transportSuggestion: string;
}

// --- 讀取功能 (保持不變) ---
export const fetchItineraryFromSheet = async (): Promise<Itinerary> => {
  return new Promise((resolve, reject) => {
    Papa.parse(GOOGLE_SHEET_CSV_URL, {
      download: true,
      header: true,
      complete: (results) => {
        const data = results.data as SheetRow[];
        const daysMap = new Map<number, DayPlan>();

        data.forEach((row) => {
          if (!row.dayNumber || !row.activityTitle) return;
          const dayNum = parseInt(row.dayNumber);

          if (!daysMap.has(dayNum)) {
            daysMap.set(dayNum, {
              date: row.date,
              dayNumber: dayNum,
              title: row.dayTitle || `Day ${dayNum}`, // 防呆
              activities: []
            });
          }

          const activity: Activity = {
            id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            time: row.time,
            title: row.activityTitle,
            description: row.description,
            location: row.location,
            icon: row.icon,
            transportSuggestion: row.transportSuggestion
          };

          daysMap.get(dayNum)?.activities.push(activity);
        });

        const sortedDays = Array.from(daysMap.values()).sort((a, b) => a.dayNumber - b.dayNumber);
        
        // 如果完全沒資料 (可能是全空)，回傳基本結構避免壞掉
        if (sortedDays.length === 0) {
           resolve({ days: [], title: 'My Trip' });
        } else {
           resolve({ days: sortedDays, title: '沖繩之旅 Okinawa' }); // Title 可以另外存或寫死
        }
      },
      error: (error) => {
        reject(error);
      }
    });
  });
};

// --- ✨ 新增: 寫入功能 ---
export const saveItineraryToSheet = async (itinerary: Itinerary): Promise<void> => {
  // 1. 將巢狀資料 (Itinerary) 攤平為 表格資料 (SheetRow[])
  const rows: SheetRow[] = [];

  itinerary.days.forEach((day) => {
    day.activities.forEach((activity) => {
      rows.push({
        dayNumber: day.dayNumber.toString(),
        date: day.date,
        dayTitle: day.title || '', // 確保每一行都有 Day Title
        time: activity.time,
        activityTitle: activity.title,
        description: activity.description || '',
        location: activity.location || '',
        icon: activity.icon || '',
        transportSuggestion: activity.transportSuggestion || ''
      });
    });
  });

  // 2. 發送 POST 請求給 Google Apps Script
  // 注意：Google Apps Script 的 doPost 需要特定的設定才能處理 CORS
  // 這裡我們用 'no-cors' 雖然收不到回傳值，但能成功寫入。
  // 若要正確收到回傳，GAS 端回傳時需要設定 Header。
  
  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8', // GAS 偏好 text/plain 避免複雜的 CORS preflight
      },
      body: JSON.stringify({
        action: 'save',
        data: rows
      }),
    });

    const result = await response.json();
    if (result.status !== 'success') {
       throw new Error('Google Sheet update failed');
    }
  } catch (error) {
    console.error('Error saving to sheet:', error);
    throw error;
  }
};