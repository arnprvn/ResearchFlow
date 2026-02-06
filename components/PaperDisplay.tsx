
import React, { useState, useEffect, useRef } from 'react';
import { formatPaperContent, convertToHtmlForDoc } from '../utils/formatter';
import { generatePdfFromMarkdown } from '../utils/pdfGenerator';
import { CopyIcon } from './icons/CopyIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';


interface PaperDisplayProps {
  content: string;
  isLoading: boolean;
  isProcessingToc: boolean;
  hasTopic: boolean;
  fontFamily: string;
  headingSize: number;
  bodySize: number;
  lineSpacing: number;
}

const PaperDisplay: React.FC<PaperDisplayProps> = ({ 
  content, isLoading, isProcessingToc, hasTopic,
  fontFamily, headingSize, bodySize, lineSpacing
}) => {
  const [copySuccess, setCopySuccess] = useState('');
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const articleRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Exclude placeholder from word count
    const cleanContent = content.replace(/<!-- TOC -->/g, '');
    const words = cleanContent.trim().split(/\s+/).filter(Boolean);
    setWordCount(words.length);
  }, [content]);

  useEffect(() => {
    if (copySuccess) {
      const timer = setTimeout(() => setCopySuccess(''), 2000);
      return () => clearTimeout(timer);
    }
  }, [copySuccess]);

  const getSafeFilename = () => {
    const titleMatch = content.match(/^#\s*(.*)/);
    const title = titleMatch ? titleMatch[1].trim() : 'research-paper';
    return title.replace(/[^a-z0-9\s-]/gi, '').replace(/\s+/g, '-').toLowerCase();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content).then(() => {
      setCopySuccess('Copied!');
    }, () => {
      setCopySuccess('Failed to copy.');
    });
  };

  const handleDownloadDoc = () => {
    const safeFilename = getSafeFilename();
    const bodyContent = convertToHtmlForDoc(content);
    
    const fullHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>${safeFilename}</title></head>
      <body>${bodyContent}</body>
      </html>
    `;

    const blob = new Blob([fullHtml], { type: 'application/vnd.ms-word' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${safeFilename}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);
    try {
        const safeFilename = getSafeFilename();
        await generatePdfFromMarkdown(content, safeFilename, { fontFamily, headingSize, bodySize, lineSpacing });
    } catch (error) {
        console.error("Failed to generate PDF:", error);
        alert("Sorry, there was an error creating the PDF.");
    } finally {
        setIsDownloadingPdf(false);
    }
  };

  const WelcomeMessage = () => (
    <div className="text-center p-8">
      <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">Welcome to the Research Paper Generator</h2>
      <p className="mt-2 text-gray-500 dark:text-gray-400">
        Please enter a topic in the panel on the left and click "Generate Paper" to begin.
      </p>
    </div>
  );

  const LoadingState = () => (
    <div className="flex flex-col items-center justify-center p-8">
      <SpinnerIcon className="h-10 w-10 text-blue-600 dark:text-blue-400 mb-4" />
      <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">Generating your paper...</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400">This may take a moment. Please wait.</p>
    </div>
  );

  const ProcessingState = ({ message }: { message: string }) => (
    <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 flex flex-col items-center justify-center z-20">
        <SpinnerIcon className="h-8 w-8 text-blue-600 dark:text-blue-400 mb-3" />
        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{message}</p>
    </div>
  );
  
  const articleStyle = {
    fontFamily: fontFamily === 'Times New Roman' ? 'Times, serif' : (fontFamily === 'Arial' ? 'Arial, sans-serif' : 'Courier, monospace'),
    '--heading-size-h1': `${headingSize + 4}pt`,
    '--heading-size-h2': `${headingSize + 2}pt`,
    '--heading-size-h3': `${headingSize}pt`,
    '--body-size': `${bodySize}pt`,
    '--line-spacing': lineSpacing,
  } as React.CSSProperties;

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 min-h-[60vh] relative">
        {isProcessingToc && <ProcessingState message="Generating Table of Contents..." />}
        {(content && !isLoading) && (
          <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
            <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">{wordCount} words</span>
            <button
              onClick={handleDownloadPdf}
              className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 font-bold py-2 px-3 rounded-md inline-flex items-center transition-colors disabled:opacity-50 disabled:cursor-wait"
              aria-label="Download as PDF"
              disabled={isDownloadingPdf}
            >
              <DownloadIcon className="h-4 w-4 mr-2" />
              <span>{isDownloadingPdf ? 'Saving PDF...' : 'PDF'}</span>
            </button>
            <button
              onClick={handleDownloadDoc}
              className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 font-bold py-2 px-3 rounded-md inline-flex items-center transition-colors disabled:opacity-50"
              aria-label="Download as Word document"
              disabled={isDownloadingPdf}
            >
              <DownloadIcon className="h-4 w-4 mr-2" />
              <span>DOC</span>
            </button>
            <button
              onClick={handleCopy}
              className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 font-bold py-2 px-3 rounded-md inline-flex items-center transition-colors disabled:opacity-50"
              aria-label="Copy paper content"
              disabled={isDownloadingPdf}
            >
              <CopyIcon className="h-4 w-4 mr-2" />
              <span>{copySuccess || 'Copy'}</span>
            </button>
          </div>
        )}
        <div className="p-6 md:p-8">
          {isLoading && !content ? (
            <LoadingState />
          ) : content ? (
            <article ref={articleRef} style={articleStyle} className="prose dark:prose-invert max-w-none paper-content">
              {formatPaperContent(content)}
            </article>
          ) : (
            <WelcomeMessage />
          )}
        </div>
      </div>
    </>
  );
};

export default PaperDisplay;
