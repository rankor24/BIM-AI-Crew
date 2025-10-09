
import React, { useState } from 'react';
import type { Project } from '../types';
import { TaskStatus } from '../types';
import Card from '../components/Card';
import Modal from '../components/Modal';

const ProjectCard: React.FC<{ project: Project }> = ({ project }) => {
  const totalTasks = project.tasks.length;
  const completedTasks = project.tasks.filter(t => t.status === TaskStatus.Done).length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <Card className="flex flex-col">
      <h4 className="text-xl font-bold text-slate-800">{project.name}</h4>
      <p className="text-slate-500 text-sm mt-1 mb-4 flex-grow">{project.description}</p>
      
      <div className="my-4">
        <div className="flex justify-between text-sm text-slate-600 mb-1">
          <span>Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2.5">
          <div className="bg-brand-blue h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      <div className="flex justify-between items-center text-sm text-slate-500">
        <span>{completedTasks}/{totalTasks} tasks done</span>
        {project.bimModelUrl && (
          <a href={project.bimModelUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-blue hover:underline">
            View BIM Model
          </a>
        )}
      </div>
    </Card>
  );
};

interface ProjectsProps {
    projects: Project[];
    onAddProject: (project: Omit<Project, 'id' | 'tasks'>) => void;
}

const Projects: React.FC<ProjectsProps> = ({ projects, onAddProject }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProjectName.trim()) {
        onAddProject({ name: newProjectName, description: newProjectDesc });
        setIsModalOpen(false);
        setNewProjectName('');
        setNewProjectDesc('');
    }
  };

  return (
    <div>
       <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-slate-800">All Projects</h2>
            <button onClick={() => setIsModalOpen(true)} className="bg-brand-blue text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Create Project
            </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map(project => (
                <ProjectCard key={project.id} project={project} />
            ))}
        </div>

        <Modal title="Create New Project" isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
            <form onSubmit={handleCreateProject} className="space-y-4">
                <div>
                    <label htmlFor="projectName" className="block text-sm font-medium text-slate-700">Project Name</label>
                    <input type="text" id="projectName" value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm" required />
                </div>
                <div>
                    <label htmlFor="projectDesc" className="block text-sm font-medium text-slate-700">Description</label>
                    <textarea id="projectDesc" value={newProjectDesc} onChange={(e) => setNewProjectDesc(e.target.value)} rows={3} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm" required></textarea>
                </div>
                <div className="flex justify-end pt-2">
                    <button type="submit" className="bg-brand-blue text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                        Create Project
                    </button>
                </div>
            </form>
        </Modal>
    </div>
  );
};

export default Projects;
