import { supabase } from './supabase';
import {
    Meeting,
    MeetingAttendee,
    MeetingTopic,
    MeetingDecision,
    MeetingVote,
    MeetingMinutes,
    CreateMeetingInput,
    CreateTopicInput,
    CreateDecisionInput,
    CreateVoteInput,
} from '../types/meeting';

class MeetingService {
    // ============ MEETINGS ============

    /**
     * List all meetings with optional filters
     */
    async list(filters?: { status?: string; year?: number }): Promise<{ data: Meeting[]; error: string | null }> {
        try {
            let query = supabase
                .from('meetings')
                .select('*')
                .order('meeting_date', { ascending: false });

            if (filters?.status) {
                query = query.eq('status', filters.status);
            }
            if (filters?.year) {
                query = query
                    .gte('meeting_date', `${filters.year}-01-01`)
                    .lte('meeting_date', `${filters.year}-12-31`);
            }

            const { data, error } = await query;

            if (error) {
                return { data: [], error: error.message };
            }

            return { data: data || [], error: null };
        } catch (err) {
            return { data: [], error: 'Erro ao buscar reuniões' };
        }
    }

    /**
     * Get single meeting with all related data
     */
    async get(id: string): Promise<{ data: Meeting | null; error: string | null }> {
        try {
            // Get meeting
            const { data: meeting, error: meetingError } = await supabase
                .from('meetings')
                .select('*')
                .eq('id', id)
                .single();

            if (meetingError) {
                return { data: null, error: meetingError.message };
            }

            // Get attendees with member info
            const { data: attendees } = await supabase
                .from('meeting_attendees')
                .select(`
                    *,
                    member:members(first_name, last_name, email)
                `)
                .eq('meeting_id', id);

            // Get topics
            const { data: topics } = await supabase
                .from('meeting_topics')
                .select('*')
                .eq('meeting_id', id)
                .order('order_num');

            // Get decisions with responsible member
            const { data: decisions } = await supabase
                .from('meeting_decisions')
                .select(`
                    *,
                    responsible:members(first_name, last_name)
                `)
                .eq('meeting_id', id);

            // Get votes
            const { data: votes } = await supabase
                .from('meeting_votes')
                .select('*')
                .eq('meeting_id', id);

            // Get minutes
            const { data: minutes } = await supabase
                .from('meeting_minutes')
                .select('*')
                .eq('meeting_id', id)
                .order('version', { ascending: false });

            return {
                data: {
                    ...meeting,
                    attendees: attendees || [],
                    topics: topics || [],
                    decisions: decisions || [],
                    votes: votes || [],
                    minutes: minutes || [],
                },
                error: null,
            };
        } catch (err) {
            return { data: null, error: 'Erro ao buscar reunião' };
        }
    }

    /**
     * Create new meeting
     */
    async create(input: CreateMeetingInput): Promise<{ data: Meeting | null; error: string | null }> {
        try {
            const { data: user } = await supabase.auth.getUser();

            const { data, error } = await supabase
                .from('meetings')
                .insert([{
                    ...input,
                    created_by: user.user?.id,
                }])
                .select()
                .single();

            if (error) {
                return { data: null, error: error.message };
            }

            return { data, error: null };
        } catch (err) {
            return { data: null, error: 'Erro ao criar reunião' };
        }
    }

    /**
     * Update meeting
     */
    async update(id: string, input: Partial<CreateMeetingInput> & { status?: string }): Promise<{ success: boolean; error: string | null }> {
        try {
            const { error } = await supabase
                .from('meetings')
                .update(input)
                .eq('id', id);

            if (error) {
                return { success: false, error: error.message };
            }

            return { success: true, error: null };
        } catch (err) {
            return { success: false, error: 'Erro ao atualizar reunião' };
        }
    }

    /**
     * Delete meeting
     */
    async delete(id: string): Promise<{ success: boolean; error: string | null }> {
        try {
            const { error } = await supabase
                .from('meetings')
                .delete()
                .eq('id', id);

            if (error) {
                return { success: false, error: error.message };
            }

            return { success: true, error: null };
        } catch (err) {
            return { success: false, error: 'Erro ao excluir reunião' };
        }
    }

    // ============ ATTENDEES ============

