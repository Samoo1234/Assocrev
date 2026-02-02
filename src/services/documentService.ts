import { supabase } from './supabase';
import { Doc } from '../types';

class DocumentService {
    /**
     * Listar todos os documentos
     */
    async list(): Promise<{ data: Doc[]; error: string | null }> {
        try {
            const { data, error } = await supabase
                .from('documents')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                return { data: [], error: error.message };
            }

            const categoryColors: Record<string, string> = {
                minutes: 'text-red-500 bg-red-50',
                bylaws: 'text-blue-500 bg-blue-50',
                reports: 'text-emerald-500 bg-emerald-50',
                contracts: 'text-orange-500 bg-orange-50',
                other: 'text-slate-500 bg-slate-50',
            };

            const categoryNames: Record<string, string> = {
                minutes: 'ATA',
                bylaws: 'ESTATUTO',
                reports: 'RELATÓRIO',
                contracts: 'CONTRATO',
                other: 'OUTRO',
            };

            const docs: Doc[] = (data || []).map(d => ({
                id: d.id,
                title: d.title,
                type: categoryNames[d.category] || d.category.toUpperCase(),
                date: new Date(d.created_at).toLocaleDateString('pt-BR'),
                size: 'N/A',
                color: categoryColors[d.category] || 'text-slate-500 bg-slate-50',
                url: d.file_url,
                category: d.category
            }));

            return { data: docs, error: null };
        } catch (err) {
            return { data: [], error: 'Erro ao buscar documentos' };
        }
    }

    /**
     * Upload de documento
     */
    async upload(file: File, metadata: { title: string; category: string; access_level: string }): Promise<{ data: any; error: string | null }> {
        try {
            // 1. Upload para o Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
            const filePath = `official/${fileName}`;

            const { error: storageError } = await supabase.storage
                .from('documents')
                .upload(filePath, file);

            if (storageError) {
                return { data: null, error: storageError.message };
            }

            // 2. Obter URL pública
            const { data: { publicUrl } } = supabase.storage
                .from('documents')
                .getPublicUrl(filePath);

            // 3. Registrar no banco
            const { data, error: dbError } = await supabase
                .from('documents')
                .insert([{
                    title: metadata.title,
                    category: metadata.category,
                    file_url: publicUrl,
                    access_level: metadata.access_level,
                    uploaded_by: (await supabase.auth.getUser()).data.user?.id
                }])
                .select()
                .single();

            if (dbError) {
                // TODO: Deletar arquivo se falhar no banco
                return { data: null, error: dbError.message };
            }

            return { data, error: null };
        } catch (err) {
            return { data: null, error: 'Erro ao realizar upload' };
        }
    }

    /**
     * Deletar documento
     */
    async delete(id: string, fileUrl: string): Promise<{ success: boolean; error: string | null }> {
        try {
            // 1. Deletar do banco
            const { error: dbError } = await supabase
                .from('documents')
                .delete()
                .eq('id', id);

            if (dbError) {
                return { success: false, error: dbError.message };
            }

            // 2. Deletar do storage (extrair path da URL)
            try {
                const url = new URL(fileUrl);
                const pathParts = url.pathname.split('/documents/');
                if (pathParts.length > 1) {
                    const filePath = pathParts[1];
                    await supabase.storage.from('documents').remove([filePath]);
                }
            } catch (e) {
                console.error('Erro ao deletar arquivo do storage:', e);
            }

            return { success: true, error: null };
        } catch (err) {
            return { success: false, error: 'Erro ao excluir documento' };
        }
    }
}

export const documentService = new DocumentService();
