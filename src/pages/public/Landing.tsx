import React from 'react';

interface LandingProps {
    onLogin: () => void;
    onRegister: () => void;
    onAdminLogin: () => void;
}

const Landing: React.FC<LandingProps> = ({ onLogin, onRegister, onAdminLogin }) => {
    return (
        <div className="flex flex-col min-h-screen">
            <header className="sticky top-0 z-50 w-full bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="text-primary">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                                <path d="M24 0.757355L47.2426 24L24 47.2426L0.757355 24L24 0.757355ZM21 35.7574V12.2426L9.24264 24L21 35.7574Z" fill="currentColor" />
                            </svg>
                        </div>
                        <span className="text-xl font-extrabold tracking-tight">ASSOCREV</span>
                    </div>
                    <nav className="hidden md:flex items-center gap-10 text-sm font-semibold text-slate-600 dark:text-slate-300">
                        <a className="hover:text-primary transition-colors" href="#">Início</a>
                        <a className="hover:text-primary transition-colors" href="#">Sobre Nós</a>
                        <a className="hover:text-primary transition-colors" href="#">Benefícios</a>
                        <a className="hover:text-primary transition-colors" href="#">Contato</a>
                    </nav>
                    <div className="flex items-center gap-3">
                        <button onClick={onAdminLogin} className="text-slate-500 hover:text-primary text-sm font-bold transition-all px-4">Admin</button>
                        <button onClick={onLogin} className="bg-primary hover:bg-emerald-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm">
                            Área do Associado
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-1">
                <section className="relative py-20 px-6 max-w-7xl mx-auto">
                    <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 h-[600px] flex items-center shadow-2xl">
                        <div className="absolute inset-0 z-0">
                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/90 via-emerald-950/60 to-emerald-950/20 z-10"></div>
                            <img className="w-full h-full object-cover" src="/hero-bg.png" alt="Hero" />
                        </div>
                        <div className="relative z-20 px-12 md:px-20 max-w-3xl">
                            <h1 className="text-white text-5xl md:text-7xl font-extrabold leading-[1.1] tracking-tight mb-6">
                                Cuidando de você e da sua família com assistência social completa
                            </h1>
                            <p className="text-white/80 text-xl md:text-2xl mb-10 leading-relaxed font-light">
                                Junte-se a milhares de associados e tenha acesso a benefícios em saúde, educação, lazer e assistência social para toda a família.
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <button onClick={onRegister} className="bg-emerald-400 hover:bg-emerald-300 text-slate-950 px-8 py-4 rounded-xl font-extrabold text-lg transition-all transform hover:scale-[1.02] shadow-xl">
                                    Associe-se Agora
                                </button>
                                <button className="bg-white/10 hover:bg-white/20 text-white border border-white/30 backdrop-blur-sm px-8 py-4 rounded-xl font-bold text-lg transition-all">
                                    Saiba Mais
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="py-24 px-6 bg-slate-50 dark:bg-slate-900/30">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6 text-center md:text-left">
                            <div className="max-w-2xl">
                                <h2 className="text-primary font-bold uppercase tracking-[0.2em] text-sm mb-4">Nossos Diferenciais</h2>
                                <h3 className="text-3xl md:text-4xl font-extrabold leading-tight">Benefícios para você e sua família</h3>
                            </div>
                            <a className="text-primary font-bold flex items-center gap-2 hover:underline justify-center md:justify-start" href="#">
                                Ver todos os benefícios <span className="material-symbols-outlined">arrow_forward</span>
                            </a>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center sm:text-left">
                            {[
                                { title: 'Assistência Social', icon: 'volunteer_activism', desc: 'Apoio completo para você e sua família em momentos de necessidade, com orientação e acolhimento.' },
                                { title: 'Saúde e Bem-estar', icon: 'health_and_safety', desc: 'Convênios com clínicas, laboratórios, farmácias e profissionais de saúde com valores especiais.' },
                                { title: 'Educação e Cultura', icon: 'school', desc: 'Descontos em cursos, escolas, universidades e atividades culturais para toda a família.' },
                            ].map((b, i) => (
                                <div key={i} className="group bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 transition-all hover:shadow-2xl hover:-translate-y-2">
                                    <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6 transition-colors group-hover:bg-primary group-hover:text-white mx-auto sm:mx-0">
                                        <span className="material-symbols-outlined text-3xl">{b.icon}</span>
                                    </div>
                                    <h4 className="text-xl font-bold mb-3">{b.title}</h4>
                                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{b.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </main>

            <footer className="bg-slate-950 text-slate-400 py-12 px-6">
                <div className="max-w-7xl mx-auto text-center">
                    <p>© 2024 ASSOCREV. Todos os direitos reservados.</p>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
