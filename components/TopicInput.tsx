
import React from 'react';
import { LightBulbIcon } from './icons/LightBulbIcon';
import { NetworkIntelligenceIcon } from './icons/NetworkIntelligenceIcon';

interface TopicInputProps {
  topic: string;
  setTopic: (topic: string) => void;
  numPages: number;
  setNumPages: (pages: number) => void;
  includeImages: boolean;
  setIncludeImages: (include: boolean) => void;
  onGenerate: () => void;
  onSuggest: () => void;
  isLoading: boolean;
  isSuggesting: boolean;
  fontFamily: string;
  setFontFamily: (font: string) => void;
  headingSize: number;
  setHeadingSize: (size: number) => void;
  bodySize: number;
  setBodySize: (size: number) => void;
  lineSpacing: number;
  setLineSpacing: (spacing: number) => void;
  enableThinking: boolean;
  setEnableThinking: (enable: boolean) => void;
}

const TopicInput: React.FC<TopicInputProps> = ({ 
    topic, setTopic, 
    numPages, setNumPages, 
    includeImages, setIncludeImages, 
    onGenerate, onSuggest, 
    isLoading, isSuggesting,
    fontFamily, setFontFamily,
    headingSize, setHeadingSize,
    bodySize, setBodySize,
    lineSpacing, setLineSpacing,
    enableThinking, setEnableThinking
}) => {

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="mb-4">
        <label htmlFor="topic" className="block text-lg font-semibold mb-2 text-gray-700 dark:text-gray-300">
          Research Topic
        </label>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
          Enter a subject to generate a paper, or a general field to get topic suggestions.
        </p>
        <textarea
          id="topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g., 'The impact of machine learning on renewable energy optimization'"
          className="w-full h-32 p-3 text-base bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out dark:placeholder-gray-400"
          disabled={isLoading || isSuggesting}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
            <label htmlFor="pages" className="block text-lg font-semibold mb-2 text-gray-700 dark:text-gray-300">
                Pages
            </label>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 h-10">
                Length of the paper.
            </p>
            <input
              type="number"
              id="pages"
              value={numPages}
              onChange={(e) => setNumPages(Math.max(1, parseInt(e.target.value, 10) || 1))}
              min="1"
              max="50"
              className="w-full p-3 text-base bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out dark:placeholder-gray-400"
              disabled={isLoading || isSuggesting}
            />
        </div>
        <div>
            <label htmlFor="images" className="block text-lg font-semibold mb-2 text-gray-700 dark:text-gray-300">
                Images
            </label>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 h-10">
                Include AI-generated images.
            </p>
            <div className="flex items-center justify-center h-[50px]">
                <input
                type="checkbox"
                id="images"
                checked={includeImages}
                onChange={(e) => setIncludeImages(e.target.checked)}
                className="h-6 w-6 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                disabled={isLoading || isSuggesting}
                />
            </div>
        </div>
      </div>
      
      <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
        <h3 className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-300">Formatting Options</h3>
        <div className="mb-4">
            <label htmlFor="font-family" className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Font Family</label>
            <select 
              id="font-family" 
              value={fontFamily} 
              onChange={(e) => setFontFamily(e.target.value)} 
              disabled={isLoading || isSuggesting} 
              className="w-full p-3 text-base bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out disabled:opacity-50"
            >
            <option>Times New Roman</option>
            <option>Arial</option>
            <option>Courier New</option>
            </select>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
            <label htmlFor="heading-size" className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Heading Size (pt)</label>
            <input 
                type="number" 
                id="heading-size" 
                value={headingSize} 
                onChange={(e) => setHeadingSize(parseInt(e.target.value, 10) || 16)} 
                min="12" 
                max="24" 
                disabled={isLoading || isSuggesting} 
                className="w-full p-3 text-base bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out disabled:opacity-50" 
            />
            </div>
            <div>
            <label htmlFor="body-size" className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Body Size (pt)</label>
            <input 
                type="number" 
                id="body-size" 
                value={bodySize} 
                onChange={(e) => setBodySize(parseInt(e.target.value, 10) || 11)} 
                min="9" 
                max="14" 
                disabled={isLoading || isSuggesting} 
                className="w-full p-3 text-base bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out disabled:opacity-50"
            />
            </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Line Spacing</label>
          <div className="flex w-full">
            {[1.0, 1.5, 2.0].map(spacing => (
              <button
                key={spacing}
                onClick={() => setLineSpacing(spacing)}
                disabled={isLoading || isSuggesting}
                className={`flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 transition-colors disabled:opacity-50
                  ${spacing === 1.0 ? 'rounded-l-md' : ''}
                  ${spacing === 2.0 ? 'rounded-r-md' : ''}
                  ${lineSpacing === spacing 
                    ? 'bg-blue-600 text-white border-blue-600' 
                    : 'bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }`
                }
              >
                {spacing.toFixed(1)}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
        <h3 className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-300">Generation Settings</h3>
        <div className="flex items-center justify-between">
          <label htmlFor="thinking-mode" className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-400 cursor-pointer">
            <NetworkIntelligenceIcon className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
            Enhanced Reasoning
          </label>
          <input
            type="checkbox"
            id="thinking-mode"
            checked={enableThinking}
            onChange={(e) => setEnableThinking(e.target.checked)}
            className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            disabled={isLoading || isSuggesting}
          />
        </div>
         <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 pl-7">
           For complex topics, allows the AI to think more deeply, improving quality but increasing generation time.
        </p>
      </div>


      <div className="mt-6 flex flex-col sm:flex-row gap-2">
        <button
          onClick={onGenerate}
          disabled={isLoading || isSuggesting || !topic.trim()}
          className="w-full flex justify-center items-center px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed dark:disabled:bg-gray-600 transition duration-150 ease-in-out"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating...
            </>
          ) : (
            'Generate Paper'
          )}
        </button>
        <button
          onClick={onSuggest}
          disabled={isLoading || isSuggesting || !topic.trim()}
          className="sm:w-auto px-4 py-3 flex justify-center items-center border border-gray-300 dark:border-gray-600 text-base font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out"
          title="Suggest Topics"
        >
           {isSuggesting ? (
            <svg className="animate-spin h-5 w-5 text-gray-700 dark:text-gray-200" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
           ) : (
             <LightBulbIcon className="h-5 w-5" />
           )}
           <span className="sm:hidden ml-2">Suggest Topics</span>
        </button>
      </div>
    </div>
  );
};

export default TopicInput;
