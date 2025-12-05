import { TripDetails, Itinerary } from './types';

// Data extracted from the user's image
export const TRIP_DATA: TripDetails = {
  outbound: {
    code: 'FD230',
    airline: '泰國亞航 (AirAsia)',
    depAirport: 'TPE 台灣桃園國際機場 T1',
    arrAirport: 'OKA 那霸機場 I',
    date: '2026-01-09',
    depTime: '2026-01-09T13:25:00',
    arrTime: '2026-01-09T15:55:00',
  },
  inbound: {
    code: 'FD231',
    airline: '泰國亞航 (AirAsia)',
    depAirport: 'OKA 那霸機場 I',
    arrAirport: 'TPE 台灣桃園國際機場 T1',
    date: '2026-01-12',
    depTime: '2026-01-12T16:55:00',
    arrTime: '2026-01-12T17:35:00',
  }
};

export const INITIAL_PROMPT_CONTEXT = `
You are a travel assistant for a trip to Okinawa, Japan.
Language: Traditional Chinese (Taiwan).
Travel Dates: Jan 9, 2026 to Jan 12, 2026.
Outbound: Arrive Okinawa 15:55 on Jan 9.
Inbound: Depart Okinawa 16:55 on Jan 12.
Accomodation: Naha city center (Kokusai Dori area).
Transportation Mode within Okinawa: Yui Rail (Monorail) and Walking ONLY. No car rental.
Focus: Food, sightseeing, and relaxation.
`;

