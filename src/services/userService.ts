import { supabase } from './supabase';

export interface CreateUserData {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    role: 'admin' | 'secretary' | 'member';
}

export interface UserRecord {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
    status: string;
    created_at?: string;
}

class UserService {
    /**
     * Criar novo usuário (auth + tabela users automaticamente via trigger)
     */
    async create(data: CreateUserData): Promise<{ user: UserRecord | null; error: string | null }> {
        try {
            // Criar usuário no Supabase Auth com metadata
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: data.email,
                password: data.password,
                options: {
                    data: {
                        first_name: data.first_name,
                        last_name: data.last_name,
                        role: data.role,
                    },
                },
            });

            if (authError) {
                return { user: null, error: authError.message };
            }

            if (!authData.user) {
                return { user: null, error: 'Não foi possível criar o usuário' };
            }

            // O trigger vai criar o registro na tabela users automaticamente
            // Aguardar um pouco e buscar o usuário criado
            await new Promise(resolve => setTimeout(resolve, 500));

            const { data: userRecord, error: fetchError } = await supabase
                .from('users')
                .select('*')
                .eq('id', authData.user.id)
                .single();

            if (fetchError || !userRecord) {
                return {
                    user: {
                        id: authData.user.id,
                        email: data.email,
                        first_name: data.first_name,
                        last_name: data.last_name,
                        role: data.role,
                        status: 'active',
                    },
                    error: null
                };
            }

            return { user: userRecord as UserRecord, error: null };
        } catch (err) {
            console.error('Erro ao criar usuário:', err);
            return { user: null, error: 'Erro ao criar usuário' };
        }
    }

    /**
     * Listar todos os usuários
     */
    async list(): Promise<{ data: UserRecord[]; error: string | null }> {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                return { data: [], error: error.message };
            }

            return { data: data || [], error: null };
        } catch (err) {
            return { data: [], error: 'Erro ao listar usuários' };
        }
    }

    /**
     * Atualizar role do usuário
     */
    async updateRole(id: string, role: string): Promise<{ success: boolean; error: string | null }> {
        try {
            const { error } = await supabase
                .from('users')
                .update({ role, updated_at: new Date().toISOString() })
                .eq('id', id);

            if (error) {
                return { success: false, error: error.message };
            }

            return { success: true, error: null };
        } catch (err) {
            return { success: false, error: 'Erro ao atualizar usuário' };
        }
    }
}

export const userService = new UserService();