    async addAttendee(meetingId: string, memberId?: string, name?: string, role: string = 'participant'): Promise<{ data: MeetingAttendee | null; error: string | null }> {
        try {
            const { data, error } = await supabase
                .from('meeting_attendees')
                .insert([{
                    meeting_id: meetingId,
                    member_id: memberId,
                    name: name,
                    role: role,
                    present: false,
                }])
                .select()
                .single();

            if (error) {
                return { data: null, error: error.message };
            }

            return { data, error: null };
        } catch (err) {
            return { data: null, error: 'Erro ao adicionar participante' };
        }
    }

    /**
     * Add multiple attendees in bulk
     */
    async addMultipleAttendees(attendees: { meeting_id: string; member_id?: string; name?: string; role: string }[]): Promise<{ success: boolean; error: string | null }> {
        try {
            const { error } = await supabase
                .from('meeting_attendees')
                .insert(attendees.map(a => ({
                    ...a,
                    present: a.hasOwnProperty('present') ? (a as any).present : false
                })));

            if (error) {
                return { success: false, error: error.message };
            }

            return { success: true, error: null };
        } catch (err) {
            return { success: false, error: 'Erro ao adicionar participantes em lote' };
        }
    }

    async updateAttendee(id: string, updates: { present?: boolean; role?: string }): Promise<{ success: boolean; error: string | null }> {
        try {
            const { error } = await supabase
                .from('meeting_attendees')
                .update(updates)
                .eq('id', id);

            if (error) {
                return { success: false, error: error.message };
            }

            return { success: true, error: null };
        } catch (err) {
            return { success: false, error: 'Erro ao atualizar participante' };
        }
    }

    async removeAttendee(id: string): Promise<{ success: boolean; error: string | null }> {
        try {
            const { error } = await supabase
                .from('meeting_attendees')
                .delete()
                .eq('id', id);

            if (error) {
                return { success: false, error: error.message };
            }

            return { success: true, error: null };
        } catch (err) {
            return { success: false, error: 'Erro ao remover participante' };
        }
    }

    // ============ TOPICS ============

    async addTopic(input: CreateTopicInput): Promise<{ data: MeetingTopic | null; error: string | null }> {
        try {
            const { data, error } = await supabase
                .from('meeting_topics')
                .insert([input])
                .select()
                .single();

            if (error) {
                return { data: null, error: error.message };
            }

            return { data, error: null };
        } catch (err) {
            return { data: null, error: 'Erro ao adicionar tópico' };
        }
    }

    async updateTopic(id: string, updates: Partial<MeetingTopic>): Promise<{ success: boolean; error: string | null }> {
        try {
            const { error } = await supabase
                .from('meeting_topics')
                .update(updates)
                .eq('id', id);

            if (error) {
                return { success: false, error: error.message };
            }

            return { success: true, error: null };
        } catch (err) {
            return { success: false, error: 'Erro ao atualizar tópico' };
        }
    }

    async deleteTopic(id: string): Promise<{ success: boolean; error: string | null }> {
        try {
            const { error } = await supabase
                .from('meeting_topics')
                .delete()
                .eq('id', id);

            if (error) {
                return { success: false, error: error.message };
            }

            return { success: true, error: null };
        } catch (err) {
            return { success: false, error: 'Erro ao excluir tópico' };
        }
    }

    // ============ DECISIONS ============

    async addDecision(input: CreateDecisionInput): Promise<{ data: MeetingDecision | null; error: string | null }> {
        try {
            const { data, error } = await supabase
                .from('meeting_decisions')
                .insert([input])
                .select()
                .single();

            if (error) {
                return { data: null, error: error.message };
            }

            return { data, error: null };
        } catch (err) {
            return { data: null, error: 'Erro ao adicionar decisão' };
        }
    }

    async updateDecision(id: string, updates: Partial<MeetingDecision>): Promise<{ success: boolean; error: string | null }> {
        try {
            const { error } = await supabase
                .from('meeting_decisions')
                .update(updates)
                .eq('id', id);

            if (error) {
                return { success: false, error: error.message };
            }

            return { success: true, error: null };
        } catch (err) {
            return { success: false, error: 'Erro ao atualizar decisão' };
        }
    }

    async deleteDecision(id: string): Promise<{ success: boolean; error: string | null }> {
        try {
            const { error } = await supabase
                .from('meeting_decisions')
                .delete()
                .eq('id', id);

            if (error) {
                return { success: false, error: error.message };
            }

            return { success: true, error: null };
        } catch (err) {
            return { success: false, error: 'Erro ao excluir decisão' };
        }
    }

