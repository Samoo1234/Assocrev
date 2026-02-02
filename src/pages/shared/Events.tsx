import React, { useState, useEffect } from 'react';
import { eventService } from '../../services/eventService';
import { AppEvent } from '../../types';
import { supabase } from '../../services/supabase';

interface EventsProps {
    isAdmin?: boolean;
}

const Events: React.FC<EventsProps> = ({ isAdmin }) => {
    const [events, setEvents] = useState<AppEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingEvent, setEditingEvent] = useState<AppEvent | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        start_date: new Date().toISOString().slice(0, 16),
        end_date: new Date().toISOString().slice(0, 16),
        location: '',
        status: 'upcoming',
        image_url: '',
    });

    const loadEvents = async () => {
        setLoading(true);
        const { data, error } = await eventService.list();
        if (error) {
            setError(error);
        } else {
            setEvents(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadEvents();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const dataToSave = {
            ...formData,
            start_date: new Date(formData.start_date).toISOString(),
            end_date: new Date(formData.end_date).toISOString(),
        };

        let result;
        if (editingEvent) {
            result = await eventService.update(editingEvent.id, dataToSave);
        } else {
            result = await eventService.create(dataToSave);
        }

        if (!result.error) {
            setIsModalOpen(false);
            setEditingEvent(null);
            setFormData({
                title: '',
                description: '',
                start_date: new Date().toISOString().slice(0, 16),
                end_date: new Date().toISOString().slice(0, 16),
                location: '',
                status: 'upcoming',
                image_url: '',
            });
            loadEvents();
        } else {
            alert('Erro ao salvar evento: ' + result.error);
        }

        setIsSubmitting(false);
    };

    const handleEdit = async (event: AppEvent) => {
        setLoading(true);
        const { data, error } = await supabase
            .from('events')
            .select('*')
            .eq('id', event.id)
            .single();

        if (data && !error) {
            setFormData({
                title: data.title,
                description: data.description || '',
                start_date: new Date(data.start_date).toISOString().slice(0, 16),
                end_date: new Date(data.end_date).toISOString().slice(0, 16),
                location: data.location,
                status: data.status,
                image_url: data.image_url || '',
            });
            setEditingEvent(event);
            setIsModalOpen(true);
        } else {
            alert('Erro ao carregar dados para edição: ' + (error?.message || 'Erro desconhecido'));
        }
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este evento?')) return;

        const result = await eventService.delete(id);
        if (result.success) {
            loadEvents();
        } else {
            alert('Erro ao excluir evento: ' + result.error);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start max-w-7xl mx-auto">
            <aside className="lg:col-span-4 bg-white dark:bg-[#1a2e22] rounded-xl shadow-sm border border-[#e8f3ec] dark:border-[#2a4535] p-6 sticky top-24">
                <div className="flex items-center justify-between mb-6">
                    <button className="p-2 hover:bg-slate-50 rounded-full"><span className="material-symbols-outlined">chevron_left</span></button>
                    <p className="text-lg font-bold">Janeiro 2026</p>
                    <button className="p-2 hover:bg-slate-50 rounded-full"><span className="material-symbols-outlined">chevron_right</span></button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center mb-4 text-[10px] font-black text-emerald-600 uppercase">
                    <div>Dom</div><div>Seg</div><div>Ter</div><div>Qua</div><div>Qui</div><div>Sex</div><div>Sáb</div>
                </div>
                <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: 31 }).map((_, i) => (
                        <button key={i} className={`h-10 flex items-center justify-center rounded-lg hover:bg-primary/10 transition-colors ${i + 1 === 15 ? 'bg-primary text-white font-bold' : ''}`}>
                            {i + 1}
                        </button>
                    ))}
                </div>
            </aside>

            <section className="lg:col-span-8 space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">Próximos Eventos</h2>
                    <div className="flex gap-2">
                        <button onClick={loadEvents} className="p-2 bg-white dark:bg-[#1a2e22] rounded-lg border border-[#e8f3ec] hover:bg-slate-50">
                            <span className="material-symbols-outlined">refresh</span>
                        </button>
                        {isAdmin && (
                            <button
                                onClick={() => {
                                    setEditingEvent(null);
                                    setFormData({
                                        title: '',
                                        description: '',
                                        start_date: new Date().toISOString().slice(0, 16),
                                        end_date: new Date().toISOString().slice(0, 16),
                                        location: '',
                                        status: 'upcoming',
                                        image_url: '',
                                    });
                                    setIsModalOpen(true);
                                }}
                                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition-colors flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined text-sm">add</span>
                                Novo Evento
                            </button>
                        )}
                    </div>
                </div>

                {loading ? (
                    <div className="bg-white dark:bg-[#1a2e22] rounded-xl p-12 text-center border border-[#e8f3ec]">
                        <span className="material-symbols-outlined text-4xl text-slate-300 animate-spin">progress_activity</span>
                        <p className="text-slate-500 mt-2">Carregando eventos...</p>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-red-500">error</span>
                        <p className="text-red-700">{error}</p>
                    </div>
                ) : events.length === 0 ? (
                    <div className="bg-white dark:bg-[#1a2e22] rounded-xl p-12 text-center border border-[#e8f3ec]">
                        <span className="material-symbols-outlined text-4xl text-slate-300">calendar_today</span>
                        <p className="text-slate-500 mt-2">Nenhum evento programado.</p>
                    </div>
                ) : (
                    events.map((event) => (
                        <div key={event.id} className={`bg-white dark:bg-[#1a2e22] rounded-xl overflow-hidden shadow-sm border border-[#e8f3ec] flex flex-col md:flex-row ${event.status === 'Finalizado' ? 'grayscale opacity-75' : ''}`}>
                            <div className="md:w-1/3 h-48 md:h-auto bg-cover bg-center" style={{ backgroundImage: `url(${event.imageUrl})` }}></div>
                            <div className="flex-1 p-6 flex flex-col">
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded ${event.status === 'Confirmado' ? 'bg-primary/10 text-primary' :
                                        event.status === 'Pendente' ? 'bg-amber-100 text-amber-700' : 'bg-gray-200 text-gray-600'
                                        }`}>
                                        {event.status}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[#50956d] text-sm font-medium">#EVENT-{event.id.slice(0, 5)}</span>
                                        {isAdmin && (
                                            <div className="flex gap-1">
                                                <button onClick={() => handleEdit(event)} className="p-1 text-slate-400 hover:text-primary transition-colors">
                                                    <span className="material-symbols-outlined text-sm">edit</span>
                                                </button>
                                                <button onClick={() => handleDelete(event.id)} className="p-1 text-slate-400 hover:text-red-500 transition-colors">
                                                    <span className="material-symbols-outlined text-sm">delete</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold mb-3">{event.title}</h3>
                                <div className="space-y-2 mb-6 text-sm text-[#50956d]">
                                    <div className="flex items-center gap-2"><span className="material-symbols-outlined text-sm">calendar_month</span><span>{event.date}</span></div>
                                    <div className="flex items-center gap-2"><span className="material-symbols-outlined text-sm">schedule</span><span>{event.time}</span></div>
                                    <div className="flex items-center gap-2"><span className="material-symbols-outlined text-sm">location_on</span><span className="font-bold text-slate-900 dark:text-white">{event.location}</span></div>
                                </div>
                                <div className="mt-auto flex flex-wrap gap-2">
                                    {!isAdmin && <button className="bg-primary/10 text-primary px-4 py-2 rounded-lg text-xs font-bold hover:bg-primary hover:text-white transition-all">Participar</button>}
                                    <button className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-lg text-xs font-bold">Detalhes</button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </section>

            {/* Modal de Novo/Editar Evento */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/20">
                            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">event</span>
                                {editingEvent ? 'Editar Evento' : 'Novo Evento'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-4">
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Título</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    placeholder="Ex: Assembleia Geral"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Descrição</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all h-24 resize-none"
                                    placeholder="Detalhes do evento..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Início</label>
                                    <input
                                        type="datetime-local"
                                        required
                                        value={formData.start_date}
                                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Fim</label>
                                    <input
                                        type="datetime-local"
                                        required
                                        value={formData.end_date}
                                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Local</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    placeholder="Ex: Auditório ou Link Zoom"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">URL da Imagem (Opcional)</label>
                                <input
                                    type="url"
                                    value={formData.image_url}
                                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    placeholder="https://images.unsplash.com/..."
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Status</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none"
                                >
                                    <option value="upcoming">Confirmado</option>
                                    <option value="ongoing">Pendente</option>
                                    <option value="finished">Finalizado</option>
                                </select>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-primary hover:bg-emerald-700 text-white py-4 rounded-xl font-bold text-lg transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <>
                                        <span className="material-symbols-outlined animate-spin">progress_activity</span>
                                        Salvando...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined">check_circle</span>
                                        {editingEvent ? 'Atualizar Evento' : 'Criar Evento'}
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Events;
