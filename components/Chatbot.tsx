
import React, { useState, useRef, useEffect } from 'react';
import { chatWithGemini } from '../services/geminiService';
import { fileToBase64 } from '../utils/fileUtils';
import { VoiceChatIcon } from './icons/VoiceChatIcon';
import { PaperAirplaneIcon } from './icons/PaperAirplaneIcon';
import { PaperClipIcon } from './icons/PaperClipIcon';
import { XMarkIcon } from './icons/XMarkIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';

type Message = {
  sender: 'user' | 'bot';
  text: string;
  image?: string;
};

const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatBodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = async () => {
    if ((!inputValue.trim() && !imageFile) || isLoading) return;

    const userMessage: Message = { sender: 'user', text: inputValue };
    if (imagePreview) {
      userMessage.image = imagePreview;
    }
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    let imagePayload = null;
    if (imageFile) {
      try {
        const base64Data = await fileToBase64(imageFile);
        imagePayload = { data: base64Data, mimeType: imageFile.type };
      } catch (error) {
        console.error("Error converting file to base64:", error);
        setMessages(prev => [...prev, { sender: 'bot', text: 'Sorry, there was an error processing your image.' }]);
        setIsLoading(false);
        removeImage();
        return;
      }
    }
    
    const responseText = await chatWithGemini(inputValue, imagePayload);
    setMessages(prev => [...prev, { sender: 'bot', text: responseText }]);
    setIsLoading(false);
    removeImage();
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-transform hover:scale-110"
        aria-label="Open Chat"
      >
        <VoiceChatIcon className="h-8 w-8" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-8 right-8 w-[90vw] max-w-md h-[70vh] max-h-[600px] bg-white dark:bg-gray-800 rounded-lg shadow-2xl flex flex-col border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300 ease-in-out">
      <header className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">AI Assistant</h3>
        <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100">
          <XMarkIcon className="h-6 w-6" />
        </button>
      </header>
      
      <div ref={chatBodyRef} className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs md:max-w-sm rounded-lg px-4 py-2 ${msg.sender === 'user' ? 'bg-blue-500 text-white rounded-br-none' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none'}`}>
              {msg.image && <img src={msg.image} alt="user upload" className="rounded-md mb-2 max-h-40" />}
              <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-end gap-2 justify-start">
             <div className="max-w-xs md:max-w-sm rounded-lg px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none">
                <SpinnerIcon className="h-5 w-5" />
             </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
        {imagePreview && (
            <div className="relative mb-2 w-24 h-24">
                <img src={imagePreview} alt="preview" className="w-full h-full object-cover rounded-md" />
                <button onClick={removeImage} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 leading-none">
                    <XMarkIcon className="h-3 w-3" />
                </button>
            </div>
        )}
        <div className="flex items-center gap-2">
            <input type="file" accept="image/*" onChange={handleImageChange} ref={fileInputRef} className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" aria-label="Attach Image">
                <PaperClipIcon className="h-6 w-6" />
            </button>
            <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask a question..."
                className="flex-1 w-full p-2 text-sm bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            />
            <button onClick={handleSendMessage} disabled={isLoading} className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 transition-colors" aria-label="Send Message">
                <PaperAirplaneIcon className="h-6 w-6" />
            </button>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
