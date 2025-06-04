import { Appointmentproduct } from './appointmentproduct';
import { InvoiceStatus } from './invoice-status.enum';

export interface Invoice {
    invoiceId: string;
    appointmentId: string;
    patientId: string;
    invoiceDate: string;
    paidAmount: number;
    paymentType?: 'CASH' | 'CARD'; // Enums from backend
    invoiceStatus: InvoiceStatus;
    paymentStatus: string;

    patientName: string;
    appointmentDate: string;

    usedProducts?: Appointmentproduct[]; // Liste des produits utilisés dans la facture

}

export { InvoiceStatus };
