import { Appointmentproduct } from "./appointmentproduct";

export interface InvoicePaymentUpdate {
    paidAmount?: number; // Matches backend's 'paidAmount' in InvoicePaymentUpdateDTO
    paymentType?: string; // Matches backend's 'PaymentType' enum as string
    usedProducts?: Appointmentproduct[]; // Matches backend's List<AppointmentProductDTO>
  }