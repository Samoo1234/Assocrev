export interface Payment {
    month: string;
    value: string;
    date: string;
    status: 'Pago' | 'Pendente' | 'Atrasado';
}

export interface Doc {
    id: string;
    title: string;
    type: string;
    date: string;
    size: string;
    color: string;
    url: string;
    category: string;
}

export interface AppEvent {
    id: string;
    title: string;
    date: string;
    time: string;
    location: string;
    status: 'Confirmado' | 'Pendente' | 'Finalizado';
    imageUrl: string;
}
