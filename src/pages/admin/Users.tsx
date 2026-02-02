import React, { useState, useEffect } from 'react';
import { userService, UserRecord, CreateUserData } from '../../services/userService';

const Users: React.FC = () => {
    const [users, setUsers] = useState<UserRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState<CreateUserData>({
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        role: 'member',
    });
    const [formError, setFormError] = useState('');
    const [formLoading, setFormLoading] = useState(false);

    const loadUsers = async () => {
        setLoading(true);
        const { data } = await userService.list();
        setUsers(data);
        setLoading(false);
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');
        setFormLoading(true);

        const { user, error } = await userService.create(formData);

        if (error) {
            setFormError(error);
            setFormLoading(false);
            return;
        }

        setShowModal(false);
        setFormData({ email: '', password: '', first_name: '', last_name: '', role: 'member' });
        setFormLoading(false);
        loadUsers();
    };

    const getRoleDisplay = (role: string) => {
        const map: Record<string, string> = {
            admin: 'Administrador',
            secretary: 'Secretário',
            member: 'Associado',
        };
        return map[role] || role;
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'admin': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'secretary': return 'bg-blue-100 text-blue-700 border-blue-200';
            default: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Gestão de Usuários</h1>
                    <p className="text-slate-500">Gerencie os acessos ao sistema</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={loadUsers} className="px-4 py-2 bg-slate-100 rounded-lg text-sm font-bold hover:bg-slate-200 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">refresh</span>
                        Atualizar
                    </button>
                    <button
                        onClick={() => setShowModal(true)}
                        className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary-dark flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-sm">person_add</span>
                        Novo Usuário
                    </button>
                </div>
            </div>

            {/* Tabela de Usuários */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center">
                        <span className="material-symbols-outlined text-4xl text-slate-300 animate-spin">progress_activity</span>
                        <p className="text-slate-500 mt-2">Carregando usuários...</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                <th className="py-4 px-6 text-left text-xs font-extrabold uppercase tracking-wider text-slate-400">Usuário</th>
                                <th className="py-4 px-6 text-left text-xs font-extrabold uppercase tracking-wider text-slate-400">Email</th>
                                <th className="py-4 px-6 text-left text-xs font-extrabold uppercase tracking-wider text-slate-400">Perfil</th>
                                <th className="py-4 px-6 text-left text-xs font-extrabold uppercase tracking-wider text-slate-400">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                <span className="text-primary font-bold text-sm">
                                                    {user.first_name?.[0]}{user.last_name?.[0]}
                                                </span>
                                            </div>
                                            <span className="font-semibold">{user.first_name} {user.last_name}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6 text-slate-500">{user.email}</td>
                                    <td className="py-4 px-6">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getRoleColor(user.role)}`}>
                                            {getRoleDisplay(user.role)}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6">
                                        <span className={`flex items-center gap-2 text-sm font-medium ${user.status === 'active' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                            <span className={`w-2 h-2 rounded-full ${user.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                                            {user.status === 'active' ? 'Ativo' : 'Inativo'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal de Novo Usuário */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                            <h2 className="text-xl font-bold">Novo Usuário</h2>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-2">Nome</label>
                                    <input
                                        type="text"
                                        value={formData.first_name}
                                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-2">Sobrenome</label>
                                    <input
                                        type="text"
                                        value={formData.last_name}
                                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-2">E-mail</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-2">Senha</label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                    minLength={6}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-2">Perfil de Acesso</label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                >
                                    <option value="member">Associado</option>
                                    <option value="secretary">Secretário</option>
                                    <option value="admin">Administrador</option>
                                </select>
                            </div>

                            {formError && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-red-500 text-sm">error</span>
                                    <p className="text-red-700 text-sm">{formError}</p>
                                </div>
                            )}

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-3 bg-slate-100 rounded-lg font-bold hover:bg-slate-200"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={formLoading}
                                    className="flex-1 px-4 py-3 bg-primary text-white rounded-lg font-bold hover:bg-primary-dark disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {formLoading ? (
                                        <>
                                            <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                                            Criando...
                                        </>
                                    ) : 'Criar Usuário'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Users;
