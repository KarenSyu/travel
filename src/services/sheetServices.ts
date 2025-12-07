// src/services/sheetService.ts
import Papa from 'papaparse';
import { Itinerary, DayPlan, Activity } from '../types'; // 假設你的型別定義在這裡

// 這是你剛剛給我的 CSV 網址
const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQrgmGdqW_izWuVlt19HWYZ6QOP5ZJKWZHwq1YVGPwqYDPC4iODs58eAnFtzXj5PyLfPdpby9Nlk6Hg/pub?output=csv';

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

export const fetchItineraryFromSheet = async (): Promise<Itinerary> => {
  return new Promise((resolve, reject) => {
    Papa.parse(GOOGLE_SHEET_CSV_URL, {
      download: true,
      header: true, // 告訴它第一行是標題
      complete: (results) => {
        const data = results.data as SheetRow[];
        
        // 開始把平面的表格資料，轉換成巢狀的 Itinerary 結構
        const daysMap = new Map<number, DayPlan>();

        data.forEach((row) => {
          // 過濾掉空行
          if (!row.dayNumber || !row.activityTitle) return;

          const dayNum = parseInt(row.dayNumber);

          // 如果這個「天」還沒建立過，就建立一個新的 Day 物件
          if (!daysMap.has(dayNum)) {
            daysMap.set(dayNum, {
              date: row.date,
              dayNumber: dayNum,
              title: row.dayTitle, // 注意：這裡用 CSV 裡的 dayTitle 對應 DayPlan 的 title
              activities: []
            });
          }

          // 建立活動物件
          const activity: Activity = {
            time: row.time,
            title: row.activityTitle,
            description: row.description,
            location: row.location,
            icon: row.icon,
            transportSuggestion: row.transportSuggestion
          };

          // 把活動加入那一天的活動列表
          daysMap.get(dayNum)?.activities.push(activity);
        });

        // 轉回陣列並依照天數排序
        const sortedDays = Array.from(daysMap.values()).sort((a, b) => a.dayNumber - b.dayNumber);

        resolve({ days: sortedDays });
      },
      error: (error) => {
        reject(error);
      }
    });
  });
};