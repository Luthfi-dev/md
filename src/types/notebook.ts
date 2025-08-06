

export interface ChecklistItem {
    id: number; // Server ID
    uuid: string; // Client ID
    label: string;
    completed: boolean;
    noteId?: number;
}

export interface Note {
    id?: number; // Server ID can be optional for new local notes
    uuid: string; // Client ID is mandatory
    title: string;
    items: ChecklistItem[];
    createdAt: string; // ISO string
    lastModified: string; // ISO string
    userId?: number;
    isSynced: boolean; 
}

export interface GroupMember {
    id: number;
    name: string;
    avatarUrl: string | null;
}

export interface GroupChecklistItem {
    id: number; // Server ID
    label: string;
    completed: boolean;
}

export interface GroupTask {
    id: number; // Server ID
    uuid: string; // Client ID
    label: string;
    completed: boolean;
    assignedTo: number[]; // Array of member IDs. Empty array means assigned to all.
    createdBy: number;
    items: GroupChecklistItem[];
}

export interface NotebookGroup {
    id: number;
    uuid: string;
    title: string;
    description: string;
    avatarUrl?: string | null; // Optional avatar for the group itself
    members: GroupMember[];
    tasks: GroupTask[];
    activeTaskCount: number; // For list view
    createdBy: number;
    createdAt: string;
}
