
export interface AppDefinition {
    id: string;
    title: string;
    description: string;
    href: string;
    icon: string;
    isPopular: boolean;
    isNew: boolean;
    order: number;
}

export interface CarouselItem {
    id: string;
    title: string;
    description: string;
    href: string;
    icon: string;
    status: 'draft' | 'published';
}
