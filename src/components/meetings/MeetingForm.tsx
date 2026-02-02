import React, { useState, useEffect } from 'react';
import { memberService } from '../../services/memberService';
import { meetingService } from '../../services/meetingService';
import { Member, CreateMeetingInput, MeetingType } from '../../types';

interface MeetingFormProps {
    onClose: () => void;
    onSuccess: (id: string) => void;
}

const MeetingForm: React.FC<MeetingFormProps> = ({ onClose, onSuccess }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [includeBoard, setIncludeBoard] = useState(true);
    const [formData, setFormData] = useState<CreateMeetingInput>({
        title: '',
        meeting_date: new Date().toISOString().split('T')[0],
        start_time: '19:00',
        meeting_type: 'ordinary',
        location: 'Sede da Associação',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const { data: meeting, error } = await meetingService.create(formData);

        if (error) {
            alert('Erro ao criar reunião: ' + error);
        } else if (meeting) {
            // Se marcado para incluir diretoria, fazemos isso agora
            if (includeBoard) {
                const { data: boardMembers } = await memberService.listBoardMembers();
                if (boardMembers && boardMembers.length > 0) {
                    const attendees = boardMembers.map(m => ({
                        meeting_id: meeting.id,
                        member_id: m.id,
                        role: m.board_position?.toLowerCase().includes('presidente') ? 'president' :
                            m.board_position?.toLowerCase().includes('secret') ? 'secretary' :
                                m.board_position?.toLowerCase().includes('tesour') ? 'treasurer' : 'participant'
                    }));
                    await meetingService.addMultipleAttendees(attendees);
                }
            }
            onSuccess(meeting.id);
        }
        setIsSubmitting(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/20">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">add_circle</span>
                            Nova Reunião
                        </h2>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Configurar pauta e participantes</p>
                    </div>
                    <button onClick={onClose} className="size-10 flex items-center justify-center rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="grid grid-cols-1 gap-6">
                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Título da Reunião</label>
                            <input
                                type="text"
                                required
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                placeholder="Ex: Assembleia Geral Extraordinária"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Data</label>
                                <input
                                    type="date"
                                    required
                                    value={formData.meeting_date}
                                    onChange={(e) => setFormData({ ...formData, meeting_date: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Horário de Início</label>
                                <input
                                    type="time"
                                    value={formData.start_time}
                                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Tipo de Reunião</label>
                            <select
                                value={formData.meeting_type}
                                onChange={(e) => setFormData({ ...formData, meeting_type: e.target.value as MeetingType })}
                                className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none"
                            >
                                <option value="ordinary">Assembleia Ordinária</option>
                                <option value="extraordinary">Assembleia Extraordinária</option>
                                <option value="board">Reunião de Diretoria</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Local</label>
                            <input
                                type="text"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                placeholder="Ex: Sede Social ou Link do Zoom"
                            />
                        </div>

                        <label className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl cursor-pointer group transition-all hover:bg-emerald-100 dark:hover:bg-emerald-900/30">
                            <input
                                type="checkbox"
                                checked={includeBoard}
                                onChange={(e) => setIncludeBoard(e.target.checked)}
                                className="size-5 rounded border-emerald-500 text-primary focus:ring-primary accent-primary"
                            />
                            <div>
                                <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Incluir diretoria automaticamente</p>
                                <p className="text-[10px] font-medium text-emerald-600/70 dark:text-emerald-400/50 uppercase tracking-tight">Adiciona presidente, secretário e tesoureiro à lista de presença</p>
                            </div>
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-primary hover:bg-emerald-700 text-white py-4 rounded-2xl font-bold text-lg transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
                    >
                        {isSubmitting ? (
                            <span className="material-symbols-outlined animate-spin">progress_activity</span>
                        ) : (
                            <>
                                <span className="material-symbols-outlined">check_circle</span>
                                Criar Reunião
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default MeetingForm;
