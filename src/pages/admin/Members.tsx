import React, { useState, useEffect } from 'react';
import { memberService, CreateMemberData } from '../../services/memberService';
import { Member } from '../../types';

const Members: React.FC = () => {
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'inactive'>('all');
    const [counts, setCounts] = useState({ active: 0, pending: 0, inactive: 0, total: 0 });

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingMember, setEditingMember] = useState<Member | null>(null);
    const [formLoading, setFormLoading] = useState(false);
    const [memberForm, setMemberForm] = useState<CreateMemberData>({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        cpf: '',
        birth_date: '',
        person_type: 'PF',
        membership_type: 'regular',
        monthly_contribution: 150,
        address: '',
        city: '',
        state: '',
        zip_code: '',
        is_board_member: false,
        board_position: '',
        notes: ''
    });

    // Carregar membros
    const loadMembers = async () => {
        setLoading(true);
        setError(null);

        const filters: any = {};
        if (statusFilter !== 'all') {
            filters.status = statusFilter;
        }
        if (searchTerm) {
            filters.search = searchTerm;
        }

        const { data, error } = await memberService.list(filters);

        if (error) {
            setError(error);
        } else {
            setMembers(data);
        }

        setLoading(false);
    };

    // Carregar contagens
    const loadCounts = async () => {
        const counts = await memberService.countByStatus();
        setCounts(counts);
    };

    useEffect(() => {
        loadMembers();
        loadCounts();
    }, [statusFilter]);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            loadMembers();
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const handleOpenCreateModal = () => {
        setEditingMember(null);
        setMemberForm({
            first_name: '',
            last_name: '',
            email: '',
            phone: '',
            cpf: '',
            birth_date: '',
            cnpj: '',
            company_name: '',
            trade_name: '',
            person_type: 'PF',
            membership_type: 'regular',
            monthly_contribution: 150,
            address: '',
            city: '',
            state: '',
            zip_code: '',
            is_board_member: false,
            board_position: '',
            notes: ''
        });
        setShowModal(true);
    };

    const handleOpenEditModal = (member: Member) => {
        setEditingMember(member);
        setMemberForm({
            first_name: member.first_name || '',
            last_name: member.last_name || '',
            email: member.email || '',
            phone: member.phone || '',
            cpf: member.cpf || '',
            birth_date: member.birth_date || '',
            cnpj: member.cnpj || '',
            company_name: member.company_name || '',
            trade_name: member.trade_name || '',
            person_type: member.person_type || 'PF',
            membership_type: member.membership_type || 'regular',
            monthly_contribution: member.monthly_contribution || 150,
            address: member.address || '',
            city: member.city || '',
            state: member.state || '',
            zip_code: member.zip_code || '',
            is_board_member: member.is_board_member || false,
            board_position: member.board_position || '',
            notes: member.notes || ''
        });
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormLoading(true);

        try {
            if (editingMember) {
                const { error } = await memberService.update(editingMember.id, memberForm);
                if (error) throw new Error(error);
            } else {
                const { error } = await memberService.create(memberForm);
                if (error) throw new Error(error);
            }
            setShowModal(false);
            loadMembers();
            loadCounts();
        } catch (err: any) {
            alert(err.message || 'Erro ao salvar membro');
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este membro?')) return;

        const { success, error } = await memberService.delete(id);
        if (success) {
            loadMembers();
            loadCounts();
        } else {
            alert(error || 'Erro ao excluir membro');
        }
    };

    const getStatusDisplay = (status: string) => {
        const map: Record<string, string> = {
            active: 'Ativo',
            pending: 'Pendente',
            inactive: 'Inativo',
            Ativo: 'Ativo',
            Pendente: 'Pendente',
            Inativo: 'Inativo'
        };
        return map[status] || status;
    };

    const getCategoryDisplay = (type: string) => {
        const map: Record<string, string> = {
            gold: 'OURO',
            silver: 'PRATA',
            regular: 'PADRÃO',
            OURO: 'OURO',
            PRATA: 'PRATA',
            'PADRÃO': 'PADRÃO'
        };
        return map[type] || type;
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">person_search</span>
                        <input
                            className="pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm w-72 focus:ring-2 focus:ring-primary transition-all outline-none"
                            placeholder="Buscar por nome..."
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-1">
                        <button
                            onClick={() => setStatusFilter('all')}
                            className={`px-3 py-1 text-xs font-bold rounded-md ${statusFilter === 'all' ? 'bg-primary text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        >
                            Todos ({counts.total})
                        </button>
                        <button
                            onClick={() => setStatusFilter('active')}
                            className={`px-3 py-1 text-xs font-bold rounded-md ${statusFilter === 'active' ? 'bg-primary text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        >
                            Ativo ({counts.active})
                        </button>
                        <button
                            onClick={() => setStatusFilter('pending')}
                            className={`px-3 py-1 text-xs font-bold rounded-md ${statusFilter === 'pending' ? 'bg-primary text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        >
                            Pendente ({counts.pending})
                        </button>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={loadMembers}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm font-bold hover:opacity-90 transition-all"
                    >
                        <span className="material-symbols-outlined text-lg">refresh</span>
                        Atualizar
                    </button>
                    <button
                        onClick={handleOpenCreateModal}
                        className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all"
                    >
                        <span className="material-symbols-outlined text-lg">person_add</span>
                        Novo Membro
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-red-500">error</span>
                    <p className="text-red-700">{error}</p>
                </div>
            )}

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center">
                        <span className="material-symbols-outlined text-4xl text-slate-300 animate-spin">progress_activity</span>
                        <p className="text-slate-500 mt-2">Carregando membros...</p>
                    </div>
                ) : members.length === 0 ? (
                    <div className="p-12 text-center">
                        <span className="material-symbols-outlined text-4xl text-slate-300">group_off</span>
                        <p className="text-slate-500 mt-2">Nenhum membro encontrado</p>
                    </div>
                ) : (
                    <>
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                    <th className="py-4 px-6 text-xs font-extrabold uppercase tracking-wider text-slate-400">Nome</th>
                                    <th className="py-4 px-6 text-xs font-extrabold uppercase tracking-wider text-slate-400">Categoria</th>
                                    <th className="py-4 px-6 text-xs font-extrabold uppercase tracking-wider text-slate-400 text-center">Adesão</th>
                                    <th className="py-4 px-6 text-xs font-extrabold uppercase tracking-wider text-slate-400">Status</th>
                                    <th className="py-4 px-6 text-xs font-extrabold uppercase tracking-wider text-slate-400 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {members.map((member) => (
                                    <tr key={member.id} className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                                                    {member.initials || `${member.first_name?.[0] || ''}${member.last_name?.[0] || ''}`.toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                                                        {member.name || `${member.first_name} ${member.last_name}`}
                                                    </p>
                                                    <p className="text-xs text-slate-400">{member.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${(member.category || member.membership_type) === 'OURO' || member.membership_type === 'gold' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                                                (member.category || member.membership_type) === 'PRATA' || member.membership_type === 'silver' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                                                    'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                }`}>
                                                {getCategoryDisplay(member.category || member.membership_type)}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-center text-sm font-medium text-slate-500">
                                            {member.joinedDate || (member.membership_date ? new Date(member.membership_date).toLocaleDateString('pt-BR') : '-')}
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`flex items-center text-sm font-semibold ${member.status === 'Ativo' || member.status === 'active' ? 'text-primary' :
                                                member.status === 'Pendente' || member.status === 'pending' ? 'text-amber-500' : 'text-slate-400'
                                                }`}>
                                                <span className={`w-2 h-2 rounded-full mr-2 ${member.status === 'Ativo' || member.status === 'active' ? 'bg-primary' :
                                                    member.status === 'Pendente' || member.status === 'pending' ? 'bg-amber-500' : 'bg-slate-300'
                                                    }`}></span>
                                                {getStatusDisplay(member.status)}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleOpenEditModal(member)}
                                                    className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                                                >
                                                    <span className="material-symbols-outlined text-xl">edit</span>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(member.id)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                >
                                                    <span className="material-symbols-outlined text-xl">delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between border-t border-slate-200 dark:border-slate-800">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                Mostrando {members.length} de {counts.total} membros
                            </p>
                        </div>
                    </>
                )}
            </div>

            {/* Modal de Cadastro/Edição */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                    {editingMember ? 'Editar Membro' : 'Novo Membro'}
                                </h2>
                                <p className="text-xs text-slate-500 uppercase font-black tracking-widest mt-1">
                                    {editingMember ? 'Atualizar cadastro existente' : 'Preencha os dados do novo associado'}
                                </p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto custom-scrollbar flex-1">
                            <div className="space-y-8">
                                {/* Seção: Tipo de Pessoa */}
                                <div>
                                    <h3 className="text-sm font-black text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-lg">badge</span>
                                        Tipo de Cadastro
                                    </h3>
                                    <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
                                        <button
                                            type="button"
                                            onClick={() => setMemberForm({ ...memberForm, person_type: 'PF' })}
                                            className={`px-6 py-2.5 text-sm font-bold rounded-lg transition-all ${memberForm.person_type === 'PF' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-500'}`}
                                        >
                                            Pessoa Física
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setMemberForm({ ...memberForm, person_type: 'PJ' })}
                                            className={`px-6 py-2.5 text-sm font-bold rounded-lg transition-all ${memberForm.person_type === 'PJ' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-500'}`}
                                        >
                                            Pessoa Jurídica
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Campos Básicos */}
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <span className="material-symbols-outlined text-lg">person</span>
                                            Informações Pessoais
                                        </h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Primeiro Nome</label>
                                                <input
                                                    type="text"
                                                    value={memberForm.first_name}
                                                    onChange={(e) => setMemberForm({ ...memberForm, first_name: e.target.value })}
                                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Sobrenome</label>
                                                <input
                                                    type="text"
                                                    value={memberForm.last_name}
                                                    onChange={(e) => setMemberForm({ ...memberForm, last_name: e.target.value })}
                                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">E-mail</label>
                                            <input
                                                type="email"
                                                value={memberForm.email}
                                                onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
                                                required
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Telefone</label>
                                                <input
                                                    type="text"
                                                    value={memberForm.phone}
                                                    onChange={(e) => setMemberForm({ ...memberForm, phone: e.target.value })}
                                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                                    {memberForm.person_type === 'PF' ? 'CPF' : 'CNPJ'}
                                                </label>
                                                <input
                                                    type="text"
                                                    value={memberForm.person_type === 'PF' ? memberForm.cpf : memberForm.cnpj}
                                                    onChange={(e) => setMemberForm({
                                                        ...memberForm,
                                                        [memberForm.person_type === 'PF' ? 'cpf' : 'cnpj']: e.target.value
                                                    })}
                                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
                                                />
                                            </div>
                                        </div>

                                        {memberForm.person_type === 'PF' && (
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Data de Nascimento</label>
                                                <input
                                                    type="date"
                                                    value={memberForm.birth_date}
                                                    onChange={(e) => setMemberForm({ ...memberForm, birth_date: e.target.value })}
                                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
                                                />
                                            </div>
                                        )}

                                        {memberForm.person_type === 'PJ' && (
                                            <>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Razão Social</label>
                                                    <input
                                                        type="text"
                                                        value={memberForm.company_name}
                                                        onChange={(e) => setMemberForm({ ...memberForm, company_name: e.target.value })}
                                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nome Fantasia</label>
                                                    <input
                                                        type="text"
                                                        value={memberForm.trade_name}
                                                        onChange={(e) => setMemberForm({ ...memberForm, trade_name: e.target.value })}
                                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
                                                    />
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {/* Configurações e Endereço */}
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <span className="material-symbols-outlined text-lg">settings</span>
                                            Configurações de Sócio
                                        </h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Categoria</label>
                                                <select
                                                    value={memberForm.membership_type}
                                                    onChange={(e) => setMemberForm({ ...memberForm, membership_type: e.target.value as any })}
                                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
                                                >
                                                    <option value="regular">Padrão</option>
                                                    <option value="silver">Prata</option>
                                                    <option value="gold">Ouro</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Contribuição Mensal</label>
                                                <div className="relative">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">R$</span>
                                                    <input
                                                        type="number"
                                                        value={memberForm.monthly_contribution}
                                                        onChange={(e) => setMemberForm({ ...memberForm, monthly_contribution: parseFloat(e.target.value) })}
                                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
                                                        step="0.01"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest pt-4 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-lg">location_on</span>
                                            Endereço
                                        </h3>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Logradouro</label>
                                            <input
                                                type="text"
                                                value={memberForm.address}
                                                onChange={(e) => setMemberForm({ ...memberForm, address: e.target.value })}
                                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
                                                placeholder="Rua, número, complemento..."
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Cidade</label>
                                                <input
                                                    type="text"
                                                    value={memberForm.city}
                                                    onChange={(e) => setMemberForm({ ...memberForm, city: e.target.value })}
                                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Estado (UF)</label>
                                                <input
                                                    type="text"
                                                    value={memberForm.state}
                                                    onChange={(e) => setMemberForm({ ...memberForm, state: e.target.value })}
                                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
                                                    maxLength={2}
                                                />
                                            </div>
                                        </div>

                                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest pt-4 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-lg">admin_panel_settings</span>
                                            Diretoria
                                        </h3>
                                        <div className="space-y-4">
                                            <label className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer group hover:bg-slate-100 transition-all">
                                                <input
                                                    type="checkbox"
                                                    checked={memberForm.is_board_member}
                                                    onChange={(e) => setMemberForm({ ...memberForm, is_board_member: e.target.checked })}
                                                    className="size-5 rounded border-slate-300 text-primary focus:ring-primary accent-primary"
                                                />
                                                <div>
                                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Membro da Diretoria</p>
                                                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-tight mt-0.5">Habilita a inclusão automática em reuniões de diretoria</p>
                                                </div>
                                            </label>

                                            {memberForm.is_board_member && (
                                                <div className="animate-in slide-in-from-top-2 duration-200">
                                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Cargo na Diretoria</label>
                                                    <input
                                                        type="text"
                                                        value={memberForm.board_position}
                                                        onChange={(e) => setMemberForm({ ...memberForm, board_position: e.target.value })}
                                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
                                                        placeholder="Ex: Presidente, Diretor Financeiro, etc."
                                                        required={memberForm.is_board_member}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Observações</label>
                                    <textarea
                                        value={memberForm.notes}
                                        onChange={(e) => setMemberForm({ ...memberForm, notes: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all h-24 resize-none"
                                    ></textarea>
                                </div>
                            </div>
                        </form>

                        <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-end gap-4">
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="px-6 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl font-bold text-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 transition-all text-sm"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={formLoading}
                                className="px-10 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark shadow-lg shadow-primary/20 disabled:opacity-50 transition-all text-sm flex items-center gap-2"
                            >
                                {formLoading ? (
                                    <>
                                        <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                                        Processando...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-lg">save</span>
                                        {editingMember ? 'Atualizar Membro' : 'Cadastrar Membro'}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div >
            )}
        </div >
    );
};

export default Members;
