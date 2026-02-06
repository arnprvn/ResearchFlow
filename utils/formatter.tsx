
import React from 'react';

const imageRegex = /!\[(.*?)\]\((data:image\/[a-zA-Z]+;base64,[A-Za-z0-9+/=]+)\)/;

export const formatPaperContent = (content: string): React.ReactNode => {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];
  let inTocSection = false;

  const flushList = () => {
    if (listItems.length > 0) {
      const listKey = `list-${elements.length}`;
      if (inTocSection) {
        elements.push(
          <ul key={listKey} className="list-none pl-0 my-2">
            {listItems.map((item, index) => {
              const parts = item.replace(/^[-*]\s*/, '').split('\t');
              const title = parts[0] || '';
              const page = parts[1] || '';
              return (
                <li key={index} className="flex justify-between items-baseline">
                  <span>{title}</span>
                  <span className="flex-grow border-b border-dotted border-gray-400 dark:border-gray-600 mx-2"></span>
                  <span>{page}</span>
                </li>
              );
            })}
          </ul>
        );
      } else {
        elements.push(
          <ul key={listKey} className="list-disc pl-5 my-2">
            {listItems.map((item, index) => (
              <li key={index}>{item.replace(/^[-*]\s*/, '')}</li>
            ))}
          </ul>
        );
      }
      listItems = [];
    }
  };

  lines.forEach((line, index) => {
    const imageMatch = line.match(imageRegex);
    if (line.includes('<!-- TOC -->')) {
        // Don't render the placeholder
    } else if (imageMatch) {
      flushList();
      const altText = imageMatch[1];
      const src = imageMatch[2];
      elements.push(
        <figure key={index} className="my-4">
          <img src={src} alt={altText} className="mx-auto rounded-lg shadow-md" />
          <figcaption className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2">
            {altText}
          </figcaption>
        </figure>
      );
    } else if (line.startsWith('# ')) {
      flushList();
      inTocSection = false;
      elements.push(<h1 key={index} className="text-3xl font-bold mt-6 mb-3 pb-2 border-b border-gray-300 dark:border-gray-600">{line.substring(2)}</h1>);
    } else if (line.startsWith('## ')) {
      flushList();
      const sectionTitle = line.substring(3);
      inTocSection = sectionTitle.includes('Table of Contents');
      elements.push(<h2 key={index} className="text-2xl font-semibold mt-6 mb-3">{sectionTitle}</h2>);
    } else if (line.startsWith('### ')) {
      flushList();
      inTocSection = false;
      elements.push(<h3 key={index} className="text-xl font-semibold mt-4 mb-2">{line.substring(4)}</h3>);
    } else if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      listItems.push(line.trim());
    } else if (line.trim() !== '') {
      flushList();
      elements.push(<p key={index} className="my-2 leading-relaxed">{line}</p>);
    } else {
        flushList();
    }
  });

  flushList();

  return elements;
};

export const convertToHtmlForDoc = (content: string): string => {
  const lines = content.replace(/<!-- TOC -->/g, '').split('\n');
  let bodyHtml = '';
  let inList = false;
  let inTocList = false;

  const flushList = () => {
    if (inList || inTocList) {
      bodyHtml += '</ul>';
      inList = false;
      inTocList = false;
    }
  };

  lines.forEach(line => {
    const trimmedLine = line.trim();
    const imageMatch = line.match(imageRegex);

    if (imageMatch) {
      flushList();
      const altText = imageMatch[1];
      const src = imageMatch[2];
      bodyHtml += `<p><img src="${src}" alt="${altText}" width="500"></p><p><em>${altText}</em></p>`;
    } else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
      if (!inList && !inTocList) {
        inList = true;
        bodyHtml += '<ul>';
      }
      // Basic list for DOC export, no special TOC formatting
      bodyHtml += `<li>${trimmedLine.replace(/^[-*]\s*/, '').replace('\t', ' - Page ')}</li>`;
    } else {
      flushList();
      if (line.startsWith('# ')) {
        bodyHtml += `<h1>${line.substring(2)}</h1>`;
      } else if (line.startsWith('## ')) {
        const sectionTitle = line.substring(3);
        inTocList = sectionTitle.includes('Table of Contents');
        bodyHtml += `<h2>${sectionTitle}</h2>`;
      } else if (line.startsWith('### ')) {
        bodyHtml += `<h3>${line.substring(4)}</h3>`;
      } else if (trimmedLine !== '') {
        bodyHtml += `<p>${line}</p>`;
      }
    }
  });

  flushList();
  return bodyHtml;
};