export const DEFAULT_ITINERARY: Itinerary = {
  days: [
    {
      date: "2026-01-09",
      dayNumber: 1,
      title: "出發與抵達",
      activities: [
        {
          "time": "07:30",
          "title": "住家",
          "description": "起床！",
          "location": "",
          "icon": "🏠",
          "transportSuggestion": ""
        },
        {
          "time": "08:15",
          "title": "住家-> 台鐵太原站",
          "description": "",
          "location": "台鐵太原站",
          "icon": "🚆",
          "transportSuggestion": "步行 10 分鍾"
        },
        {
          "time": "08:38",
          "title": "台鐵新烏日站",
          "description": "區間車途經6站：精武-> 臺中火車站 -> 五權車站 ->大慶 ->烏日-> 新烏日。08:38-08:57)、(08:48-09:08)、(09:02-09:20)",
          "location": "台鐵太原站",
          "icon": "🚆",
          "transportSuggestion": "區間車 19 分鐘"
        },
        {
          "time": "08:57",
          "title": "台鐵新烏日站 -> 高鐵台中站",
          "description": "抵達新烏日火車站，沿著連通道步行至高鐵站大廳，準備登車。",
          "location": "台鐵新烏日站",
          "icon": "🚶",
          "transportSuggestion": "步行 5 分鐘至台中高鐵站"
        },
        {
          "time": "09:32",
          "title": "高鐵台中站 -> 高鐵桃園站",
          "description": "搭乘高鐵北上列車 616往南港，途經2站：新竹->桃園",
          "location": "高鐵台中站",
          "icon": "🚄",
          "transportSuggestion": "高鐵 37 分鐘"
        },
        {
          "time": "10:09",
          "title": "轉乘機捷",
          "description": "前往機場捷運 A18 ",
          "location": "高鐵桃園站",
          "icon": "🚶",
          "transportSuggestion": "步行 4 分鍾 + 等車"
        },
        {
          "time": "10:17",
          "title": "機場捷運 A18（桃園高鐵站） -> A12（第一航廈站） ",
          "description": "搭乘往台北車站、機場方向。搭乘普通車前往A12桃園國際機場 T1。(10:17-10:36)、(10:32-10:51)",
          "location": "機場捷運 A18 站",
          "icon": "🚇",
          "transportSuggestion": "機捷普通車 20 分鐘，抵達時間 10:36。"
        },
        {
          "time": "10:36",
          "title": "機捷 A12 -> 桃園機場 T1",
          "description": "前往桃園機場 T1",
          "location": "機場捷運 A12 站",
          "icon": "🚶",
          "transportSuggestion": "A12下車後需步行10分鐘，抵達T1。"
        },
        {
          "time": "10:47",
          "title": "桃園機場 T1",
          "description": "建議抵達時間。辦理 AirAsia 登機手續、托運行李 (需預留 2.5 小時處理登機手續及安檢)。",
          "location": "桃園國際機場第一航廈",
          "icon": "🛄",
          "transportSuggestion": "保險 10:50 checkin，最晚 11:25"
        },
        {
          "time": "12:55",
          "title": "前往登機門",
          "description": "保溫瓶裝開水，廉航不能外食，機票無附餐，預計 12:55 開始登機。",
          "location": "桃園國際機場第一航廈",
          "icon": "🧑‍✈️",
          "transportSuggestion": "步行至登機門"
        },
        {
          "time": "13:25",
          "title": "起飛，前往沖繩那霸",
          "description": "睡一下就到囉！",
          "location": "桃園國際機場第一航廈",
          "icon": "✈️",
          "transportSuggestion": "飛行 1.5 小時"
        },
        {
          time: "15:55",
          title: "抵達沖繩那霸機場",
          description: "入境檢查、提領行李。",
          location: "那霸機場",
          icon: "🛬",
          transportSuggestion: "入境約 1 小時"
        },
        {
          time: "17:00",
          title: "前往市區飯店",
          description: "搭乘單軌列車 (Yui Rail) 前往縣廳前站/美榮橋站。",
          location: "縣廳前站 Comfort Hotel Naha Prefectural Office",
          icon: "🚝",
          transportSuggestion: "單軌列車 15 分鐘"
        },
        {
          time: "18:30",
          title: "國際通晚餐",
          description: "享用沖繩麵或 Agu 豬火鍋，逛逛唐吉訶德。",
          location: "國際通",
          icon: "🍜",
          transportSuggestion: "步行 5 分鐘"
        }
      ]
    },
    {
      date: "2026-01-10",
      dayNumber: 2,
      title: "那霸市區巡禮",
      activities: [
        {
          time: "09:00",
          title: "波上宮參拜",
          description: "懸崖上的神社，沖繩八社之首，可順便去波之上海灘。",
          location: "波上宮",
          icon: "⛩️",
          transportSuggestion: "步行 20 分鐘"
        },
        {
          time: "12:00",
          title: "午餐：傑克牛排",
          description: "美式風格老牌牛排館 (Jack's Steak House)。",
          location: "Jack's Steak House",
          icon: "🥩",
          transportSuggestion: "步行 10 分鐘"
        },
        {
          time: "14:00",
          title: "首里城公園",
          description: "搭單軌至首里站。雖然正殿重建中，但周邊城牆與公園仍值得一看。",
          location: "首里城公園",
          icon: "🏯",
          transportSuggestion: "單軌列車 30 分鐘 + 步行 15 分鐘"
        },
        {
          time: "18:00",
          title: "新都心購物",
          description: "DFS 免稅店、3A Main Place 購物中心。",
          location: "Omoromachi 站",
          icon: "🛍️",
          transportSuggestion: "單軌列車 15 分鐘"
        }
      ]
    },
    {
      date: "2026-01-11",
      dayNumber: 3,
      title: "海濱與悠閒",
      activities: [
         {
          time: "09:00",
          title: "国際通り入口",
          description: "吃完飯店早餐出發",
          location: "国際通り入口",
          icon: "🥞",
          transportSuggestion: ""
        },
        {
          time: "10:00",
          title: "瀨長島 Umikaji Terrace",
          description: "地中海風情白色建築，看飛機起降，吃幸福鬆餅。",
          location: "瀨長島",
          icon: "🥞",
          transportSuggestion: "轉乘公車TK02（¥360）-> Senagajima Hotel Umikajiterrace"
        },
        {
          time: "15:00",
          title: "壺屋陶其通",
          description: "傳統陶藝街區，散步喝咖啡。",
          location: "壺屋やちむん通り入口広場",
          icon: "☕",
          transportSuggestion: "到單軌列車牧志站，下車後步行 15 分鐘"
        },
        {
          time: "18:00",
          title: "牧志公設市場",
          description: "體驗當地海鮮，現買現煮。",
          location: "第一牧志公設市場",
          icon: "🦞",
          transportSuggestion: "步行 10 分鐘"
        }
      ]
    },
    {
      date: "2026-01-12",
      dayNumber: 4,
      title: "回程",
      activities: [
        {
          time: "10:00",
          title: "最後採買 / 奧武山公園",
          description: "若有時間可去奧武山公園散步，或在國際通補貨。",
          location: "奧武山公園",
          icon: "🌳",
          transportSuggestion: "單軌列車 10 分鐘"
        },
        {
          time: "14:00",
          title: "前往那霸機場",
          description: "搭乘單軌列車前往機場，逛國內線航廈伴手禮。",
          location: "那霸機場",
          icon: "🚝",
          transportSuggestion: "單軌列車 15 分鐘"
        },
        {
          time: "16:55",
          title: "飛機起飛",
          description: "返回台灣。",
          location: "那霸機場",
          icon: "🛫",
          transportSuggestion: "飛行 1.5 小時"
        },
        {
          time: "17:35",
          title: "抵達桃園機場",
          description: "入境、提領行李。",
          location: "桃園國際機場",
          icon: "🛬",
          transportSuggestion: "-"
        },
        {
          time: "18:30",
          title: "桃園機場捷運 -> 高鐵桃園站",
          description: "搭乘機捷前往高鐵站。",
          location: "高鐵桃園站",
          icon: "🚇",
          transportSuggestion: "機捷 20 分鐘"
        },
        {
          time: "19:00",
          title: "高鐵桃園 -> 台中高鐵",
          description: "搭乘南下高鐵。",
          location: "台中高鐵站",
          icon: "🚄",
          transportSuggestion: "高鐵 40 分鐘"
        },
        {
          time: "19:50",
          title: "新烏日站 -> 太原站",
          description: "轉乘台鐵區間車返回溫暖的家。",
          location: "太原火車站",
          icon: "🏠",
          transportSuggestion: "區間車 20 分鐘"
        }
      ]
    }
  ]
};
