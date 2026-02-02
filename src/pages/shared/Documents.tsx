import React, { useState, useEffect } from 'react';
import { documentService } from '../../services/documentService';
import { Doc } from '../../types';

interface DocumentsProps {
    isAdmin?: boolean;
}

const Documents: React.FC<DocumentsProps> = ({ isAdmin }) => {
    const [docs, setDocs] = useState<Doc[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        category: 'minutes',
        access_level: 'public'
    });

    const loadDocuments = async () => {
        setLoading(true);
        const { data, error } = await documentService.list();
        if (error) {
            setError(error);
        } else {
            setDocs(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadDocuments();
    }, []);

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        setIsSubmitting(true);
        const { error: uploadError } = await documentService.upload(file, formData);

        if (uploadError) {
            alert('Erro ao enviar documento: ' + uploadError);
        } else {
            setIsModalOpen(false);
            setFile(null);
            setFormData({ title: '', category: 'minutes', access_level: 'public' });
            loadDocuments();
        }
        setIsSubmitting(false);
    };

    const handleDelete = async (doc: Doc) => {
        if (!confirm(`Deseja realmente excluir o documento "${doc.title}"?`)) return;

        const { success, error: deleteError } = await documentService.delete(doc.id, doc.url);
        if (success) {
            loadDocuments();
        } else {
            alert('Erro ao excluir: ' + deleteError);
        }
    };

    const handleView = (url: string) => {
        window.open(url, '_blank');
    };

    const handleDownload = (url: string, title: string) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = title;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Filter by search
    const filteredDocs = docs.filter(doc =>
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.type.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const displayDocs = filteredDocs;

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="bg-white dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm space-y-4">
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1 relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                        <input
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                            placeholder="Buscar por título ou palavra-chave..."
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <button onClick={loadDocuments} className="px-4 py-2 bg-slate-100 dark:bg-white/10 rounded-lg text-sm font-bold hover:bg-slate-200 flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">refresh</span>
                            Atualizar
                        </button>
                        {isAdmin && (
                            <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-emerald-700 flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">upload_file</span>
                                Novo Documento
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="bg-white dark:bg-white/5 rounded-xl p-12 text-center border border-slate-200">
                    <span className="material-symbols-outlined text-4xl text-slate-300 animate-spin">progress_activity</span>
                    <p className="text-slate-500 mt-2">Carregando documentos...</p>
                </div>
            ) : error ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-red-500">error</span>
                    <p className="text-red-700">{error}</p>
                </div>
            ) : displayDocs.length === 0 ? (
                <div className="bg-white dark:bg-white/5 rounded-xl p-12 text-center border border-slate-200">
                    <span className="material-symbols-outlined text-4xl text-slate-300">folder_off</span>
                    <p className="text-slate-500 mt-2">Nenhum documento encontrado</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {displayDocs.map((doc, i) => (
                        <div key={i} className="bg-white dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 p-5 group hover:shadow-xl transition-all flex flex-col h-full">
                            <div className="flex items-start justify-between mb-4">
                                <div className={`size-12 rounded-lg flex items-center justify-center ${doc.color}`}>
                                    <span className="material-symbols-outlined text-3xl">picture_as_pdf</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-1 rounded bg-slate-100 dark:bg-white/10 text-[10px] font-bold text-slate-500 uppercase tracking-tight">{doc.type}</span>
                                    {isAdmin && (
                                        <button onClick={() => handleDelete(doc)} className="p-1 text-slate-400 hover:text-red-500 transition-colors">
                                            <span className="material-symbols-outlined text-xs">delete</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                            <h3 className="text-base font-bold text-slate-800 dark:text-white leading-snug flex-1">{doc.title}</h3>
                            <div className="mt-4 space-y-2">
                                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                    <span className="material-symbols-outlined text-sm">calendar_month</span>
                                    Publicado em {doc.date}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                    <span className="material-symbols-outlined text-sm">description</span>
                                    PDF
                                </div>
                            </div>
                            <div className="mt-6 flex items-center gap-2">
                                <button onClick={() => handleView(doc.url)} className="flex-1 py-2 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold border border-slate-200 dark:border-white/10 transition-all flex items-center justify-center gap-2">
                                    <span className="material-symbols-outlined text-base">visibility</span> Visualizar
                                </button>
                                {isAdmin && (
                                    <button onClick={() => handleDownload(doc.url, doc.title)} className="flex-1 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-xs font-bold border border-primary/20 transition-all flex items-center justify-center gap-2">
                                        <span className="material-symbols-outlined text-base">download</span> Baixar
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal de Upload */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/20">
                            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">upload_file</span>
                                Novo Documento
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <form onSubmit={handleUpload} className="p-8 space-y-4">
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Título do Documento</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    placeholder="Ex: Ata de Assembleia 2024"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Categoria</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none"
                                >
                                    <option value="minutes">ATA</option>
                                    <option value="bylaws">ESTATUTO</option>
                                    <option value="reports">RELATÓRIO</option>
                                    <option value="contracts">CONTRATO</option>
                                    <option value="other">OUTRO</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Arquivo (PDF)</label>
                                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-200 dark:border-slate-800 border-dashed rounded-xl hover:border-primary/50 transition-colors">
                                    <div className="space-y-1 text-center">
                                        <span className="material-symbols-outlined text-4xl text-slate-300">description</span>
                                        <div className="flex text-sm text-slate-600 dark:text-slate-400">
                                            <label className="relative cursor-pointer rounded-md font-medium text-primary hover:text-emerald-700">
                                                <span>Selecionar arquivo</span>
                                                <input
                                                    type="file"
                                                    accept=".pdf"
                                                    className="sr-only"
                                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                                />
                                            </label>
                                        </div>
                                        <p className="text-xs text-slate-500">
                                            {file ? file.name : 'Apenas PDF até 10MB'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting || !file}
                                className="w-full bg-primary hover:bg-emerald-700 text-white py-4 rounded-xl font-bold text-lg transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <>
                                        <span className="material-symbols-outlined animate-spin">progress_activity</span>
                                        Enviando...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined">check_circle</span>
                                        Enviar Documento
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

export default Documents;
