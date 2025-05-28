// src/app/appointment-list/appointment-list.component.ts
import { Component, OnInit, ViewChild, inject, AfterViewInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { CommonModule, DatePipe, CurrencyPipe, TitleCasePipe } from '@angular/common';
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

import { Appointment } from '../../../models/appointment';
import { appointmentService } from '../../../services/appointment/appointment.service';

// ⭐ REMOVE Invoice and InvoicePayComponent Imports ⭐
// import { Invoice } from '../../../models/invoice';
// import { InvoicePayComponent } from '../../invoice/invoice-pay/invoice-pay.component';


@Component({
  selector: 'app-appointment-list',
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
    TitleCasePipe,
    // ⭐ REMOVE MatDialogModule from imports ⭐
    // MatDialogModule,
    // ⭐ REMOVE InvoicePayComponent from imports ⭐
    // InvoicePayComponent
  ],
  templateUrl: './appointment-list.component.html',
  styleUrls: ['./appointment-list.component.css']
})
export class AppointmentListComponent implements OnInit, AfterViewInit {
  appointments: Appointment[] = [];
  errorMessage: string = '';
  isLoading = false;
  selectedStatus: string = '';
  selectedAppointment: Appointment | null = null;
  displayedColumns: string[] = [
    'patientName',
    'doctorName',
    'serviceName',
    'dateAppointment',
    'startTime',
    'endTime',
    'appointmentStatus',
    'paymentStatus',
    'totalAmount',
    'description',
    'actions'
  ];
  dataSource = new MatTableDataSource<Appointment>();

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  private appointmentService = inject(appointmentService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  // ⭐ REMOVE MatDialog Injection ⭐
  // private dialog = inject(MatDialog);

  constructor() {}

  ngOnInit() {
    this.loadAppointments();
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;

    this.dataSource.filterPredicate = (data: Appointment, filter: string) => {
      const searchStr = (
        (data.patientId || '') +
        (data.patientName || '') +
        (data.doctorName || '') +
        (data.dateAppointment ? data.dateAppointment.toString() : '') +
        (data.startTime || '') +
        (data.endTime || '') +
        (data.appointmentStatus || '') +
        (data.paymentStatus || '') +
        (data.totalAmount ? data.totalAmount.toString() : '') +
        (data.description || '')
      ).toLowerCase();
      return searchStr.includes(filter);
    };
  }

  loadAppointments() {
    this.isLoading = true;
    this.errorMessage = '';
    this.appointmentService.getAllappointments().subscribe({
      next: (appointments: Appointment[]) => {
        console.log('DEBUG: Appointments loaded from backend:', appointments);
        this.appointments = appointments;
        this.dataSource.data = appointments;
        this.isLoading = false;

        this.appointments.forEach(appointment => {
          console.log(`DEBUG: Appointment ID: ${appointment.appointmentId}, Status: ${appointment.appointmentStatus}, Payment: ${appointment.paymentStatus}`);
        });
      },
      error: (error: any) => {
        console.error('Error loading appointments:', error);
        this.errorMessage = 'Failed to load appointments. Please try again.';
        this.isLoading = false;
        this.snackBar.open(this.errorMessage, 'Close', { duration: 5000 });
      }
    });
  }

  editAppointment(appointmentId: string | undefined): void {
    console.log('DEBUG: editAppointment called with ID:', appointmentId);
    if (appointmentId) {
      this.router.navigate(['/appointments', appointmentId]);
    } else {
      this.snackBar.open('Appointment ID is missing for editing.', 'Close', { duration: 3000 });
      console.warn('Attempted to edit an appointment with no ID.');
    }
  }

  deleteAppointment(appointmentId: string | undefined): void {
    if (confirm('Are you sure you want to delete this appointment?')) {
      if (appointmentId) {
        this.isLoading = true;
        this.errorMessage = '';
        this.appointmentService.deleteappointment(appointmentId).subscribe({
          next: () => {
            this.snackBar.open('Appointment deleted successfully!', 'Close', { duration: 3000 });
            this.appointments = this.appointments.filter(a => a.appointmentId !== appointmentId);
            this.dataSource.data = this.appointments;
            this.isLoading = false;
          },
          error: (error: any) => {
            console.error('Error deleting appointment:', error);
            this.errorMessage = 'Failed to delete appointment: ' + (error.message || 'Unknown error');
            this.isLoading = false;
            this.snackBar.open(this.errorMessage, 'Close', { duration: 5000 });
          }
        });
      } else {
        this.snackBar.open('Appointment ID is missing for deletion!', 'Close', { duration: 3000 });
      }
    }
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  filterByStatus(status: string): void {
    this.selectedStatus = status;
    if (status) {
      this.dataSource.data = this.appointments.filter(app => app.appointmentStatus === status);
    } else {
      this.dataSource.data = this.appointments;
    }
  }

  getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'accent';
      case 'scheduled':
        return 'primary';
      case 'completed':
        return 'primary';
      case 'cancelled':
        return 'warn';
      default:
        return '';
    }
  }

  getPaymentStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'accent';
      case 'partially_paid':
        return 'warn';
      case 'paid':
        return 'primary';
      case 'unpaid':
        return 'accent';
      case 'partial':
        return 'warn';
      case 'cancelled':
        return 'warn';
      default:
        return '';
    }
  }

  viewDetails(appointment: Appointment): void {
    this.selectedAppointment = appointment;
  }

  cancelAppointment(appointmentId: string): void {
    if (confirm('Are you sure you want to cancel this appointment?')) {
        this.appointmentService.deleteappointment(appointmentId).subscribe({
            next: () => {
                this.snackBar.open('Appointment cancelled successfully', 'Close', {
                    duration: 3000,
                    panelClass: ['success-snackbar']
                });
                this.loadAppointments();
            },
            error: (error: any) => {
                this.snackBar.open('Failed to cancel appointment', 'Close', {
                    duration: 3000,
                    panelClass: ['error-snackbar']
                });
                console.error('Error cancelling appointment:', error);
            }
        });
    }
  }

  viewAppointmentDetails(appointmentId: string | undefined): void {
    if (appointmentId) {
      this.router.navigate(['/appointments', appointmentId]);
    } else {
      this.snackBar.open('Appointment ID is missing for viewing details!', 'Close', { duration: 3000 });
    }
  }

  navigateToAppointmentForm(): void {
    this.router.navigate(['/addappointment']);
  }

  // ⭐⭐⭐ MODIFIED METHOD TO NAVIGATE TO PAYMENT PAGE ⭐⭐⭐
  navigateToPaymentPage(invoiceId: string | undefined): void {
    if (invoiceId) {
      this.router.navigate(['/invoices',invoiceId,'pay']); // Navigate to payment page
    } else {
      this.snackBar.open('Invoice ID is missing for payment.', 'Close', { duration: 3000 });
      console.warn('Attempted to navigate to payment page with no invoice ID.');
    }
  }
}