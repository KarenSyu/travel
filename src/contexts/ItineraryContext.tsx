import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Itinerary, DayPlan } from '../types';
import { DEFAULT_ITINERARY } from '../constants';

interface ItineraryContextType {
  itinerary: Itinerary;
  updateItinerary: (newItinerary: Itinerary) => void;
  updateDayPlan: (dayIndex: number, newDayPlan: DayPlan) => void;
}

const ItineraryContext = createContext<ItineraryContextType | undefined>(undefined);

export const ItineraryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [itinerary, setItinerary] = useState<Itinerary>(DEFAULT_ITINERARY);

  useEffect(() => {
    const cached = localStorage.getItem('okinawa_itinerary_2026_hardcoded');
    if (cached) {
      try {
        setItinerary(JSON.parse(cached));
      } catch (e) {
        console.error("Failed to parse cached itinerary", e);
      }
    }
  }, []);

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
