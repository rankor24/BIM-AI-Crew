import React, { useState } from 'react';
import Card from '../components/Card';
import Modal from '../components/Modal';
import type { Meeting } from '../types';
import { SparkleIcon } from '../components/Icons';

const MeetingCard: React.FC<{ meeting: Meeting }> = ({ meeting }) => (
    <Card>
        <div className="flex justify-between items-start">
            <div>
                <h4 className="font-bold text-slate-800">{meeting.title}</h4>
                <p className="text-sm text-slate-500">{meeting.date} via {meeting.platform}</p>
            </div>
            <span className="text-xs font-semibold px-2 py-1 bg-blue-100 text-brand-blue rounded-full">{meeting.platform}</span>
        </div>
        <div className="mt-4 border-t pt-4">
            <h5 className="font-semibold text-slate-700 text-sm mb-2">AI-Generated Action Items</h5>
            <ul className="list-disc list-inside space-y-1 text-slate-600 text-sm">
                {meeting.actionItems.map((item, index) => <li key={index}>{item}</li>)}
                 {meeting.actionItems.length === 0 && <li className="list-none">No action items were identified.</li>}
            </ul>
        </div>
        <div className="mt-4">
            <details>
                <summary className="cursor-pointer text-sm font-semibold text-brand-blue hover:underline">Show AI-Generated Summary</summary>
                <p className="mt-2 text-sm text-slate-500 bg-slate-50 p-3 rounded-lg">{meeting.transcriptSummary}</p>
            </details>
        </div>
    </Card>
);

interface MeetingsProps {
    meetings: Meeting[];
    onAddMeeting: (title: string, date: string, platform: Meeting['platform'], transcript: string) => Promise<void>;
    isSyncing: boolean;
}

const Meetings: React.FC<MeetingsProps> = ({ meetings, onAddMeeting, isSyncing }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newMeeting, setNewMeeting] = useState({
        title: '',
        date: '',
        platform: 'MS Teams' as 'Google Meet' | 'MS Teams' | 'Webex',
        transcript: '',
    });

    const handleLogMeeting = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newMeeting.title && newMeeting.date && newMeeting.transcript) {
            await onAddMeeting(newMeeting.title, newMeeting.date, newMeeting.platform, newMeeting.transcript);
            setIsModalOpen(false);
            setNewMeeting({ title: '', date: '', platform: 'MS Teams', transcript: '' });
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-slate-800">Meeting Logs</h2>
                <button onClick={() => setIsModalOpen(true)} className="bg-brand-blue text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center">
                    + Log Meeting
                </button>
            </div>
            <div className="space-y-6">
                {meetings.map(meeting => <MeetingCard key={meeting.id} meeting={meeting} />)}
                 {meetings.length === 0 && <Card><p className="text-slate-500 text-center">No meetings have been logged yet. Click "Log Meeting" to add one.</p></Card>}
            </div>
            <Modal title="Log New Meeting with AI" isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <form onSubmit={handleLogMeeting} className="space-y-4">
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
                    <div>
                        <label htmlFor="meetingTranscript" className="block text-sm font-medium text-slate-700">Meeting Transcript</label>
                        <textarea id="meetingTranscript" rows={5} placeholder="Paste the full meeting transcript here..." value={newMeeting.transcript} onChange={e => setNewMeeting({...newMeeting, transcript: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue" required />
                    </div>
                    <p className="text-xs text-slate-500 text-center pt-2">AI will process the transcript to generate a summary and extract action items for you.</p>
                    <div className="flex justify-end pt-2">
                        <button type="submit" disabled={isSyncing} className="bg-brand-blue text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center disabled:bg-slate-400">
                             <SparkleIcon className={`w-5 h-5 mr-2 ${isSyncing ? 'animate-ping' : ''}`} />
                            {isSyncing ? 'Generating...' : 'Generate & Log Meeting'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Meetings;