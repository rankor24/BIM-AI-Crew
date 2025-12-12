import React, { useState, useCallback, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Modal from './components/Modal';
import { SparkleIcon } from './components/Icons';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Tasks from './pages/Tasks';
import Insights from './pages/Insights';
import Meetings from './pages/Meetings';
import KnowledgeBase from './pages/KnowledgeBase';
import Settings from './pages/Settings';
import type { View, Project, Task, Meeting, Integration, KnowledgeArticle, TaskCompletionData } from './types';
import { TaskStatus } from './types';
import { PROJECTS, TASKS, MEETINGS, INTEGRATIONS } from './constants';
import { GoogleGenAI } from "@google/genai";

const App = (): React.ReactElement => {
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [ai, setAi] = useState<GoogleGenAI | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // --- RECORDING & TRANSCRIPTION STATE ---
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  // --- MEETING MODAL STATE ---
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [newMeeting, setNewMeeting] = useState({
        title: '',
        date: new Date().toISOString().split('T')[0],
        platform: 'MS Teams' as 'Google Meet' | 'MS Teams' | 'Webex',
        transcript: '',
  });

  // --- STATE WITH PERSISTENCE ---
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('bim_user');
    return saved ? JSON.parse(saved) : { 
      name: 'Alex Drake', 
      role: 'BIM Manager', 
      avatar: 'https://picsum.photos/seed/user/40/40' 
    };
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('bim_projects');
    return saved ? JSON.parse(saved) : PROJECTS;
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('bim_tasks');
    return saved ? JSON.parse(saved) : TASKS;
  });

  const [meetings, setMeetings] = useState<Meeting[]>(() => {
    const saved = localStorage.getItem('bim_meetings');
    return saved ? JSON.parse(saved) : MEETINGS;
  });

  const [articles, setArticles] = useState<KnowledgeArticle[]>(() => {
    const saved = localStorage.getItem('bim_articles');
    return saved ? JSON.parse(saved) : [];
  });

  const [integrations, setIntegrations] = useState<Integration[]>(() => {
    const saved = localStorage.getItem('bim_integrations');
    return saved ? JSON.parse(saved) : INTEGRATIONS;
  });

  // --- PERSISTENCE EFFECTS ---
  useEffect(() => { localStorage.setItem('bim_user', JSON.stringify(user)); }, [user]);
  useEffect(() => { localStorage.setItem('bim_projects', JSON.stringify(projects)); }, [projects]);
  useEffect(() => { localStorage.setItem('bim_tasks', JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem('bim_meetings', JSON.stringify(meetings)); }, [meetings]);
  useEffect(() => { localStorage.setItem('bim_articles', JSON.stringify(articles)); }, [articles]);
  useEffect(() => { localStorage.setItem('bim_integrations', JSON.stringify(integrations)); }, [integrations]);

  // --- INITIALIZATION ---
  useEffect(() => {
    if (process.env.API_KEY) {
      try {
        const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
        setAi(genAI);
      } catch (e) {
        console.error("Error initializing GoogleGenAI:", e);
      }
    }
  }, []);

  // Load Google API Scripts
  useEffect(() => {
    const loadScript = (src: string) => {
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);
    };
    loadScript("https://apis.google.com/js/api.js");
    loadScript("https://accounts.google.com/gsi/client");
  }, []);

  const handleViewChange = useCallback((view: View) => {
    setActiveView(view);
    setSearchQuery(''); 
  }, []);

  // --- RECORDING HANDLERS ---
  const handleStartRecording = async () => {
    try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;
        chunksRef.current = [];

        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                chunksRef.current.push(e.data);
            }
        };

        recorder.onstop = async () => {
            stream.getTracks().forEach(track => track.stop());
            const blob = new Blob(chunksRef.current, { type: 'video/webm' }); 
            await processAudioBlob(blob);
            setIsRecording(false);
        };

        recorder.start();
        setIsRecording(true);
        stream.getVideoTracks()[0].onended = () => {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
            }
        };

    } catch (err) {
        console.error("Error starting screen capture:", err);
        alert("Could not start recording. Please ensure you grant permission to share screen audio.");
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
    }
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleTranscribeAudio = async (mediaBlob: Blob): Promise<string> => {
    if (!ai) return "AI not initialized";
    try {
        const base64Data = await blobToBase64(mediaBlob);
        const mimeType = mediaBlob.type || 'video/webm'; 
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { mimeType, data: base64Data } },
                    { text: "Transcribe this meeting audio verbatim. Provide only the transcript text." }
                ]
            }
        });
        return response.text || "No transcript generated.";
    } catch (e) {
        console.error("Transcription failed:", e);
        return "";
    }
  };

  const processAudioBlob = async (blob: Blob) => {
    setIsTranscribing(true);
    try {
        const transcript = await handleTranscribeAudio(blob);
        setNewMeeting(prev => ({ 
            ...prev, 
            transcript: prev.transcript ? prev.transcript + '\n\n' + transcript : transcript 
        }));
        setIsMeetingModalOpen(true);
    } catch (error) {
        console.error(error);
        alert("Failed to transcribe audio.");
    } finally {
        setIsTranscribing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        await processAudioBlob(file);
    }
  };

  // --- DATA HANDLERS ---
  const handleAddProject = (project: Omit<Project, 'id' | 'tasks'>) => {
    const newProject: Project = { ...project, id: `p${Date.now()}`, tasks: [] };
    setProjects(prev => [...prev, newProject]);
  };

  const handleAddTask = (task: Omit<Task, 'id' | 'status'>) => {
    const newTask: Task = { ...task, id: `t${Date.now()}`, status: TaskStatus.ToDo };
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
    const newMeeting: Meeting = { ...meeting, id: `m${Date.now()}` };
    setMeetings(prev => [newMeeting, ...prev]);
  };

  const handleDisconnectIntegration = async (name: string) => {
    setIntegrations(prev => prev.map(int => int.name === name ? { ...int, isLoading: true } : int));
    await new Promise(resolve => setTimeout(resolve, 500)); 
    setIntegrations(prev => prev.map(int => int.name === name ? { ...int, connected: false, isLoading: false, accessToken: undefined, config: undefined } : int));
  };

  const handleConnectIntegration = async (name: string, settings: Record<string, string>) => {
    // Set loading state
    setIntegrations(prev => prev.map(int => int.name === name ? { ...int, isLoading: true } : int));
    
    if (name === 'Google Drive') {
        const clientId = settings.clientId;
        const google = (window as any).google;

        if (!google || !google.accounts || !google.accounts.oauth2) {
            alert("Google API scripts not loaded yet. Please wait a moment and try again.");
            setIntegrations(prev => prev.map(int => int.name === name ? { ...int, isLoading: false } : int));
            return;
        }

        try {
            // Initiate OAuth 2.0 Token Flow
            const tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: clientId,
                scope: 'https://www.googleapis.com/auth/drive.readonly',
                callback: (response: any) => {
                    if (response.error) {
                        console.error("Google Auth Error:", response);
                        alert("Google Authentication failed: " + response.error);
                        setIntegrations(prev => prev.map(int => int.name === name ? { ...int, isLoading: false } : int));
                        return;
                    }
                    
                    // Success! Store the token.
                    setIntegrations(prev => prev.map(int => int.name === name ? { 
                        ...int, 
                        connected: true, 
                        isLoading: false,
                        accessToken: response.access_token,
                        config: settings
                    } : int));
                },
            });

            // Trigger the popup
            tokenClient.requestAccessToken();

        } catch (e) {
            console.error(e);
            alert("Failed to initialize Google Auth.");
            setIntegrations(prev => prev.map(int => int.name === name ? { ...int, isLoading: false } : int));
        }

    } else {
        // Mock connection for other services
        console.log(`Connecting ${name} with settings:`, settings);
        await new Promise(resolve => setTimeout(resolve, 1500)); 
        setIntegrations(prev => prev.map(int => int.name === name ? { ...int, connected: true, isLoading: false, config: settings } : int));
    }
  };
  
  // --- AI LOGIC ---
  const handleSyncTasks = async () => {
    if (!ai) return;
    setIsSyncing(true);
    try {
        const projectIds = projects.map(p => p.id).join("', '");
        if (projectIds.length === 0) {
            alert("Please create a project first before syncing tasks.");
            return;
        }
        const prompt = `Generate 3 new realistic tasks for a BIM/Architecture project manager. Respond ONLY with a valid JSON array of objects. Each object must have "title" (string), "projectId" (randomly pick one from ['${projectIds}']), "dueDate" (a date in the next 2 weeks in YYYY-MM-DD format), and "source" (randomly pick one from ['Asana', 'Outlook', 'Whatsapp', 'Trimble Connect']).`;
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
    } finally {
        setIsSyncing(false);
    }
  };

  const handleGenerateAndSaveMeeting = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!ai) return;
     if (!newMeeting.title || !newMeeting.date || !newMeeting.transcript) {
         alert("Please fill in all fields.");
         return;
     }

     setIsSyncing(true);
     try {
        const prompt = `From the following meeting transcript for a meeting titled "${newMeeting.title}" on ${newMeeting.date}, generate a plausible meeting summary (2-3 sentences) and 2-3 key action items. Respond ONLY with a valid JSON object with keys "transcriptSummary" (string) and "actionItems" (array of strings). Do not include any other text or markdown.\n\nTranscript:\n"""${newMeeting.transcript}"""`;
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        const notes = JSON.parse(response.text.trim());
        
        handleAddMeeting({ 
            title: newMeeting.title, 
            date: newMeeting.date, 
            platform: newMeeting.platform, 
            transcriptSummary: notes.transcriptSummary,
            actionItems: notes.actionItems
        });
        
        setIsMeetingModalOpen(false);
        setNewMeeting({ title: '', date: new Date().toISOString().split('T')[0], platform: 'MS Teams', transcript: '' });

     } catch(e) {
        console.error("Failed to generate meeting notes:", e);
        alert("Failed to generate meeting summary.");
     } finally {
        setIsSyncing(false);
     }
  };

  const handleGenerateArticleContent = async (prompt: string): Promise<string> => {
    if (!ai) return "AI not available.";
    const fullPrompt = `You are a knowledge base assistant for an architecture firm. Based on the following topic, generate a concise and informative article. Use Markdown format.\n\nTopic: "${prompt}"`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: fullPrompt });
    return response.text;
  };

  const handleAddArticle = (article: Omit<KnowledgeArticle, 'id' | 'createdAt'>) => {
    const newArticle: KnowledgeArticle = { ...article, id: `a${Date.now()}`, createdAt: new Date().toISOString() };
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
    const lowerQuery = searchQuery.toLowerCase();
    const filteredProjects = projects.filter(p => p.name.toLowerCase().includes(lowerQuery) || p.description.toLowerCase().includes(lowerQuery));
    const filteredTasks = tasks.filter(t => t.title.toLowerCase().includes(lowerQuery) || t.source.toLowerCase().includes(lowerQuery));
    const filteredMeetings = meetings.filter(m => m.title.toLowerCase().includes(lowerQuery) || m.transcriptSummary.toLowerCase().includes(lowerQuery));
    const filteredArticles = articles.filter(a => a.title.toLowerCase().includes(lowerQuery) || a.content.toLowerCase().includes(lowerQuery));
    const projectsWithTasks = filteredProjects.map(project => ({ ...project, tasks: tasks.filter(task => task.projectId === project.id) }));
    const taskCompletionData = getTaskCompletionData();

    switch (activeView) {
      case 'dashboard':
        return <Dashboard projects={projectsWithTasks} tasks={filteredTasks} taskCompletionData={taskCompletionData} />;
      case 'projects':
        return <Projects projects={projectsWithTasks} onAddProject={handleAddProject} />;
      case 'tasks':
        return <Tasks tasks={filteredTasks} projects={projects} onAddTask={handleAddTask} onUpdateTaskStatus={handleUpdateTaskStatus} onSyncTasks={handleSyncTasks} isSyncing={isSyncing} />;
      case 'insights':
        return <Insights tasks={tasks} taskCompletionData={taskCompletionData} />; 
      case 'meetings':
        return <Meetings 
                  meetings={filteredMeetings} 
                  onOpenMeetingModal={() => setIsMeetingModalOpen(true)}
                />;
      case 'knowledge':
        return <KnowledgeBase 
                    articles={filteredArticles} 
                    onAddArticle={handleAddArticle} 
                    onGenerateContent={handleGenerateArticleContent}
                    integrations={integrations}
                />;
      case 'settings':
        return <Settings integrations={integrations} onConnect={handleConnectIntegration} onDisconnect={handleDisconnectIntegration} />;
      default:
        return <Dashboard projects={projectsWithTasks} tasks={filteredTasks} taskCompletionData={taskCompletionData} />;
    }
  };
  
  const viewTitles: Record<View, string> = {
    dashboard: 'Dashboard', projects: 'Projects', tasks: 'Tasks', insights: 'Productivity Insights',
    meetings: 'Meetings', knowledge: 'Obsidian Vault (Google Drive)', settings: 'Integrations & Settings',
  };

  return (
    <div className="flex h-screen bg-slate-100 font-sans">
      <Sidebar activeView={activeView} onViewChange={handleViewChange} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title={viewTitles[activeView]} 
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          user={user}
          onUpdateUser={setUser}
          isRecording={isRecording}
          onStartRecording={handleStartRecording}
          onStopRecording={handleStopRecording}
          isTranscribing={isTranscribing}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-100 p-6">
          {renderView()}
        </main>
      </div>

      <Modal title="Log New Meeting with AI" isOpen={isMeetingModalOpen} onClose={() => setIsMeetingModalOpen(false)}>
            <form onSubmit={handleGenerateAndSaveMeeting} className="space-y-4">
                <div>
                    <label htmlFor="meetingTitle" className="block text-sm font-medium text-slate-700">Meeting Title</label>
                    <input type="text" id="meetingTitle" placeholder="e.g., Weekly Project Sync" value={newMeeting.title} onChange={e => setNewMeeting({...newMeeting, title: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue" required />
                </div>
                <div>
                    <label htmlFor="meetingDate" className="block text-sm font-medium text-slate-700">Date</label>
                    <input type="date" id="meetingDate" value={newMeeting.date} onChange={e => setNewMeeting({...newMeeting, date: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue" required />
                </div>
                <div>
                    <label htmlFor="meetingPlatform" className="block text-sm font-medium text-slate-700">Platform</label>
                    <select id="meetingPlatform" value={newMeeting.platform} onChange={e => setNewMeeting({...newMeeting, platform: e.target.value as any})} className="mt-1 block w-full pl-3 pr-10 py-2 border-gray-300 focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm rounded-md">
                        <option>MS Teams</option>
                        <option>Google Meet</option>
                        <option>Webex</option>
                    </select>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Transcript Source</label>
                    <div className="flex flex-col gap-3">
                        <p className="text-xs text-slate-500">
                           You can record audio using the "Rec Audio" button in the top header, or upload a file here.
                        </p>
                        <label className="bg-white border border-slate-300 text-slate-700 px-3 py-2 rounded-md text-sm font-semibold hover:bg-slate-50 flex items-center justify-center cursor-pointer">
                            Import Audio/Video File
                            <input type="file" accept="audio/*,video/*" onChange={handleFileUpload} className="hidden" disabled={isTranscribing || isRecording} />
                        </label>
                        {isTranscribing && <p className="text-xs text-brand-blue font-semibold text-center">Transcribing file with Gemini...</p>}
                    </div>
                </div>

                <div>
                    <label htmlFor="meetingTranscript" className="block text-sm font-medium text-slate-700">Meeting Transcript</label>
                    <textarea id="meetingTranscript" rows={5} placeholder="Paste transcript here, or use recording/import tools..." value={newMeeting.transcript} onChange={e => setNewMeeting({...newMeeting, transcript: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue" required />
                </div>
                <div className="flex justify-end pt-2">
                    <button type="submit" disabled={isSyncing || isTranscribing} className="bg-brand-blue text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center disabled:bg-slate-400">
                            <SparkleIcon className={`w-5 h-5 mr-2 ${isSyncing ? 'animate-ping' : ''}`} />
                        {isSyncing ? 'Generating...' : 'Generate & Log Meeting'}
                    </button>
                </div>
            </form>
        </Modal>
    </div>
  );
};

export default App;