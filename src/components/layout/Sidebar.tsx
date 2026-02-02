import React from 'react';
import { AppView } from '../../types';

interface SidebarProps {
    currentView: AppView;
    onNavigate: (view: AppView) => void;
    isAdmin: boolean;
    onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, isAdmin, onLogout }) => {
    const navItems = isAdmin
        ? [
            { id: 'admin-dashboard', label: 'Painel', icon: 'dashboard' },
            { id: 'members', label: 'Membros', icon: 'groups' },
            { id: 'users', label: 'Usuários', icon: 'manage_accounts' },
            { id: 'financial', label: 'Financeiro', icon: 'account_balance_wallet' },
            { id: 'meetings', label: 'Reuniões', icon: 'groups' },
            { id: 'events', label: 'Eventos', icon: 'event' },
            { id: 'documents', label: 'Documentos', icon: 'description' },
        ]
        : [
            { id: 'member-dashboard', label: 'Início', icon: 'home' },
            { id: 'events', label: 'Eventos', icon: 'featured_seasonal_and_gifts' },
        ];

    return (
        <aside className={`w-72 h-screen border-r flex flex-col justify-between p-6 ${isAdmin ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800' : 'bg-white dark:bg-[#161d19] border-[#e2e8e4] dark:border-gray-800'}`}>
            <div className="flex flex-col gap-8">
                <div className="flex items-center gap-3">
                    <div className="bg-primary rounded-xl p-2.5 text-white shadow-lg shadow-emerald-500/20">
                        <span className="material-symbols-outlined text-3xl">{isAdmin ? 'shield_person' : 'corporate_fare'}</span>
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-[#0e141a] dark:text-white text-lg font-bold leading-tight">ASSOCREV</h1>
                        <p className="text-[#517264] dark:text-emerald-500/70 text-xs font-semibold uppercase tracking-wider">{isAdmin ? 'Sistema Adm' : 'Portal do Associado'}</p>
                    </div>
                </div>

                <nav className="flex flex-col gap-1.5">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => onNavigate(item.id as AppView)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${currentView === item.id
                                ? 'bg-primary text-white shadow-md'
                                : 'text-[#517264] dark:text-gray-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 hover:text-primary'
                                }`}
                        >
                            <span className="material-symbols-outlined">{item.icon}</span>
                            <span className="text-sm font-semibold">{item.label}</span>
                        </button>
                    ))}
                </nav>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                >
                    <span className="material-symbols-outlined">logout</span>
                    <span className="text-sm font-bold">Sair</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
