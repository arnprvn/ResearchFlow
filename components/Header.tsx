
import React from 'react';
import { AcademicCapIcon } from './icons/AcademicCapIcon';

const Header: React.FC = () => {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-md">
      <div className="container mx-auto px-4 py-4 flex items-center justify-center text-center">
        <AcademicCapIcon className="h-8 w-8 mr-3 text-blue-600 dark:text-blue-400" />
        <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            RESEARCH PAPER GENERATION
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Your Professional Academic Writing Assistant</p>
        </div>
      </div>
    </header>
  );
};

export default Header;
