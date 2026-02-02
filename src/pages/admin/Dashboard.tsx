import React, { useState, useEffect } from 'react';
import { memberService } from '../../services/memberService';
import { financialService } from '../../services/financialService';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardStats {
    totalMembers: number;
    activeMembers: number;
    pendingMembers: number;
    monthlyIncome: number;
    balance: number;
}

const Dashboard: React.FC = () => {
    const [stats, setStats] = useState<DashboardStats>({
        totalMembers: 0,
        activeMembers: 0,
        pendingMembers: 0,
        monthlyIncome: 0,
        balance: 0
    });
    const [growthData, setGrowthData] = useState<{ month: string; members: number }[]>([]);
    const [loading, setLoading] = useState(true);

    const loadStats = async () => {
        setLoading(true);

        const [memberCounts, financialSummary, historicalGrowth] = await Promise.all([
            memberService.countByStatus(),
            financialService.getSummary(),
            memberService.getGrowthData()
        ]);

        setStats({
            totalMembers: memberCounts.total,
            activeMembers: memberCounts.active,
            pendingMembers: memberCounts.pending,
            monthlyIncome: financialSummary.data.monthlyIncome,
            balance: financialSummary.data.balance
        });

        setGrowthData(historicalGrowth);
        setLoading(false);
    };

    useEffect(() => {
        loadStats();
    }, []);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    return (
        <div className="space-y-6">
            {/* Cards de Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary text-2xl">groups</span>
                        </div>
                    </div>
                    <p className="text-slate-400 text-sm font-medium">Total Associados</p>
                    <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                        {loading ? '...' : stats.totalMembers.toLocaleString('pt-BR')}
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                            <span className="material-symbols-outlined text-emerald-600 text-2xl">check_circle</span>
                        </div>
                    </div>
                    <p className="text-slate-400 text-sm font-medium">Ativos</p>
                    <p className="text-3xl font-extrabold text-emerald-600 mt-1">
                        {loading ? '...' : stats.activeMembers}
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                            <span className="material-symbols-outlined text-amber-600 text-2xl">pending</span>
                        </div>
                    </div>
                    <p className="text-slate-400 text-sm font-medium">Pendentes</p>
                    <p className="text-3xl font-extrabold text-amber-600 mt-1">
                        {loading ? '...' : stats.pendingMembers}
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                            <span className="material-symbols-outlined text-blue-600 text-2xl">payments</span>
                        </div>
                    </div>
                    <p className="text-slate-400 text-sm font-medium">Receita Mensal</p>
                    <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                        {loading ? '...' : formatCurrency(stats.monthlyIncome)}
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                            <span className="material-symbols-outlined text-purple-600 text-2xl">account_balance</span>
                        </div>
                    </div>
                    <p className="text-slate-400 text-sm font-medium">Saldo</p>
                    <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                        {loading ? '...' : formatCurrency(stats.balance)}
                    </p>
                </div>
            </div>

            {/* Gráfico de Crescimento */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-bold">Crescimento Mensal</h2>
                        <p className="text-sm text-slate-400">Evolução do número de associados</p>
                    </div>
                    <button onClick={loadStats} className="px-4 py-2 bg-slate-100 rounded-lg text-sm font-bold hover:bg-slate-200 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">refresh</span>
                        Atualizar
                    </button>
                </div>
                <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={growthData}>
                            <defs>
                                <linearGradient id="colorMembers" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                            <Tooltip
                                contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                                formatter={(value: number) => [`${value} associados`, 'Total']}
                            />
                            <Area
                                type="monotone"
                                dataKey="members"
                                stroke="#16a34a"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorMembers)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Ações Rápidas */}
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-8 rounded-2xl shadow-lg">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h3 className="text-white text-xl font-bold mb-2">Quer exportar relatórios?</h3>
                        <p className="text-white/80">Gere relatórios completos de associados, financeiro e eventos em PDF ou Excel.</p>
                    </div>
                    <button className="bg-white text-emerald-600 px-6 py-3 rounded-xl font-bold hover:bg-emerald-50 transition-all flex items-center gap-2 whitespace-nowrap">
                        <span className="material-symbols-outlined">download</span>
                        Exportar Dados
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
