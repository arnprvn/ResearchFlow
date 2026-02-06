
import React from 'react';

interface TopicSuggestionsProps {
  topics: string[];
  onSelectTopic: (topic: string) => void;
  isLoading: boolean;
  error: string | null;
}

const TopicSuggestions: React.FC<TopicSuggestionsProps> = ({ topics, onSelectTopic, isLoading, error }) => {
  if (isLoading) {
    return (
      <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center">Finding inspiration...</p>
      </div>
    );
  }

  if (error) {
    return (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>
        </div>
    );
  }

  if (topics.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
      <h3 className="text-md font-semibold mb-2 text-gray-700 dark:text-gray-300">Topic Suggestions</h3>
      <ul className="space-y-2">
        {topics.map((topic, index) => (
          <li key={index}>
            <button
              onClick={() => onSelectTopic(topic)}
              className="w-full text-left p-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              {topic}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TopicSuggestions;
