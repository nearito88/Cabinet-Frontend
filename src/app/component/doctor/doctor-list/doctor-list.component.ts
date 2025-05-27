import { Component, OnInit, ViewChild, inject, AfterViewInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common'; // Include DatePipe for direct use in template
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar'; // Ensure MatSnackBarModule is provided at root
import { MatTooltipModule } from '@angular/material/tooltip';

// Import your Doctor model and DoctorService
import { Doctor } from '../../../models/doctor';
import { DoctorService } from '../../../services/doctor/doctor.service';

@Component({
  selector: 'app-doctor-list', // Correct selector for DoctorListComponent
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
    RouterModule, // Allows using routerLink in template
    MatProgressSpinnerModule,
    MatTooltipModule,
    DatePipe // Needed because date pipe is used directly in the template
  ],
  templateUrl: './doctor-list.component.html', // Correct template URL
  styleUrls: ['./doctor-list.component.css'] // Correct style URL
})
export class DoctorListComponent implements OnInit, AfterViewInit { // Correct class name
  doctors: Doctor[] = []; // Changed from services to doctors
  errorMessage: string = '';
  isLoading = false;
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  filterValue: string = ''; // Add this property

  // Define displayed columns for the MatTable - Adapt to Doctor properties
  displayedColumns: string[] = ['name', 'specialization', 'email', 'phone', 'age', 'dateJoined', 'actions'];
  dataSource = new MatTableDataSource<Doctor>(); // Changed from Service to Doctor

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  // Using inject for services
  private doctorService = inject(DoctorService); // Changed from serviceService to doctorService
  private router = inject(Router);
  private snackBar = inject(MatSnackBar); // Inject MatSnackBar for messages

  constructor() { } // Removed logic from constructor as it's done in ngOnInit and ngAfterViewInit

  ngOnInit() {
    this.loadDoctors();
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;

    // Optional: Custom filter predicate if you want to search across multiple columns
    this.dataSource.filterPredicate = (data: Doctor, filter: string) => {
      const dataStr = JSON.stringify(data).toLowerCase(); // Search in all data fields
      return dataStr.indexOf(filter) !== -1;
    };

    // This ensures sorting and pagination are applied when filter changes
    this.dataSource.sortingDataAccessor = (item, property) => {
        switch(property) {
            case 'age':
                // FIX: Use nullish coalescing to return the number or 0 if null/undefined.
                // No parseInt needed as item.age is already number | null.
                return item.age ?? 0;
            case 'dateJoined':
                // FIX: Ensure it's a Date object and get its timestamp, or default to 0.
                // This assumes loadDoctors converts dateJoined to a Date object.
                return (item.dateJoined instanceof Date ? item.dateJoined.getTime() : 0);
            default:
                // For other properties, return the value directly. MatSort handles string/number comparison.
                return (item as any)[property];
        }
    };
  }

  loadDoctors() {
    this.isLoading = true;
    this.errorMessage = '';
    this.doctorService.getAllDoctors().subscribe({ // Call doctorService
      next: (doctors: Doctor[]) => {
        console.log('DEBUG: Doctors loaded from backend:', doctors);
        this.doctors = doctors;
        this.dataSource.data = doctors;
        this.isLoading = false;

        this.doctors.forEach(doctor => {
          console.log(`DEBUG: Doctor Name: ${doctor.name}, ID: ${doctor.doctorId}`);
        });
      },
      error: (error: any) => {
        console.error('Error loading doctors:', error);
        this.errorMessage = 'Failed to load doctors. Please try again.';
        this.isLoading = false;
        this.snackBar.open(this.errorMessage, 'Close', { duration: 5000 });
      }
    });
  }

  // NOTE: MatSort usually handles sorting directly via mat-sort-header.
  // The toggleSort and applySort methods below are generally only needed for custom client-side sorting
  // that goes beyond what matSort can do automatically, or if you prefer manual control.
  // For standard columns, you might not need these.
  toggleSort(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    // This `applySort` would typically not be used with mat-sort-header directly.
    // MatSort automatically updates dataSource.sort.
    // If you enable a custom sort function for dataSource.sort, it will be called.
    // This is often not needed if data is simple and sorting is handled by MatSortModule.
    // For now, removing call to `applySort()` to let MatSort handle it.
    // This logic might be specific to your service list's custom sorting for 'price'.
  }

  // applySort() { // This method might be redundant if MatSort handles everything
  //   // If you have special sorting logic for Doctors, implement it here
  //   // otherwise, MatSort will handle sorting of dataSource.data automatically
  //   this.dataSource.data = this.doctors; // Just reassign to trigger MatTable update
  // }


  editDoctor(doctorId: string | undefined): void { // Changed from serviceId to doctorId
    console.log('DEBUG: editDoctor called with ID:', doctorId);
    if (doctorId) {
      this.router.navigate(['/doctor/', doctorId]); // Assuming your edit route is '/doctors/edit/:id'
    } else {
      this.snackBar.open('Doctor ID is missing for editing.', 'Close', { duration: 3000 });
      console.warn('Attempted to edit a doctor with no ID.');
    }
  }

  deleteDoctor(doctorId: string | undefined): void { // Changed from serviceId to doctorId
    if (confirm('Are you sure you want to delete this doctor?')) {
      if (doctorId) {
        this.isLoading = true;
        this.errorMessage = '';
        this.doctorService.deleteDoctor(doctorId).subscribe({ // Call doctorService
          next: (response: string) => {
            this.snackBar.open(response, 'Close', { duration: 3000 });
            // Update the local data source after deletion
            this.doctors = this.doctors.filter(d => d.doctorId !== doctorId);
            this.dataSource.data = this.doctors;
            this.isLoading = false;
          },
          error: (error: any) => {
            console.error('Error deleting doctor:', error);
            this.errorMessage = 'Failed to delete doctor: ' + (error.error?.message || error.message);
            this.isLoading = false;
            this.snackBar.open(this.errorMessage, 'Close', { duration: 5000 });
          }
        });
      } else {
        this.snackBar.open('Doctor ID is missing for deletion!', 'Close', { duration: 3000 });
      }
    }
  }

  applyFilter(event: Event): void {
    const filterText = (event.target as HTMLInputElement)?.value;
    this.filterValue = filterText;
    if (filterText) {
      this.dataSource.filter = filterText.trim().toLowerCase();
      if (this.dataSource.paginator) {
        this.dataSource.paginator.firstPage();
      }
    } else {
      this.dataSource.filter = '';
    }
  }

  // Renamed from viewServiceDetails, though typically editDoctor serves this purpose
  viewDoctorDetails(doctorId: string | undefined): void {
    if (doctorId) {
      this.router.navigate(['/doctors/edit', doctorId]); // Assuming 'edit' route also serves as 'details'
    } else {
      this.snackBar.open('Doctor ID is missing for viewing details!', 'Close', { duration: 3000 });
    }
  }

  navigateToDoctorForm(): void { // Changed navigateToServiceForm
    this.router.navigate(['/adddoctor']); // Assuming your add route is '/doctors/add'
  }
}