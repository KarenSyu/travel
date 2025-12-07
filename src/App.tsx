import React, { useState, useEffect } from 'react';
import { ItineraryView } from './components/ItineraryView';
import { CurrencyView } from './components/CurrencyView';
import { AccountingView } from './components/AccountingView';
import { BottomNav } from './components/BottomNav';
import { View, Itinerary } from './types'; // 記得確認這裡有匯入 Itinerary
import { ItineraryProvider } from './contexts/ItineraryContext';
import { fetchItineraryFromSheet } from './services/sheetServices';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// Error Boundary 保持不變
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  constructor(props: ErrorBoundaryProps) {
    super(props);
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("App Crash:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full w-full p-8 text-center bg-gray-50 font-sans">
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-red-100 max-w-sm">
            <h2 className="text-xl font-bold text-red-600 mb-2">發生錯誤</h2>
            <div className="text-xs text-left bg-gray-100 p-3 rounded border border-gray-200 overflow-auto max-h-32 mb-4 break-all">
              {this.state.error?.message || "Unknown Error"}
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-bold active:scale-95 transition-transform"
            >
              重新整理
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.ITINERARY);
  
  // 1. 新增：處理資料抓取的狀態
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // 2. 新增：在載入時抓取 Google Sheet 資料
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        console.log("開始抓取行程資料...");
        const data = await fetchItineraryFromSheet();
        setItinerary(data);
        console.log("行程資料抓取成功！", data);
      } catch (err) {
        console.error("Failed to load itinerary:", err);
        setFetchError(err instanceof Error ? err.message : "無法載入行程資料");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const renderView = () => {
    switch (currentView) {
      case View.ITINERARY:
        // 如果還在載入，ItineraryView 可能會拿不到資料
        // 但因為我們外面有 Loading 判斷，這裡其實已經安全了
        return <ItineraryView />;
      case View.CURRENCY:
        return <CurrencyView />;
      case View.ACCOUNTING:
        return <AccountingView />;
      default:
        return <ItineraryView />;
    }
  };

  // 3. 處理 Loading 畫面 (讓使用者知道正在下載資料)
  if (loading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-black text-white">
        <div className="animate-pulse text-xl font-bold">正在從雲端下載行程... ✈️</div>
        <div className="text-sm text-gray-400 mt-2">Connecting to Google Sheets</div>
      </div>
    );
  }

  // 4. 處理錯誤畫面 (如果 Google Sheet 讀不到)
  if (fetchError) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-6 rounded-xl shadow-lg text-center">
          <h2 className="text-red-600 font-bold mb-2">資料載入失敗</h2>
          <p className="text-gray-600 mb-4">{fetchError}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg"
          >
            重試
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      {/* 關鍵點：這裡需要把抓到的 itinerary 傳進去 Provider。
         注意：這需要你的 ItineraryContext 支援 initialData 屬性。
         如果不支援，你可以暫時把 Context 改掉，或是去修改 Context 檔案。
      */}
      <ItineraryProvider initialData={itinerary}>
        <div className="h-full w-full flex flex-col bg-gray-50 font-sans text-gray-900">
          <main className="flex-1 relative overflow-hidden">
            {renderView()}
          </main>
          <BottomNav currentView={currentView} onViewChange={setCurrentView} />
        </div>
      </ItineraryProvider>
    </ErrorBoundary>
  );
};

export default App;