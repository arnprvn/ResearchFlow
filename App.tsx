
import React, { useState, useCallback, useEffect } from 'react';
import Header from './components/Header';
import TopicInput from './components/TopicInput';
import PaperDisplay from './components/PaperDisplay';
import TopicSuggestions from './components/TopicSuggestions';
import { generatePaperStream, suggestTopics } from './services/geminiService';
import { calculateTocData } from './utils/pdfGenerator';
import Chatbot from './components/Chatbot';

const App: React.FC = () => {
  const [topic, setTopic] = useState<string>('');
  const [numPages, setNumPages] = useState<number>(4);
  const [includeImages, setIncludeImages] = useState<boolean>(true);
  const [paperContent, setPaperContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isProcessingToc, setIsProcessingToc] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [suggestedTopics, setSuggestedTopics] = useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = useState<boolean>(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  
  const [fontFamily, setFontFamily] = useState<string>('Times New Roman');
  const [headingSize, setHeadingSize] = useState<number>(16);
  const [bodySize, setBodySize] = useState<number>(11);
  const [lineSpacing, setLineSpacing] = useState<number>(1.5);
  const [enableThinking, setEnableThinking] = useState<boolean>(false);


  useEffect(() => {
    if (!isLoading && paperContent && paperContent.includes('<!-- TOC -->')) {
      const injectToc = async () => {
        setIsProcessingToc(true);
        try {
          const tocData = await calculateTocData(paperContent, { fontFamily, headingSize, bodySize, lineSpacing });
          let tocMarkdown = '## 3. Table of Contents\n\n';
          if (tocData.length > 0) {
              tocMarkdown += tocData.map(item => `- ${item.title}\t${item.page}`).join('\n');
          } else {
              tocMarkdown += '*No sections found for Table of Contents.*';
          }
          setPaperContent(currentContent => currentContent.replace('<!-- TOC -->', tocMarkdown));
        } catch (e) {
          console.error("Failed to generate Table of Contents", e);
          // Silently fail or show a small error. For now, we'll just remove the placeholder.
          setPaperContent(currentContent => currentContent.replace('<!-- TOC -->', ''));
        } finally {
          setIsProcessingToc(false);
        }
      };
      injectToc();
    }
  }, [isLoading, paperContent, fontFamily, headingSize, bodySize, lineSpacing]);


  const handleSuggest = useCallback(async () => {
    if (!topic.trim()) {
      setSuggestionError('Please enter a general field to get topic suggestions.');
      return;
    }
    setIsSuggesting(true);
    setSuggestionError(null);
    setSuggestedTopics([]);
    try {
      const topics = await suggestTopics(topic);
      setSuggestedTopics(topics);
    } catch (err: any) {
      setSuggestionError(err.message || 'Could not fetch suggestions.');
    } finally {
      setIsSuggesting(false);
    }
  }, [topic]);

  const handleGenerate = useCallback(async () => {
    if (!topic.trim()) {
      setError('Please enter a topic to generate a paper.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setPaperContent('');
    setSuggestedTopics([]);
    setSuggestionError(null);

    try {
      const stream = generatePaperStream(topic, numPages, includeImages, enableThinking);
      for await (const chunk of stream) {
        setPaperContent((prev) => prev + chunk);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while generating the paper. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [topic, numPages, includeImages, enableThinking]);

  const handleSelectTopic = (selectedTopic: string) => {
    setTopic(selectedTopic);
    setSuggestedTopics([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 dark:bg-gray-900 dark:text-gray-200 font-sans">
      <Header />
      <main className="container mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <TopicInput
                topic={topic}
                setTopic={setTopic}
                numPages={numPages}
                setNumPages={setNumPages}
                includeImages={includeImages}
                setIncludeImages={setIncludeImages}
                onGenerate={handleGenerate}
                onSuggest={handleSuggest}
                isLoading={isLoading}
                isSuggesting={isSuggesting}
                fontFamily={fontFamily}
                setFontFamily={setFontFamily}
                headingSize={headingSize}
                setHeadingSize={setHeadingSize}
                bodySize={bodySize}
                setBodySize={setBodySize}
                lineSpacing={lineSpacing}
                setLineSpacing={setLineSpacing}
                enableThinking={enableThinking}
                setEnableThinking={setEnableThinking}
              />
              {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
              <TopicSuggestions 
                topics={suggestedTopics}
                onSelectTopic={handleSelectTopic}
                isLoading={isSuggesting}
                error={suggestionError}
              />
            </div>
          </div>
          <div className="lg-col-span-2">
            <PaperDisplay
              content={paperContent}
              isLoading={isLoading}
              isProcessingToc={isProcessingToc}
              hasTopic={!!topic.trim()}
              fontFamily={fontFamily}
              headingSize={headingSize}
              bodySize={bodySize}
              lineSpacing={lineSpacing}
            />
          </div>
        </div>
      </main>
      <Chatbot />
    </div>
  );
};

export default App;
