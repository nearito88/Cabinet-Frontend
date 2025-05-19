import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { Patient } from '../../../models/patient';
import { PatientService } from '../../../services/patients/patient.service';
import { Router } from '@angular/router';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-patients-list',
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
    MatIconModule
  ],
  templateUrl: './patients-list.component.html',
  styleUrls: ['./patients-list.component.css']
})
export class PatientsListComponent implements OnInit {
  patients: Patient[] = [];

  editPatient(patientId: string) {
    // Navigate to patient details page with patient ID
    this.router.navigate(['/patients', patientId]);
  }

  deletePatient(patientId: string) {
    if (confirm('Are you sure you want to delete this patient?')) {
      this.patientService.deletePatient(patientId).subscribe({
        next: () => {
          this.patients = this.patients.filter(p => p.patientId !== patientId);
          this.dataSource.data = this.patients;
        },
        error: (error) => {
          console.error('Error deleting patient:', error);
          this.error = 'Failed to delete patient. Please try again.';
        }
      });
    }
  }
  displayedColumns: string[] = [
    'name',
    'cin',
    'age',
    'gender',
    'phone',
    'email',
    'status',
    'disease',
    'medicalHistory',
    'documents',
    'insurance',
    'dateJoined',
    'actions'
  ];
  dataSource = new MatTableDataSource<Patient>([]);
  loading = true;
  error = '';
  patientService = inject(PatientService);
  router = inject(Router);

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngOnInit(): void {
    this.loadPatients();
  }

  loadPatients(): void {
    this.loading = true;
    this.patientService.getAllPatients().subscribe({
      next: (patients: Patient[]) => {
        this.patients = patients;
        this.dataSource = new MatTableDataSource(this.patients);
        this.dataSource.sort = this.sort;
        this.dataSource.paginator = this.paginator;
        this.loading = false;
      },
      error: (err: any) => {
        this.error = 'Error loading patients.';
        console.error('Error loading patients:', err);
        this.loading = false;
      }
    });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement)?.value;
    if (filterValue) {
      this.dataSource.filter = filterValue.trim().toLowerCase();
      if (this.dataSource.paginator) {
        this.dataSource.paginator.firstPage();
      }
    }
  }

  viewPatientDetails(patientId: string): void {
    this.router.navigate(['/patients', patientId]);
  }

  navigateToPatientForm(): void {
    this.router.navigate(['/patients/add']);
  }
}