import { User } from "./user";

export interface Doctor extends User{
    doctorId?: string; // Optional because it might not exist when creating a new doctor
    specialization: string;
}
