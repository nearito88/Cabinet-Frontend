// src/app/patient-list/patient-list.component.ts

import { Component, OnInit, ViewChild, AfterViewInit, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { Patient } from '../../../models/patient';
import { PatientService } from '../../../services/patients/patient.service';

@Component({
  selector: 'app-patient-list',
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
    RouterModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './patients-list.component.html',
  styleUrls: ['./patients-list.component.css']
})
export class PatientListComponent implements OnInit, AfterViewInit {
  patients: Patient[] = [];
  errorMessage: string = '';
  isLoading: boolean = false;

  displayedColumns: string[] = [
    'name',
    'cin',
    'age',
    'gender',
    'phone',
    'email',
    'status',
    'disease',
    'documentsCount',
    'medicalHistoryCount',
    'insurance',
    'dateJoined',
    'actions' // Ensure this matches HTML matColumnDef
  ];
  dataSource = new MatTableDataSource<Patient>();

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  private router = inject(Router);
  private patientService = inject(PatientService);
  private snackBar = inject(MatSnackBar);

  constructor() {
    this.dataSource = new MatTableDataSource(this.patients);
  }

  ngOnInit() {
    this.loadPatients();
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;

    // Custom sorting for nested properties (e.g., 'documents.length')
    this.dataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'documentsCount': return item.documents ? item.documents.length : 0;
        case 'medicalHistoryCount': return item.medicalHistory ? item.medicalHistory.length : 0;
        // Handle sorting for 'dateJoined' if it's a string from backend
        case 'dateJoined': return new Date(item.dateJoined || '').getTime();
        default: return (item as any)[property];
      }
    };
  }

  loadPatients() {
    this.isLoading = true;
    this.errorMessage = '';
    this.patientService.getAllPatients().subscribe({
      next: (patients: Patient[]) => {
        this.patients = patients;
        // Transform dateJoined from string to Date object if necessary
        // This is important for correct date sorting and display
        this.dataSource.data = patients.map(p => ({
            ...p,
            dateJoined: p.dateJoined ? new Date(p.dateJoined) : null
        }));
        this.isLoading = false;
        console.log('Patients loaded:', this.dataSource.data);
      },
      error: (error: any) => {
        console.error('Error loading patients:', error);
        this.errorMessage = 'Failed to load patients. Please try again.';
        this.isLoading = false;
        this.snackBar.open(this.errorMessage, 'Close', { duration: 5000 });
      }
    });
  }

  // ... (applyFilter, editPatient, deletePatient, navigateToPatientForm methods)
  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement)?.value.trim().toLowerCase();
    
    this.dataSource.filterPredicate = (data: Patient, filter: string): boolean => {
      if (!filter) return true;
      
      // Convert all searchable fields to lowercase strings, handling null/undefined
      const name = (data.name || '').toLowerCase();
      const cin = (data.cin || '').toLowerCase();
      const phone = (data.phone || '').toLowerCase();
      const email = (data.email || '').toLowerCase();
      
      // Search in multiple fields
      return (
        name.includes(filter) ||
        cin.includes(filter) ||
        phone.includes(filter) ||
        email.includes(filter)
      );
    };
    
    this.dataSource.filter = filterValue;
    
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  editPatient(patientId: string | undefined): void {
    if (patientId) {
      this.router.navigate(['/patients', patientId]); // Assuming your patient detail/edit route is like '/patients/:id'
    } else {
      this.snackBar.open('Patient ID is missing for editing.', 'Close', { duration: 3000 });
      console.warn('Attempted to edit a patient with no ID.');
    }
  }

  deletePatient(patientId: string | undefined): void {
    if (!patientId) {
      this.snackBar.open('Patient ID is missing for deletion.', 'Close', { duration: 3000 });
      console.warn('Attempted to delete a patient with no ID.');
      return;
    }

    if (confirm('Are you sure you want to delete this patient? This action cannot be undone.')) {
      this.isLoading = true;
      this.errorMessage = '';
      this.patientService.deletePatient(patientId).subscribe({
        next: () => {
          this.snackBar.open('Patient deleted successfully!', 'Close', { duration: 3000 });
          this.dataSource.data = this.dataSource.data.filter(p => p.patientId !== patientId);
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('Error deleting patient:', error);
          this.errorMessage = 'Failed to delete patient. Please try again.';
          this.isLoading = false;
          this.snackBar.open(this.errorMessage, 'Close', { duration: 5000 });
        }
      });
    }
  }

  navigateToPatientForm(): void {
    this.router.navigate(['/addpatient']); // Assuming your add patient route is '/addpatient'
  }
}