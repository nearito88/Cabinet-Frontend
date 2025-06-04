import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DatePipe, CurrencyPipe } from '@angular/common';

import { appointmentService } from '../../../services/appointment/appointment.service';
import { Invoice } from '../../../models/invoice';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-appointment-invoice-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTableModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    DatePipe,
    CurrencyPipe,
    MatIconModule,
    MatTooltipModule
  ],
  templateUrl: './appointment-invoice-list.component.html',
  styleUrls: ['./appointment-invoice-list.component.css']
})
export class AppointmentInvoiceListComponent implements OnInit {
  appointmentId: string = '';
  invoices: Invoice[] = [];
  isLoading = true;
  errorMessage = '';

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private appointmentService = inject(appointmentService);

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('appointmentId');
      if (id) {
        this.appointmentId = id;
        this.fetchInvoices();
      } else {
        this.errorMessage = 'Appointment ID is missing.';
        this.isLoading = false;
      }
    });
  }

  fetchInvoices(): void {
    this.isLoading = true;
    this.appointmentService.getInvoicesByAppointmentId(this.appointmentId).subscribe({
      next: (invoices) => {
        // Debug: log raw invoices
        console.log('Invoices fetched from backend:', invoices);
  
        // Ici on vérifie si patientName est null, on remplace par "N/A" ou une valeur par défaut
        this.invoices = invoices.map(inv => ({
          ...inv,
          patientName: inv.patientName ?? 'N/A'
        }));
  
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load invoices.';
        this.snackBar.open(this.errorMessage, 'Close', { duration: 4000 });
        this.isLoading = false;
      }
    });
  }

  getProductsAsString(invoice: Invoice): string {
    if (!invoice.usedProducts || invoice.usedProducts.length === 0) {
      return 'No products'; // Still return plain text for no products
    }

    // Limit to 2 products as before, but generate <li> tags
    const productListItems = invoice.usedProducts.slice(0, 2)
      .map(p => `<li>${p.productName} (${p.quantity})</li>`)
      .join(''); // Join without a comma

    let htmlString = `<ul>${productListItems}</ul>`;

    // If there are more than 2 products, add an ellipsis item
    if (invoice.usedProducts.length > 2) {
      htmlString += `<li>...</li>`; // Add an ellipsis as a separate list item
    }

    return htmlString;
  }

  editInvoice(invoiceId: string): void {
    console.log('Editing invoice:', invoiceId);
    // ⭐ IMPORTANT: You will need to define a route like '/invoices/edit/:invoiceId' in your app-routing.module.ts
    // and create an InvoiceEditComponent (or modify an existing one) to handle the editing.
    this.router.navigate(['/invoices', invoiceId]); 
  }
  

  downloadInvoicePdf(invoice: Invoice): void {
    const doc = new jsPDF();
  
    doc.setFontSize(16);
    doc.text('Invoice Details', 14, 20);
  
    autoTable(doc, {
      startY: 30,
      body: [
        ['Invoice ID', invoice.invoiceId],
        ['Appointment ID', invoice.appointmentId],
        ['Patient Name', invoice.patientName],
        ['Invoice Date', invoice.invoiceDate],
        ['Paid Amount', `${invoice.paidAmount} MAD`],
        ['Payment Type', invoice.paymentType ?? '—'],
        ['Status', invoice.invoiceStatus],
      ]
    });
  
    doc.save(`invoice-${invoice.invoiceId}.pdf`);
  }
}
