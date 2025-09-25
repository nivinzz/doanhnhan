import React, { useState, useCallback } from 'react';
import { generateEntrepreneurStoryAndImage } from './services/geminiService';
import type { StoryData } from './types';
import { Spinner } from './components/Spinner';
import { Icon } from './components/Icon';
import { COPY_ICON, DOWNLOAD_ICON } from './constants';

const App: React.FC = () => {
  const [storyData, setStoryData] = useState<StoryData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const handleGenerateStory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setStoryData(null);

    try {
      setLoadingMessage('Đang tìm một doanh nhân truyền cảm hứng...');
      const result = await generateEntrepreneurStoryAndImage(setLoadingMessage);
      setStoryData(result);
    } catch (err) {
      console.error(err);
      setError('Đã xảy ra lỗi khi tạo câu chuyện. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, []);

  const handleCopyStory = () => {
    if (storyData?.story) {
      navigator.clipboard.writeText(storyData.story).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      });
    }
  };

  const handleDownloadImage = () => {
    if (storyData?.imageUrl) {
      const link = document.createElement('a');
      link.href = storyData.imageUrl;
      link.download = `${storyData.entrepreneurName.replace(/\s+/g, '_')}_inspiration.jpeg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };
  
  const WelcomeScreen = () => (
    <div className="text-center">
      <h2 className="text-3xl font-bold text-white mb-4">Biên Niên Sử Doanh Nhân</h2>
      <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
        Khám phá những khoảnh khắc định hình nên sự vĩ đại. Nhấn nút bên dưới để tạo ra một câu chuyện và hình minh họa được AI sáng tạo về hành trình của một doanh nhân nổi tiếng.
      </p>
    </div>
  );

  const LoadingScreen = () => (
    <div className="text-center flex flex-col items-center justify-center">
      <Spinner />
      <p className="text-lg text-gray-300 mt-4 animate-pulse">{loadingMessage}</p>
    </div>
  );

  const StoryDisplay = ({ data }: { data: StoryData }) => (
    <div className="w-full max-w-4xl bg-white/5 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
        <img src={data.imageUrl} alt={`Illustration of ${data.entrepreneurName}`} className="w-full h-auto aspect-video object-cover" />
        <div className="p-8">
            <h2 className="text-4xl font-extrabold text-white mb-4">{data.entrepreneurName}</h2>
            <p className="text-gray-200 text-lg leading-relaxed whitespace-pre-wrap">{data.story}</p>
            <div className="mt-8 flex items-center justify-end gap-4">
                <button
                    onClick={handleCopyStory}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg shadow-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                    <Icon path={COPY_ICON} />
                    {isCopied ? 'Đã chép!' : 'Sao Chép'}
                </button>
                <button
                    onClick={handleDownloadImage}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg shadow-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-green-400"
                >
                    <Icon path={DOWNLOAD_ICON} />
                    Tải Ảnh
                </button>
            </div>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 font-sans bg-grid-white/[0.05] relative">
      <div className="absolute pointer-events-none inset-0 flex items-center justify-center bg-gray-900 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
      <div className="relative z-10 w-full flex-grow flex flex-col items-center justify-center">
        {isLoading && <LoadingScreen />}
        {!isLoading && !storyData && <WelcomeScreen />}
        {!isLoading && storyData && <StoryDisplay data={storyData} />}
        {error && <p className="mt-4 text-red-400 bg-red-900/50 px-4 py-2 rounded-md">{error}</p>}
      </div>
      
      <div className="relative z-10 py-8">
        <button
          onClick={handleGenerateStory}
          disabled={isLoading}
          className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-900 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-bold text-lg rounded-full shadow-lg hover:shadow-indigo-500/50 transform hover:-translate-y-1 transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-indigo-500/70"
        >
          {isLoading ? 'Đang tạo...' : 'Tạo Câu Chuyện Mới'}
        </button>
      </div>
    </div>
  );
};

export default App;
