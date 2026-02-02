import { supabase } from './supabase';
import { Member, formatMember } from '../types/member';

export interface MemberFilters {
    status?: 'active' | 'inactive' | 'pending';
    membership_type?: 'regular' | 'gold' | 'silver';
    search?: string;
}

export interface CreateMemberData {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    cpf?: string;
    birth_date?: string;
    address?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    membership_type?: 'regular' | 'gold' | 'silver';
    monthly_contribution?: number;
    person_type?: 'PF' | 'PJ';
    cnpj?: string;
    company_name?: string;
    trade_name?: string;
    is_board_member?: boolean;
    board_position?: string;
    notes?: string;
}

class MemberService {
    /**
     * Listar todos os membros com filtros opcionais
     */
    async list(filters?: MemberFilters): Promise<{ data: Member[]; error: string | null }> {
        try {
            let query = supabase
                .from('members')
                .select('*')
                .order('created_at', { ascending: false });

            if (filters?.status) {
                query = query.eq('status', filters.status);
            }

            if (filters?.membership_type) {
                query = query.eq('membership_type', filters.membership_type);
            }

            if (filters?.search) {
                query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
            }

            const { data, error } = await query;

            if (error) {
                return { data: [], error: error.message };
            }

            return {
                data: (data || []).map(m => formatMember(m as Member)),
                error: null
            };
        } catch (err) {
            return { data: [], error: 'Erro ao buscar membros' };
        }
    }

    /**
     * Listar apenas membros da diretoria
     */
    async listBoardMembers(): Promise<{ data: Member[]; error: string | null }> {
        try {
            const { data, error } = await supabase
                .from('members')
                .select('*')
                .eq('is_board_member', true)
                .eq('status', 'active')
                .order('first_name', { ascending: true });

            if (error) {
                return { data: [], error: error.message };
            }

            return {
                data: (data || []).map(m => formatMember(m as Member)),
                error: null
            };
        } catch (err) {
            return { data: [], error: 'Erro ao buscar diretoria' };
        }
    }

