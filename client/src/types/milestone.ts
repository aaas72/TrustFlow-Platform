// Types for Milestones service (API DTOs)

export type MilestoneItem = {
    id: number;
    project_id: number;
    title: string;
    description?: string | null;
    amount: number;
    status?:
    | 'pending'
    | 'funded'
    | 'in_progress'
    | 'submitted'
    | 'approved'
    | 'revision_requested'
    | string;
    deadline?: string | null;
    attachments?: { id: number; file_name: string; file_path?: string | null; file_type?: string | null; url?: string | null }[];
    review_notes?: string | null;
};

export type GetProjectMilestonesResponse = {
    success: boolean;
    milestones: MilestoneItem[];
    message?: string;
};

export type CreateMilestonePayload = {
    project_id: number;
    title: string;
    amount: number;
    description?: string;
    deadline?: string;
};

export type CreateMilestoneResponse = {
    success: boolean;
    message: string;
    milestone_id?: number;
    milestone?: MilestoneItem; // bazı uç noktalar tüm nesneyi döndürüyor
};

export type UpdateMilestoneStatusResponse = {
    success: boolean;
    message: string;
};

export type ApprovePlanResponse = {
    success: boolean;
    message: string;
    started_milestone?: MilestoneItem | null;
};


