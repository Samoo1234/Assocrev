import { supabase } from './supabase';

export interface MemberProfile {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    cpf?: string;
    status: string;
    membership_type: string;
    membership_date: string;
    birth_date?: string;
    monthly_contribution?: number;
    person_type?: string;
}

export interface MemberPayment {
    id: string;
    month: string;
    value: string;
    date: string;
    status: 'Pago' | 'Pendente' | 'Atrasado';
    type: string;
    amount: number;
}

class MemberPortalService {
    /**
     * Buscar perfil do membro logado pelo email
     */
    async getProfile(email: string): Promise<{ data: MemberProfile | null; error: string | null }> {
        try {
            // Usar RPC para ignorar RLS no portal do associado (acesso via CPF)
            const { data, error } = await supabase
                .rpc('get_member_profile_by_email', { email_input: email });

            const profile = data && data.length > 0 ? data[0] : null;

            if (error || !profile) {
                console.error('Erro ao buscar perfil via RPC:', error);
                return { data: null, error: 'Perfil de associado não encontrado' };
            }

            return { data: profile as MemberProfile, error: null };
        } catch (err) {
            console.error('Erro catch profile:', err);
            return { data: null, error: 'Erro ao buscar perfil' };
        }
    }

    /**
     * Buscar histórico de pagamentos do membro
     */
    async getPayments(memberId: string): Promise<{ data: MemberPayment[]; error: string | null }> {
        try {
            // Usar RPC para ignorar RLS no portal do associado
            const { data, error } = await supabase
                .rpc('get_member_payments_by_id', { member_id_input: memberId });

            if (error) {
                console.error('Erro ao buscar pagamentos via RPC:', error);
                return { data: [], error: error.message };
            }

            // Converter para formato de exibição
            const payments: MemberPayment[] = (data || []).map(t => {
                const date = new Date(t.date);
                return {
                    id: t.id,
                    month: date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
                    value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.amount || 0),
                    date: date.toLocaleDateString('pt-BR'),
                    status: 'Pago' as const,
                    type: t.category || 'Mensalidade',
                    amount: t.amount || 0,
                };
            });

            return { data: payments, error: null };
        } catch (err) {
            console.error('Erro catch payments:', err);
            return { data: [], error: 'Erro ao buscar pagamentos' };
        }
    }

    /**
     * Buscar próxima mensalidade pendente
     */
    async getNextPayment(member: MemberProfile): Promise<{
        amount: number;
        dueDate: string;
        status: 'pending' | 'paid' | 'overdue';
    }> {
        const now = new Date();
        const dueDay = 10;
        const dueDate = new Date(now.getFullYear(), now.getMonth(), dueDay);

        // Se já passou do dia 10, próximo vencimento é mês que vem
        if (now.getDate() > dueDay) {
            dueDate.setMonth(dueDate.getMonth() + 1);
        }

        return {
            amount: member.monthly_contribution || 150,
            dueDate: dueDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }),
            status: now.getDate() > dueDay ? 'pending' : 'pending',
        };
    }
}

export const memberPortalService = new MemberPortalService();
