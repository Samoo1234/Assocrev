import React from 'react';
import { User, AppView } from '../../types';

interface HeaderProps {
    user: User;
    currentView: AppView;
}

const Header: React.FC<HeaderProps> = ({ user, currentView }) => {
    const getTitle = () => {
        switch (currentView) {
            case 'admin-dashboard': return 'Visão Geral';
            case 'members': return 'Gestão de Membros';
            case 'financial': return 'Gestão Financeira';
            case 'documents': return 'Gestão de Documentos';
            case 'events': return 'Gestão de Eventos';
            default: return `Olá, ${user.name.split(' ')[0]}`;
        }
    };

    return (
        <header className="h-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 px-8 flex items-center justify-between">
            <div className="flex flex-col">
                {currentView !== 'member-dashboard' && currentView !== 'admin-dashboard' && (
                    <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mb-1">
                        <span className="hover:text-primary cursor-pointer">Painel</span>
                        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                        <span className="text-slate-600 dark:text-slate-300 capitalize">{currentView.replace('-', ' ')}</span>
                    </div>
                )}
                <h2 className="text-[#0e141a] dark:text-white text-xl font-bold tracking-tight">
                    {currentView === 'member-dashboard' ? (
                        <>Olá, <span className="text-primary">{user.name}</span></>
                    ) : getTitle()}
                </h2>
            </div>

            <div className="flex items-center gap-6">
                <div className="hidden lg:relative md:block">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">search</span>
                    <input className="pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-sm w-64 focus:ring-2 focus:ring-primary/20 transition-all" placeholder="Buscar no sistema..." type="text" />
                </div>

                <div className="flex gap-2">
                    <button className="size-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-[#0e141a] dark:text-white hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors relative">
                        <span className="material-symbols-outlined text-[20px]">notifications</span>
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-800"></span>
                    </button>
                    <button className="size-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-[#0e141a] dark:text-white hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors">
                        <span className="material-symbols-outlined text-[20px]">help_outline</span>
                    </button>
                </div>

                <div className="h-10 w-px bg-slate-200 dark:bg-slate-800 mx-2"></div>

                <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold leading-tight">{user.name}</p>
                        <p className="text-[11px] text-primary dark:text-emerald-500 font-bold uppercase tracking-widest">{user.role}</p>
                    </div>
                    <div
                        className="size-10 rounded-full bg-cover bg-center border-2 border-primary ring-2 ring-emerald-50 dark:ring-emerald-900/20"
                        style={{ backgroundImage: `url(${user.avatar})` }}
                    />
                </div>
            </div>
        </header>
    );
};

export default Header;
