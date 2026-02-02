import { supabase } from './supabase';

export interface Transaction {
    id: string;
    type: 'income' | 'expense';
    category: string;
    amount: number;
    description?: string;
    date: string;
    member_id?: string;
    created_by?: string;
}

export interface FinancialSummary {
    balance: number;
    monthlyIncome: number;
    monthlyExpense: number;
    pendingPayments: number;
}

class FinancialService {
    /**
     * Obter resumo financeiro
     */
    async getSummary(): Promise<{ data: FinancialSummary; error: string | null }> {
        try {
            const now = new Date();
            const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toLocaleDateString('en-CA');
            const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toLocaleDateString('en-CA');

            // Buscar transações do mês
            const { data: transactions, error } = await supabase
                .from('transactions')
                .select('*')
                .gte('date', firstDayOfMonth)
                .lte('date', lastDayOfMonth);

            if (error) {
                return {
                    data: { balance: 0, monthlyIncome: 0, monthlyExpense: 0, pendingPayments: 0 },
                    error: error.message
                };
            }

            const monthlyIncome = (transactions || [])
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + Number(t.amount), 0);

            const monthlyExpense = (transactions || [])
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + Number(t.amount), 0);

            // Buscar todas as transações para saldo total
            const { data: allTransactions } = await supabase
                .from('transactions')
                .select('type, amount');

            const totalIncome = (allTransactions || [])
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + Number(t.amount), 0);

            const totalExpense = (allTransactions || [])
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + Number(t.amount), 0);

            // Calcular pagamentos pendentes (estimado)
            // Pegar total de contribuições esperadas de membros ativos
            const { data: members } = await supabase
                .from('members')
                .select('monthly_contribution')
                .or('status.eq.active,status.eq.Ativo');

            const expectedMonthlyIncome = (members || []).reduce((sum, m) => sum + Number(m.monthly_contribution || 0), 0);
            const pendingPayments = Math.max(0, expectedMonthlyIncome - monthlyIncome);

            return {
                data: {
                    balance: totalIncome - totalExpense,
                    monthlyIncome,
                    monthlyExpense,
                    pendingPayments,
                },
                error: null,
            };
        } catch (err) {
            return {
                data: { balance: 0, monthlyIncome: 0, monthlyExpense: 0, pendingPayments: 0 },
                error: 'Erro ao buscar resumo financeiro'
            };
        }
    }

    /**
     * Listar transações
     */
    async list(): Promise<{ data: Transaction[]; error: string | null }> {
        try {
            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .order('date', { ascending: false })
                .limit(50);

            if (error) {
                return { data: [], error: error.message };
            }

            return { data: data || [], error: null };
        } catch (err) {
            return { data: [], error: 'Erro ao buscar transações' };
        }
    }

    /**
     * Criar nova transação
     */
    async create(transaction: Omit<Transaction, 'id'>): Promise<{ data: Transaction | null; error: string | null }> {
        try {
            const { data, error } = await supabase
                .from('transactions')
                .insert([transaction])
                .select()
                .single();

            if (error) {
                return { data: null, error: error.message };
            }

            return { data: data as Transaction, error: null };
        } catch (err) {
            return { data: null, error: 'Erro ao criar transação' };
        }
    }

    /**
     * Excluir transação
     */
    async delete(id: string): Promise<{ success: boolean; error: string | null }> {
        try {
            const { error } = await supabase
                .from('transactions')
                .delete()
                .eq('id', id);

            if (error) {
                return { success: false, error: error.message };
            }

            return { success: true, error: null };
        } catch (err) {
            return { success: false, error: 'Erro ao excluir transação' };
        }
    }
}

export const financialService = new FinancialService();
