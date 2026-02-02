// User types for authentication
export interface User {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: 'admin' | 'secretary' | 'member';
    profile_image?: string;
    status: string;
    name: string; // computed: first_name + last_name
    avatar: string; // alias for profile_image
    membership: string; // display role
}

// Member types for the members table
export interface Member {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    cpf?: string;
    birth_date?: string;
    address?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    membership_number?: string;
    membership_date: string;
    status: 'active' | 'inactive' | 'pending';
    membership_type: 'regular' | 'gold' | 'silver';
    monthly_contribution?: number;
    notes?: string;
    person_type: 'PF' | 'PJ';
    cnpj?: string;
    company_name?: string;
    trade_name?: string;
    is_board_member?: boolean;
    board_position?: string;
    created_at?: string;
    updated_at?: string;
    // Computed
    name?: string;
    initials?: string;
    category?: 'OURO' | 'PRATA' | 'PADRÃO';
    joinedDate?: string;
}

// Helper to convert DB member to display format
export function formatMember(member: Member): Member {
    const name = `${member.first_name} ${member.last_name}`;
    const initials = `${member.first_name[0]}${member.last_name[0]}`.toUpperCase();
    const category = member.membership_type === 'gold' ? 'OURO' :
        member.membership_type === 'silver' ? 'PRATA' : 'PADRÃO';
    const statusMap = { active: 'Ativo', inactive: 'Inativo', pending: 'Pendente' };

    return {
        ...member,
        name,
        initials,
        category,
        joinedDate: member.membership_date ? new Date(member.membership_date).toLocaleDateString('pt-BR') : '',
        status: statusMap[member.status] as any,
    };
}
