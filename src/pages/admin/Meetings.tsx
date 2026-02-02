import React, { useState } from 'react';
import MeetingsList from '../../components/meetings/MeetingsList';
import MeetingForm from '../../components/meetings/MeetingForm';
import MeetingEditor from '../../components/meetings/MeetingEditor';
import MinutesPreview from '../../components/meetings/MinutesPreview';
import { aiMinutesService } from '../../services/aiMinutesService';
import { meetingService } from '../../services/meetingService';

const Meetings: React.FC = () => {
    const [view, setView] = useState<'list' | 'editor' | 'preview'>('list');
    const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [generatedContent, setGeneratedContent] = useState<string>('');
    const [generating, setGenerating] = useState(false);
    const [meetingTitle, setMeetingTitle] = useState('');

    const handleSelectMeeting = (id: string) => {
        setSelectedMeetingId(id);
        setView('editor');
    };

    const handleNewMeetingSuccess = (id: string) => {
        setShowForm(false);
        setSelectedMeetingId(id);
        setView('editor');
    };

    const handleGenerateMinutes = async () => {
        if (!selectedMeetingId) return;

        setGenerating(true);
        // Pre-fetch title for the preview
        const { data } = await meetingService.get(selectedMeetingId);
        if (data) setMeetingTitle(data.title);

        const result = await aiMinutesService.generateMinutes(selectedMeetingId);
        if (result.error) {
            alert('Erro ao gerar ata: ' + result.error);
        } else {
            setGeneratedContent(result.content);
            setView('preview');
        }
        setGenerating(false);
    };

    const handleSaveMinutes = async (content: string) => {
        if (!selectedMeetingId) return;
        await meetingService.saveMinutes(selectedMeetingId, content);
    };

    return (
        <div className="container mx-auto pb-12">
            {generating && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-md">
                    <div className="text-center">
                        <div className="relative size-32 mx-auto mb-8">
                            <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-ping"></div>
                            <div className="absolute inset-0 rounded-full border-t-4 border-primary animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="material-symbols-outlined text-4xl text-primary">smart_toy</span>
                            </div>
                        </div>
                        <h2 className="text-2xl font-black text-white mb-2">IA Gerando Ata Oficial</h2>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Analisando pauta, decisões e votações...</p>
                    </div>
                </div>
            )}

            {view === 'list' && (
                <>
                    <div className="mb-10">
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                            <span className="material-symbols-outlined text-primary text-4xl">groups</span>
                            Reuniões e Atas
                        </h1>
                        <p className="text-slate-500 mt-2 font-medium">Gerencie as assembleias da associação e gere atas oficiais com inteligência artificial.</p>
                    </div>

                    <MeetingsList
                        onSelectMeeting={handleSelectMeeting}
                        onNewMeeting={() => setShowForm(true)}
                    />
                </>
            )}

            {view === 'editor' && selectedMeetingId && (
                <MeetingEditor
                    meetingId={selectedMeetingId}
                    onBack={() => setView('list')}
                    onGenerateMinutes={handleGenerateMinutes}
                />
            )}

            {view === 'preview' && selectedMeetingId && (
                <MinutesPreview
                    meetingId={selectedMeetingId}
                    meetingTitle={meetingTitle}
                    content={generatedContent}
                    onSave={handleSaveMinutes}
                    onClose={() => setView('editor')}
                />
            )}

            {showForm && (
                <MeetingForm
                    onClose={() => setShowForm(false)}
                    onSuccess={handleNewMeetingSuccess}
                />
            )}
        </div>
    );
};

export default Meetings;
