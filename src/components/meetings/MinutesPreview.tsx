import React, { useState } from 'react';
import { exportService } from '../../services/exportService';
import { MinutesStatus } from '../../types/meeting';

interface MinutesPreviewProps {
    meetingId: string;
    meetingTitle: string;
    content: string; // HTML string
    onSave: (content: string) => Promise<void>;
    onClose: () => void;
}

const MinutesPreview: React.FC<MinutesPreviewProps> = ({ meetingId, meetingTitle, content, onSave, onClose }) => {
    const [editableContent, setEditableContent] = useState(content);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isExporting, setIsExporting] = useState<string | null>(null);

    const handleSave = async () => {
        setIsSaving(true);
        await onSave(editableContent);
        setIsEditing(false);
        setIsSaving(false);
    };

    const handleExport = async (type: 'pdf' | 'docx') => {
        setIsExporting(type);
        const options = {
            title: `Ata - ${meetingTitle}`,
            content: editableContent,
            meetingId
        };

        if (type === 'pdf') {
            await exportService.generatePDF(options);
        } else {
            await exportService.generateDOCX(options);
        }
        setIsExporting(null);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-4xl max-h-[90vh] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/20">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">description</span>
                            Prévia da Ata Gerada
                        </h2>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Revisão final antes do export</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {!isEditing ? (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="px-4 py-2 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 rounded-xl text-sm font-bold flex items-center gap-2 transition-all"
                            >
                                <span className="material-symbols-outlined text-sm">edit</span>
                                Editar
                            </button>
                        ) : (
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="px-6 py-2 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 transition-all flex items-center gap-2"
                            >
                                {isSaving ? <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span> : <span className="material-symbols-outlined text-sm">check</span>}
                                Salvar Alterações
                            </button>
                        )}
                        <button onClick={onClose} className="size-10 flex items-center justify-center rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 transition-colors">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>
                </div>

                {/* Content Editor/Viewer */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50 dark:bg-slate-950">
                    <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 p-12 shadow-xl rounded-2xl border border-slate-100 dark:border-slate-800">
                        {isEditing ? (
                            <textarea
                                className="w-full h-[600px] p-6 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-mono focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                                value={editableContent}
                                onChange={e => setEditableContent(e.target.value)}
                                placeholder="Edit the HTML content of the minutes..."
                            />
                        ) : (
                            <div
                                className="prose dark:prose-invert prose-emerald max-w-none"
                                dangerouslySetInnerHTML={{ __html: editableContent }}
                            />
                        )}
                    </div>
                </div>

                {/* Footer / Export Actions */}
                <div className="px-8 py-6 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/20">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Formato de Exportação</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => handleExport('pdf')}
                            disabled={isExporting !== null}
                            className="px-6 py-3 bg-red-500 text-white rounded-2xl text-sm font-bold hover:bg-red-600 transition-all flex items-center gap-2 shadow-lg shadow-red-500/20 disabled:opacity-50"
                        >
                            {isExporting === 'pdf' ? <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span> : <span className="material-symbols-outlined">picture_as_pdf</span>}
                            Exportar PDF
                        </button>
                        <button
                            onClick={() => handleExport('docx')}
                            disabled={isExporting !== null}
                            className="px-6 py-3 bg-blue-600 text-white rounded-2xl text-sm font-bold hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-50"
                        >
                            {isExporting === 'docx' ? <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span> : <span className="material-symbols-outlined">description</span>}
                            Exportar DOCX
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MinutesPreview;
