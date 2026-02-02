import { supabase } from './supabase';
import { AppEvent } from '../types';

class EventService {
    /**
     * Listar todos os eventos
     */
    async list(): Promise<{ data: AppEvent[]; error: string | null }> {
        try {
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .order('start_date', { ascending: true });

            if (error) {
                return { data: [], error: error.message };
            }

            // Mapear para formato do frontend
            const events: AppEvent[] = (data || []).map(e => ({
                id: e.id,
                title: e.title,
                date: new Date(e.start_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }),
                time: `${new Date(e.start_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - ${new Date(e.end_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
                location: e.location,
                status: e.status === 'upcoming' ? 'Confirmado' : e.status === 'ongoing' ? 'Pendente' : 'Finalizado',
                imageUrl: e.image_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400',
            }));

            return { data: events, error: null };
        } catch (err) {
            return { data: [], error: 'Erro ao buscar eventos' };
        }
    }

    /**
     * Criar novo evento
     */
    async create(eventData: any): Promise<{ data: any | null; error: string | null }> {
        try {
            const { data, error } = await supabase
                .from('events')
                .insert([eventData])
                .select()
                .single();

            if (error) {
                return { data: null, error: error.message };
            }

            return { data, error: null };
        } catch (err) {
            return { data: null, error: 'Erro ao criar evento' };
        }
    }

    /**
     * Atualizar evento
     */
    async update(id: string, eventData: any): Promise<{ data: any | null; error: string | null }> {
        try {
            const { data, error } = await supabase
                .from('events')
                .update(eventData)
                .eq('id', id)
                .select()
                .single();

            if (error) {
                return { data: null, error: error.message };
            }

            return { data, error: null };
        } catch (err) {
            return { data: null, error: 'Erro ao atualizar evento' };
        }
    }

    /**
     * Excluir evento
     */
    async delete(id: string): Promise<{ success: boolean; error: string | null }> {
        try {
            const { error } = await supabase
                .from('events')
                .delete()
                .eq('id', id);

            if (error) {
                return { success: false, error: error.message };
            }

            return { success: true, error: null };
        } catch (err) {
            return { success: false, error: 'Erro ao excluir evento' };
        }
    }
}

export const eventService = new EventService();
