import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../services/supabase';

export interface AuthUser {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: 'admin' | 'secretary' | 'member';
    profile_image?: string;
    status: string;
}

interface AuthContextType {
    isAuthenticated: boolean;
    isAdmin: boolean;
    isLoading: boolean;
    user: AuthUser | null;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Verificar sessão existente ao carregar
        const checkSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();

                if (session?.user) {
                    // Tentar buscar perfil, mas não travar se falhar
                    try {
                        const { data: profile } = await supabase
                            .from('users')
                            .select('*')
                            .eq('id', session.user.id)
                            .single();

                        if (profile) {
                            setUser({
                                id: profile.id,
                                email: profile.email,
                                first_name: profile.first_name,
                                last_name: profile.last_name,
                                role: profile.role,
                                profile_image: profile.profile_image,
                                status: profile.status,
                            });
                        }
                    } catch (e) {
                        console.error('Erro ao buscar perfil:', e);
                    }
                }
            } catch (e) {
                console.error('Erro ao verificar sessão:', e);
            }
            setIsLoading(false);
        };

        checkSession();

        // Listener para mudanças de auth
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
                try {
                    const { data: profile } = await supabase
                        .from('users')
                        .select('*')
                        .eq('id', session.user.id)
                        .single();

                    if (profile) {
                        setUser({
                            id: profile.id,
                            email: profile.email,
                            first_name: profile.first_name,
                            last_name: profile.last_name,
                            role: profile.role,
                            profile_image: profile.profile_image,
                            status: profile.status,
                        });
                    }
                } catch (e) {
                    console.error('Erro ao buscar perfil:', e);
                }
            } else {
                setUser(null);
            }
            setIsLoading(false);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
        setIsLoading(true);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                setIsLoading(false);
                return { success: false, error: error.message };
            }

            if (!data.user) {
                setIsLoading(false);
                return { success: false, error: 'Usuário não encontrado' };
            }

            // Buscar perfil
            const { data: profile, error: profileError } = await supabase
                .from('users')
                .select('*')
                .eq('id', data.user.id)
                .single();

            if (profileError || !profile) {
                setIsLoading(false);
                return { success: false, error: 'Perfil não encontrado. Contate o administrador.' };
            }

            setUser({
                id: profile.id,
                email: profile.email,
                first_name: profile.first_name,
                last_name: profile.last_name,
                role: profile.role,
                profile_image: profile.profile_image,
                status: profile.status,
            });

            setIsLoading(false);
            return { success: true };
        } catch (e) {
            setIsLoading(false);
            return { success: false, error: 'Erro ao fazer login. Tente novamente.' };
        }
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
    };

    const isAuthenticated = !!user;
    const isAdmin = user?.role === 'admin' || user?.role === 'secretary';

    return (
        <AuthContext.Provider value={{
            isAuthenticated,
            isAdmin,
            isLoading,
            user,
            login,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
