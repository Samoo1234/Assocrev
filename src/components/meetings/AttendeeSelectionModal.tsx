import React, { useState, useEffect } from 'react';
import { Member } from '../../types/member';
import { memberService } from '../../services/memberService';

interface AttendeeSelectionModalProps {
    onClose: () => void;
    onAddMember: (member: Member) => void;
    onAddGuest: (name: string) => void;
}

const AttendeeSelectionModal: React.FC<AttendeeSelectionModalProps> = ({ onClose, onAddMember, onAddGuest }) => {
    const [activeTab, setActiveTab] = useState<'members' | 'guests'>('members');
    const [search, setSearch] = useState('');
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(false);
    const [guestName, setGuestName] = useState('');

    useEffect(() => {
        if (activeTab === 'members' && search.length >= 2) {
            const timer = setTimeout(async () => {
                setLoading(true);
                const { data } = await memberService.list({ search });
                if (data) setMembers(data);
                setLoading(false);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [search, activeTab]);

    const handleAddGuest = (e: React.FormEvent) => {
        e.preventDefault();
        if (guestName.trim()) {
            onAddGuest(guestName.trim());
            setGuestName('');
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/20">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">person_add</span>
                            Adicionar Participante
                        </h2>
                    </div>
                    <button onClick={onClose} className="size-10 flex items-center justify-center rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="flex border-b border-slate-100 dark:border-slate-800">
                    <button
                        onClick={() => setActiveTab('members')}
                        className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'members' ? 'text-primary border-b-2 border-primary' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        Associados
                    </button>
                    <button
                        onClick={() => setActiveTab('guests')}
                        className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'guests' ? 'text-primary border-b-2 border-primary' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        Visitantes Externos
                    </button>
                </div>

                <div className="p-8">
                    {activeTab === 'members' ? (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Buscar Associado</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                                    <input
                                        type="text"
                                        placeholder="Nome, e-mail ou CPF..."
                                        className="w-full pl-12 pr-4 py-3 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-2">
                                {loading && <div className="text-center py-4 text-xs text-slate-400 font-bold uppercase tracking-widest">Buscando...</div>}
                                {!loading && members.length === 0 && search.length >= 2 && <div className="text-center py-4 text-xs text-slate-400">Nenhum associado encontrado.</div>}
                                {!loading && members.map(member => (
                                    <button
                                        key={member.id}
                                        onClick={() => {
                                            onAddMember(member);
                                            onClose();
                                        }}
                                        className="w-full p-4 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/10 flex items-center justify-between border border-transparent hover:border-emerald-100 transition-all text-left"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-[10px]">{member.first_name[0]}{member.last_name[0]}</div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 dark:text-white">{member.first_name} {member.last_name}</p>
                                                <p className="text-[10px] text-slate-500 font-medium">{member.email}</p>
                                            </div>
                                        </div>
                                        <span className="material-symbols-outlined text-slate-300">add_circle</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleAddGuest} className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nome do Visitante</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Digite o nome completo..."
                                    className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    value={guestName}
                                    onChange={(e) => setGuestName(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full py-4 bg-slate-800 dark:bg-slate-700 text-white rounded-2xl font-bold text-sm hover:bg-slate-900 transition-all shadow-lg"
                            >
                                Adicionar Visitante
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AttendeeSelectionModal;
