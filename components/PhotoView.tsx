import React, { useState } from 'react';
import { analyzePhoto } from '../services/geminiService';
import { Camera, Image as ImageIcon, Loader2, UploadCloud, Sparkles } from 'lucide-react';

export const PhotoView: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Strip prefix for Gemini API if needed, though most client libs handle it. 
        // @google/genai inlineData expects pure base64 usually, so let's strip the data:image... part.
        const base64Data = base64String.split(',')[1];
        setImage(base64String); // For display
        analyze(base64Data);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyze = async (base64Data: string) => {
    setAnalyzing(true);
    setAnalysis(null);
    try {
      const result = await analyzePhoto(base64Data);
      setAnalysis(result || "無法分析此圖片。");
    } catch (error) {
      setAnalysis("分析失敗，請檢查網路連線或稍後再試。");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 pt-safe overflow-y-auto no-scrollbar pb-24">
      <div className="px-6 py-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">圖片分析</h2>
        <p className="text-gray-500 text-sm mb-6">拍攝或上傳照片，讓 AI 告訴你這是哪裡、或翻譯菜單。</p>

        {!image ? (
          <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-2xl bg-white cursor-pointer hover:bg-gray-50 transition-colors">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <UploadCloud className="w-12 h-12 text-gray-400 mb-3" />
              <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">點擊上傳</span> 或拖放圖片</p>
              <p className="text-xs text-gray-500">支援 JPG, PNG</p>
            </div>
            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
          </label>
        ) : (
          <div className="relative w-full rounded-2xl overflow-hidden shadow-md mb-6 bg-black">
            <img src={image} alt="Uploaded" className="w-full h-auto max-h-[400px] object-contain mx-auto" />
            <button 
              onClick={() => setImage(null)}
              className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full backdrop-blur-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>
        )}

        {analyzing && (
          <div className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <Loader2 className="animate-spin text-okinawa-blue" />
            <span className="text-gray-600 font-medium">Gemini 正在分析圖片...</span>
          </div>
        )}

        {analysis && !analyzing && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-bold text-gray-400 uppercase mb-2 flex items-center gap-2">
              <Sparkles size={14} className="text-okinawa-coral" /> 
              分析結果
            </h3>
            <div className="prose prose-sm text-gray-800 leading-relaxed">
              {analysis}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};