export type ApplicationStatus = "APPLIED" | "INTERVIEW" | "OFFER" | "REJECTED";

export interface Application {
  id: number;
  company: string;
  position: string;
  location: string;
  status: ApplicationStatus;
  job_url?: string | null;
  notes?: string | null;
  salary?: string | null;
  skills?: string[] | null;
  created_at: string;
}

export interface CreateApplicationInput {
  company: string;
  position: string;
  location: string;
  status: ApplicationStatus;
  job_url?: string;
  notes?: string;
  salary?: string;
  skills?: string[];
}

export type UpdateApplicationInput = Partial<CreateApplicationInput>;

export interface User {
  id: number;
  email: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}