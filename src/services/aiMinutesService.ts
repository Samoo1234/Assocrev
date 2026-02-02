import { GoogleGenerativeAI } from '@google/generative-ai';
import { Meeting, meetingTypeLabels, attendeeRoleLabels, voteResultLabels } from '../types/meeting';
import { meetingService } from './meetingService';

// Initialize Gemini AI
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export interface GenerateMinutesResult {
    content: string;
    error: string | null;
}

class AIMinutesService {
    /**
     * Generate meeting minutes using AI
     */
    async generateMinutes(meetingId: string): Promise<GenerateMinutesResult> {
        try {
            // Fetch complete meeting data
            const { data: meeting, error } = await meetingService.get(meetingId);

            if (error || !meeting) {
                return { content: '', error: error || 'Reunião não encontrada' };
            }

            // Check if AI is available
            if (!genAI) {
                // Fallback: generate basic template without AI
                return this.generateTemplateMinutes(meeting);
            }

            // Build prompt for AI
            const prompt = this.buildPrompt(meeting);

            // Call Gemini AI
            const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            return { content: text, error: null };
        } catch (err) {
            console.error('Erro ao gerar ata com IA:', err);
            // Try fallback template
            try {
                const { data: meeting } = await meetingService.get(meetingId);
                if (meeting) {
                    return this.generateTemplateMinutes(meeting);
                }
            } catch (_) { }
            return { content: '', error: 'Erro ao gerar ata. Tente novamente.' };
        }
    }

