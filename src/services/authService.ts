import { supabase } from './supabase';

export interface AuthUser {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: 'admin' | 'secretary' | 'member';
    profile_image?: string;
    status: string;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface SignUpData extends LoginCredentials {
    first_name: string;
    last_name: string;
}

class AuthService {
    /**
     * Login com email e senha
     */
    async login(credentials: LoginCredentials): Promise<{ user: AuthUser | null; error: string | null }> {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: credentials.email,
                password: credentials.password,
            });

            if (error) {
                return { user: null, error: error.message };
            }

            if (!data.user) {
                return { user: null, error: 'Usuário não encontrado' };
            }

            // Buscar dados do perfil na tabela users
            const { data: profile, error: profileError } = await supabase
                .from('users')
                .select('*')
                .eq('id', data.user.id)
                .single();

            if (profileError || !profile) {
                return { user: null, error: 'Perfil não encontrado. Contate o administrador.' };
            }

            return {
                user: {
                    id: profile.id,
                    email: profile.email,
                    first_name: profile.first_name,
                    last_name: profile.last_name,
                    role: profile.role,
                    profile_image: profile.profile_image,
                    status: profile.status,
                },
                error: null,
            };
        } catch (err) {
            return { user: null, error: 'Erro ao fazer login. Tente novamente.' };
        }
    }

    /**
     * Logout
     */
    async logout(): Promise<void> {
        await supabase.auth.signOut();
    }

    /**
     * Obter sessão atual
     */
    async getSession(): Promise<{ user: AuthUser | null }> {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
            return { user: null };
        }

        const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

        if (!profile) {
            return { user: null };
        }

        return {
            user: {
                id: profile.id,
                email: profile.email,
                first_name: profile.first_name,
                last_name: profile.last_name,
                role: profile.role,
                profile_image: profile.profile_image,
                status: profile.status,
            },
        };
    }

    /**
     * Listener para mudanças de autenticação
     */
    onAuthStateChange(callback: (user: AuthUser | null) => void) {
        return supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
                const { data: profile } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                if (profile) {
                    callback({
                        id: profile.id,
                        email: profile.email,
                        first_name: profile.first_name,
                        last_name: profile.last_name,
                        role: profile.role,
                        profile_image: profile.profile_image,
                        status: profile.status,
                    });
                } else {
                    callback(null);
                }
            } else {
                callback(null);
            }
        });
    }
}

export const authService = new AuthService();
