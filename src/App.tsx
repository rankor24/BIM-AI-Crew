

import React, { useState, useCallback, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Tasks from './pages/Tasks';
import Insights from './pages/Insights';
import Meetings from './pages/Meetings';
import KnowledgeBase from './pages/KnowledgeBase';
import Settings from './pages/Settings';
import type { View, Project, Task, Meeting, Integration, KnowledgeArticle, TaskCompletionData } from './types';
import { TaskStatus, TaskSource } from './types';
import { PROJECTS, TASKS, MEETINGS, INTEGRATIONS } from './constants';
import { GoogleGenAI } from "@google/genai";


// FIX: Changed component signature from `React.FC` to an explicit arrow function returning `JSX.Element`. This resolves a cascading type inference issue that caused numerous incorrect scope-related errors.
const App = (): JSX.Element => {
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [projects, setProjects] = useState<Project[]>(PROJECTS);
  const [tasks, setTasks] = useState<Task[]>(TASKS);
  const [meetings, setMeetings] = useState<Meeting[]>(MEETINGS);
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [integrations, setIntegrations] = useState<Integration[]>(INTEGRATIONS);
  const [isSyncing, setIsSyncing] = useState(false);
  const [ai, setAi] = useState<GoogleGenAI | null>(null);

  useEffect(() => {
    // The API_KEY is set in the environment variables.
    if (process.env.API_KEY) {
      try {
        const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
        setAi(genAI);
      } catch (e) {
        console.error("Error initializing GoogleGenAI:", e);
      }
    }
  }, []);

  const handleViewChange = useCallback((view: View) => {
    setActiveView(view);
  }, []);

  const handleAddProject = (project: Omit<Project, 'id' | 'tasks'>) => {
    const newProject: Project = {
      ...project,
      id: `p${Date.now()}`,
      tasks: [],
    };
    setProjects(prev => [...prev, newProject]);
  };

  const handleAddTask = (task: Omit<Task, 'id' | 'status'>) => {
    const newTask: Task = {
      ...task,
      id: `t${Date.now()}`,
      status: TaskStatus.ToDo,
    };
    setTasks(prev => [...prev, newTask]);
    setProjects(prevProjects => prevProjects.map(p => {
        if (p.id === newTask.projectId) {
            return { ...p, tasks: [...p.tasks, newTask] };
        }
        return p;
    }));
  };
  
  const handleUpdateTaskStatus = (taskId: string) => {
    setTasks(prevTasks =>
      prevTasks.map(task => {
        if (task.id === taskId) {
          const newStatus = task.status === TaskStatus.Done ? TaskStatus.ToDo : TaskStatus.Done;
          return { 
            ...task, 
            status: newStatus,
            completionDate: newStatus === TaskStatus.Done ? new Date().toISOString().split('T')[0] : undefined
          };
        }
        return task;
      })
    );
  };

  const handleAddMeeting = (meeting: Omit<Meeting, 'id'>) => {
    const newMeeting: Meeting = {
        ...meeting,
        id: `m${Date.now()}`,
    };
    setMeetings(prev => [newMeeting, ...prev]);
  };

  const handleDisconnectIntegration = async (name: string) => {
    setIntegrations(prev => prev.map(int => int.name === name ? { ...int, isLoading: true } : int));
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    alert(`You have successfully disconnected from ${name}.`);
    setIntegrations(prev => prev.map(int => int.name === name ? { ...int, connected: false, isLoading: false } : int));
  };

  const handleConnectIntegration = async (name: string, settings: Record<string, string>) => {
    setIntegrations(prev => prev.map(int => int.name === name ? { ...int, isLoading: true } : int));
    console.log(`Connecting ${name} with settings:`, settings);
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
    alert(`Success! ${name} is connected.`);
    setIntegrations(prev => prev.map(int => int.name === name ? { ...int, connected: true, isLoading: false } : int));
  };
  
  // --- AI HANDLERS ---
  const handleSyncTasks = async () => {
    if (!ai) return;
    setIsSyncing(true);
    try {
        const projectIds = projects.map(p => p.id).join("', '");
        if (projectIds.length === 0) {
            alert("Please create a project first before syncing tasks.");
            setIsSyncing(false);
            return;
        }
        const prompt = `Generate 3 new realistic tasks for a BIM/Architecture project manager. Respond ONLY with a valid JSON array of objects. Each object must have "title" (string), "projectId" (randomly pick one from ['${projectIds}']), "dueDate" (a date in the next 2 weeks in YYYY-MM-DD format), and "source" (randomly pick one from ['Asana', 'Outlook', 'Whatsapp', 'Trimble Connect']). Do not include any other text or markdown.`;
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        const newTasksRaw = JSON.parse(response.text.trim());
        const newTasksToAdd: Task[] = newTasksRaw.map((t: any) => ({
            ...t,
            id: `t${Date.now()}${Math.random().toString(36).substring(2, 7)}`,
            status: TaskStatus.ToDo,
        }));
        setTasks(prev => [...prev, ...newTasksToAdd]);
    } catch (e) {
        console.error("Failed to parse AI response for tasks:", e);
        alert("Could not generate new tasks. Please try again.");
    } finally {
        setIsSyncing(false);
    }
  };

  const handleGenerateMeetingNotes = async (title: string, date: string, platform: Meeting['platform'], transcript: string): Promise<void> => {
     if (!ai) return;
     setIsSyncing(true);
     try {
        const prompt = `From the following meeting transcript for a meeting titled "${title}" on ${date}, generate a plausible meeting summary (2-3 sentences) and 2-3 key action items. Respond ONLY with a valid JSON object with keys "transcriptSummary" (string) and "actionItems" (array of strings). Do not include any other text or markdown.\n\nTranscript:\n"""${transcript}"""`;
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        const notes = JSON.parse(response.text.trim());
        handleAddMeeting({ title, date, platform, ...notes });
     } catch(e) {
        console.error("Failed to generate meeting notes:", e);
        alert("Failed to generate meeting summary. Please check the transcript and try again.");
     } finally {
        setIsSyncing(false);
     }
  };

  const handleGenerateArticleContent = async (prompt: string): Promise<string> => {
    if (!ai) return "AI not available. Please ensure your API key is configured.";
    const fullPrompt = `You are a knowledge base assistant for an architecture firm. Based on the following topic, generate a concise and informative article. Use Markdown format. Include headings, lists, or other relevant formatting.\n\nTopic: "${prompt}"`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: fullPrompt });
    return response.text;
  };

  const handleAddArticle = (article: Omit<KnowledgeArticle, 'id' | 'createdAt'>) => {
    const newArticle: KnowledgeArticle = {
      ...article,
      id: `a${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setArticles(prev => [...prev, newArticle]);
  };

  const getTaskCompletionData = (): TaskCompletionData[] => {
    const last7Days: TaskCompletionData[] = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateString = d.toISOString().split('T')[0];
        const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
        
        const completedTasks = tasks.filter(t => t.completionDate === dateString).length;
        
        last7Days.push({ name: dayName, tasksCompleted: completedTasks });
    }
    return last7Days;
  };

  const renderView = () => {
    const projectsWithTasks = projects.map(project => ({
        ...project,
        tasks: tasks.filter(task => task.projectId === project.id)
    }));
    const taskCompletionData = getTaskCompletionData();

    switch (activeView) {
      case 'dashboard':
        return <Dashboard projects={projectsWithTasks} tasks={tasks} taskCompletionData={taskCompletionData} />;
      case 'projects':
        return <Projects projects={projectsWithTasks} onAddProject={handleAddProject} />;
      case 'tasks':
        return <Tasks tasks={tasks} projects={projects} onAddTask={handleAddTask} onUpdateTaskStatus={handleUpdateTaskStatus} onSyncTasks={handleSyncTasks} isSyncing={isSyncing} />;
      case 'insights':
        return <Insights tasks={tasks} taskCompletionData={taskCompletionData} />;
      case 'meetings':
        return <Meetings meetings={meetings} onAddMeeting={handleGenerateMeetingNotes} isSyncing={isSyncing} />;
      case 'knowledge':
        return <KnowledgeBase articles={articles} onAddArticle={handleAddArticle} onGenerateContent={handleGenerateArticleContent} />;
      case 'settings':
        return <Settings 
                    integrations={integrations} 
                    onConnect={handleConnectIntegration}
                    onDisconnect={handleDisconnectIntegration} 
                />;
      default:
        return <Dashboard projects={projectsWithTasks} tasks={tasks} taskCompletionData={taskCompletionData} />;
    }
  };
  
  const viewTitles: Record<View, string> = {
    dashboard: 'Dashboard',
    projects: 'Projects',
    tasks: 'Tasks',
    insights: 'Productivity Insights',
    meetings: 'Meetings',
    knowledge: 'Knowledge Base',
    settings: 'Integrations & Settings',
  };

  return (
    <div className="flex h-screen bg-slate-100 font-sans">
      <Sidebar activeView={activeView} onViewChange={handleViewChange} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={viewTitles[activeView]} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-100 p-6">
          {renderView()}
        </main>
      </div>
    </div>
  );
};

export default App;