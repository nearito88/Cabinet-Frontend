import { Component, OnInit, ChangeDetectorRef, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';

// Angular Material Modules (make sure these are imported for standalone)
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { NgClass } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'; // Already in imports, but good to ensure

// Chart.js
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, registerables } from 'chart.js';
import 'chartjs-plugin-datalabels'; // If you're using this plugin, ensure it's compatible or registered
Chart.register(...registerables);

// ⭐ Your Backend-Aligned Interfaces (Models) ⭐
// Adjust paths to where these models are defined in your frontend project
import { Patient as BackendPatient } from '../models/patient'; // Renamed to avoid conflict with mock Patient
import { Doctor as BackendDoctor } from '../models/doctor'; // Renamed to avoid conflict with mock Doctor
import { Appointment as BackendAppointment } from '../models/appointment'; // Your updated Appointment interface
import { Invoice as BackendInvoice } from '../models/invoice'; // Your Invoice interface
import { Product as BackendProduct } from '../models/product'; // Your Product interface (for inventory)

// ⭐ Your Services ⭐
import { PatientService } from '../services/patients/patient.service';
import { appointmentService } from '../services/appointment/appointment.service';
import { DoctorService } from '../services/doctor/doctor.service';
import { invoiceService } from '../services/invoice/invoice.service'; // For invoice chart
import { ProductService } from '../services/inventory/product.service'; // For inventory alerts

// RxJS for data fetching
import { forkJoin, Subject, of } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';


// ⭐ Dashboard-Specific Interfaces (Updated to reflect actual data) ⭐
interface DashboardCard { // This interface is good for your template
  title: string;
  value: number | string;
  icon: string;
  color: string;
  textColor: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

// Updated from your original 'Appointment' interface to reflect BackendAppointment
interface DashboardAppointmentDisplay {
  id: string; // From appointmentId
  patientName: string; // From BackendAppointment.patientName
  date: Date; // Converted from BackendAppointment.dateAppointment (string)
  time: string; // BackendAppointment.startTime
  status: string; // BackendAppointment.appointmentStatus (e.g., 'PENDING', 'SCHEDULED')
  doctorName: string; // BackendAppointment.doctorName
  description: string; // BackendAppointment.description
  // ⭐ NEW: List of services for display ⭐
  services: { serviceName?: string; price?: number }[]; // Simplified for display
}

// Updated from your original 'Patient' interface to reflect BackendPatient
interface DashboardPatientDisplay {
  id: string; // patientId
  name: string; // patientName
  lastVisit: Date; // Needs to be mapped from BackendPatient.lastVisit (if exists)
  status: string; // patient.status (e.g., 'active')
  avatar: string; // Derived from name
  color: string; // Derived
}

// Updated Inventory Alert Interface to reflect BackendProduct
interface InventoryAlert {
  id: string; // productId
  itemName: string; // productName
  description: string; // derived based on low stock
  quantity: number; // product.quantity
  type: 'warning' | 'critical' | 'info'; // derived
  icon: string; // derived
}


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule, MatSnackBarModule ,MatButtonModule, MatIconModule, MatListModule, MatChipsModule, MatMenuModule, MatDividerModule, MatTabsModule, MatProgressBarModule, MatProgressSpinnerModule, // Added MatProgressSpinnerModule
    NgClass,
    BaseChartDirective
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  // ⭐ Dynamic Data Properties for Cards ⭐
  totalPatientsCount: number = 0;
  todayAppointmentsCount: number = 0;
  availableDoctorsCount: number = 0;
  monthlyRevenueAmount: number = 0; // Renamed to avoid confusion with DashboardCard 'value'

  // ⭐ Dynamic Data for Lists/Alerts ⭐
  todayAppointmentsList: DashboardAppointmentDisplay[] = [];
  recentPatientsList: DashboardPatientDisplay[] = []; // You'll need to fetch recent patients
  inventoryAlertsList: InventoryAlert[] = []; // Populated from ProductService

  // Chart reference
  @ViewChild(BaseChartDirective) chart: BaseChartDirective | undefined;

