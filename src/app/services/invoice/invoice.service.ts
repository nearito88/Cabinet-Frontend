import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Invoice, InvoiceStatus } from '../../models/invoice';

@Injectable({
  providedIn: 'root'
})

export class invoiceService {
  private apiUrl = 'https://cabinet-backend-93017aca48c8.herokuapp.com/api/invoices'; // Base URL for Service API
  private http = inject(HttpClient);

  getAllInvoices(): Observable<Invoice[]> {
    return this.http.get<Invoice[]>(this.apiUrl);
  }

  getInvoiceById(invoiceId: string): Observable<Invoice> {
    return this.http.get<Invoice>(`${this.apiUrl}/${invoiceId}`);
  }

  addInvoice(invoice: Invoice): Observable<string> {
    return this.http.post<string>(this.apiUrl, invoice, { responseType: 'text' as 'json' });
  }

  updateInvoice(invoiceId: string, invoiceData: Invoice): Observable<string> {
    return this.http.put<string>(`${this.apiUrl}/${invoiceId}`, invoiceData, { responseType: 'text' as 'json' });
  }

  deleteInvoice(invoiceId: string): Observable<string> {
    return this.http.delete<string>(`${this.apiUrl}/${invoiceId}`, { responseType: 'text' as 'json' });
  }

  getInvoicesByPatientId(patientId: string): Observable<Invoice[]> {
    return this.http.get<Invoice[]>(`${this.apiUrl}/patient/${patientId}`);
  }

  processPayment(invoiceId: string, paymentAmount: number, paymentType: string): Observable<Invoice> {
    const payload = { paymentAmount, paymentType };
    return this.http.put<Invoice>(`${this.apiUrl}/${invoiceId}/pay`, payload);
  }

}