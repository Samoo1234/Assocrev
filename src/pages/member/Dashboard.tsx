import React, { useState, useEffect } from 'react';
import { memberPortalService, MemberProfile, MemberPayment } from '../../services/memberPortalService';

interface DashboardProps {
    userEmail?: string;
}

const Dashboard: React.FC<DashboardProps> = ({ userEmail }) => {
    const [profile, setProfile] = useState<MemberProfile | null>(null);
    const [payments, setPayments] = useState<MemberPayment[]>([]);
    const [nextPayment, setNextPayment] = useState<{ amount: number; dueDate: string; status: string } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);

            // Buscar perfil do membro
            const email = userEmail || 'joao.silva@email.com'; // fallback para demo
            const { data: memberProfile } = await memberPortalService.getProfile(email);

            if (memberProfile) {
                setProfile(memberProfile);

                // Buscar pagamentos
                const { data: memberPayments } = await memberPortalService.getPayments(memberProfile.id);
                setPayments(memberPayments);

                // Buscar próxima mensalidade
                const next = await memberPortalService.getNextPayment(memberProfile);
                setNextPayment(next);
            }

            setLoading(false);
        };

        loadData();
    }, [userEmail]);

    // Fallback para dados mock se não houver dados reais
    const displayPayments = payments.length > 0 ? payments : [
        { id: '1', month: 'Outubro/2023', value: 'R$ 150,00', date: '10/10/2023', status: 'Pago' as const, type: 'mensalidade', amount: 150 },
        { id: '2', month: 'Setembro/2023', value: 'R$ 150,00', date: '11/09/2023', status: 'Pago' as const, type: 'mensalidade', amount: 150 },
        { id: '3', month: 'Agosto/2023', value: 'R$ 150,00', date: '10/08/2023', status: 'Pago' as const, type: 'mensalidade', amount: 150 },
    ];

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const getMembershipDisplay = (type: string) => {
        const map: Record<string, string> = {
            regular: 'Padrão',
            contributor: 'Contribuinte',
            honorary: 'Honorário',
            gold: 'Ouro Premium',
            silver: 'Prata',
        };
        return map[type] || type;
    };

    const isBirthday = () => {
        if (!profile?.birth_date) return false;

        // birth_date is "YYYY-MM-DD"
        const [year, month, day] = profile.birth_date.split('-').map(Number);
        const today = new Date();

        // today.toLocaleString('pt-BR', { day: 'numeric' }) handles local browser timezone correctly
        const currentDay = today.getDate();
        const currentMonth = today.getMonth() + 1; // getMonth() is 0-indexed

        return currentDay === day && currentMonth === month;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
                    <p className="text-slate-500 mt-2">Carregando seus dados...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            {isBirthday() && (
                <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-primary p-1 rounded-2xl shadow-xl animate-in fade-in slide-in-from-top-4 duration-1000">
                    <div className="bg-white dark:bg-slate-900 rounded-[14px] p-6 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                            <div className="absolute top-4 left-10 text-2xl animate-bounce">🎈</div>
                            <div className="absolute top-10 right-20 text-2xl animate-bounce delay-100">✨</div>
                            <div className="absolute bottom-4 left-1/2 text-2xl animate-bounce delay-300">🎉</div>
                            <div className="absolute top-1/2 right-10 text-2xl animate-bounce delay-700">🍰</div>
                        </div>

                        <div className="size-20 rounded-full bg-gradient-to-tr from-pink-100 to-purple-100 dark:from-pink-900/20 dark:to-purple-900/20 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-5xl text-pink-500 drop-shadow-sm">card_giftcard</span>
                        </div>

                        <div className="text-center md:text-left flex-1 relative z-10">
                            <h2 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-primary mb-1">
                                Feliz Aniversário, {profile?.first_name}! 🎂
                            </h2>
                            <p className="text-slate-600 dark:text-gray-300 font-medium">
                                A equipe <span className="text-primary font-bold">ASSOCREV</span> deseja a você um dia repleto de alegrias, saúde e conquistas. Parabéns por mais um ano de vida!
                            </p>
                        </div>

                        <div className="shrink-0 relative z-10">
                            <button className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-black text-sm shadow-lg shadow-pink-500/30 hover:scale-105 transition-transform">
                                COMEMORAR! 🎉
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <section>
                <h1 className="text-slate-900 dark:text-white text-4xl font-black leading-tight tracking-tight">
                    Bem-vindo{profile ? `, ${profile.first_name}` : ' ao seu Portal'}
                </h1>
                <p className="text-slate-500 dark:text-gray-400 text-lg mt-2">
                    Gerencie seus dados e mensalidades com a confiança <span className="text-primary font-bold">ASSOCREV</span>.
                </p>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Next Payment Card */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col transition-transform hover:shadow-md">
                    <div className="h-2 bg-gradient-to-r from-primary to-emerald-400"></div>
                    <div className="p-8 space-y-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-primary dark:text-emerald-500 text-xs font-bold uppercase tracking-widest">Financeiro</p>
                                <h3 className="text-slate-900 dark:text-white text-2xl font-bold mt-1">Próxima Mensalidade</h3>
                            </div>
                            <span className="bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 px-3 py-1 rounded-full text-xs font-bold uppercase">
                                Pendente
                            </span>
                        </div>
                        <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-xl p-6 border border-emerald-100 dark:border-emerald-900/20">
                            <div className="flex flex-col gap-1">
                                <p className="text-primary dark:text-emerald-400 text-4xl font-black tracking-tight">
                                    {formatCurrency(nextPayment?.amount || profile?.monthly_contribution || 150)}
                                </p>
                                <p className="text-slate-500 dark:text-gray-400 text-sm font-medium">
                                    Vencimento: <span className="text-slate-900 dark:text-white font-bold">{nextPayment?.dueDate || '10 de Janeiro, 2026'}</span>
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-3 pt-2">
                            <button className="flex-1 flex items-center justify-center gap-2 bg-primary text-white px-5 py-3.5 rounded-xl font-bold text-sm hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 transition-all">
                                <span className="material-symbols-outlined text-[20px]">content_copy</span>
                                <span>Copiar Código PIX</span>
                            </button>
                            <button className="flex-1 flex items-center justify-center gap-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white px-5 py-3.5 rounded-xl font-bold text-sm hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all">
                                <span className="material-symbols-outlined text-[20px]">picture_as_pdf</span>
                                <span>Baixar Boleto</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Profile Stats Card */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-8 flex flex-col justify-between transition-transform hover:shadow-md">
                    <div>
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <p className="text-primary dark:text-emerald-500 text-xs font-bold uppercase tracking-widest">Perfil</p>
                                <h3 className="text-slate-900 dark:text-white text-2xl font-bold mt-1">Meus Dados</h3>
                            </div>
                            <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-black text-xs uppercase tracking-wider border ${profile?.status === 'active'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400 border-amber-200 dark:border-amber-800/50'
                                }`}>
                                <span className={`size-2 rounded-full ${profile?.status === 'active' ? 'bg-emerald-600 animate-pulse' : 'bg-amber-600'}`}></span>
                                {profile?.status === 'active' ? 'Ativo' : 'Pendente'}
                            </div>
                        </div>
                        <div className="space-y-5">
                            <div className="flex flex-col border-b border-slate-100 dark:border-slate-800 pb-4">
                                <p className="text-slate-500 dark:text-gray-400 text-[11px] uppercase font-bold tracking-widest">Nome Completo</p>
                                <p className="text-slate-900 dark:text-white font-semibold text-lg">
                                    {profile ? `${profile.first_name} ${profile.last_name}` : 'Carregando...'}
                                </p>
                            </div>
                            <div className="flex flex-col border-b border-slate-100 dark:border-slate-800 pb-4">
                                <p className="text-slate-500 dark:text-gray-400 text-[11px] uppercase font-bold tracking-widest">CPF</p>
                                <p className="text-slate-900 dark:text-white font-semibold text-lg">
                                    {profile?.cpf || '***.***.***-**'}
                                </p>
                            </div>
                            <div className="flex flex-col">
                                <p className="text-slate-500 dark:text-gray-400 text-[11px] uppercase font-bold tracking-widest">Categoria de Sócio</p>
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">workspace_premium</span>
                                    <p className="text-slate-900 dark:text-white font-semibold text-lg">
                                        {profile ? getMembershipDisplay(profile.membership_type) : 'Carregando...'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <button className="mt-8 text-primary dark:text-emerald-400 text-sm font-bold flex items-center gap-2 hover:gap-3 transition-all group">
                        <span>Atualizar informações cadastrais</span>
                        <span className="material-symbols-outlined text-sm font-bold">arrow_forward</span>
                    </button>
                </div>
            </div>

            <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                    <h3 className="text-slate-900 dark:text-white text-lg font-bold flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">history</span>
                        Histórico de Pagamentos
                    </h3>
                    <button className="text-sm font-bold text-primary hover:text-emerald-700 hover:underline transition-colors">Ver tudo</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800/50">
                            <tr>
                                <th className="px-8 py-4 text-[11px] uppercase font-bold text-slate-500 tracking-widest">Mês Referência</th>
                                <th className="px-8 py-4 text-[11px] uppercase font-bold text-slate-500 tracking-widest">Valor</th>
                                <th className="px-8 py-4 text-[11px] uppercase font-bold text-slate-500 tracking-widest">Data de Pagamento</th>
                                <th className="px-8 py-4 text-[11px] uppercase font-bold text-slate-500 tracking-widest text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {displayPayments.map((row) => (
                                <tr key={row.id} className="hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-colors">
                                    <td className="px-8 py-5 font-semibold">{row.month}</td>
                                    <td className="px-8 py-5 text-slate-600 dark:text-gray-300">{row.value}</td>
                                    <td className="px-8 py-5 text-slate-600 dark:text-gray-300">{row.date}</td>
                                    <td className="px-8 py-5 text-right">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border ${row.status === 'Pago'
                                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50'
                                            : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800/50'
                                            }`}>
                                            <span className={`size-1.5 rounded-full ${row.status === 'Pago' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                                            {row.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
};

export default Dashboard;