  // Invoice Status Chart Data (will be updated dynamically)
  public pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'right',
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.label || '';
            const value = context.raw as number;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  } as any;

  public pieChartData: ChartData<'pie', number[], string> = {
    labels: ['Paid', 'Unpaid', 'Overdue', 'Partially Paid'],
    datasets: [{
      data: [0, 0, 0, 0], // ⭐ Initialized to zero, will be populated dynamically ⭐
      backgroundColor: [
        '#4caf50', // Green for Paid
        '#f44336', // Red for Unpaid
        '#ff9800', // Orange for Overdue
        '#2196f3'  // Blue for Partially Paid
      ],
      hoverBackgroundColor: [
        '#388e3c', // Darker Green
        '#d32f2f', // Darker Red
        '#f57c00', // Darker Orange
        '#1976d2'  // Darker Blue
      ]
    }]
  };

  public pieChartType: ChartType = 'pie';

  isLoadingDashboard: boolean = true;
  dashboardErrorMessage: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private cdr: ChangeDetectorRef, // Used for manual change detection if needed for charts
    private patientService: PatientService,
    private appointmentService: appointmentService,
    private doctorService: DoctorService,
    private invoiceService: invoiceService,
    private productService: ProductService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.fetchDashboardData();
  }
  quickActions = [
    { icon: 'add', label: 'New Appointment', route: '/addappointment' },
    { icon: 'person_add', label: 'Add Patient', route: '/addpatient' },
    { icon: 'product_add', label: 'Add Product', route: '/addproduct' },
    { icon: 'add', label: 'New Prescription', route: '/addservice' }
  ];

  isChartDataEmptyOrAllZeros(data: number[] | undefined): boolean {
    if (!data || data.length === 0) {
      return true; // Consider empty data as "no data"
    }
    // Check if every value is exactly zero
    return data.every(val => val === 0);
  }

  fetchDashboardData(): void {
    this.isLoadingDashboard = true;
    this.dashboardErrorMessage = null;

    const today = new Date();
    const todayFormatted = today.toISOString().split('T')[0];
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    console.log('DEBUG DASHBOARD: Frontend\'s "Today" date for filtering:', todayFormatted);


    forkJoin({
      patients: this.patientService.getAllPatients().pipe(
        catchError(error => { console.error('Error fetching patients:', error); return of(null); })
      ),
      doctors: this.doctorService.getAllDoctors().pipe(
        catchError(error => { console.error('Error fetching doctors:', error); return of(null); })
      ),
      appointments: this.appointmentService.getAllappointments().pipe(
        catchError(error => { console.error('Error fetching appointments:', error); return of(null); })
      ),
      invoices: this.invoiceService.getAllInvoices().pipe( // Fetch all invoices for the chart
        catchError(error => { console.error('Error fetching invoices:', error); return of(null); })
      ),
      products: this.productService.getAllProducts().pipe( // Fetch all products for inventory alerts
        catchError(error => { console.error('Error fetching products:', error); return of(null); })
      )
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: ({ patients, doctors, appointments, invoices, products }) => {
        // --- 1. Top-Row Cards Data ---
        if (patients) {
          this.totalPatientsCount = patients.length;
          // You could add logic for '+12%' trend here if you have historical data
        } else { this.dashboardErrorMessage = 'Failed to load patient data.'; }

        if (doctors) {
          this.availableDoctorsCount = doctors.filter(doc => !doc.onLeave).length; // Assuming 'onLeave' boolean
          // You could add logic for '2 on leave' trend here if you have dynamic leave data
        } else { if (!this.dashboardErrorMessage) this.dashboardErrorMessage = 'Failed to load doctor data.'; }

        if (appointments) {
          // Filter for Today's Appointments Count
          this.todayAppointmentsCount = appointments.filter(app =>
            app.dateAppointment === todayFormatted && app.appointmentStatus !== 'CANCELLED'
          ).length;

          // Populate Today's Appointments List
          this.todayAppointmentsList = appointments
            .filter(app => app.dateAppointment === todayFormatted && app.appointmentStatus !== 'CANCELLED')
            .map(app => ({
              id: app.appointmentId || '',
              patientName: app.patientName || 'N/A',
              date: app.dateAppointment ? new Date(app.dateAppointment) : new Date(), // Convert string to Date
              time: app.startTime || 'N/A',
              status: app.appointmentStatus || 'PENDING', // Use the string directly from backend
              doctorName: app.doctorName || 'N/A',
              description: app.description || '', // Added description
              services: app.services || [] // Pass the list of services for display
            }))
            .sort((a, b) => a.time.localeCompare(b.time)); // Sort by time

          // Calculate Monthly Revenue
          this.monthlyRevenueAmount = appointments
            .filter(app => {
              if (app.dateAppointment) {
                const appDate = new Date(app.dateAppointment);
                // Define what constitutes 'revenue' (e.g., completed or paid appointments within the month)
                return appDate.getMonth() + 1 === currentMonth && appDate.getFullYear() === currentYear &&
                       (app.paymentStatus === 'PAID' || app.paymentStatus === 'PARTIALLY_PAID' || app.appointmentStatus === 'COMPLETED');
              }
              return false;
            })
            .reduce((sum, app) => sum + (app.totalAmount || 0), 0); // Sum totalAmount
        } else { if (!this.dashboardErrorMessage) this.dashboardErrorMessage = 'Failed to load appointment data.'; }

        // --- 2. Invoice Status Chart ---
        if (invoices) {
          const paidCount = invoices.filter(inv => inv.invoiceStatus === 'Paid').length;
          const unpaidCount = invoices.filter(inv => inv.invoiceStatus === 'Pending').length;
          const partiallyPaidCount = invoices.filter(inv => inv.invoiceStatus === 'Partially Paid').length;
          // You might need an 'Overdue' status in your InvoiceStatus enum or derive it based on date
          const overdueCount = invoices.filter(inv => inv.invoiceStatus === 'Cancelled').length; // Assuming 'OVERDUE' exists

          this.pieChartData.datasets[0].data = [paidCount, unpaidCount, overdueCount, partiallyPaidCount];
          this.chart?.update(); // Update the chart
          this.cdr.detectChanges(); // Manually trigger change detection for chart
        } else { if (!this.dashboardErrorMessage) this.dashboardErrorMessage = 'Failed to load invoice data.'; }


        // --- 3. Inventory Alerts ---
        if (products) {
          this.inventoryAlertsList = products
            // ⭐ MODIFIED FILTER: Use p.minimum for filtering ⭐
            .filter(p => p.quantity !== undefined && p.minimum !== undefined && p.quantity <= p.minimum)
            .map(p => {
              let type: 'warning' | 'critical' | 'info' = 'info';
              let icon: string = 'info';
              let description: string = 'Stock needs review';

              // ⭐ Use p.minimum in alert logic ⭐
              let alertThreshold = p.minimum || 0; // Ensure a default if minimum is null/undefined

              if (p.quantity !== undefined && p.quantity <= alertThreshold) {
                  // Out of stock is always critical
                  if (p.quantity === 0) {
                      type = 'critical';
                      icon = 'error';
                      description = `Out of Stock. Minimum: ${alertThreshold}.`;
                  }
                  // Critical if quantity is at or below 50% of the defined minimum
                  else if (p.quantity <= alertThreshold / 2) {
                      type = 'critical';
                      icon = 'error';
                      description = `Critical stock level. Minimum: ${alertThreshold}.`;
                  }
                  // Warning if quantity is below minimum but above critical threshold
                  else {
                      type = 'warning';
                      icon = 'warning';
                      description = `Low stock alert. Minimum: ${alertThreshold}.`;
                  }
              }

              return {
                id: p.productId || '',
                itemName: p.productName || 'Unknown Product',
                description: description,
                quantity: p.quantity || 0,
                type: type,
                icon: icon,
                minimum: alertThreshold // ⭐ Pass 'minimum' to the alert object for display ⭐
              };
            });
        } else {
            if (!this.dashboardErrorMessage) this.dashboardErrorMessage = 'Failed to load product data for inventory.';
        }


        // Final loading state update
        this.isLoadingDashboard = false;
        if (this.dashboardErrorMessage) {
          this.snackBar.open(this.dashboardErrorMessage, 'Dismiss', { duration: 5000, panelClass: ['snackbar-error'] });
        }
      },
      error: (err) => { // This catchError is for forkJoin itself if any observable errors and isn't caught individually
        console.error('Error fetching all dashboard data:', err);
        this.dashboardErrorMessage = 'Failed to load dashboard data. Please try again.';
        this.isLoadingDashboard = false;
        this.snackBar.open('Dashboard data failed to load!', 'Dismiss', { duration: 5000, panelClass: ['snackbar-error'] });
      }
    });
  }

  getServicesForDashboard(appt: DashboardAppointmentDisplay): string {
    if (!appt.services || appt.services.length === 0) {
      return 'No services';
    }
  
    // Display up to 2 services, similar to invoice products
    const servicesHtml = appt.services.slice(0, 2)
      .map(s => {
        const priceDisplay = s.price !== undefined && s.price !== null ? `(${s.price.toFixed(2)} ${'MAD'})` : '';
        return `<li>${s.serviceName || 'Unnamed Service'} ${priceDisplay}</li>`;
      })
      .join('');
  
    let fullHtml = `<ul class="dashboard-service-list">${servicesHtml}</ul>`;
  
    if (appt.services.length > 2) {
      fullHtml += `<span class="dashboard-service-more-info"> (+${appt.services.length - 2} more)</span>`;
    }
  
    return fullHtml;
  }

  // Helper method to get relative time for recent appointments (unchanged)
  getRelativeTime(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    const minute = 60; const hour = minute * 60; const day = hour * 24; const month = day * 30; const year = day * 365;

    if (diffInSeconds < minute) { return 'Just now'; }
    else if (diffInSeconds < hour) { const minutes = Math.floor(diffInSeconds / minute); return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`; }
    else if (diffInSeconds < day) { const hours = Math.floor(diffInSeconds / hour); return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`; }
    else if (diffInSeconds < month) { const days = Math.floor(diffInSeconds / day); return `${days} ${days === 1 ? 'day' : 'days'} ago`; }
    else if (diffInSeconds < year) { const months = Math.floor(diffInSeconds / month); return `${months} ${months === 1 ? 'month' : 'months'} ago`; }
    else { const years = Math.floor(diffInSeconds / year); return `${years} ${years === 1 ? 'year' : 'years'} ago`; }
  }

  // Get status color for appointments (unchanged)
  getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'scheduled': return '#2196f3';
      case 'confirmed': return '#4caf50';
      case 'completed': return '#9e9e9e';
      case 'cancelled': return '#f44336';
      case 'pending': return '#ffc107'; // Added PENDING color
      default: return '#9e9e9e';
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}