    /**
     * Build AI prompt from meeting data
     */
    private buildPrompt(meeting: Meeting): string {
        const formattedDate = new Date(meeting.meeting_date + 'T12:00:00').toLocaleDateString('pt-BR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });

        // Format attendees
        const attendeesList = meeting.attendees?.map(a => {
            const name = a.member
                ? `${a.member.first_name} ${a.member.last_name}`
                : a.name || 'Participante';
            const role = attendeeRoleLabels[a.role] || a.role;
            const presence = a.present ? '(Presente)' : '(Ausente)';
            return `- ${name} - ${role} ${presence}`;
        }).join('\n') || 'Nenhum participante registrado';

        // Format topics
        const topicsList = meeting.topics?.map((t, i) => {
            const notes = t.discussion_notes ? `\n   Discussão: ${t.discussion_notes}` : '';
            return `${i + 1}. ${t.title}${t.description ? ` - ${t.description}` : ''}${notes}`;
        }).join('\n\n') || 'Nenhum tópico registrado';

        // Format decisions
        const decisionsList = meeting.decisions?.map((d, i) => {
            const responsible = d.responsible
                ? `Responsável: ${d.responsible.first_name} ${d.responsible.last_name}`
                : '';
            const deadline = d.deadline
                ? `Prazo: ${new Date(d.deadline + 'T12:00:00').toLocaleDateString('pt-BR')}`
                : '';
            return `${i + 1}. ${d.description}${responsible ? ` | ${responsible}` : ''}${deadline ? ` | ${deadline}` : ''}`;
        }).join('\n') || 'Nenhuma decisão registrada';

        // Format votes
        const votesList = meeting.votes?.map((v, i) => {
            const result = v.result ? voteResultLabels[v.result] : 'Pendente';
            return `${i + 1}. ${v.subject}\n   A favor: ${v.votes_for} | Contra: ${v.votes_against} | Abstenções: ${v.votes_abstain} | Resultado: ${result}`;
        }).join('\n\n') || 'Nenhuma votação registrada';

        return `Você é um secretário(a) profissional de uma associação de beneficiários. 
Gere uma ATA DE REUNIÃO oficial e formal em português brasileiro com base nos dados abaixo.

INSTRUÇÕES:
1. Use linguagem formal e técnica apropriada para documentos oficiais
2. Estruture a ata nos moldes tradicionais de atas de reuniões de associações
3. Inclua cabeçalho, corpo e encerramento
4. Mantenha tom impessoal e objetivo
5. Formate o texto em HTML para exibição formatada
6. Não invente informações além das fornecidas
7. Se houver votações, declare claramente os resultados

DADOS DA REUNIÃO:

TIPO: ${meetingTypeLabels[meeting.meeting_type] || meeting.meeting_type}
TÍTULO: ${meeting.title}
DATA: ${formattedDate}
HORÁRIO: ${meeting.start_time || 'Não informado'} às ${meeting.end_time || 'Não informado'}
LOCAL: ${meeting.location || 'Não informado'}

PARTICIPANTES:
${attendeesList}

PAUTA (TÓPICOS DISCUTIDOS):
${topicsList}

DELIBERAÇÕES E DECISÕES:
${decisionsList}

VOTAÇÕES:
${votesList}

---

Por favor, gere a ATA completa em formato HTML, incluindo:
- Cabeçalho com título e identificação
- Abertura formal (data, hora, local, convocação)
- Lista de presença
- Desenvolvimento dos trabalhos (tópicos discutidos)
- Deliberações e votações
- Encaminhamentos com responsáveis e prazos
- Encerramento formal
- Espaço para assinaturas (presidente e secretário)`;
    }

    /**
     * Generate basic template without AI (fallback)
     */
    private generateTemplateMinutes(meeting: Meeting): GenerateMinutesResult {
        const formattedDate = new Date(meeting.meeting_date + 'T12:00:00').toLocaleDateString('pt-BR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });

        const presentAttendees = meeting.attendees?.filter(a => a.present) || [];
        const absentAttendees = meeting.attendees?.filter(a => !a.present) || [];

        const html = `
<div style="font-family: 'Times New Roman', serif; max-width: 800px; margin: 0 auto; line-height: 1.6;">
    <h1 style="text-align: center; font-size: 18px; margin-bottom: 5px;">ASSOCIAÇÃO DOS BENEFICIÁRIOS</h1>
    <h2 style="text-align: center; font-size: 16px; font-weight: normal; margin-bottom: 30px;">
        ATA DA ${meetingTypeLabels[meeting.meeting_type]?.toUpperCase() || 'REUNIÃO'}
    </h2>
    
    <p style="text-align: justify;">
        Aos <strong>${formattedDate}</strong>, às <strong>${meeting.start_time || '___:___'}</strong> horas, 
        ${meeting.location ? `no endereço <strong>${meeting.location}</strong>` : 'em local a definir'}, 
        reuniram-se os membros da Associação para a realização da 
        <strong>${meetingTypeLabels[meeting.meeting_type] || 'reunião'}</strong>, 
        com a seguinte pauta: <strong>${meeting.title}</strong>.
    </p>

    <h3 style="font-size: 14px; margin-top: 20px;">1. LISTA DE PRESENÇA</h3>
    <p><strong>Presentes:</strong></p>
    <ul>
        ${presentAttendees.map(a => {
            const name = a.member ? `${a.member.first_name} ${a.member.last_name}` : a.name || 'Participante';
            return `<li>${name} - ${attendeeRoleLabels[a.role] || a.role}</li>`;
        }).join('\n        ') || '<li>Nenhum participante presente registrado</li>'}
    </ul>
    ${absentAttendees.length > 0 ? `
    <p><strong>Ausentes:</strong></p>
    <ul>
        ${absentAttendees.map(a => {
            const name = a.member ? `${a.member.first_name} ${a.member.last_name}` : a.name || 'Participante';
            return `<li>${name} - ${attendeeRoleLabels[a.role] || a.role}</li>`;
        }).join('\n        ')}
    </ul>` : ''}

    <h3 style="font-size: 14px; margin-top: 20px;">2. ORDEM DO DIA</h3>
    <ol>
        ${meeting.topics?.map(t => `
        <li>
            <strong>${t.title}</strong>
            ${t.description ? `<br/><em>${t.description}</em>` : ''}
            ${t.discussion_notes ? `<br/>Discussão: ${t.discussion_notes}` : ''}
        </li>`).join('\n        ') || '<li>Nenhum tópico registrado</li>'}
    </ol>

    ${meeting.votes && meeting.votes.length > 0 ? `
    <h3 style="font-size: 14px; margin-top: 20px;">3. VOTAÇÕES</h3>
    <ol>
        ${meeting.votes.map(v => `
        <li>
            <strong>${v.subject}</strong><br/>
            Votos a favor: ${v.votes_for} | Votos contra: ${v.votes_against} | Abstenções: ${v.votes_abstain}<br/>
            <strong>Resultado: ${voteResultLabels[v.result!] || 'Pendente'}</strong>
        </li>`).join('\n        ')}
    </ol>` : ''}

    ${meeting.decisions && meeting.decisions.length > 0 ? `
    <h3 style="font-size: 14px; margin-top: 20px;">4. DELIBERAÇÕES E ENCAMINHAMENTOS</h3>
    <ol>
        ${meeting.decisions.map(d => {
            const responsible = d.responsible ? `${d.responsible.first_name} ${d.responsible.last_name}` : '';
            const deadline = d.deadline ? new Date(d.deadline + 'T12:00:00').toLocaleDateString('pt-BR') : '';
            return `
        <li>
            ${d.description}
            ${responsible ? `<br/>Responsável: ${responsible}` : ''}
            ${deadline ? `<br/>Prazo: ${deadline}` : ''}
        </li>`;
        }).join('\n        ')}
    </ol>` : ''}

    <h3 style="font-size: 14px; margin-top: 20px;">5. ENCERRAMENTO</h3>
    <p style="text-align: justify;">
        Nada mais havendo a tratar, foi encerrada a reunião às <strong>${meeting.end_time || '___:___'}</strong> horas, 
        da qual eu, secretário(a), lavrei a presente ata que, após lida e aprovada, 
        será assinada por mim e pelo(a) presidente.
    </p>

    <div style="margin-top: 60px; display: flex; justify-content: space-between;">
        <div style="text-align: center; width: 45%;">
            <div style="border-top: 1px solid #000; padding-top: 5px;">
                Presidente
            </div>
        </div>
        <div style="text-align: center; width: 45%;">
            <div style="border-top: 1px solid #000; padding-top: 5px;">
                Secretário(a)
            </div>
        </div>
    </div>
</div>`;

        return { content: html.trim(), error: null };
    }

    /**
     * Improve/rewrite existing minutes with AI
     */
    async improveMinutes(content: string, instructions?: string): Promise<GenerateMinutesResult> {
        if (!genAI) {
            return { content: '', error: 'API de IA não configurada' };
        }

        try {
            const prompt = `Você é um revisor profissional de documentos oficiais.
Revise e melhore a ATA DE REUNIÃO abaixo, mantendo o formato HTML.

INSTRUÇÕES:
${instructions || 'Melhore a linguagem formal, corrija erros gramaticais e aprimore a estrutura.'}

ATA ATUAL:
${content}

Por favor, retorne a ata revisada em HTML.`;

            const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            return { content: text, error: null };
        } catch (err) {
            console.error('Erro ao melhorar ata:', err);
            return { content: '', error: 'Erro ao processar com IA' };
        }
    }
}

export const aiMinutesService = new AIMinutesService();
