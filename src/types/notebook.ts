
export interface ChecklistItem {
    id: string;
    label: string;
    completed: boolean;
}

export interface Note {
    id: string;
    title: string;
    items: ChecklistItem[];
    createdAt: string; // ISO string
}

export interface GroupMember {
    id: string;
    name: string;
    avatarUrl: string;
}

export interface GroupTask {
    id: string;
    label: string;
    completed: boolean;
    assignedTo: string[]; // Array of member IDs. Empty array means assigned to all.
}

export interface NotebookGroup {
    id: string;
    title: string;
    avatarUrl?: string; // Optional avatar for the group itself
    members: GroupMember[];
    tasks: GroupTask[];
}
