import React, { useState } from 'react';
import { memberService, CreateMemberData } from '../../services/memberService';

interface RegisterProps {
    onBack: () => void;
    onSuccess: () => void;
}

const Register: React.FC<RegisterProps> = ({ onBack, onSuccess }) => {
    const [formLoading, setFormLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormLoading(true);
        setError(null);

        try {
            const { error } = await memberService.create(memberForm);
            if (error) throw new Error(error);
            setSuccess(true);
            setTimeout(() => {
                onSuccess();
            }, 3000);
        } catch (err: any) {
            setError(err.message || 'Erro ao realizar cadastro. Verifique os dados e tente novamente.');
        } finally {
            setFormLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl p-12 text-center animate-in zoom-in-95 duration-300">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto mb-8">
                        <span className="material-symbols-outlined text-5xl">check_circle</span>
                    </div>
                    <h2 className="text-3xl font-extrabold mb-4">Cadastro Realizado!</h2>
                    <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                        Seja bem-vindo à ASSOCREV. Seu cadastro foi recebido com sucesso.
                        Você será redirecionado para o login em instantes.
                    </p>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-primary h-full animate-progress-bar"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
            {/* Header Mini */}
            <header className="py-6 px-10 flex items-center justify-between">
                <div className="flex items-center gap-3 cursor-pointer" onClick={onBack}>
                    <div className="text-primary">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                            <path d="M24 0.757355L47.2426 24L24 47.2426L0.757355 24L24 0.757355ZM21 35.7574V12.2426L9.24264 24L21 35.7574Z" fill="currentColor" />
                        </svg>
                    </div>
                    <span className="text-xl font-extrabold tracking-tight">ASSOCREV</span>
                </div>
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-slate-500 hover:text-primary font-bold transition-colors"
                >
                    <span className="material-symbols-outlined">arrow_back</span>
                    Voltar para o Início
                </button>
            </header>

            <main className="flex-1 flex items-center justify-center p-6 pb-20">
                <div className="max-w-4xl w-full bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row">
                    {/* Lateral Info */}
                    <div className="md:w-1/3 bg-slate-900 p-12 text-white relative flex flex-col justify-between overflow-hidden">
                        <div className="absolute inset-0 opacity-20">
                            <img className="w-full h-full object-cover" src="/hero-bg.png" alt="Background" />
                        </div>
                        <div className="relative z-10">
                            <h2 className="text-3xl font-extrabold leading-tight mb-6">Comece sua jornada conosco</h2>
                            <p className="text-white/70 leading-relaxed mb-8">
                                Ao se associar, você terá acesso imediato a uma rede completa de assistência e benefícios.
                            </p>

                            <ul className="space-y-4">
                                {[
                                    'Assistência Social Completa',
                                    'Convênios Exclusivos',
                                    'Eventos e Networking',
                                    'Portal do Associado Online'
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-sm font-medium">
                                        <span className="material-symbols-outlined text-primary text-xl">check_circle</span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="relative z-10 pt-10 mt-10 border-t border-white/10">
                            <p className="text-xs text-white/50 font-bold uppercase tracking-widest mb-1">Dúvidas?</p>
                            <p className="text-sm font-bold">contato@assocrev.com.br</p>
                        </div>
                    </div>

                    {/* Form Area */}
                    <div className="flex-1 p-10 md:p-14 overflow-y-auto max-h-[85vh] custom-scrollbar">
                        <div className="mb-10">
                            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">Associe-se Agora</h1>
                            <p className="text-slate-500 dark:text-slate-400 font-medium">Preencha os dados abaixo para iniciar seu cadastro.</p>
                        </div>

                        {error && (
                            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 mb-8 flex items-center gap-3 text-red-700 dark:text-red-400 animate-in slide-in-from-top-4">
                                <span className="material-symbols-outlined shrink-0">error</span>
                                <p className="text-sm font-bold">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-8">
                            {/* Tipo de Cadastro */}
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

                            <div className="grid grid-cols-1 gap-6">
                                {/* Informações Básicas */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <span className="material-symbols-outlined text-lg">person</span>
                                        {memberForm.person_type === 'PF' ? 'Dados Pessoais' : 'Dados da Empresa'}
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Primeiro Nome</label>
                                            <input
                                                type="text"
                                                value={memberForm.first_name}
                                                onChange={(e) => setMemberForm({ ...memberForm, first_name: e.target.value })}
                                                className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                                                required
                                                placeholder="Seu nome"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Sobrenome</label>
                                            <input
                                                type="text"
                                                value={memberForm.last_name}
                                                onChange={(e) => setMemberForm({ ...memberForm, last_name: e.target.value })}
                                                className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                                                required
                                                placeholder="Seu sobrenome"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">E-mail</label>
                                        <input
                                            type="email"
                                            value={memberForm.email}
                                            onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                                            className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                                            required
                                            placeholder="seu@email.com"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Telefone</label>
                                            <input
                                                type="text"
                                                value={memberForm.phone}
                                                onChange={(e) => setMemberForm({ ...memberForm, phone: e.target.value })}
                                                className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                                                placeholder="(00) 00000-0000"
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
                                                className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                                                required
                                                placeholder={memberForm.person_type === 'PF' ? '000.000.000-00' : '00.000.000/0000-00'}
                                            />
                                        </div>
                                    </div>

                                    {memberForm.person_type === 'PJ' && (
                                        <>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Razão Social</label>
                                                <input
                                                    type="text"
                                                    value={memberForm.company_name}
                                                    onChange={(e) => setMemberForm({ ...memberForm, company_name: e.target.value })}
                                                    className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                                                    placeholder="Nome oficial da empresa"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nome Fantasia</label>
                                                <input
                                                    type="text"
                                                    value={memberForm.trade_name}
                                                    onChange={(e) => setMemberForm({ ...memberForm, trade_name: e.target.value })}
                                                    className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                                                    placeholder="Nome como sua empresa é conhecida"
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Endereço */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <span className="material-symbols-outlined text-lg">location_on</span>
                                        Endereço
                                    </h3>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Logradouro</label>
                                        <input
                                            type="text"
                                            value={memberForm.address}
                                            onChange={(e) => setMemberForm({ ...memberForm, address: e.target.value })}
                                            className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-primary/10 outline-none transition-all"
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
                                                className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                                                placeholder="Sua cidade"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Estado (UF)</label>
                                            <input
                                                type="text"
                                                value={memberForm.state}
                                                onChange={(e) => setMemberForm({ ...memberForm, state: e.target.value })}
                                                className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                                                maxLength={2}
                                                placeholder="UF"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6">
                                <button
                                    type="submit"
                                    disabled={formLoading}
                                    className="w-full py-5 bg-primary text-white rounded-[1.25rem] font-extrabold text-lg shadow-2xl shadow-primary/30 hover:bg-primary-dark transition-all transform hover:scale-[1.01] flex items-center justify-center gap-3 disabled:opacity-70 disabled:hover:scale-100"
                                >
                                    {formLoading ? (
                                        <>
                                            <span className="material-symbols-outlined animate-spin">progress_activity</span>
                                            Processando...
                                        </>
                                    ) : (
                                        <>
                                            Enviar Cadastro
                                            <span className="material-symbols-outlined">arrow_forward</span>
                                        </>
                                    )}
                                </button>
                                <p className="text-center text-slate-400 text-xs mt-6 font-medium">
                                    Ao clicar em Enviar Cadastro, você concorda com nossos <br />
                                    <a href="#" className="text-primary hover:underline">Termos de Uso</a> e <a href="#" className="text-primary hover:underline">Política de Privacidade</a>.
                                </p>
                            </div>
                        </form>
                    </div>
                </div>
            </main>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes progress-bar {
                    from { width: 0%; }
                    to { width: 100%; }
                }
                .animate-progress-bar {
                    animation: progress-bar 3s linear forwards;
                }
            ` }} />
        </div>
    );
};

export default Register;
