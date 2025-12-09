import React, { useState, useEffect, useRef } from 'react';
import { useItinerary } from '../contexts/ItineraryContext';
import { 
  MapPin, Calendar, ExternalLink, Train, Footprints, 
  Loader2, Plus, GripVertical, Edit2, Trash2, Save, X, RotateCcw, Check
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Activity } from '../types';

// ✨ Helper Component: 簡單的 Modal 用於新增/編輯
const ActivityModal = ({ 
  isOpen, onClose, onSave, initialData 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSave: (data: Activity) => void; 
  initialData?: Activity 
}) => {
  const [formData, setFormData] = useState<Activity>({
    id: '', // 初始化空字串，儲存時再產生
    time: '10:00',
    title: '', 
    location: '', 
    description: '', 
    icon: '📍', 
    transportSuggestion: ''
  });

  useEffect(() => {
    if (isOpen && initialData) setFormData(initialData);
    else if (isOpen) setFormData({ 
      time: '10:00', 
      title: '', 
      location: '', 
      description: '', 
      icon: '📍', 
      transportSuggestion: '' 
    });
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <h3 className="text-lg font-bold mb-4">{initialData ? '編輯行程' : '新增行程'}</h3>
        <div className="space-y-3">
          <div className="flex gap-2">
            <input 
              type="time" 
              className="border p-2 rounded-lg w-full"
              value={formData.time}
              onChange={e => setFormData({...formData, time: e.target.value})}
            />
          </div>
          <div className="flex gap-2">
            <input 
              placeholder="標題 (例: 吃拉麵)" 
              className="border p-2 rounded-lg w-full"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
            />
          </div>
          <input 
            placeholder="地點/Google Maps 關鍵字" 
            className="border p-2 rounded-lg w-full"
            value={formData.location}
            onChange={e => setFormData({...formData, location: e.target.value})}
          />
           <div className="flex gap-2">
             <input 
              placeholder="Icon (emoji)" 
              className="border p-2 rounded-lg w-1/4 text-center"
              value={formData.icon}
              onChange={e => setFormData({...formData, icon: e.target.value})}
            />
             <input 
              placeholder="交通方式 (選填)" 
              className="border p-2 rounded-lg w-3/4"
              value={formData.transportSuggestion}
              onChange={e => setFormData({...formData, transportSuggestion: e.target.value})}
            />
           </div>
          <textarea 
            placeholder="備註/描述" 
            className="border p-2 rounded-lg w-full h-24"
            value={formData.description}
            onChange={e => setFormData({...formData, description: e.target.value})}
          />
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg">取消</button>
          <button 
            onClick={() => onSave(formData)} 
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-bold"
          >
            儲存
          </button>
        </div>
      </div>
    </div>
  );
};

export const ItineraryView: React.FC = () => {
  const {itinerary, loading, hasUnsavedChanges, saveChanges, revertChanges, moveActivity, addActivity, editActivity, deleteActivity } = useItinerary();
  const [activeDay, setActiveDay] = useState<number>(1);
  const [isEditMode, setIsEditMode] = useState(false); // ✨ 編輯模式開關

  // 建立一個 Ref 來綁定捲動區域
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  //日本、台灣當地時間
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getFormattedTime = (timeZone: string) => {
    try {
      return new Intl.DateTimeFormat('en-US', {
        timeZone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).format(time);
    } catch (e) {
      return "--:--";
    }
  };

  // 新增這個 Effect：當 activeDay 改變時，執行捲動歸零
  useEffect(() => {
    if (scrollContainerRef.current) {
      // scrollTo(0, 0) 是瞬間跳轉，比較適合切換分頁
      // 如果想要平滑滾動，可以改用 behavior: 'smooth'
      scrollContainerRef.current.scrollTo({
        top: 0,
        behavior: 'smooth' // 或 'auto' (瞬間跳轉)
      });
    }
  }, [activeDay]); // 監聽 activeDay

  // 處理儲存
  const handleSave = async () => {
    await saveChanges();
    setIsEditMode(false); // 儲存後自動退出編輯模式 (看個人喜好，也可不加)
  };

  // 處理取消
  const handleCancel = () => {
    // if (confirm('確定要放棄所有未儲存的變更嗎？')) {
      revertChanges();
      setIsEditMode(false);
    // }
  };
  
  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<{day: number, index: number, data: Activity} | null>(null);

  // --- 拖曳處理 ---
  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return; // 拖到不知名的地方

    // DroppableId 格式為 "day-1", "day-2" -> 解析出數字
    const sourceDayNum = parseInt(source.droppableId.replace('day-', ''));
    const destDayNum = parseInt(destination.droppableId.replace('day-', ''));

    moveActivity(sourceDayNum, source.index, destDayNum, destination.index);
  };

  // --- CRUD Handlers ---
  const handleAddNew = () => {
    setEditingItem(null); // Clear editing state
    setModalOpen(true);
  };

  const handleEditClick = (dayNum: number, index: number, activity: Activity) => {
    setEditingItem({ day: dayNum, index, data: activity });
    setModalOpen(true);
  };

  const handleSaveModal = (data: Activity) => {
    const activityToSave = { ...data };
    
    // 如果沒有 ID (表示是新增的)，就幫它產生一個
    if (!activityToSave.id) {
        activityToSave.id = `new-${Date.now()}`;
    }

    if (editingItem) {
      editActivity(editingItem.day, editingItem.index, activityToSave);
    } else {
      addActivity(activeDay, activityToSave);
    }
    setModalOpen(false);
  };



  if (loading || !itinerary) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-blue-400" /></div>;
  }

  // 確保 activeDay 存在
  const safeActiveDay = itinerary.days.find(d => d.dayNumber === activeDay) ? activeDay : itinerary.days[0]?.dayNumber || 1;
  const currentDayPlan = itinerary.days.find(d => d.dayNumber === safeActiveDay);

  const getGoogleMapsUrl = (query: string) => {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  };

  const clickDay = (day) => {
     setActiveDay(day.dayNumber);
      console.log("clickDay", day);
  }


  return (
    <div className="flex flex-col h-full bg-gray-50 relative">
      <div className="relative h-44 w-full bg-blue-200 overflow-hidden shrink-0 z-30">
        <img 
          src="https://picsum.photos/800/400?random=1" 
          alt="Okinawa Header" 
          className="w-full h-full object-cover opacity-90"
        />
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-black/30 via-transparent to-gray-900/90 z-10"></div>
        
        {/* Dual Clocks */}
        <div className="absolute top-0 right-4 z-20 pt-safe mt-3 flex flex-col items-end gap-2">
          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/20 shadow-lg">
            <span className="text-lg mr-1 leading-none shadow-sm">🇯🇵</span>
            <div className="text-right">
              <div className="text-[10px] text-gray-200 font-medium leading-none mb-0.5">日本時間</div>
              <div className="text-white font-mono font-bold text-sm tracking-widest leading-none drop-shadow-md">{getFormattedTime('Asia/Tokyo')}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/20 shadow-lg">
            <span className="text-lg mr-1 leading-none shadow-sm">🇹🇼</span>
            <div className="text-right">
              <div className="text-[10px] text-gray-200 font-medium leading-none mb-0.5">台北時間</div>
              <div className="text-white font-mono font-bold text-sm tracking-widest leading-none drop-shadow-md">{getFormattedTime('Asia/Taipei')}</div>
            </div>
          </div>
        </div>

        {/* 標題 */}
        <div className="absolute bottom-0 left-0 w-full p-4 z-20">
           <h1 className="text-white text-2xl font-bold tracking-tight drop-shadow-md">{itinerary.title}</h1>
            <p className="text-white/90 text-xs flex items-center gap-1 mt-1 font-medium">
              <Calendar size={12} /> 
              {itinerary.days[0]?.date} - { itinerary.days[itinerary.days.length - 1]?.date.slice(-5)}
            </p>
        </div>

        {/* 編輯/儲存及取消 */}
        <div className="absolute bottom-0 right-0 w-1/2 p-4 z-20">
          <button 
                onClick={() => setIsEditMode(true)}
                className={`absolute bottom-5 right-5 p-2 rounded-full transition-colors ${
                  isEditMode ? 'hidden' : 'bg-white/20 text-white hover:bg-white/30'
                }`}
                title = "進入編輯模式"
              >
            <Edit2 size={20} />
          </button>
                

          {isEditMode && (
            <>
              <button 
                onClick={handleSave}
                className="absolute bottom-5 right-5 flex items-end gap-1 px-3 py-2 bg-green-500/80 hover:bg-green-500 text-white rounded-lg text-sm font-bold backdrop-blur-sm shadow-lg transition-colors"
              >
                <Save size={16} /> 儲存
              </button>
              <button 
                onClick={handleCancel}
                className="absolute bottom-5 right-[100px] flex gap-1 px-3 py-2 bg-red-500/80 hover:bg-red-500 text-white rounded-lg text-sm font-medium backdrop-blur-sm transition-colors"
              >
                <X size={16} /> 取消
              </button>
            </>
          )}

          <p className="absolute bottom-0 right-5  text-white/90 text-xs flex items-center gap-1 mt-1 font-medium text-right">
            {hasUnsavedChanges ? '⚠️ 有未儲存的變更' : ''}
          </p>

        </div>
      </div>


      {/* Day Tabs */}
      <div className="bg-white border-b border-gray-200 px-2 pt-2 sticky top-0 z-30 shadow-sm overflow-x-auto no-scrollbar">
        <div className="flex space-x-2 pb-2">
          {itinerary.days.map((day) => (
            <button
              key={day.dayNumber}
              onClick={() => clickDay(day)}
              className={`flex-1 min-w-[80px] py-2 px-3 rounded-xl text-center transition-all ${
                safeActiveDay === day.dayNumber 
                  ? 'bg-blue-500 text-white shadow-md' 
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              <div className="text-xs opacity-80">Day {day.dayNumber}</div>
              <div className="text-sm font-bold whitespace-nowrap">
                {day.date.split('-').slice(1).join('/')}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Content Area with Drag & Drop */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-2 py-4" ref={scrollContainerRef}>
        <div className="relative w-full pl-10">
            {/* ✨ 新增行程的按鈕 (只在編輯模式顯示) */}
            {isEditMode && (
              <button 
                onClick={handleAddNew}
                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-2xl flex items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors"
              >
                <Plus size={20} className="mr-2" /> 新增行程
              </button>
            )}
        </div>
       
        <DragDropContext onDragEnd={onDragEnd}>
          {/* 我們只顯示當前的 Day，但如果要做並排拖曳，這裡邏輯要改。手機版通常一次看一天。 */}
          <Droppable droppableId={`day-${safeActiveDay}`}>
            {(provided) => (
              <div 
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-4 pl-2"
              >
                
                {/* Vertical Line */}
                <div className="absolute left-[30px] top-0 bottom-0 w-0.5 bg-gray-200"></div>
                
                {currentDayPlan?.activities.map((activity, index) => (
                  <Draggable 
                    key={activity.id} // Key 必須唯一
                    draggableId={activity.id} 
                    index={index}
                    isDragDisabled={!isEditMode} // 只有編輯模式可以拖曳
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`relative group ${snapshot.isDragging ? 'z-50 opacity-90 scale-105' : ''}`}
                        style={provided.draggableProps.style}
                      >
                        <div className="flex gap-4">
                          {/* Node / Drag Handle */}
                          <div 
                            {...provided.dragHandleProps}
                            className="relative z-10 shrink-0 mt-1 cursor-grab active:cursor-grabbing"
                          >
                            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-lg shadow-sm transition-colors ${
                              isEditMode ? 'bg-yellow-50 border-yellow-400' : 'bg-white border-blue-500'
                            }`}>
                              {isEditMode ? <GripVertical size={16} className="text-yellow-600" /> : (activity.icon || '📍')}
                            </div>
                          </div>

                          {/* Card Content */}
                          <div className="flex-1 min-w-0">
                             <div className="relative">
                               <div className="flex justify-between items-baseline gap-2 mb-1">
                                 <span className="font-mono text-lg font-bold text-blue-600">{activity.time}</span>
                                 
                                 {/* ✨ 編輯/刪除按鈕 (只在編輯模式顯示) */}
                                 {isEditMode && (
                                   <div className="flex gap-2">
                                     <button 
                                       onClick={() => handleEditClick(safeActiveDay, index, activity)}
                                       className="p-1.5 bg-gray-100 rounded-full text-gray-600 hover:bg-blue-100 hover:text-blue-600"
                                     >
                                       <Edit2 size={14} />
                                     </button>
                                     <button 
                                       onClick={() => deleteActivity(safeActiveDay, index)}
                                       className="p-1.5 bg-gray-100 rounded-full text-gray-600 hover:bg-red-100 hover:text-red-600"
                                     >
                                       <Trash2 size={14} />
                                     </button>
                                   </div>
                                 )}
                               </div>
                               
                               <div className={`bg-white rounded-2xl p-4 shadow-sm border transition-colors ${
                                 isEditMode ? 'border-dashed border-gray-300' : 'border-gray-100'
                               }`}>
                                 <div className="flex justify-between items-start mb-1">
                                  <h4 className="font-bold text-gray-800 text-base">{activity.title}</h4>
                                  <div className="flex gap-2">
                                    <a href={getGoogleMapsUrl(activity.location)} target="_blank" rel="noreferrer">
                                      <ExternalLink size={14} className="text-gray-300 hover:text-okinawa-blue" />
                                    </a>
                                  </div>
                                </div>
                                 <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
                                   <MapPin size={12} className="shrink-0" />
                                   <span className="truncate">{activity.location}</span>
                                 </div>
                                 <p className="text-sm text-gray-600 leading-relaxed border-t border-gray-50 pt-2 mt-1">
                                   {activity.description}
                                 </p>
                               </div>
                             </div>
                             
                             {/* Transport Info */}
                             {activity.transportSuggestion && (
                               <div className="ml-2 mt-2 flex items-center gap-2 text-[10px] text-gray-500 bg-gray-100 px-2 py-1 rounded-md w-fit">
                                 <Train size={10} /> {activity.transportSuggestion}
                               </div>
                             )}
                          </div>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}

              </div>
            )}
          </Droppable>
        </DragDropContext>

        {/* 底部保留空間 */}
        <div className="h-20"></div>
      </div>

      {/* Modal */}
      <ActivityModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        onSave={handleSaveModal}
        initialData={editingItem?.data}
      />
    </div>
  );
};