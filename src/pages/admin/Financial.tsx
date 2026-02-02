import React, { useState, useEffect } from 'react';
import { financialService, Transaction, FinancialSummary } from '../../services/financialService';
import { memberService } from '../../services/memberService';
import { Member } from '../../types/member';

const Financial: React.FC = () => {
    const [summary, setSummary] = useState<FinancialSummary>({ balance: 0, monthlyIncome: 0, monthlyExpense: 0, pendingPayments: 0 });
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        type: 'income' as 'income' | 'expense',
        category: '',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        member_id: '',
    });

    const loadData = async () => {
        setLoading(true);
        setError(null);

        const [summaryResult, transactionsResult, membersResult] = await Promise.all([
            financialService.getSummary(),
            financialService.list(),
            memberService.list()
        ]);

        if (summaryResult.error) {
            setError(summaryResult.error);
        } else {
            setSummary(summaryResult.data);
        }

        if (!transactionsResult.error) {
            setTransactions(transactionsResult.data);
        }

        if (!membersResult.error) {
            setMembers(membersResult.data);
        }

        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const result = await financialService.create({
            type: formData.type,
            category: formData.category,
            amount: Number(formData.amount),
            description: formData.description,
            date: formData.date,
            member_id: formData.member_id || undefined,
        });

        if (!result.error) {
            setIsModalOpen(false);
            setFormData({
                type: 'income',
                category: '',
                amount: '',
                description: '',
                date: new Date().toISOString().split('T')[0],
                member_id: '',
            });
            loadData();
        } else {
            alert('Erro ao criar transação: ' + result.error);
        }

        setIsSubmitting(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta transação?')) return;

        const result = await financialService.delete(id);
        if (!result.error) {
            loadData();
        } else {
            alert('Erro ao excluir transação: ' + result.error);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    return (
        <div className="space-y-6">
            {/* Cards de Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-slate-400 text-sm font-medium">Saldo Total</span>
                        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                            <span className="material-symbols-outlined text-emerald-600">account_balance</span>
                        </div>
                    </div>
                    <p className="text-3xl font-extrabold text-slate-900 dark:text-white">
                        {loading ? '...' : formatCurrency(summary.balance)}
                    </p>
                    <p className="text-sm text-emerald-500 font-medium mt-1">Saldo em caixa</p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-slate-400 text-sm font-medium">Receita Mensal</span>
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <span className="material-symbols-outlined text-blue-600">trending_up</span>
                        </div>
                    </div>
                    <p className="text-3xl font-extrabold text-slate-900 dark:text-white">
                        {loading ? '...' : formatCurrency(summary.monthlyIncome)}
                    </p>
                    <p className="text-sm text-slate-400 font-medium mt-1">Este mês</p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-slate-400 text-sm font-medium">Despesas</span>
                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                            <span className="material-symbols-outlined text-red-600">trending_down</span>
                        </div>
                    </div>
                    <p className="text-3xl font-extrabold text-slate-900 dark:text-white">
                        {loading ? '...' : formatCurrency(summary.monthlyExpense)}
                    </p>
                    <p className="text-sm text-slate-400 font-medium mt-1">Este mês</p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-slate-400 text-sm font-medium">Inadimplência</span>
                        <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                            <span className="material-symbols-outlined text-amber-600">warning</span>
                        </div>
                    </div>
                    <p className="text-3xl font-extrabold text-slate-900 dark:text-white">
                        {loading ? '...' : summary.monthlyIncome + summary.pendingPayments > 0
                            ? `${((summary.pendingPayments / (summary.monthlyIncome + summary.pendingPayments)) * 100).toFixed(1)}%`
                            : '0%'}
                    </p>
                    <p className="text-sm text-amber-500 font-medium mt-1">
                        {loading ? '...' : formatCurrency(summary.pendingPayments)} pendente
                    </p>
                </div>
            </div>

            {/* Tabela de Transações */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <h2 className="text-lg font-bold">Últimas Transações</h2>
                    <div className="flex gap-2">
                        <button onClick={loadData} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">refresh</span>
                            Atualizar
                        </button>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-sm">add</span>
                            Nova Transação
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="p-12 text-center">
                        <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
                        <p className="text-slate-500 mt-2">Carregando transações...</p>
                    </div>
                ) : error ? (
                    <div className="p-6">
                        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/20 rounded-lg p-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-red-500">error</span>
                            <p className="text-red-700 dark:text-red-400">{error}</p>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/50">
                                    <th className="py-4 px-6 text-left text-xs font-extrabold uppercase tracking-wider text-slate-400">Descrição</th>
                                    <th className="py-4 px-6 text-left text-xs font-extrabold uppercase tracking-wider text-slate-400">Categoria</th>
                                    <th className="py-4 px-6 text-left text-xs font-extrabold uppercase tracking-wider text-slate-400">Data</th>
                                    <th className="py-4 px-6 text-right text-xs font-extrabold uppercase tracking-wider text-slate-400">Valor</th>
                                    <th className="py-4 px-6 text-right text-xs font-extrabold uppercase tracking-wider text-slate-400 tracking-widest px-2">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-12 text-center text-slate-500">Nenhuma transação encontrada.</td>
                                    </tr>
                                ) : (
                                    transactions.map((t) => (
                                        <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${t.type === 'income' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                                                        <span className={`material-symbols-outlined ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                                            {t.type === 'income' ? 'arrow_downward' : 'arrow_upward'}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-900 dark:text-white leading-tight">{t.description || t.category}</p>
                                                        {t.member_id && (
                                                            <p className="text-[10px] text-slate-500 uppercase font-black mt-0.5 tracking-tighter">
                                                                Associado: {(() => {
                                                                    const m = members.find(m => m.id === t.member_id);
                                                                    return m ? `${m.first_name} ${m.last_name || ''}` : '...';
                                                                })()}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-[11px] font-black uppercase tracking-tight text-slate-600 dark:text-gray-400">{t.category}</span>
                                            </td>
                                            <td className="py-4 px-6 text-slate-500 dark:text-gray-400 text-sm">
                                                {new Date(t.date).toLocaleDateString('pt-BR')}
                                            </td>
                                            <td className={`py-4 px-6 text-right font-bold ${t.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                                                {t.type === 'income' ? '+' : '-'}{formatCurrency(Number(t.amount))}
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <button
                                                    onClick={() => handleDelete(t.id)}
                                                    className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-500 transition-all rounded-lg hover:bg-red-50"
                                                >
                                                    <span className="material-symbols-outlined text-sm">delete</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal de Nova Transação */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/20">
                            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">add_chart</span>
                                Nova Transação
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-5">
                            <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/40 p-1 rounded-xl mb-4">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type: 'income' })}
                                    className={`py-3 rounded-lg text-sm font-black transition-all flex items-center justify-center gap-2 ${formData.type === 'income'
                                        ? 'bg-emerald-500 text-white shadow-md'
                                        : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                >
                                    <span className="material-symbols-outlined text-[18px]">trending_up</span>
                                    RECEITA
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type: 'expense' })}
                                    className={`py-3 rounded-lg text-sm font-black transition-all flex items-center justify-center gap-2 ${formData.type === 'expense'
                                        ? 'bg-red-500 text-white shadow-md'
                                        : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                >
                                    <span className="material-symbols-outlined text-[18px]">trending_down</span>
                                    DESPESA
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Valor</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
                                            <input
                                                type="number"
                                                required
                                                step="0.01"
                                                value={formData.amount}
                                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                                placeholder="0,00"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Data</label>
                                        <input
                                            type="date"
                                            required
                                            value={formData.date}
                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Categoria</label>
                                    <select
                                        required
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none"
                                    >
                                        <option value="">Selecione...</option>
                                        {formData.type === 'income' ? (
                                            <>
                                                <option value="Mensalidade">Mensalidade</option>
                                                <option value="Doação">Doação</option>
                                                <option value="Evento">Evento</option>
                                                <option value="Outros">Outros</option>
                                            </>
                                        ) : (
                                            <>
                                                <option value="Infraestrutura">Infraestrutura</option>
                                                <option value="Pessoal">Pessoal</option>
                                                <option value="Serviços">Serviços</option>
                                                <option value="Outros">Outros</option>
                                            </>
                                        )}
                                    </select>
                                </div>

                                {formData.category === 'Mensalidade' && (
                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Vincular Associado</label>
                                        <select
                                            value={formData.member_id}
                                            onChange={(e) => setFormData({ ...formData, member_id: e.target.value })}
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none"
                                        >
                                            <option value="">Selecione o associado...</option>
                                            {members.map(m => (
                                                <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Descrição</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                                        placeholder="Ex: Pagamento referente a..."
                                        rows={3}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-primary hover:bg-emerald-700 text-white py-4 rounded-xl font-bold text-lg transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <>
                                        <span className="material-symbols-outlined animate-spin">progress_activity</span>
                                        Processando...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined">check_circle</span>
                                        Salvar Transação
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Financial;
