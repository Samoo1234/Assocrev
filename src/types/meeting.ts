// Meeting types for the meeting minutes system

export type MeetingType = 'ordinary' | 'extraordinary' | 'board';
export type MeetingStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type AttendeeRole = 'president' | 'secretary' | 'treasurer' | 'participant' | 'guest';
export type TopicStatus = 'pending' | 'discussed' | 'skipped';
export type VoteResult = 'approved' | 'rejected' | 'tied';
export type MinutesStatus = 'draft' | 'reviewed' | 'approved';

export interface Meeting {
    id: string;
    title: string;
    meeting_date: string;
    start_time?: string;
    end_time?: string;
    meeting_type: MeetingType;
    location?: string;
    status: MeetingStatus;
    created_by?: string;
    created_at?: string;
    updated_at?: string;
    // Relations
    attendees?: MeetingAttendee[];
    topics?: MeetingTopic[];
    decisions?: MeetingDecision[];
    votes?: MeetingVote[];
    minutes?: MeetingMinutes[];
}

export interface MeetingAttendee {
    id: string;
    meeting_id: string;
    member_id?: string;
    name?: string; // for non-member guests
    role: AttendeeRole;
    present: boolean;
    created_at?: string;
    // Joined from members table
    member?: {
        first_name: string;
        last_name: string;
        email?: string;
        board_position?: string;
    };
}

export interface MeetingTopic {
    id: string;
    meeting_id: string;
    order_num: number;
    title: string;
    description?: string;
    discussion_notes?: string;
    status: TopicStatus;
    created_at?: string;
    // Related decisions and votes
    decisions?: MeetingDecision[];
    votes?: MeetingVote[];
}

export interface MeetingDecision {
    id: string;
    meeting_id: string;
    topic_id?: string;
    description: string;
    responsible_member_id?: string;
    deadline?: string;
    created_at?: string;
    // Joined from members table
    responsible?: {
        first_name: string;
        last_name: string;
    };
}

export interface MeetingVote {
    id: string;
    meeting_id: string;
    topic_id?: string;
    subject: string;
    votes_for: number;
    votes_against: number;
    votes_abstain: number;
    result?: VoteResult;
    created_at?: string;
}

export interface MeetingMinutes {
    id: string;
    meeting_id: string;
    content: string;
    version: number;
    status: MinutesStatus;
    generated_by: 'ai' | 'manual';
    pdf_url?: string;
    docx_url?: string;
    created_at?: string;
    approved_at?: string;
    approved_by?: string;
}

// Form types for creating/updating
export interface CreateMeetingInput {
    title: string;
    meeting_date: string;
    start_time?: string;
    end_time?: string;
    meeting_type?: MeetingType;
    location?: string;
}

export interface CreateTopicInput {
    meeting_id: string;
    order_num: number;
    title: string;
    description?: string;
}

export interface CreateDecisionInput {
    meeting_id: string;
    topic_id?: string;
    description: string;
    responsible_member_id?: string;
    deadline?: string;
}

export interface CreateVoteInput {
    meeting_id: string;
    topic_id?: string;
    subject: string;
    votes_for?: number;
    votes_against?: number;
    votes_abstain?: number;
}

// Display helpers
export const meetingTypeLabels: Record<MeetingType, string> = {
    ordinary: 'Assembleia Ordinária',
    extraordinary: 'Assembleia Extraordinária',
    board: 'Reunião de Diretoria',
};

export const meetingStatusLabels: Record<MeetingStatus, string> = {
    scheduled: 'Agendada',
    in_progress: 'Em Andamento',
    completed: 'Concluída',
    cancelled: 'Cancelada',
};

export const attendeeRoleLabels: Record<AttendeeRole, string> = {
    president: 'Presidente',
    secretary: 'Secretário(a)',
    treasurer: 'Tesoureiro(a)',
    participant: 'Participante',
    guest: 'Convidado',
};

export const topicStatusLabels: Record<TopicStatus, string> = {
    pending: 'Pendente',
    discussed: 'Discutido',
    skipped: 'Pulado',
};

export const voteResultLabels: Record<VoteResult, string> = {
    approved: 'Aprovado',
    rejected: 'Rejeitado',
    tied: 'Empatado',
};
