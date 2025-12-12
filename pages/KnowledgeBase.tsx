import React, { useState, useEffect } from 'react';
import type { KnowledgeArticle, Integration } from '../types';
import Card from '../components/Card';
import Modal from '../components/Modal';
import { SparkleIcon, FileIcon, FolderIcon, SyncIcon } from '../components/Icons';

interface VaultNode {
    id: string;
    name: string;
    type: 'folder' | 'file';
    children?: VaultNode[];
    content?: string; 
    mimeType?: string;
}

const SimpleMarkdown: React.FC<{ content: string }> = ({ content }) => {
    const htmlContent = content
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mb-4 border-b pb-2 text-slate-800">$1</h1>')
        .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mb-3 mt-6 text-slate-800">$1</h2>')
        .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mb-2 mt-4 text-slate-800">$1</h3>')
        .replace(/^\- (.*$)/gim, '<li class="ml-4 list-disc">$1</li>')
        .replace(/^\* (.*$)/gim, '<li class="ml-4 list-disc">$1</li>')
        .replace(/(\r\n|\n|\r)/gm, "<br>");

    return <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: htmlContent }} />;
};

interface FileTreeNodeProps {
    node: VaultNode;
    depth?: number;
    selectedId: string | null;
    onSelect: (node: VaultNode) => void;
    expandedNodes: Set<string>;
    toggleExpand: (id: string) => void;
}

const FileTreeNode: React.FC<FileTreeNodeProps> = ({ node, depth = 0, selectedId, onSelect, expandedNodes, toggleExpand }) => {
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = selectedId === node.id;
    const paddingLeft = `${depth * 1.5 + 0.5}rem`;

    const handleClick = () => {
        if (node.type === 'folder') {
            toggleExpand(node.id);
        } else {
            onSelect(node);
        }
    };

    return (
        <li>
            <div 
                onClick={handleClick}
                className={`flex items-center py-1.5 pr-2 cursor-pointer transition-colors select-none
                    ${isSelected ? 'bg-brand-blue text-white' : 'hover:bg-slate-100 text-slate-700'}
                `}
                style={{ paddingLeft }}
            >
                <span className="mr-2 opacity-70">
                    {node.type === 'folder' ? (
                        <FolderIcon className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    ) : (
                        <FileIcon className="w-4 h-4" />
                    )}
                </span>
                <span className="text-sm truncate">{node.name}</span>
            </div>
            {node.type === 'folder' && isExpanded && node.children && (
                <ul className="border-l border-slate-200 ml-4">
                    {node.children.map(child => (
                        <FileTreeNode 
                            key={child.id} 
                            node={child} 
                            depth={depth}
                            selectedId={selectedId}
                            onSelect={onSelect}
                            expandedNodes={expandedNodes}
                            toggleExpand={toggleExpand}
                        />
                    ))}
                </ul>
            )}
        </li>
    );
};


interface KnowledgeBaseProps {
    articles: KnowledgeArticle[];
    onAddArticle: (article: Omit<KnowledgeArticle, 'id' | 'createdAt'>) => void;
    onGenerateContent: (prompt: string) => Promise<string>;
    integrations: Integration[];
}

