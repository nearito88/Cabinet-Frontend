import { Component, OnInit, ViewChild, inject, AfterViewInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router'; // Keep RouterModule for template links
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms'; // For ngModel in filter
import { CommonModule } from '@angular/common'; // For *ngIf, *ngFor
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'; // For loading indicator
import { MatSnackBar } from '@angular/material/snack-bar'; // For user feedback messages
import { MatTooltipModule } from '@angular/material/tooltip'; // For tooltips on action buttons

// Import your CabinetService model and ServiceService
import { Service } from '../../../models/service';
import { ServiceService } from '../../../services/medical-service/service.service';

@Component({
  selector: 'app-service-list', // Changed selector
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatInputModule,
    FormsModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    RouterModule, // Allows using routerLink in template if needed
    MatProgressSpinnerModule, // Add for loading spinner
    MatTooltipModule // Add for tooltips
    // MatSnackBarModule is not needed here as it's provided via MatSnackBar directly
  ],
  templateUrl: './service-list.component.html', // Changed template URL
  styleUrls: ['./service-list.component.css'] // Changed style URL
})
export class CabinetServiceListComponent implements OnInit, AfterViewInit { // Changed class name
  services: Service[] = []; // Changed patient to service
  errorMessage: string = ''; // Changed error to errorMessage for clarity
  isLoading = false; // Changed loading to isLoading
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  filterValue: string = ''; // Add this property


  // Define displayed columns for the MatTable
  // Adapt these to your CabinetService properties
  displayedColumns: string[] = ['serviceName', 'description', 'price', 'actions'];
  dataSource = new MatTableDataSource<Service>(); // Changed Patient to CabinetService

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  // Using inject for services as per your preferred pattern
  private serviceService = inject(ServiceService); // Changed patientService to serviceService
  private router = inject(Router);
  private snackBar = inject(MatSnackBar); // Inject MatSnackBar for messages

  constructor() {
    // dataSource data will be set in loadServices
  }

  ngOnInit() {
    this.loadServices();
  }

  ngAfterViewInit() {
    // Apply sort and paginator after view is initialized and data is loaded
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;

    // Optional: Custom filter predicate if you want to search across multiple columns
    this.dataSource.filterPredicate = (data: Service, filter: string) => {
      const dataStr = JSON.stringify(data).toLowerCase(); // Search in all data fields
      return dataStr.indexOf(filter) !== -1;
    };
  }

  loadServices() {
    this.isLoading = true;
    this.errorMessage = '';
    this.serviceService.getAllServices().subscribe({
      next: (services: Service[]) => {
        // --- DEBUG LOG 1: Log the raw services array received from the backend ---
        console.log('DEBUG: Services loaded from backend:', services);

        this.services = services;
        this.dataSource.data = services;
        this.isLoading = false;

        // --- DEBUG LOG 2: Log IDs of individual services after being set to dataSource ---
        this.services.forEach(service => {
          console.log(`DEBUG: Service Name: ${service.serviceName}, ID: ${service.serviceId}`);
        });

      },
      error: (error: any) => {
        console.error('Error loading services:', error);
        this.errorMessage = 'Failed to load services. Please try again.';
        this.isLoading = false;
        this.snackBar.open(this.errorMessage, 'Close', { duration: 5000 });
      }
    });
  }

  toggleSort(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applySort();
  }

  applySort() {
    if (this.sortColumn === 'price') {
      this.services.sort((a, b) => {
        const priceA = a.price.toString();
        const priceB = b.price.toString();
        return this.sortDirection === 'asc' 
          ? priceA.localeCompare(priceB) 
          : priceB.localeCompare(priceA);
      });
    }
    this.dataSource.data = this.services;
  }

  editService(serviceId: string | undefined): void {
    // --- DEBUG LOG 3: Log the serviceId when editService is called ---
    console.log('DEBUG: editService called with ID:', serviceId);

    if (serviceId) {
      this.router.navigate(['/services', serviceId]);
    } else {
      this.snackBar.open('Service ID is missing for editing.', 'Close', { duration: 3000 });
      console.warn('Attempted to edit a service with no ID.');
    }
  }

  deleteService(serviceId: string | undefined): void { // Changed deletePatient to deleteService
    if (confirm('Are you sure you want to delete this service?')) {
      if (serviceId) {
        this.isLoading = true;
        this.errorMessage = '';
        this.serviceService.deleteService(serviceId).subscribe({ // Call serviceService
          next: (response: string) => { // Backend might return a message string
            this.snackBar.open(response, 'Close', { duration: 3000 });
            // Update the local data source after deletion
            this.services = this.services.filter(s => s.serviceId !== serviceId);
            this.dataSource.data = this.services;
            this.isLoading = false;
          },
          error: (error: any) => {
            console.error('Error deleting service:', error);
            this.errorMessage = 'Failed to delete service: ' + (error.message || 'Unknown error');
            this.isLoading = false;
            this.snackBar.open(this.errorMessage, 'Close', { duration: 5000 });
          }
        });
      } else {
        this.snackBar.open('Service ID is missing for deletion!', 'Close', { duration: 3000 });
      }
    }
  }

  applyFilter(event: Event): void {
    const filterText = (event.target as HTMLInputElement)?.value;
    this.filterValue = filterText; // Update the filterValue property
    if (filterText) {
      this.dataSource.filter = filterText.trim().toLowerCase();
      if (this.dataSource.paginator) {
        this.dataSource.paginator.firstPage();
      }
    } else {
      this.dataSource.filter = ''; // Clear filter if input is empty
    }
  }

  // Renamed from viewPatientDetails, though typically editService serves this purpose
  viewServiceDetails(serviceId: string | undefined): void {
    if (serviceId) {
      this.router.navigate(['/services/edit', serviceId]); // Assuming 'edit' route also serves as 'details'
    } else {
      this.snackBar.open('Service ID is missing for viewing details!', 'Close', { duration: 3000 });
    }
  }

  navigateToServiceForm(): void { // Changed navigateToPatientForm
    this.router.navigate(['/addservice']); // Assuming route is '/services/add'
  }
}