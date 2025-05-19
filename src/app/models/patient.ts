import { User } from "./user"; 

export interface Patient extends User {
  patientId: string;
  cin: string;
  disease?: string;
  documents?: string[];
  insurance?: string;
  status?: string;
  medicalHistory?: string[];
}