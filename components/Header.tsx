
import React from 'react';

interface HeaderProps {
  title: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  return (
    <header className="bg-white shadow-sm p-4 flex justify-between items-center z-10">
      <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
      <div className="flex items-center space-x-4">
        <div className="relative">
          <input 
            type="search" 
            placeholder="Search..." 
            className="pl-10 pr-4 py-2 border rounded-full bg-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-blue"
          />
          <svg className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
        <div className="flex items-center space-x-2">
          <img 
            src="https://picsum.photos/seed/user/40/40" 
            alt="User Avatar" 
            className="w-10 h-10 rounded-full border-2 border-brand-lightblue"
          />
          <div>
            <div className="font-semibold text-slate-700">Alex Drake</div>
            <div className="text-xs text-slate-500">BIM Manager</div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
