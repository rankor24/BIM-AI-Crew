import React, { useState } from 'react';
import Modal from './Modal';

interface UserProfile {
  name: string;
  role: string;
  avatar: string;
}

interface HeaderProps {
  title: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  user: UserProfile;
  onUpdateUser: (user: UserProfile) => void;
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  isTranscribing: boolean;
}

const Header: React.FC<HeaderProps> = ({ 
  title, 
  searchQuery, 
  onSearchChange, 
  user, 
  onUpdateUser,
  isRecording,
  onStartRecording,
  onStopRecording,
  isTranscribing
}) => {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [editUser, setEditUser] = useState(user);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser(editUser);
    setIsProfileModalOpen(false);
  };

  return (
    <>
      <header className="bg-white shadow-sm p-4 flex justify-between items-center z-10 sticky top-0">
        <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-bold text-slate-800 hidden md:block">{title}</h2>
            {/* Mobile View Title fallback could go here */}
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Global Recording Controls */}
          <div className="flex items-center mr-2">
            {!isRecording ? (
                <button 
                    onClick={onStartRecording}
                    disabled={isTranscribing}
                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-600 rounded-full border border-slate-200 transition-colors text-sm font-semibold disabled:opacity-50"
                    title="Record System Audio (Teams, Zoom, etc.)"
                >
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                    <span className="hidden sm:inline">Rec Audio</span>
                </button>
            ) : (
                <button 
                    onClick={onStopRecording}
                    className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-full border border-red-200 animate-pulse text-sm font-semibold"
                >
                    <div className="w-2.5 h-2.5 rounded-full bg-red-600"></div>
                    <span>Stop Recording</span>
                </button>
            )}
            {isTranscribing && <span className="ml-2 text-xs text-brand-blue font-medium animate-pulse">Transcribing...</span>}
          </div>

          <div className="relative hidden md:block">
            <input 
              type="search" 
              placeholder="Search..." 
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-full bg-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-blue w-64 transition-all"
            />
            <svg className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <button 
            onClick={() => setIsProfileModalOpen(true)}
            className="flex items-center space-x-2 hover:bg-slate-50 p-1 rounded-lg transition-colors"
          >
            <img 
              src={user.avatar} 
              alt="User Avatar" 
              className="w-10 h-10 rounded-full border-2 border-brand-lightblue"
            />
            <div className="text-left hidden md:block">
              <div className="font-semibold text-slate-700">{user.name}</div>
              <div className="text-xs text-slate-500">{user.role}</div>
            </div>
          </button>
        </div>
      </header>

      <Modal 
        title="Edit Profile" 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)}
      >
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Full Name</label>
            <input 
              type="text" 
              value={editUser.name} 
              onChange={(e) => setEditUser({...editUser, name: e.target.value})}
              className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Role / Job Title</label>
            <input 
              type="text" 
              value={editUser.role} 
              onChange={(e) => setEditUser({...editUser, role: e.target.value})}
              className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue"
              required
            />
          </div>
          <div>
             <label className="block text-sm font-medium text-slate-700">Avatar URL</label>
             <input 
              type="text" 
              value={editUser.avatar} 
              onChange={(e) => setEditUser({...editUser, avatar: e.target.value})}
              className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue"
            />
          </div>
          <div className="flex justify-end pt-4">
             <button type="submit" className="bg-brand-blue text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700">
               Save Profile
             </button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default Header;