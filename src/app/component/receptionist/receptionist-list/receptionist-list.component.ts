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

// Import your Receptionist model and ReceptionistService
import { Receptionist } from '../../../models/receptionist'; // Adjust path if needed
import { ReceptionistService } from '../../../services/receptionist/receptionist.service'; // Adjust path if needed

@Component({
  selector: 'app-receptionist-list', // Correct selector for ReceptionistListComponent
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
  templateUrl: './receptionist-list.component.html', // Correct template URL
  styleUrls: ['./receptionist-list.component.css'] // Correct style URL
})
export class ReceptionistListComponent implements OnInit, AfterViewInit { // Correct class name
  receptionists: Receptionist[] = []; // Changed to receptionists
  errorMessage: string = '';
  isLoading = false;
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  filterValue: string = ''; // Add this property

  // Define displayed columns for the MatTable - Adapt to Receptionist properties
  // Assuming Receptionist has name, email, phone, age, dateJoined, and receptionistId
  // You might want to add 'username' or 'role' if relevant for display
  displayedColumns: string[] = ['name', 'email', 'phone', 'age', 'dateJoined', 'actions'];
  dataSource = new MatTableDataSource<Receptionist>(); // Changed to Receptionist

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  // Using inject for services
  private receptionistService = inject(ReceptionistService); // Changed to ReceptionistService
  private router = inject(Router);
  private snackBar = inject(MatSnackBar); // Inject MatSnackBar for messages
input: any;

  constructor() { }

  ngOnInit() {
    this.loadReceptionists();
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;

    // Optional: Custom filter predicate if you want to search across multiple columns
    this.dataSource.filterPredicate = (data: Receptionist, filter: string) => {
      const dataStr = JSON.stringify(data).toLowerCase(); // Search in all data fields
      return dataStr.indexOf(filter) !== -1;
    };

    // This ensures sorting and pagination are applied when filter changes
    this.dataSource.sortingDataAccessor = (item, property) => {
      switch(property) {
          case 'age':
              // Assuming age is number | null | undefined, treat null/undefined as 0 for sorting
              return (item as any)[property] ?? 0;
          case 'dateJoined':
              // Assuming dateJoined is a string, convert to Date for sorting by time value
              const dateVal = (item as any)[property];
              return dateVal ? new Date(dateVal).getTime() : 0;
          default:
              return (item as any)[property];
      }
    };
  }

  loadReceptionists() {
    this.isLoading = true;
    this.errorMessage = '';
    this.receptionistService.getAllreceptionists().subscribe({ // Call receptionistService
      next: (receptionists: Receptionist[]) => {
        console.log('DEBUG: Receptionists loaded from backend:', receptionists);
        this.receptionists = receptionists;
        this.dataSource.data = receptionists;
        this.isLoading = false;

        this.receptionists.forEach(receptionist => {
          console.log(`DEBUG: Receptionist Name: ${receptionist.name}, ID: ${receptionist.receptionistId}`);
        });
      },
      error: (error: any) => {
        console.error('Error loading receptionists:', error);
        this.errorMessage = 'Failed to load receptionists. Please try again.';
        this.isLoading = false;
        this.snackBar.open(this.errorMessage, 'Close', { duration: 5000 });
      }
    });
  }

  // No change needed for toggleSort or applySort comments, as they were notes about MatSort itself.

  editReceptionist(receptionistId: string | undefined): void { // Changed to receptionistId
    console.log('DEBUG: editReceptionist called with ID:', receptionistId);
    if (receptionistId) {
      // Adjust this route based on your Angular routing for editing a receptionist
      this.router.navigate(['/receptionists/', receptionistId]);
    } else {
      this.snackBar.open('Receptionist ID is missing for editing.', 'Close', { duration: 3000 });
      console.warn('Attempted to edit a receptionist with no ID.');
    }
  }

  deleteReceptionist(receptionistId: string | undefined): void { // Changed to receptionistId
    if (confirm('Are you sure you want to delete this receptionist?')) {
      if (receptionistId) {
        this.isLoading = true;
        this.errorMessage = '';
        this.receptionistService.deletereceptionist(receptionistId).subscribe({ // Call receptionistService
          next: (response: string) => {
            this.snackBar.open(response, 'Close', { duration: 3000 });
            // Update the local data source after deletion
            this.receptionists = this.receptionists.filter(r => r.receptionistId !== receptionistId);
            this.dataSource.data = this.receptionists;
            this.isLoading = false;
          },
          error: (error: any) => {
            console.error('Error deleting receptionist:', error);
            this.errorMessage = 'Failed to delete receptionist: ' + (error.error?.message || error.message);
            this.isLoading = false;
            this.snackBar.open(this.errorMessage, 'Close', { duration: 5000 });
          }
        });
      } else {
        this.snackBar.open('Receptionist ID is missing for deletion!', 'Close', { duration: 3000 });
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
  viewReceptionistDetails(receptionistId: string | undefined): void { // Changed to receptionistId
    if (receptionistId) {
      // Adjust this route based on your Angular routing for viewing/editing a receptionist
      this.router.navigate(['/receptionists/edit', receptionistId]); // Assuming 'edit' route also serves as 'details'
    } else {
      this.snackBar.open('Receptionist ID is missing for viewing details!', 'Close', { duration: 3000 });
    }
  }

  navigateToReceptionistForm(): void { // Changed navigateToDoctorForm
    // Adjust this route based on your Angular routing for adding a receptionist
    this.router.navigate(['/addreceptionist']);
  }
}