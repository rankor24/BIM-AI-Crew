
export enum TaskStatus {
  ToDo = 'To Do',
  InProgress = 'In Progress',
  Done = 'Done',
  Overdue = 'Overdue',
}

export enum TaskSource {
  Manual = 'Manual',
  Asana = 'Asana',
  Outlook = 'Outlook',
  Whatsapp = 'Whatsapp',
  Trimble = 'Trimble Connect',
}

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  dueDate: string;
  source: TaskSource;
  projectId: string;
  completionDate?: string;
}

export interface Project {
  id:string;
  name: string;
  description: string;
  tasks: Task[];
  bimModelUrl?: string;
}

export interface Meeting {
  id: string;
  title: string;
  date: string;
  platform: 'Google Meet' | 'MS Teams' | 'Webex';
  transcriptSummary: string;
  actionItems: string[];
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

export interface FileNode {
  name:string;
  type: 'folder' | 'file';
  children?: FileNode[];
}

export interface ProductivityData {
  name: string;
  'BIM Modeling': number;
  'Client Communication': number;
  'Meetings': number;
  'Admin': number;
}

export interface TaskCompletionData {
  name: string;
  tasksCompleted: number;
}

export type View = 'dashboard' | 'projects' | 'tasks' | 'insights' | 'meetings' | 'knowledge' | 'settings';

export interface IntegrationSetting {
    id: string;
    label: string;
    type: 'text' | 'password' | 'email';
    defaultValue?: string;
}

export interface Integration {
    name: string;
    description: string;
    connected: boolean;
    isLoading?: boolean;
    settings?: IntegrationSetting[];
    accessToken?: string;
    config?: Record<string, string>;
}
