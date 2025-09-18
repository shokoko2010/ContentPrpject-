export interface Post {
    id: string;
    title: string;
    content: string;
    status: 'draft' | 'published' | 'needs-review' | 'approved';
    publishDate?: string;
    author?: string;
}

export interface Site {
    id: string;
    name: string;
    url: string;
}

export interface User {
    id: string;
    name: string;
    email: string;
    teamId: string;
}

export interface Team {
    id: string;
    name: string;
    members: string[];
}