const KnowledgeBase: React.FC<KnowledgeBaseProps> = ({ articles, onAddArticle, onGenerateContent, integrations }) => {
  const [driveIntegration, setDriveIntegration] = useState<Integration | undefined>(undefined);
  
  // Vault State
  const [vaultData, setVaultData] = useState<VaultNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<VaultNode | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [isSyncing, setIsSyncing] = useState(false);
  const [loadingFileId, setLoadingFileId] = useState<string | null>(null);
  
  // Creation Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFilePrompt, setNewFilePrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
      const integration = integrations.find(i => i.name === 'Google Drive');
      setDriveIntegration(integration);
      
      // Initial Load if connected
      if (integration?.connected && integration.accessToken && vaultData.length === 0) {
          fetchDriveFiles(integration, 'root');
      }
  }, [integrations]);

  const fetchDriveFiles = async (integration: Integration, folderId: string = 'root') => {
      if (!integration || !integration.accessToken || !integration.config) return;
      setIsSyncing(true);

      const apiKey = integration.config.apiKey;
      const targetFolderId = folderId === 'root' ? (integration.config.rootFolderId || 'root') : folderId;

      try {
          const query = `'${targetFolderId}' in parents and trashed = false`;
          let url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType)`;
          if (apiKey) url += `&key=${apiKey}`;
          
          const response = await fetch(url, {
              headers: {
                  'Authorization': `Bearer ${integration.accessToken}`
              }
          });

          if (!response.ok) throw new Error("Failed to fetch files");

          const data = await response.json();
          const files = data.files || [];

          const nodes: VaultNode[] = files.map((f: any) => ({
              id: f.id,
              name: f.name,
              type: f.mimeType === 'application/vnd.google-apps.folder' ? 'folder' : 'file',
              mimeType: f.mimeType,
              // If it's a folder, we don't know children yet, but we init array so it can be populated
              children: f.mimeType === 'application/vnd.google-apps.folder' ? [] : undefined 
          }));
          
          // If fetching root, replace everything. If fetching subdir, find node and append.
          if (folderId === 'root') {
              setVaultData(nodes);
              // Auto expand root if needed
          } else {
             updateVaultDataChildren(folderId, nodes);
          }

      } catch (e) {
          console.error("Drive Fetch Error:", e);
          alert("Could not load files from Google Drive. Please check your token or folder ID.");
      } finally {
          setIsSyncing(false);
      }
  };

  const updateVaultDataChildren = (parentId: string, children: VaultNode[]) => {
      setVaultData(prev => {
          const updateRecursive = (nodes: VaultNode[]): VaultNode[] => {
              return nodes.map(node => {
                  if (node.id === parentId) {
                      return { ...node, children: children };
                  }
                  if (node.children) {
                      return { ...node, children: updateRecursive(node.children) };
                  }
                  return node;
              });
          };
          return updateRecursive(prev);
      });
  };

  const handleToggleExpand = (id: string) => {
      const newSet = new Set(expandedNodes);
      if (newSet.has(id)) {
          newSet.delete(id);
      } else {
          newSet.add(id);
          // Lazy load children if empty
          const findNode = (nodes: VaultNode[]): VaultNode | undefined => {
              for (const node of nodes) {
                  if (node.id === id) return node;
                  if (node.children) {
                      const found = findNode(node.children);
                      if (found) return found;
                  }
              }
              return undefined;
          };
          const node = findNode(vaultData);
          if (node && node.children && node.children.length === 0 && driveIntegration) {
              fetchDriveFiles(driveIntegration, id);
          }
      }
      setExpandedNodes(newSet);
  };

  const handleSelectFile = async (node: VaultNode) => {
      if (!node.content && driveIntegration) {
          // Fetch Content
          setLoadingFileId(node.id);
          try {
              let url = `https://www.googleapis.com/drive/v3/files/${node.id}?alt=media`;
              if (driveIntegration.config?.apiKey) url += `&key=${driveIntegration.config.apiKey}`;
              
               const response = await fetch(url, {
                  headers: {
                      'Authorization': `Bearer ${driveIntegration.accessToken}`
                  }
              });
              if(response.ok) {
                  const text = await response.text();
                  node.content = text;
                  // Update state to cache content
                  updateVaultDataChildren(node.id, []); // Hack to trigger re-render if needed, but better to update node content in tree
              } else {
                  node.content = "*Error loading file content.*";
              }
          } catch(e) {
              node.content = "*Error loading file content.*";
          } finally {
              setLoadingFileId(null);
          }
      }
      setSelectedFile(node);
  };

  const handleSync = async () => {
     if(driveIntegration) {
         fetchDriveFiles(driveIntegration, 'root');
     }
  };

  const handleCreateFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    setIsGenerating(true);
    
    // NOTE: Creating files on real Drive requires 'https://www.googleapis.com/auth/drive.file' scope and write logic.
    // For this demo, we will just simulate adding it to the local view or alert that write is not implemented in readonly mode.
    
    let content = '# ' + newFileName + '\n\n';
    if (newFilePrompt.trim()) {
        content = await onGenerateContent(newFilePrompt);
    }
    
    // Add locally for now as we are likely in read-only scope
    const newFile: VaultNode = {
        id: `new_${Date.now()}`,
        name: newFileName.endsWith('.md') ? newFileName : `${newFileName}.md`,
        type: 'file',
        content: content
    };

    setVaultData(prev => [...prev, newFile]);
    onAddArticle({ title: newFileName, content });
    
    setIsGenerating(false);
    setIsModalOpen(false);
    setNewFileName('');
    setNewFilePrompt('');
    setSelectedFile(newFile);
    alert("File created locally. Writing back to Google Drive is not enabled in this Read-Only mode.");
  };

  if (!driveIntegration?.connected) {
      return (
          <div className="h-full flex items-center justify-center p-6">
              <Card className="max-w-md w-full text-center py-12">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                       <svg className="w-10 h-10 text-slate-400" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">Connect to Google Drive</h2>
                  <p className="text-slate-600 mb-8">
                      To access your Obsidian Vault, please connect your Google Drive account in Settings.
                  </p>
                  <p className="text-xs text-slate-400 mt-4 mb-4">You will need a valid Google Cloud Client ID.</p>
              </Card>
          </div>
      );
  }

  return (
    <div className="flex h-full gap-6">
        {/* SIDEBAR: FILE EXPLORER */}
        <div className="w-1/3 min-w-[250px] flex flex-col h-full">
            <Card className="h-full flex flex-col p-0 overflow-hidden" titleClassName="p-4 border-b">
                <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                    <h3 className="font-semibold text-slate-700">My Vault</h3>
                    <div className="flex space-x-2">
                        <button 
                            onClick={handleSync} 
                            className={`p-1.5 text-slate-500 hover:text-brand-blue hover:bg-slate-200 rounded-md transition-colors ${isSyncing ? 'animate-spin' : ''}`}
                            title="Refresh from Drive"
                        >
                            <SyncIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-2">
                    {vaultData.length === 0 && !isSyncing && (
                         <div className="text-sm text-slate-400 p-4 text-center">Empty or No Files Found.<br/>Check Folder ID in Settings.</div>
                    )}
                    <ul className="space-y-1">
                        {vaultData.map(node => (
                            <FileTreeNode 
                                key={node.id} 
                                node={node} 
                                selectedId={selectedFile?.id || null}
                                onSelect={handleSelectFile}
                                expandedNodes={expandedNodes}
                                toggleExpand={handleToggleExpand}
                            />
                        ))}
                    </ul>
                </div>

                <div className="p-4 border-t bg-slate-50">
                     <button onClick={() => setIsModalOpen(true)} className="w-full bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50 hover:text-brand-blue flex items-center justify-center transition-colors shadow-sm">
                        + New File
                    </button>
                </div>
            </Card>
        </div>

        {/* MAIN: CONTENT EDITOR/VIEWER */}
        <div className="flex-1 h-full">
            <Card className="h-full flex flex-col overflow-hidden">
                {!selectedFile ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                            <FolderIcon className="w-8 h-8 opacity-50" />
                        </div>
                        <p>Select a file from the explorer to view or edit.</p>
                    </div>
                ) : (
                    <div className="flex flex-col h-full">
                        <div className="border-b pb-4 mb-4 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center">
                                <FileIcon className="w-5 h-5 mr-2 text-slate-400" />
                                {selectedFile.name}
                            </h2>
                            <div className="flex items-center gap-2">
                                {loadingFileId === selectedFile.id && <span className="text-xs text-brand-blue animate-pulse">Loading content...</span>}
                                <span className="text-xs text-slate-400 px-2 py-1 bg-slate-100 rounded">Read-only</span>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto pr-2">
                            {selectedFile.content ? (
                                <SimpleMarkdown content={selectedFile.content} />
                            ) : (
                                <div className="text-slate-400 text-sm italic">Select file to load content...</div>
                            )}
                        </div>
                    </div>
                )}
            </Card>
        </div>

        {/* NEW FILE MODAL */}
        <Modal title="Create New Markdown File" isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
            <form onSubmit={handleCreateFile} className="space-y-4">
                <div>
                    <label htmlFor="fileName" className="block text-sm font-medium text-slate-700">File Name</label>
                    <div className="flex mt-1">
                        <input type="text" id="fileName" placeholder="e.g., Site_Visit_Report" value={newFileName} onChange={(e) => setNewFileName(e.target.value)} className="block w-full px-3 py-2 border border-slate-300 rounded-l-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm" required />
                        <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">.md</span>
                    </div>
                </div>
                <div>
                    <label htmlFor="filePrompt" className="block text-sm font-medium text-slate-700">AI Content Generation (Optional)</label>
                    <textarea id="filePrompt" rows={3} placeholder="Describe what you want the note to be about. E.g., 'Summary of LEED certification requirements for commercial buildings'" value={newFilePrompt} onChange={(e) => setNewFilePrompt(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm"></textarea>
                </div>
                <div className="flex justify-end pt-2">
                    <button type="submit" disabled={isGenerating} className="bg-brand-blue text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center disabled:bg-slate-400">
                        <SparkleIcon className={`w-5 h-5 mr-2 ${isGenerating ? 'animate-ping' : ''}`} />
                        {isGenerating ? 'Generating...' : 'Create File'}
                    </button>
                </div>
            </form>
        </Modal>
    </div>
  );
};

export default KnowledgeBase;