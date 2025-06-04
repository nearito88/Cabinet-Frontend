import { Component, OnInit, ViewChild, inject, AfterViewInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';

// ⭐ REMOVE MatDialog Imports ⭐
// import { MatDialog, MatDialogModule } from '@angular/material/dialog';

// ⭐ REMOVE InvoicePayComponent Import (not used directly in this component anymore) ⭐
// import { InvoicePayComponent } from '../invoice-pay/invoice-pay.component';

import { Invoice } from '../../../models/invoice'; // <--- Using your provided frontend Invoice interface
import { invoiceService } from '../../../services/invoice/invoice.service';


@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatSortModule,
    MatCardModule,
    MatPaginatorModule,
    MatInputModule,
    FormsModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    RouterModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatSelectModule,
    MatOptionModule,
    MatChipsModule,
    DatePipe,
    CurrencyPipe,
    // ⭐ REMOVE MatDialogModule from imports ⭐
    // MatDialogModule,
  ],
  templateUrl: './invoice-list.component.html',
  styleUrls: ['./invoice-list.component.css']
})
export class InvoiceListComponent implements OnInit, AfterViewInit {
  invoices: Invoice[] = [];
  errorMessage: string = '';
  isLoading = false;
  selectedStatus: string = '';
  displayedColumns: string[] = [
    'appointmentId',
    'patient',
    'invoiceDate',
    'paidAmount',
    'invoiceStatus',
    'paymentType',
    'actions'
  ];
  dataSource = new MatTableDataSource<Invoice>();

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  private invoiceService = inject(invoiceService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  // ⭐ REMOVE MatDialog Injection ⭐
  // private dialog = inject(MatDialog); // No longer needed as dialogs are removed

  constructor() {}

  ngOnInit() {
    this.loadInvoices();
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;

    this.dataSource.filterPredicate = (data: Invoice, filter: string) => {
      const searchStr = (
        (data.patientName || '') +
        data.appointmentId +
        data.invoiceDate +
        data.paidAmount +
        data.invoiceStatus +
        (data.paymentType || '')
      ).toLowerCase();
      return searchStr.includes(filter);
    };
  }

  loadInvoices() {
    this.isLoading = true;
    this.errorMessage = '';
    this.invoiceService.getAllInvoices().subscribe({
      next: (invoices: Invoice[]) => {
        console.log('DEBUG: Invoices loaded from backend:', invoices);
        this.invoices = invoices;
        this.dataSource.data = invoices;
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading invoices:', error);
        this.errorMessage = 'Failed to load invoices. Please try again.';
        this.isLoading = false;
        this.snackBar.open(this.errorMessage, 'Close', { duration: 5000 });
      }
    });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  filterByStatus(status: string): void {
    this.selectedStatus = status;
    if (status) {
      this.dataSource.data = this.invoices.filter(inv => inv.invoiceStatus === status);
    } else {
      this.dataSource.data = this.invoices;
    }
  }

  getStatusColor(status: Invoice['invoiceStatus']): string {
    switch (status) {
      case 'Pending':
        return 'accent';
      case 'Paid':
        return 'primary';
      case 'Partially Paid':
        return 'warn';
      case 'Cancelled':
        return 'warn';
      default:
        console.warn(`Unknown invoice status: ${status}. Defaulting to no color.`);
        return '';
    }
  }

  // ⭐ MODIFIED: processPayment now navigates to a new page ⭐
  processPayment(invoiceId: string | undefined): void {
    if (invoiceId) {
      // Navigate to the payment page, passing the invoiceId as a route parameter
      this.router.navigate(['/invoices', 'pay', invoiceId]);
    } else {
      this.snackBar.open('Invoice ID is missing to process payment.', 'Close', { duration: 3000 });
      console.warn('Attempted to navigate to payment page with no invoice ID.');
    }
  }

  deleteInvoice(invoiceId: string | undefined): void {
    if (confirm('Are you sure you want to delete this invoice?')) {
      if (invoiceId) {
        this.isLoading = true;
        this.errorMessage = '';
        this.invoiceService.deleteInvoice(invoiceId).subscribe({
          next: (response: string) => {
            this.snackBar.open(response, 'Close', { duration: 3000 });
            this.invoices = this.invoices.filter(inv => inv.invoiceId !== invoiceId);
            this.dataSource.data = this.invoices;
            this.isLoading = false;
          },
          error: (error: any) => {
            console.error('Error deleting invoice:', error);
            this.errorMessage = 'Failed to delete invoice: ' + (error.error || 'Unknown error');
            this.isLoading = false;
            this.snackBar.open(this.errorMessage, 'Close', { duration: 5000 });
          }
        });
      } else {
        this.snackBar.open('Invoice ID is missing for deletion!', 'Close', { duration: 3000 });
      }
    }
  }

  editInvoice(invoiceId: string | undefined): void {
    if (invoiceId) {
      this.router.navigate(['/invoices', invoiceId]);
    } else {
      this.snackBar.open('Invoice ID is missing for editing.', 'Close', { duration: 3000 });
    }
  }

  navigateToNewInvoiceForm(): void {
    this.router.navigate(['/addinvoice']);
  }
}