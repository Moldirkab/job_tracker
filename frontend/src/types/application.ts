export type ApplicationStatus = "APPLIED" | "INTERVIEW" | "OFFER" | "REJECTED";

export interface Application {
  id: string;
  company: string;
  position: string;
  location: string;
  status: ApplicationStatus;
  job_url?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateApplicationInput {
  company: string;
  position: string;
  location: string;
  status: ApplicationStatus;
  job_url?: string;
  notes?: string;
}

export type UpdateApplicationInput = Partial<CreateApplicationInput>;

export interface User {
  id: string;
  email: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}