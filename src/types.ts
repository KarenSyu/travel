export enum View {
  ITINERARY = 'ITINERARY',
  CURRENCY = 'CURRENCY',
  ACCOUNTING = 'ACCOUNTING'
}

export interface Flight {
  code: string;
  airline: string;
  depAirport: string;
  arrAirport: string;
  depTime: string; // ISO string
  arrTime: string; // ISO string
  date: string;
}

export interface TripDetails {
  outbound: Flight;
  inbound: Flight;
}

export interface Activity {
  time: string;
  title: string;
  description: string;
  location: string;
  icon: string;
  transportSuggestion?: string; // e.g. "步行 5 分鐘" or "單軌列車 15 分鐘"
}

export interface DayPlan {
  date: string;
  dayNumber: number;
  title: string;
  activities: Activity[];
}

export interface Itinerary {
  days: DayPlan[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface Expense {
  id: string;
  item: string;
  amount: number; // JPY
  category: string;
  date: number; // timestamp
  note?: string;
}