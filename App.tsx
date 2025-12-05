import React, { useState } from 'react';
import { ItineraryView } from './components/ItineraryView';
import { ChatView } from './components/ChatView';
import { PhotoView } from './components/PhotoView';
import { BottomNav } from './components/BottomNav';
import { View } from './types';
import { ItineraryProvider } from './contexts/ItineraryContext';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.ITINERARY);

  const renderView = () => {
    switch (currentView) {
      case View.ITINERARY:
        return <ItineraryView />;
      case View.CHAT:
        return <ChatView />;
      case View.PHOTO:
        return <PhotoView />;
      default:
        return <ItineraryView />;
    }
  };

  return (
    <ItineraryProvider>
      <div className="h-full w-full flex flex-col bg-gray-50 font-sans text-gray-900">
        <main className="flex-1 relative overflow-hidden">
          {renderView()}
        </main>
        <BottomNav currentView={currentView} onViewChange={setCurrentView} />
      </div>
    </ItineraryProvider>
  );
};

export default App;
