import React, { useState, useEffect } from 'react';
import { meetingService } from '../../services/meetingService';
import { aiMinutesService } from '../../services/aiMinutesService';
import {
    Meeting,
    MeetingTopic,
    MeetingDecision,
    MeetingVote,
    MeetingAttendee,
    AttendeeRole,
    meetingTypeLabels,
    attendeeRoleLabels
} from '../../types/meeting';
import AttendeeSelectionModal from './AttendeeSelectionModal';
import { Member } from '../../types/member';

interface MeetingEditorProps {
    meetingId: string;
    onBack: () => void;
    onGenerateMinutes: () => void;
}

const MeetingEditor: React.FC<MeetingEditorProps> = ({ meetingId, onBack, onGenerateMinutes }) => {
    const [meeting, setMeeting] = useState<Meeting | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'topics' | 'attendees' | 'decisions' | 'votes'>('topics');

    // Form states for adding items
    const [newTopic, setNewTopic] = useState({ title: '', description: '' });
    const [newDecision, setNewDecision] = useState({ description: '', responsible_id: '', topic_id: '' });
    const [newVote, setNewVote] = useState({ subject: '', topic_id: '' });
    const [showAttendeeModal, setShowAttendeeModal] = useState(false);

    const loadMeetingData = async () => {
        setLoading(true);
        const { data, error } = await meetingService.get(meetingId);
        if (!error && data) {
            setMeeting(data);
        }
        setLoading(false);
    };

    const handleAddMemberAttendee = async (member: Member) => {
        // Evitar duplicados
        if (meeting?.attendees?.some(a => a.member_id === member.id)) return;

        await meetingService.addAttendee(meetingId, member.id, undefined, 'participant');
        loadMeetingData();
    };

    const handleAddGuestAttendee = async (name: string) => {
        await meetingService.addAttendee(meetingId, undefined, name, 'participant');
        loadMeetingData();
    };

    useEffect(() => {
        loadMeetingData();
    }, [meetingId]);

    const handleAddTopic = async () => {
        if (!newTopic.title || !meeting) return;

        await meetingService.addTopic({
            meeting_id: meetingId,
            title: newTopic.title,
            description: newTopic.description,
            order_num: (meeting.topics?.length || 0) + 1
        });

        setNewTopic({ title: '', description: '' });
        loadMeetingData();
    };

    const handleUpdateTopicNotes = async (topicId: string, notes: string) => {
        await meetingService.updateTopic(topicId, { discussion_notes: notes });
        // Don't reload full meeting to avoid flicker during typing
        setMeeting(prev => {
            if (!prev) return null;
            return {
                ...prev,
                topics: prev.topics?.map(t => t.id === topicId ? { ...t, discussion_notes: notes } : t)
            };
        });
    };

    const handleTogglePresence = async (attendeeId: string, currentStatus: boolean) => {
        await meetingService.updateAttendee(attendeeId, { present: !currentStatus });
        loadMeetingData();
    };

    const handleAddDecision = async () => {
        if (!newDecision.description) return;

        await meetingService.addDecision({
            meeting_id: meetingId,
            description: newDecision.description,
            responsible_member_id: newDecision.responsible_id || undefined,
            topic_id: newDecision.topic_id || undefined
        });

        setNewDecision({ description: '', responsible_id: '', topic_id: '' });
        loadMeetingData();
    };

    const handleAddVote = async () => {
        if (!newVote.subject) return;

        await meetingService.addVote({
            meeting_id: meetingId,
            subject: newVote.subject,
            topic_id: newVote.topic_id || undefined
        });

        setNewVote({ subject: '', topic_id: '' });
        loadMeetingData();
    };

    const handleUpdateVote = async (voteId: string, field: string, value: number) => {
        await meetingService.updateVote(voteId, { [field]: value });
        loadMeetingData();
    };

    const handleUpdateStatus = async (status: string) => {
        await meetingService.update(meetingId, { status });
        loadMeetingData();
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-64">
            <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
            <p className="mt-4 text-slate-500 font-bold uppercase tracking-widest text-xs">Carregando detalhes da reunião...</p>
        </div>
    );

    if (!meeting) return <div>Reunião não encontrada.</div>;

    return (
        <div className="space-y-6">
            {/* Header com ações */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-all">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white line-clamp-1">{meeting.title}</h2>
                        <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs font-bold text-primary uppercase tracking-widest">
                                {meetingTypeLabels[meeting.meeting_type]}
                            </span>
                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                            <span className="text-xs font-medium text-slate-500">
                                {new Date(meeting.meeting_date + 'T12:00:00').toLocaleDateString('pt-BR')}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {meeting.status === 'scheduled' && (
                        <button
                            onClick={() => handleUpdateStatus('in_progress')}
                            className="px-6 py-2 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 transition-all flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-sm">play_arrow</span>
                            Iniciar Reunião
                        </button>
                    )}

                    {meeting.status === 'in_progress' && (
                        <button
                            onClick={() => handleUpdateStatus('completed')}
                            className="px-6 py-2 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-slate-900 transition-all flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-sm">check</span>
                            Encerrar Reunião
                        </button>
                    )}

                    <button
                        onClick={onGenerateMinutes}
                        className="px-6 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                    >
                        <span className="material-symbols-outlined text-sm">smart_toy</span>
                        Gerar Ata com IA
                    </button>
                </div>
            </div>

            {/* Abas e Editor */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Menu lateral de abas */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm h-fit">
                    <div className="space-y-2">
                        {[
                            { id: 'attendees', icon: 'groups', label: 'Participantes', count: meeting.attendees?.length },
                            { id: 'topics', icon: 'list_alt', label: 'Pauta e Notas', count: meeting.topics?.length },
                            { id: 'decisions', icon: 'gavel', label: 'Decisões', count: meeting.decisions?.length },
                            { id: 'votes', icon: 'ballot', label: 'Votações', count: meeting.votes?.length },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${activeTab === tab.id
                                    ? 'bg-primary text-white shadow-lg shadow-emerald-500/20'
                                    : 'hover:bg-slate-50 dark:hover:bg-white/5 text-slate-500'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined">{tab.icon}</span>
                                    <span className="font-bold text-sm tracking-tight">{tab.label}</span>
                                </div>
                                {tab.count !== undefined && (
                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-white text-primary' : 'bg-slate-100 dark:bg-white/10 text-slate-400'
                                        }`}>
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Conteúdo da aba */}
                <div className="lg:col-span-3 space-y-6">
                    {/* ABA PARTICIPANTES */}
                    {activeTab === 'attendees' && (
                        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                            <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">groups</span>
                                    Lista de Presença
                                </h3>
                                <button
                                    onClick={() => setShowAttendeeModal(true)}
                                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                                >
                                    <span className="material-symbols-outlined text-sm">person_add</span>
                                    Adicionar Participante
                                </button>
                            </div>
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {meeting.attendees?.length === 0 ? (
                                    <div className="p-12 text-center text-slate-400">Nenhum participante registrado.</div>
                                ) : (
                                    meeting.attendees?.map(attendee => (
                                        <div key={attendee.id} className="px-8 py-4 flex items-center justify-between group hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="size-10 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center font-bold text-primary text-xs border border-primary/20">
                                                    {attendee.member?.first_name[0]}{attendee.member?.last_name[0]}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 dark:text-white text-sm">
                                                        {attendee.member ? `${attendee.member.first_name} ${attendee.member.last_name}` : attendee.name}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{attendeeRoleLabels[attendee.role]}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleTogglePresence(attendee.id, attendee.present)}
                                                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 ${attendee.present
                                                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                                    : 'bg-slate-100 dark:bg-white/5 text-slate-400 border-transparent hover:border-slate-200'
                                                    }`}
                                            >
                                                <span className="material-symbols-outlined text-sm">
                                                    {attendee.present ? 'check_circle' : 'radio_button_unchecked'}
                                                </span>
                                                {attendee.present ? 'Presente' : 'Deseja marcar presença?'}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (confirm('Remover este participante?')) {
                                                        meetingService.removeAttendee(attendee.id).then(() => loadMeetingData());
                                                    }
                                                }}
                                                className="p-2 text-slate-300 hover:text-red-500 transition-all"
                                            >
                                                <span className="material-symbols-outlined text-sm">remove_circle</span>
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* ABA PAUTAS */}
                    {activeTab === 'topics' && (
                        <div className="space-y-6">
                            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
                                    <span className="material-symbols-outlined text-primary">add_box</span>
                                    Novo Tópico de Pauta
                                </h3>
                                <div className="space-y-4">
                                    <input
                                        type="text"
                                        placeholder="Título do tópico ou pauta..."
                                        className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                        value={newTopic.title}
                                        onChange={e => setNewTopic({ ...newTopic, title: e.target.value })}
                                    />
                                    <textarea
                                        placeholder="Descrição curta (opcional)..."
                                        className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                                        rows={2}
                                        value={newTopic.description}
                                        onChange={e => setNewTopic({ ...newTopic, description: e.target.value })}
                                    />
                                    <button
                                        onClick={handleAddTopic}
                                        className="w-full py-3 bg-slate-800 dark:bg-slate-700 text-white rounded-xl text-sm font-bold hover:bg-slate-900 transition-all flex items-center justify-center gap-2"
                                    >
                                        <span className="material-symbols-outlined">add</span>
                                        Adicionar Tópico
                                    </button>
                                </div>
                            </div>

                            {meeting.topics?.map((topic, index) => (
                                <div key={topic.id} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                                    <div className="px-8 py-4 bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="size-6 bg-primary text-white text-[10px] font-black rounded-full flex items-center justify-center">{topic.order_num}</span>
                                            <h4 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-tight">{topic.title}</h4>
                                        </div>
                                        <button className="text-slate-400 hover:text-red-500 transition-all">
                                            <span className="material-symbols-outlined text-sm">delete</span>
                                        </button>
                                    </div>
                                    <div className="p-8 space-y-4">
                                        {topic.description && <p className="text-sm text-slate-500 italic mb-2">{topic.description}</p>}
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Notas de Discussão</label>
                                            <textarea
                                                className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none min-h-[120px]"
                                                placeholder="Resuma o que foi discutido sobre este tópico..."
                                                value={topic.discussion_notes || ''}
                                                onChange={e => handleUpdateTopicNotes(topic.id, e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ABA DECISÕES */}
                    {activeTab === 'decisions' && (
                        <div className="space-y-6">
                            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
                                    <span className="material-symbols-outlined text-primary">gavel</span>
                                    Registrar Nova Decisão
                                </h3>
                                <div className="space-y-4">
                                    <textarea
                                        placeholder="Descreva a decisão tomada..."
                                        className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                                        rows={2}
                                        value={newDecision.description}
                                        onChange={e => setNewDecision({ ...newDecision, description: e.target.value })}
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <select
                                            className="px-4 py-3 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none appearance-none"
                                            value={newDecision.topic_id}
                                            onChange={e => setNewDecision({ ...newDecision, topic_id: e.target.value })}
                                        >
                                            <option value="">Vincular a Tópico (opcional)</option>
                                            {meeting.topics?.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                                        </select>
                                        <select
                                            className="px-4 py-3 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none appearance-none"
                                            value={newDecision.responsible_id}
                                            onChange={e => setNewDecision({ ...newDecision, responsible_id: e.target.value })}
                                        >
                                            <option value="">Definir Responsável (opcional)</option>
                                            {meeting.attendees?.filter(a => a.member_id).map(a => (
                                                <option key={a.member_id} value={a.member_id}>
                                                    {a.member?.first_name} {a.member?.last_name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <button
                                        onClick={handleAddDecision}
                                        className="w-full py-3 bg-slate-800 dark:bg-slate-700 text-white rounded-xl text-sm font-bold hover:bg-slate-900 transition-all"
                                    >
                                        Salvar Decisão
                                    </button>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {meeting.decisions?.length === 0 ? (
                                        <div className="p-12 text-center text-slate-400">Nenhuma decisão registrada.</div>
                                    ) : (
                                        meeting.decisions?.map(decision => (
                                            <div key={decision.id} className="p-6 hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
                                                <div className="flex items-start justify-between">
                                                    <div className="space-y-2">
                                                        <p className="font-bold text-slate-900 dark:text-white">{decision.description}</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {decision.responsible && (
                                                                <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded text-[10px] font-bold uppercase">
                                                                    Responsável: {decision.responsible.first_name}
                                                                </span>
                                                            )}
                                                            <span className="px-2 py-0.5 bg-slate-100 dark:bg-white/10 text-slate-400 rounded text-[10px] font-bold uppercase tracking-tight">
                                                                Registrado em {new Date(decision.created_at!).toLocaleString()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <button className="text-slate-300 hover:text-red-500 transition-all">
                                                        <span className="material-symbols-outlined text-sm">delete</span>
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ABA VOTAÇÕES */}
                    {activeTab === 'votes' && (
                        <div className="space-y-6">
                            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
                                    <span className="material-symbols-outlined text-primary">ballot</span>
                                    Registrar Votação
                                </h3>
                                <div className="space-y-4">
                                    <input
                                        type="text"
                                        placeholder="Objeto da votação (Ex: Aprovação de contas 2024)..."
                                        className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                        value={newVote.subject}
                                        onChange={e => setNewVote({ ...newVote, subject: e.target.value })}
                                    />
                                    <select
                                        className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none appearance-none"
                                        value={newVote.topic_id}
                                        onChange={e => setNewVote({ ...newVote, topic_id: e.target.value })}
                                    >
                                        <option value="">Vincular a Tópico (opcional)</option>
                                        {meeting.topics?.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                                    </select>
                                    <button
                                        onClick={handleAddVote}
                                        className="w-full py-3 bg-slate-800 dark:bg-slate-700 text-white rounded-xl text-sm font-bold hover:bg-slate-900 transition-all"
                                    >
                                        Abrir Votação
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {meeting.votes?.map(vote => (
                                    <div key={vote.id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-full">
                                        <div className="flex items-start justify-between mb-4">
                                            <h4 className="font-bold text-slate-900 dark:text-white leading-tight pr-4">{vote.subject}</h4>
                                            <button className="text-slate-300 hover:text-red-500 transition-all">
                                                <span className="material-symbols-outlined text-sm">delete</span>
                                            </button>
                                        </div>

                                        <div className="flex-1 space-y-4">
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-emerald-600">
                                                    <span>A Favor</span>
                                                    <span>{vote.votes_for}</span>
                                                </div>
                                                <div className="flex gap-1 h-2 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden">
                                                    <div style={{ width: `${(vote.votes_for / (Math.max(1, vote.votes_for + vote.votes_against + vote.votes_abstain))) * 100}%` }} className="bg-emerald-500 h-full"></div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => handleUpdateVote(vote.id, 'votes_for', vote.votes_for - 1)} className="size-6 rounded bg-slate-100 dark:bg-white/10 flex items-center justify-center">-</button>
                                                    <button onClick={() => handleUpdateVote(vote.id, 'votes_for', vote.votes_for + 1)} className="flex-1 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 font-bold text-xs">+</button>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-red-500">
                                                    <span>Contra</span>
                                                    <span>{vote.votes_against}</span>
                                                </div>
                                                <div className="flex gap-1 h-2 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden">
                                                    <div style={{ width: `${(vote.votes_against / (Math.max(1, vote.votes_for + vote.votes_against + vote.votes_abstain))) * 100}%` }} className="bg-red-500 h-full"></div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => handleUpdateVote(vote.id, 'votes_against', vote.votes_against - 1)} className="size-6 rounded bg-slate-100 dark:bg-white/10 flex items-center justify-center">-</button>
                                                    <button onClick={() => handleUpdateVote(vote.id, 'votes_against', vote.votes_against + 1)} className="flex-1 py-1 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 font-bold text-xs">+</button>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                    <span>Abstenções</span>
                                                    <span>{vote.votes_abstain}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => handleUpdateVote(vote.id, 'votes_abstain', vote.votes_abstain - 1)} className="size-6 rounded bg-slate-100 dark:bg-white/10 flex items-center justify-center">-</button>
                                                    <button onClick={() => handleUpdateVote(vote.id, 'votes_abstain', vote.votes_abstain + 1)} className="flex-1 py-1 rounded-lg bg-slate-100 dark:bg-white/10 text-slate-500 font-bold text-xs">+</button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resultado:</span>
                                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded ${vote.result === 'approved' ? 'bg-emerald-100 text-emerald-600' :
                                                vote.result === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'
                                                }`}>
                                                {vote.result === 'approved' ? 'Aprovado' : vote.result === 'rejected' ? 'Rejeitado' : 'Empate/Pendente'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {showAttendeeModal && (
                <AttendeeSelectionModal
                    onClose={() => setShowAttendeeModal(false)}
                    onAddMember={handleAddMemberAttendee}
                    onAddGuest={handleAddGuestAttendee}
                />
            )}
        </div>
    );
};

export default MeetingEditor;
