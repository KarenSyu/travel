import React, { useState } from 'react';
import { ItineraryView } from './components/ItineraryView';
import { CurrencyView } from './components/CurrencyView';
import { AccountingView } from './components/AccountingView';
import { BottomNav } from './components/BottomNav';
import { View } from './types';
import { ItineraryProvider } from './contexts/ItineraryContext';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// Simple Error Boundary to catch crashes
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

  const renderView = () => {
    switch (currentView) {
      case View.ITINERARY:
        return <ItineraryView />;
      case View.CURRENCY:
        return <CurrencyView />;
      case View.ACCOUNTING:
        return <AccountingView />;
      default:
        return <ItineraryView />;
    }
  };

  return (
    <ErrorBoundary>
      <ItineraryProvider>
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