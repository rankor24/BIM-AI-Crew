import React, { useState } from 'react';
import type { KnowledgeArticle } from '../types';
import Card from '../components/Card';
import Modal from '../components/Modal';
import { SparkleIcon, FileIcon } from '../components/Icons';

const SimpleMarkdown: React.FC<{ content: string }> = ({ content }) => {
    const htmlContent = content
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^\* (.*$)/gim, '<li>$1</li>')
        .replace(/(\r\n|\n|\r)/gm, "<br>");

    return <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: htmlContent }} />;
};


interface KnowledgeBaseProps {
    articles: KnowledgeArticle[];
    onAddArticle: (article: Omit<KnowledgeArticle, 'id' | 'createdAt'>) => void;
    onGenerateContent: (prompt: string) => Promise<string>;
}

const KnowledgeBase: React.FC<KnowledgeBaseProps> = ({ articles, onAddArticle, onGenerateContent }) => {
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeArticle | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newArticleTitle, setNewArticleTitle] = useState('');
  const [newArticlePrompt, setNewArticlePrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  const handleCreateArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newArticleTitle.trim()) return;
    setIsGenerating(true);
    
    let content = 'Start writing your notes here...';
    if (newArticlePrompt.trim()) {
        content = await onGenerateContent(newArticlePrompt);
    }

    onAddArticle({ title: newArticleTitle, content });
    
    setIsGenerating(false);
    setIsModalOpen(false);
    setNewArticleTitle('');
    setNewArticlePrompt('');
  };
  
  return (
    <>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
        <div className="md:col-span-1 h-full flex flex-col">
            <Card title="Knowledge Articles" className="h-full flex flex-col">
                <button onClick={() => setIsModalOpen(true)} className="w-full bg-brand-blue text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center mb-4">
                    + New Article
                </button>
                <div className="bg-slate-50 p-2 rounded-lg border flex-grow overflow-y-auto">
                    {articles.length === 0 && <p className="text-slate-500 text-sm text-center p-4">No articles yet. Create one to get started!</p>}
                    <ul className="space-y-1">
                        {articles.map(article => (
                            <li key={article.id}>
                                <button 
                                    onClick={() => setSelectedArticle(article)}
                                    className={`w-full text-left p-2 rounded-md text-sm ${selectedArticle?.id === article.id ? 'bg-brand-lightblue text-white' : 'text-slate-700 hover:bg-slate-200'}`}
                                >
                                    {article.title}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </Card>
        </div>
        <div className="md:col-span-2 h-full">
            <Card title={selectedArticle?.title || "Select an Article"} className="h-full">
                {!selectedArticle && (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                        <FileIcon className="w-16 h-16 mb-4" />
                        <p>No article selected. Please choose one from the list or create a new one.</p>
                    </div>
                )}
                {selectedArticle && (
                   <div className="text-slate-700 space-y-2 text-sm h-full overflow-y-auto">
                       <SimpleMarkdown content={selectedArticle.content} />
                   </div>
                )}
            </Card>
        </div>
    </div>

    <Modal title="Create New Article" isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <form onSubmit={handleCreateArticle} className="space-y-4">
            <div>
                <label htmlFor="articleTitle" className="block text-sm font-medium text-slate-700">Article Title</label>
                <input type="text" id="articleTitle" placeholder="e.g., Concrete Curing Standards" value={newArticleTitle} onChange={(e) => setNewArticleTitle(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm" required />
            </div>
             <div>
                <label htmlFor="articlePrompt" className="block text-sm font-medium text-slate-700">AI Content Prompt (Optional)</label>
                <input type="text" id="articlePrompt" placeholder="e.g., Explain the importance of BIM Level 2" value={newArticlePrompt} onChange={(e) => setNewArticlePrompt(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue sm:text-sm" />
                <p className="text-xs text-slate-500 mt-1">If you provide a prompt, AI will generate the initial content for you.</p>
            </div>
            <div className="flex justify-end pt-2">
                <button type="submit" disabled={isGenerating} className="bg-brand-blue text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center disabled:bg-slate-400">
                     <SparkleIcon className={`w-5 h-5 mr-2 ${isGenerating ? 'animate-ping' : ''}`} />
                    {isGenerating ? 'Generating...' : 'Create Article'}
                </button>
            </div>
        </form>
    </Modal>
    </>
  );
};

export default KnowledgeBase;