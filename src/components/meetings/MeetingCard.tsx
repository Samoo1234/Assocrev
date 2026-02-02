import React from 'react';
import { Meeting, meetingTypeLabels, meetingStatusLabels } from '../../types/meeting';

interface MeetingCardProps {
    meeting: Meeting;
    onClick: (id: string) => void;
}

const MeetingCard: React.FC<MeetingCardProps> = ({ meeting, onClick }) => {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'scheduled': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30';
            case 'in_progress': return 'text-amber-600 bg-amber-100 dark:bg-amber-900/30';
            case 'completed': return 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30';
            case 'cancelled': return 'text-red-600 bg-red-100 dark:bg-red-900/30';
            default: return 'text-slate-600 bg-slate-100 dark:bg-slate-800';
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'board': return 'admin_panel_settings';
            case 'extraordinary': return 'emergency';
            default: return 'groups';
        }
    };

    const formattedDate = new Date(meeting.meeting_date + 'T12:00:00').toLocaleDateString('pt-BR');

    return (
        <div
            onClick={() => onClick(meeting.id)}
            className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
            <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getStatusColor(meeting.status)}`}>
                    <span className="material-symbols-outlined text-2xl">{getTypeIcon(meeting.meeting_type)}</span>
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(meeting.status)}`}>
                    {meetingStatusLabels[meeting.status]}
                </span>
            </div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-primary transition-colors line-clamp-2">
                {meeting.title}
            </h3>

            <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <span className="material-symbols-outlined text-sm">calendar_month</span>
                    {formattedDate}
                </div>
                {meeting.start_time && (
                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                        <span className="material-symbols-outlined text-sm">schedule</span>
                        {meeting.start_time} {meeting.end_time ? `- ${meeting.end_time}` : ''}
                    </div>
                )}
                {meeting.location && (
                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 line-clamp-1">
                        <span className="material-symbols-outlined text-sm">location_on</span>
                        {meeting.location}
                    </div>
                )}
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-medium text-slate-400">
                <span className="uppercase tracking-widest">{meetingTypeLabels[meeting.meeting_type]}</span>
                <span className="flex items-center gap-1 text-primary">
                    Ver detalhes
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </span>
            </div>
        </div>
    );
};

export default MeetingCard;
