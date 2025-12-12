import React from 'react';
import Card from '../components/Card';
import type { Meeting } from '../types';

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
    onOpenMeetingModal: () => void;
}

const Meetings: React.FC<MeetingsProps> = ({ meetings, onOpenMeetingModal }) => {
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-slate-800">Meeting Logs</h2>
                <button onClick={onOpenMeetingModal} className="bg-brand-blue text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center">
                    + Log Meeting
                </button>
            </div>
            <div className="space-y-6">
                {meetings.map(meeting => <MeetingCard key={meeting.id} meeting={meeting} />)}
                 {meetings.length === 0 && <Card><p className="text-slate-500 text-center">No meetings have been logged yet. Click "Log Meeting" to add one.</p></Card>}
            </div>
        </div>
    );
};

export default Meetings;