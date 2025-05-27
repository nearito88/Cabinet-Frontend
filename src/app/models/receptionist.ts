import { User } from "./user";

export interface Receptionist extends User {
    receptionistId?: string; // Optional: Backend generates this, or it's not present when creating.
}
