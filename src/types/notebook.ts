

export interface ChecklistItem {
    id: string | number; // Local can be string, server is number
    uuid: string;
    label: string;
    completed: boolean;
    noteId?: number;
}

export interface Note {
    id: string | number; // Local can be string, server is number
    uuid: string;
    title: string;
    items: ChecklistItem[];
    createdAt: string; // ISO string
    userId?: number;
}

export interface GroupMember {
    id: string; // user id
    name: string;
    avatarUrl: string;
}

export interface GroupTask {
    id: string | number;
    uuid: string;
    label: string;
    completed: boolean;
    assignedTo: string[]; // Array of member IDs. Empty array means assigned to all.
    createdBy: number;
}

export interface NotebookGroup {
    id: string | number;
    uuid: string;
    title: string;
    description: string;
    avatarUrl?: string; // Optional avatar for the group itself
    members: GroupMember[];
    tasks: GroupTask[];
    createdBy: number;
    createdAt: string;
}
