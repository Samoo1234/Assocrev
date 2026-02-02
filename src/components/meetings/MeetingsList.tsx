import React, { useState, useEffect } from 'react';
import { meetingService } from '../../services/meetingService';
import { Meeting } from '../../types/meeting';
import MeetingCard from './MeetingCard';

interface MeetingsListProps {
    onSelectMeeting: (id: string) => void;
    onNewMeeting: () => void;
}

const MeetingsList: React.FC<MeetingsListProps> = ({ onSelectMeeting, onNewMeeting }) => {
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState<'all' | 'scheduled' | 'in_progress' | 'completed'>('all');

    const loadMeetings = async () => {
        setLoading(true);
        const { data, error } = await meetingService.list();
        if (!error) {
            setMeetings(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadMeetings();
    }, []);

    const filteredMeetings = meetings.filter(meeting => {
        const matchesSearch = meeting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            meeting.location?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filter === 'all' || meeting.status === filter;
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex-1 relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                    <input
                        type="text"
                        placeholder="Buscar reuniões por título ou local..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value as any)}
                        className="px-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none appearance-none cursor-pointer"
                    >
                        <option value="all">Todos Status</option>
                        <option value="scheduled">Agendadas</option>
                        <option value="in_progress">Em Andamento</option>
                        <option value="completed">Concluídas</option>
                    </select>
                    <button
                        onClick={onNewMeeting}
                        className="px-6 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                    >
                        <span className="material-symbols-outlined">add</span>
                        Nova Reunião
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-64 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-2xl"></div>
                    ))}
                </div>
            ) : filteredMeetings.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800">
                    <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">event_busy</span>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Nenhuma reunião encontrada</h3>
                    <p className="text-slate-500 mb-6">Crie a primeira reunião para começar a documentar as atas.</p>
                    <button
                        onClick={onNewMeeting}
                        className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-emerald-700 transition-all"
                    >
                        Agendar Reunião
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredMeetings.map(meeting => (
                        <MeetingCard
                            key={meeting.id}
                            meeting={meeting}
                            onClick={onSelectMeeting}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default MeetingsList;
