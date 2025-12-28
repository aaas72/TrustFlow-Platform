export interface Project {
  id: string | number;
  title: string;
  description: string;
  budget?: number;
  duration?: string;
  clientName?: string;
  location?: string;
  skills?: string[];
  postedAt?: Date;
  applicants?: number;
  status: string;
}