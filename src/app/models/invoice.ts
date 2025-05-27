import { InvoiceStatus } from './invoice-status.enum';

export interface Invoice {
    invoiceId: string;
    appointmentId: string;
    patientId: string;
    invoiceDate: string;
    datePaid: string;
    paidAmount: number;
    totalAmount: number;
    paymentType?: 'CASH' | 'CARD'; // Enums from backend
    invoiceStatus: InvoiceStatus;
    paymentStatus: string;

    patientName?: string;
    appointmentDate?: string;
}

export { InvoiceStatus };