    // ============ VOTES ============

    async addVote(input: CreateVoteInput): Promise<{ data: MeetingVote | null; error: string | null }> {
        try {
            const { data, error } = await supabase
                .from('meeting_votes')
                .insert([input])
                .select()
                .single();

            if (error) {
                return { data: null, error: error.message };
            }

            return { data, error: null };
        } catch (err) {
            return { data: null, error: 'Erro ao adicionar votação' };
        }
    }

    async updateVote(id: string, updates: Partial<MeetingVote>): Promise<{ success: boolean; error: string | null }> {
        try {
            // Calculate result if vote counts are being updated
            const updateData = { ...updates };
            if (updates.votes_for !== undefined || updates.votes_against !== undefined) {
                const votesFor = updates.votes_for ?? 0;
                const votesAgainst = updates.votes_against ?? 0;

                if (votesFor > votesAgainst) {
                    updateData.result = 'approved';
                } else if (votesAgainst > votesFor) {
                    updateData.result = 'rejected';
                } else {
                    updateData.result = 'tied';
                }
            }

            const { error } = await supabase
                .from('meeting_votes')
                .update(updateData)
                .eq('id', id);

            if (error) {
                return { success: false, error: error.message };
            }

            return { success: true, error: null };
        } catch (err) {
            return { success: false, error: 'Erro ao atualizar votação' };
        }
    }

    async deleteVote(id: string): Promise<{ success: boolean; error: string | null }> {
        try {
            const { error } = await supabase
                .from('meeting_votes')
                .delete()
                .eq('id', id);

            if (error) {
                return { success: false, error: error.message };
            }

            return { success: true, error: null };
        } catch (err) {
            return { success: false, error: 'Erro ao excluir votação' };
        }
    }

    // ============ MINUTES ============

    async saveMinutes(meetingId: string, content: string, generatedBy: 'ai' | 'manual' = 'ai'): Promise<{ data: MeetingMinutes | null; error: string | null }> {
        try {
            // Check if there's already a minutes for this meeting
            const { data: existing } = await supabase
                .from('meeting_minutes')
                .select('version')
                .eq('meeting_id', meetingId)
                .order('version', { ascending: false })
                .limit(1);

            const nextVersion = existing && existing.length > 0 ? existing[0].version + 1 : 1;

            const { data, error } = await supabase
                .from('meeting_minutes')
                .insert([{
                    meeting_id: meetingId,
                    content: content,
                    version: nextVersion,
                    generated_by: generatedBy,
                    status: 'draft',
                }])
                .select()
                .single();

            if (error) {
                return { data: null, error: error.message };
            }

            return { data, error: null };
        } catch (err) {
            return { data: null, error: 'Erro ao salvar ata' };
        }
    }

    async updateMinutes(id: string, updates: Partial<MeetingMinutes>): Promise<{ success: boolean; error: string | null }> {
        try {
            const { error } = await supabase
                .from('meeting_minutes')
                .update(updates)
                .eq('id', id);

            if (error) {
                return { success: false, error: error.message };
            }

            return { success: true, error: null };
        } catch (err) {
            return { success: false, error: 'Erro ao atualizar ata' };
        }
    }

    async approveMinutes(id: string): Promise<{ success: boolean; error: string | null }> {
        try {
            const { data: user } = await supabase.auth.getUser();

            const { error } = await supabase
                .from('meeting_minutes')
                .update({
                    status: 'approved',
                    approved_at: new Date().toISOString(),
                    approved_by: user.user?.id,
                })
                .eq('id', id);

            if (error) {
                return { success: false, error: error.message };
            }

            return { success: true, error: null };
        } catch (err) {
            return { success: false, error: 'Erro ao aprovar ata' };
        }
    }

    async getLatestMinutes(meetingId: string): Promise<{ data: MeetingMinutes | null; error: string | null }> {
        try {
            const { data, error } = await supabase
                .from('meeting_minutes')
                .select('*')
                .eq('meeting_id', meetingId)
                .order('version', { ascending: false })
                .limit(1)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
                return { data: null, error: error.message };
            }

            return { data: data || null, error: null };
        } catch (err) {
            return { data: null, error: 'Erro ao buscar ata' };
        }
    }
}

export const meetingService = new MeetingService();
