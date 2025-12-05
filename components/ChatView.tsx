import React, { useState, useRef, useEffect } from 'react';
import { createChatSession } from '../services/geminiService';
import { useItinerary } from '../contexts/ItineraryContext';
import { ChatMessage, Activity } from '../types';
import { Send, User, Bot, Sparkles, CheckCircle } from 'lucide-react';
import { GenerateContentResponse } from '@google/genai';

export const ChatView: React.FC = () => {
  const { itinerary, updateDayPlan } = useItinerary();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: '你好！我是你的沖繩旅遊助手。我可以幫你修改行程、查詢美食。試試看說：「把第一天的晚餐改成燒肉」',
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatSessionRef = useRef<any>(null);

  useEffect(() => {
    // Initialize chat session
    chatSessionRef.current = createChatSession();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleToolCall = (functionCalls: any[]) => {
    let responseText = "";
    
    functionCalls.forEach(fc => {
      if (fc.name === 'update_itinerary_activity') {
        const { dayNumber, activityTitleToFind, newDetails } = fc.args;
        console.log("Executing Tool:", fc.name, fc.args);
        
        const dayPlan = itinerary.days.find(d => d.dayNumber === dayNumber);
        if (dayPlan) {
           const newActivities = [...dayPlan.activities];
           let index = -1;
           
           if (activityTitleToFind) {
             index = newActivities.findIndex(a => a.title.includes(activityTitleToFind));
           }

           if (index !== -1) {
             // Update existing
             newActivities[index] = { ...newActivities[index], ...newDetails };
             responseText = `已更新第 ${dayNumber} 天的「${newActivities[index].title}」。`;
           } else {
             // Add new if not found (simple logic)
             const newActivity: Activity = {
               time: newDetails.time || "TBD",
               title: newDetails.title || "New Activity",
               description: newDetails.description || "",
               location: newDetails.location || "",
               icon: newDetails.icon || "📍",
               transportSuggestion: newDetails.transportSuggestion
             };
             // Insert based on time sorting roughly or just append
             newActivities.push(newActivity);
             newActivities.sort((a, b) => a.time.localeCompare(b.time));
             responseText = `已在第 ${dayNumber} 天新增行程「${newActivity.title}」。`;
           }
           
           updateDayPlan(dayNumber, { ...dayPlan, activities: newActivities });
        } else {
          responseText = `找不到第 ${dayNumber} 天的行程。`;
        }
      }
    });
    return responseText;
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      // Send current itinerary summary as context (optional but helps model know what to update)
      // For efficiency, we just rely on tool logic or user prompt, but providing a brief context helps.
      const resultStream = await chatSessionRef.current.sendMessageStream({ message: userMsg.text });
      
      let fullResponseText = '';
      const responseMsgId = (Date.now() + 1).toString();
      
      setMessages(prev => [...prev, {
        id: responseMsgId,
        role: 'model',
        text: '',
        timestamp: Date.now()
      }]);

      for await (const chunk of resultStream) {
        const c = chunk as GenerateContentResponse;
        
        // Handle Tool Calls
        const functionCalls = c.candidates?.[0]?.content?.parts?.[0]?.functionCall ? [c.candidates[0].content.parts[0].functionCall] : 
                              c.functionCalls; // Check various locations depending on SDK version nuance
        
        if (functionCalls && functionCalls.length > 0) {
           const toolResult = handleToolCall(functionCalls);
           // Technically we should send this back to the model, but for a simple UI update we can just show the result text or a confirmation.
           // For this demo, we append the system confirmation to the chat.
           fullResponseText = toolResult; 
           
           // Send tool response back to model to close the loop (simplified)
           // In a full implementation, we'd use session.sendToolResponse
           // Here we just display the success message.
        } else {
           const textChunk = c.text || '';
           fullResponseText += textChunk;
        }

        setMessages(prev => prev.map(msg => 
          msg.id === responseMsgId ? { ...msg, text: fullResponseText } : msg
        ));
      }
    } catch (error) {
      console.error("Chat error", error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: '抱歉，發生錯誤。',
        timestamp: Date.now()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 pt-safe">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shrink-0 shadow-sm z-10">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Sparkles className="text-okinawa-blue w-5 h-5" />
          AI 導遊
        </h2>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-20 no-scrollbar">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex items-end gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-gray-200' : 'bg-okinawa-blue text-white'}`}>
                {msg.role === 'user' ? <User size={16} className="text-gray-600" /> : <Bot size={16} />}
              </div>
              <div 
                className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm
                  ${msg.role === 'user' 
                    ? 'bg-gray-800 text-white rounded-br-none' 
                    : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                  }`}
              >
                {msg.text}
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
           <div className="flex justify-start">
             <div className="flex items-end gap-2 max-w-[85%]">
               <div className="w-8 h-8 rounded-full bg-okinawa-blue text-white flex items-center justify-center shrink-0">
                 <Bot size={16} />
               </div>
               <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-none shadow-sm border border-gray-100">
                 <div className="flex space-x-1">
                   <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                   <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                   <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                 </div>
               </div>
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 p-4 pb-safe shrink-0 absolute bottom-0 w-full mb-[56px] md:mb-0 md:relative">
        <div className="flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="幫我把第一天晚餐改成..."
            className="flex-1 bg-transparent border-none outline-none text-sm py-1"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className={`p-1.5 rounded-full transition-colors ${input.trim() ? 'bg-okinawa-blue text-white' : 'bg-gray-300 text-gray-500'}`}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
