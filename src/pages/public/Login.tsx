import React, { useState } from 'react';

interface LoginProps {
    onLogin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    onCpfLogin?: (cpf: string) => Promise<{ success: boolean; error?: string }>;
    onBack: () => void;
    isAdmin?: boolean;
}

const Login: React.FC<LoginProps> = ({ onLogin, onCpfLogin, onBack, isAdmin = false }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [cpf, setCpf] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Máscara de CPF
    const formatCPF = (val: string) => {
        const numeric = val.replace(/\D/g, '');
        if (numeric.length <= 3) return numeric;
        if (numeric.length <= 6) return `${numeric.slice(0, 3)}.${numeric.slice(3)}`;
        if (numeric.length <= 9) return `${numeric.slice(0, 3)}.${numeric.slice(3, 6)}.${numeric.slice(6)}`;
        return `${numeric.slice(0, 3)}.${numeric.slice(3, 6)}.${numeric.slice(6, 9)}-${numeric.slice(9, 11)}`;
    };

    const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatCPF(e.target.value);
        if (formatted.length <= 14) {
            setCpf(formatted);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        let result;
        if (isAdmin) {
            result = await onLogin(email, password);
        } else if (onCpfLogin) {
            const cleanCpf = cpf.replace(/\D/g, '');
            if (cleanCpf.length !== 11) {
                setError('CPF deve ter 11 dígitos');
                setIsLoading(false);
                return;
            }
            result = await onCpfLogin(cleanCpf);
        } else {
            result = { success: false, error: 'Função de login não disponível' };
        }

        if (!result.success) {
            setError(result.error || 'Erro ao fazer login');
        }

        setIsLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 px-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4 shadow-lg shadow-emerald-500/30">
                        <span className="material-symbols-outlined text-white text-4xl">
                            {isAdmin ? 'shield_person' : 'person'}
                        </span>
                    </div>
                    <h1 className="text-white text-3xl font-extrabold tracking-tight">ASSOCREV</h1>
                    <p className="text-emerald-400/70 text-sm font-medium mt-1">
                        {isAdmin ? 'Acesso Administrativo' : 'Portal do Associado'}
                    </p>
                </div>

                {/* Form Card */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {isAdmin ? (
                            <>
                                <div>
                                    <label className="block text-white/80 text-sm font-semibold mb-2">
                                        E-mail
                                    </label>
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
                                            mail
                                        </span>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                            placeholder="seu@email.com"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-white/80 text-sm font-semibold mb-2">
                                        Senha
                                    </label>
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
                                            lock
                                        </span>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                            placeholder="••••••••"
                                            required
                                        />
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div>
                                <label className="block text-white/80 text-sm font-semibold mb-2 text-center">
                                    Digite seu CPF para acessar
                                </label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
                                        badge
                                    </span>
                                    <input
                                        type="text"
                                        value={cpf}
                                        onChange={handleCpfChange}
                                        className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white text-center text-xl font-bold tracking-widest placeholder-white/10 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                        placeholder="000.000.000-00"
                                        required
                                    />
                                </div>
                                <p className="text-white/40 text-[10px] text-center mt-4 uppercase font-bold tracking-tight">
                                    O portal será liberado automaticamente após validar seu CPF
                                </p>
                            </div>
                        )}

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-red-400 text-sm">error</span>
                                <p className="text-red-400 text-sm font-medium">{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-primary hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold text-lg transition-all shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                                    {isAdmin ? 'Entrando...' : 'Validando CPF...'}
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined">{isAdmin ? 'login' : 'check_circle'}</span>
                                    {isAdmin ? 'Entrar no Painel' : 'Acessar meu Portal'}
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-white/10">
                        <button
                            onClick={onBack}
                            className="w-full text-white/60 hover:text-white py-2 font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined text-sm">arrow_back</span>
                            Voltar para início
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-white/30 text-xs mt-8">
                    © 2026 ASSOCREV. Sistema de Gestão Associativa.
                </p>
            </div>
        </div>
    );
};

export default Login;
