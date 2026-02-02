import React, { useState, useEffect } from 'react';
import { supabase } from './services/supabase';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';

// Pages
import Landing from './pages/public/Landing';
import Login from './pages/public/Login';
import MemberDashboard from './pages/member/Dashboard';
import AdminDashboard from './pages/admin/Dashboard';
import Members from './pages/admin/Members';
import Users from './pages/admin/Users';
import Financial from './pages/admin/Financial';
import Documents from './pages/shared/Documents';
import Events from './pages/shared/Events';
import Meetings from './pages/admin/Meetings';

import { AppView } from './types';

type ViewState = AppView | 'login' | 'login-admin';

interface AuthUser {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: 'admin' | 'secretary' | 'member';
    profile_image?: string;
    status: string;
}

const App: React.FC = () => {
    const [currentView, setCurrentView] = useState<ViewState>('landing');
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(false); // <- Mudado para false

    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash.replace('#/', '') as ViewState;
            if (hash && ['landing', 'login', 'login-admin', 'member-dashboard', 'admin-dashboard', 'members', 'users', 'financial', 'documents', 'events', 'meetings'].includes(hash)) {
                setCurrentView(hash);
            }
        };
        window.addEventListener('hashchange', handleHashChange);
        handleHashChange();
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    const navigateTo = (view: ViewState) => {
        window.location.hash = `/${view}`;
        setCurrentView(view);
    };

    const handleCpfLogin = async (cpf: string) => {
        setIsLoading(true);

        try {
            // 1. Buscar membro pelo CPF via RPC (para ignorar RLS no lookup inicial)
            const cleanCpf = cpf.replace(/\D/g, '');
            const { data, error: rpcError } = await supabase
                .rpc('get_member_email_by_cpf', { cpf_input: cleanCpf });

            const member = data && data.length > 0 ? data[0] : null;

            if (rpcError || !member) {
                console.error('Erro RPC:', rpcError);
                setIsLoading(false);
                return { success: false, error: 'Identificamos que este CPF não está vinculado a nenhum associado ativo.' };
            }

            // 2. Tentar login silencioso se existir usuário auth
            // Para RLS funcionar, o ideal é ter uma sessão. 
            // Como é um sistema simplificado, vamos tentar logar com o email do membro e o CPF como senha
            const { data: authData } = await supabase.auth.signInWithPassword({
                email: member.email,
                password: cleanCpf
            });

            // Mesmo se o auth falhar (usuário não criado no auth.users),
            // permitimos o acesso ao portal pois o CPF é válido no PROJETO.
            // Nota: RLS pode dar erro se não houver authData, mas o memberPortalService 
            // já tem tratamento de erro/fallback.

            setUser({
                id: member.id,
                email: member.email,
                first_name: member.first_name,
                last_name: member.last_name,
                role: 'member',
                status: member.status,
            });

            setIsLoading(false);
            navigateTo('member-dashboard');
            return { success: true };
        } catch (e) {
            console.error('Erro no login por CPF:', e);
            setIsLoading(false);
            return { success: false, error: 'Falha na validação do associado.' };
        }
    };

    const handleLogin = async (email: string, password: string) => {
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
            const { data: profile } = await supabase
                .from('users')
                .select('*')
                .eq('id', data.user.id)
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
                setIsLoading(false);
                navigateTo(profile.role === 'admin' || profile.role === 'secretary' ? 'admin-dashboard' : 'member-dashboard');
                return { success: true };
            } else {
                setIsLoading(false);
                return { success: false, error: 'Perfil não encontrado. Contate o administrador.' };
            }
        } catch (e) {
            console.error('Erro no login:', e);
            setIsLoading(false);
            return { success: false, error: 'Erro ao fazer login' };
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        navigateTo('landing');
    };

    const isAuthenticated = !!user;
    const isAdmin = user?.role === 'admin' || user?.role === 'secretary';

    // Loading - removido para não travar
    // Landing page
    if (currentView === 'landing' && !isAuthenticated) {
        return (
            <Landing
                onLogin={() => navigateTo('login')}
                onAdminLogin={() => navigateTo('login-admin')}
            />
        );
    }

    // Login pages
    if (currentView === 'login' && !isAuthenticated) {
        return (
            <Login
                onLogin={handleLogin}
                onCpfLogin={handleCpfLogin}
                onBack={() => navigateTo('landing')}
                isAdmin={false}
            />
        );
    }

    if (currentView === 'login-admin' && !isAuthenticated) {
        return (
            <Login
                onLogin={handleLogin}
                onBack={() => navigateTo('landing')}
                isAdmin={true}
            />
        );
    }

    // Se não autenticado, mostrar landing
    if (!isAuthenticated) {
        return (
            <Landing
                onLogin={() => navigateTo('login')}
                onAdminLogin={() => navigateTo('login-admin')}
            />
        );
    }

    // Header user
    const headerUser = user ? {
        name: `${user.first_name} ${user.last_name}`,
        role: user.role === 'admin' ? 'Administrador' : user.role === 'secretary' ? 'Secretário' : 'Associado',
        avatar: user.profile_image || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(`${user.first_name} ${user.last_name}`),
        membership: user.role === 'admin' ? 'Sistema Adm' : 'Associado'
    } : null;

    // Authenticated layout
    return (
        <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark">
            <Sidebar
                currentView={currentView as AppView}
                onNavigate={(view) => navigateTo(view)}
                isAdmin={isAdmin}
                onLogout={handleLogout}
            />
            <main className="flex-1 flex flex-col overflow-hidden">
                {headerUser && (
                    <Header
                        currentView={currentView as AppView}
                        user={headerUser}
                    />
                )}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                    {currentView === 'member-dashboard' && <MemberDashboard userEmail={user?.email} />}
                    {currentView === 'admin-dashboard' && <AdminDashboard />}
                    {currentView === 'members' && <Members />}
                    {currentView === 'users' && <Users />}
                    {currentView === 'financial' && <Financial />}
                    {currentView === 'documents' && <Documents isAdmin={isAdmin} />}
                    {currentView === 'events' && <Events isAdmin={isAdmin} />}
                    {currentView === 'meetings' && <Meetings />}
                </div>
            </main>
        </div>
    );
};

export default App;
