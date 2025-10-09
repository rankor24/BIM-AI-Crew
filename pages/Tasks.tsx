import React, { useState, useMemo } from 'react';
import { TaskSource, TaskStatus } from '../types';
import type { Task, Project } from '../types';
import Modal from '../components/Modal';
import { SyncIcon } from '../components/Icons';

const statusStyles: Record<TaskStatus, string> = {
    [TaskStatus.Done]: "bg-green-100 text-green-800",
    [TaskStatus.InProgress]: "bg-blue-100 text-blue-800",
    [TaskStatus.Overdue]: "bg-red-100 text-red-800",
    [TaskStatus.ToDo]: "bg-gray-100 text-gray-800",
};

const sourceStyles: Record<TaskSource, string> = {
    [TaskSource.Asana]: "bg-pink-100 text-pink-800",
    [TaskSource.Manual]: "bg-indigo-100 text-indigo-800",
    [TaskSource.Outlook]: "bg-sky-100 text-sky-800",
    [TaskSource.Trimble]: "bg-amber-100 text-amber-800",
    [TaskSource.Whatsapp]: "bg-emerald-100 text-emerald-800",
};

interface TaskRowProps {
    task: Task;
    projectName: string;
    onUpdateStatus: (taskId: string) => void;
}

const TaskRow: React.FC<TaskRowProps> = ({ task, projectName, onUpdateStatus }) => {
    return (
        <tr className="bg-white hover:bg-slate-50 border-b">
            <td className="p-4">
                <input 
                    type="checkbox" 
                    className="h-4 w-4 rounded border-gray-300 text-brand-blue focus:ring-brand-blue" 
                    checked={task.status === TaskStatus.Done}
                    onChange={() => onUpdateStatus(task.id)}
                />
            </td>
            <td className={`p-4 font-medium text-slate-900 ${task.status === TaskStatus.Done ? 'line-through text-slate-500' : ''}`}>{task.title}</td>
            <td className="p-4 text-slate-600">{projectName}</td>
            <td className="p-4 text-slate-600">{task.dueDate}</td>
            <td className="p-4"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusStyles[task.status]}`}>{task.status}</span></td>
            <td className="p-4"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${sourceStyles[task.source]}`}>{task.source}</span></td>
        </tr>
    );
};

interface TasksProps {
    tasks: Task[];
    projects: Project[];
    onAddTask: (task: Omit<Task, 'id' | 'status'>) => void;
    onUpdateTaskStatus: (taskId: string) => void;
    onSyncTasks: () => Promise<void>;
    isSyncing: boolean;
}

const Tasks: React.FC<TasksProps> = ({ tasks, projects, onAddTask, onUpdateTaskStatus, onSyncTasks, isSyncing }) => {
  const [activeFilter, setActiveFilter] = useState<TaskSource | 'All'>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({
      title: '',
      projectId: projects[0]?.id || '',
      dueDate: '',
      source: TaskSource.Manual
  });
  
  const TABS: (TaskSource | 'All')[] = ['All', ...Object.values(TaskSource)];

  const filteredTasks = useMemo(() => {
    if (activeFilter === 'All') return tasks;
    return tasks.filter(task => task.source === activeFilter);
  }, [activeFilter, tasks]);

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTask.title.trim() && newTask.projectId && newTask.dueDate) {
        onAddTask(newTask);
        setIsModalOpen(false);
        setNewTask({ title: '', projectId: projects[0]?.id || '', dueDate: '', source: TaskSource.Manual });
    }
  };
  
  return (
    <div className="bg-white rounded-xl shadow-md">
       <div className="p-4 border-b flex justify-between items-center">
         <div>
            {TABS.map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={`px-4 py-2 text-sm font-medium rounded-md mr-2 ${activeFilter === tab ? 'bg-brand-blue text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                {tab}
              </button>
            ))}
         </div>
         <div className="flex items-center space-x-2">
            <button onClick={onSyncTasks} disabled={isSyncing} className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center disabled:bg-slate-400">
                <SyncIcon className={`w-5 h-5 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Syncing...' : 'Sync & Import Tasks'}
            </button>
            <button onClick={() => setIsModalOpen(true)} className="bg-brand-blue text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center">
                + Create Task
            </button>
         </div>
       </div>
       <div className="overflow-x-auto">
         <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                    <th scope="col" className="p-4"></th>
                    <th scope="col" className="p-4">Task</th>
                    <th scope="col" className="p-4">Project</th>
                    <th scope="col" className="p-4">Due Date</th>
                    <th scope="col" className="p-4">Status</th>
                    <th scope="col"className="p-4">Source</th>
                </tr>
            </thead>
            <tbody>
                {filteredTasks.map(task => {
                    const projectName = projects.find(p => p.id === task.projectId)?.name || 'N/A';
                    return <TaskRow key={task.id} task={task} projectName={projectName} onUpdateStatus={onUpdateTaskStatus} />
                })}
            </tbody>
         </table>
       </div>

       <Modal title="Create New Task" isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
         <form onSubmit={handleCreateTask} className="space-y-4">
            <div>
                <label htmlFor="taskTitle" className="block text-sm font-medium text-slate-700">Task Title</label>
                <input type="text" id="taskTitle" value={newTask.title} onChange={(e) => setNewTask({...newTask, title: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm" required />
            </div>
            <div>
                <label htmlFor="taskProject" className="block text-sm font-medium text-slate-700">Project</label>
                <select id="taskProject" value={newTask.projectId} onChange={(e) => setNewTask({...newTask, projectId: e.target.value})} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm rounded-md" required>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
            </div>
             <div>
                <label htmlFor="taskDueDate" className="block text-sm font-medium text-slate-700">Due Date</label>
                <input type="date" id="taskDueDate" value={newTask.dueDate} onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm" required />
            </div>
            <div>
                <label htmlFor="taskSource" className="block text-sm font-medium text-slate-700">Source</label>
                <select id="taskSource" value={newTask.source} onChange={(e) => setNewTask({...newTask, source: e.target.value as TaskSource})} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm rounded-md">
                    {Object.values(TaskSource).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>
            <div className="flex justify-end pt-2">
                <button type="submit" className="bg-brand-blue text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                    Create Task
                </button>
            </div>
         </form>
       </Modal>
    </div>
  );
};

export default Tasks;
