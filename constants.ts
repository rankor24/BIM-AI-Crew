import type { Project, Task, Meeting, FileNode, ProductivityData, Integration } from './types';

export const TASKS: Task[] = [];

export const PROJECTS: Project[] = [];

export const MEETINGS: Meeting[] = [];

export const OBSIDIAN_VAULT: FileNode[] = [];

export const PRODUCTIVITY_DATA: ProductivityData[] = [];

export const INTEGRATIONS: Integration[] = [
  { name: 'Asana', description: 'For core project and task management.', connected: false, settings: [
    { id: 'token', label: 'Personal Access Token', type: 'password' },
    { id: 'workspaceId', label: 'Default Workspace ID', type: 'text' }
  ]},
  { name: 'Outlook', description: 'Imports tasks from flagged emails.', connected: false, settings: [
    { id: 'email', label: 'Outlook Email', type: 'email' },
    { id: 'password', label: 'App Password', type: 'password' }
  ]},
  { name: 'WhatsApp', description: 'Captures tasks from messages.', connected: false, settings: [
      { id: 'phone', label: 'Phone Number', type: 'text' },
  ]},
  { name: 'Trimble Connect', description: 'For BIM collaboration and issue tracking.', connected: false, settings: [
    { id: 'webhookUrl', label: 'Webhook URL', type: 'text' },
  ]},
  { name: 'ActivityWatch', description: 'Tracks time and productivity patterns.', connected: false, settings: [] },
  { name: 'Obsidian', description: 'Your personal knowledge database.', connected: false, settings: [
      { id: 'vaultPath', label: 'API Key', type: 'text' }
  ]},
  { 
    name: 'Notion', 
    description: 'Sync knowledge bases and project documentation.', 
    connected: false, 
    settings: [
      { id: 'token', label: 'Notion Integration Token', type: 'password' }
    ]
  },
  { name: 'Google Meet', description: 'For meeting transcription.', connected: false, settings: [] },
  { name: 'MS Teams', description: 'For meeting transcription.', connected: false, settings: [] },
];