    /**
     * Buscar membro por ID
     */
    async getById(id: string): Promise<{ data: Member | null; error: string | null }> {
        try {
            const { data, error } = await supabase
                .from('members')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                return { data: null, error: error.message };
            }

            return {
                data: formatMember(data as Member),
                error: null
            };
        } catch (err) {
            return { data: null, error: 'Erro ao buscar membro' };
        }
    }

    /**
     * Criar novo membro
     */
    async create(memberData: CreateMemberData): Promise<{ data: Member | null; error: string | null }> {
        try {
            const cleanCpf = (memberData.cpf || memberData.cnpj || '').replace(/\D/g, '');

            // 1. Criar usuário no Auth do Supabase com CPF como senha inicial
            // Isso permite o login "só com CPF" que o cliente pediu
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: memberData.email,
                password: cleanCpf,
                options: {
                    data: {
                        first_name: memberData.first_name,
                        last_name: memberData.last_name,
                        role: 'member',
                    }
                }
            });

            // Se der erro no auth (ex: usuário já existe), continuamos para tentar criar/vincular na tabela members
            // mas guardamos o log se necessário.

            // 2. Inserir na tabela members
            const { data, error } = await supabase
                .from('members')
                .insert([{
                    ...memberData,
                    first_name: memberData.first_name.trim(),
                    last_name: memberData.last_name.trim(),
                    status: 'active',
                    membership_date: new Date().toLocaleDateString('en-CA'), // Formato YYYY-MM-DD local
                }])
                .select()
                .single();

            if (error) {
                return { data: null, error: error.message };
            }

            return {
                data: formatMember(data as Member),
                error: null
            };
        } catch (err) {
            console.error('Erro ao criar membro:', err);
            return { data: null, error: 'Erro ao criar membro' };
        }
    }

    /**
     * Atualizar membro
     */
    async update(id: string, memberData: Partial<CreateMemberData>): Promise<{ data: Member | null; error: string | null }> {
        try {
            const { data, error } = await supabase
                .from('members')
                .update({
                    ...memberData,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', id)
                .select()
                .single();

            if (error) {
                return { data: null, error: error.message };
            }

            return {
                data: formatMember(data as Member),
                error: null
            };
        } catch (err) {
            return { data: null, error: 'Erro ao atualizar membro' };
        }
    }

    /**
     * Deletar membro
     */
    async delete(id: string): Promise<{ success: boolean; error: string | null }> {
        try {
            const { error } = await supabase
                .from('members')
                .delete()
                .eq('id', id);

            if (error) {
                return { success: false, error: error.message };
            }

            return { success: true, error: null };
        } catch (err) {
            return { success: false, error: 'Erro ao deletar membro' };
        }
    }

    /**
     * Alterar status do membro
     */
    async updateStatus(id: string, status: 'active' | 'inactive' | 'pending'): Promise<{ success: boolean; error: string | null }> {
        try {
            const { error } = await supabase
                .from('members')
                .update({ status, updated_at: new Date().toISOString() })
                .eq('id', id);

            if (error) {
                return { success: false, error: error.message };
            }

            return { success: true, error: null };
        } catch (err) {
            return { success: false, error: 'Erro ao alterar status' };
        }
    }

    /**
     * Contar membros por status
     */
    async countByStatus(): Promise<{ active: number; pending: number; inactive: number; total: number }> {
        try {
            const { data, error } = await supabase
                .from('members')
                .select('status');

            if (error || !data) {
                return { active: 0, pending: 0, inactive: 0, total: 0 };
            }

            const counts = data.reduce((acc, m) => {
                const status = m.status === 'Ativo' ? 'active' :
                    m.status === 'Pendente' ? 'pending' :
                        m.status === 'Inativo' ? 'inactive' : m.status;
                acc[status as string] = (acc[status as string] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            return {
                active: counts['active'] || 0,
                pending: counts['pending'] || 0,
                inactive: counts['inactive'] || 0,
                total: data.length,
            };
        } catch (err) {
            return { active: 0, pending: 0, inactive: 0, total: 0 };
        }
    }

    /**
     * Obter dados de crescimento mensal (membros por mês)
     */
    async getGrowthData(): Promise<{ month: string; members: number }[]> {
        try {
            const { data, error } = await supabase
                .from('members')
                .select('membership_date')
                .order('membership_date', { ascending: true });

            if (error || !data) return [];

            // Agrupar por mês
            const monthsMap: Record<string, number> = {};
            const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

            // Garantir que temos os últimos 6 meses pelo menos, mesmo que vazios
            const now = new Date();
            for (let i = 5; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const monthName = monthNames[d.getMonth()];
                monthsMap[monthName] = 0;
            }

            let cumulativeCount = 0;

            // Aqui uma lógica simples: vamos contar quantos membros entraram em cada mês
            // e somar ao total acumulado para o gráfico de crescimento

            // 1. Contar totais históricos antes do período exibido (para o acumulado)
            const firstDateDisplayed = new Date(now.getFullYear(), now.getMonth() - 5, 1);

            // Buscar contagem total inicial
            const { count } = await supabase
                .from('members')
                .select('*', { count: 'exact', head: true })
                .lt('membership_date', firstDateDisplayed.toISOString().split('T')[0]);

            cumulativeCount = count || 0;

            const periodCounts: Record<string, number> = {};
            data.forEach(m => {
                if (!m.membership_date) return;
                const d = new Date(m.membership_date);
                if (d >= firstDateDisplayed) {
                    const monthName = monthNames[d.getMonth()];
                    periodCounts[monthName] = (periodCounts[monthName] || 0) + 1;
                }
            });

            const result = Object.keys(monthsMap).map(month => {
                cumulativeCount += (periodCounts[month] || 0);
                return {
                    month,
                    members: cumulativeCount
                };
            });

            return result;
        } catch (err) {
            console.error('Erro ao buscar dados de crescimento:', err);
            return [];
        }
    }
}

export const memberService = new MemberService();
