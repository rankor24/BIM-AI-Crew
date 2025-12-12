import React from 'react';
import type { View } from '../types';
import { DashboardIcon, ProjectsIcon, TasksIcon, InsightsIcon, MeetingsIcon, KnowledgeIcon, SettingsIcon } from './Icons';

interface SidebarProps {
  activeView: View;
  onViewChange: (view: View) => void;
}

const NavItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
      isActive
        ? 'bg-brand-blue text-white shadow-md'
        : 'text-slate-600 hover:bg-slate-200 hover:text-slate-800'
    }`}
  >
    {icon}
    <span className="ml-3">{label}</span>
  </button>
);

const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange }) => {
  const navItems = [
    { id: 'dashboard', icon: <DashboardIcon />, label: 'Dashboard' },
    { id: 'projects', icon: <ProjectsIcon />, label: 'Projects' },
    { id: 'tasks', icon: <TasksIcon />, label: 'Tasks' },
    { id: 'insights', icon: <InsightsIcon />, label: 'Insights' },
    { id: 'meetings', icon: <MeetingsIcon />, label: 'Meetings' },
    { id: 'knowledge', icon: <KnowledgeIcon />, label: 'Knowledge Base' },
    { id: 'settings', icon: <SettingsIcon />, label: 'Settings' },
  ] as const;

  return (
    <aside className="w-64 bg-white shadow-lg flex flex-col p-4">
      <div className="flex items-center mb-8 px-2">
        <div className="bg-brand-blue p-2 rounded-lg">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2 1M4 7l2-1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" /></svg>
        </div>
        <h1 className="text-xl font-bold text-slate-800 ml-3">AI Crew</h1>
      </div>
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => (
          <NavItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            isActive={activeView === item.id}
            onClick={() => onViewChange(item.id)}
          />
        ))}
      </nav>
       <div className="mt-auto p-2 bg-slate-100 rounded-lg">
          <p className="text-sm text-slate-600">Need help?</p>
          <a href="mailto:support@bimai.com" className="text-sm font-semibold text-brand-blue hover:underline">Contact Support</a>
        </div>
    </aside>
  );
};

export default Sidebar;