import { CabinetService } from "./cabinet-service";
import { Invoice } from "./invoice";
import { Service } from "./service";

export interface Appointment {
    appointmentId?: string; // Matches backend's AppointmentId
    patientId: string | null;   // <--- CHANGE THIS TO string | null
    serviceId?: string | null;   // <--- CHANGE THIS TO string | null
    doctorId : string | null; 
    dateAppointment: Date | string; // <--- Allow both Date object and string
    startTime: string;     // Matches backend's StartTime (new naming)
    endTime: string;       // Matches backend's EndTime (new)
    appointmentStatus: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'PENDING';
    paymentStatus: 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED';
    description: string;   // Matches backend's Description (new naming, replaces 'reason')
    totalAmount: number;   // Matches backend's TotalAmount (new)
    paidAmount?: number;    // Matches backend's PaidAmount (new)
    isRelated: boolean;    // Matches backend's isRelated (new) 
    invoiceId?: string; // This will hold the invoiceId from the backend

    isCustomPrice: boolean;
    services: CabinetService[] ;
    invoices?: Invoice[];


    // These are typically derived or fetched separately on the frontend,
    // but if your backend DTO includes them, keep them.
    // For now, let's keep them as optional for easier display,
    // assuming your backend might provide them in a DTO for the list view.
    patientName?: string;
    doctorName?: string;
    serviceName?: string;
  
    partialAppointments?: Appointment[]; // Matches backend's PartialAppointments
  }