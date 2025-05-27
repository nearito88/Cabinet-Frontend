// src/app/doctor-details/doctor-details.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';

// Angular Material Imports
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Your models and services

import { Receptionist } from '../../../models/receptionist';
import { ReceptionistService } from '../../../services/receptionist/receptionist.service';

@Component({
  selector: 'app-doctor-details',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './receptionist-detail.component.html',
  styleUrls: ['./receptionist-detail.component.css']
})
export class ReceptionistDetailsComponent implements OnInit {
  receptionist: Receptionist | null = null; // Will hold the doctor data
  doctorId: string | null = null; // Holds the ID from the route
  isLoading: boolean = true; // For initial data loading
  isSaving: boolean = false; // For update operation feedback
  errorMessage: string = '';

  // Inject services
  private receptionistService = inject(ReceptionistService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.doctorId = params.get('id');
      if (this.doctorId) {
        this.loadReceptionistDetails(this.doctorId);
      } else {
        this.errorMessage = 'No doctor ID provided.';
        this.isLoading = false;
        this.snackBar.open(this.errorMessage, 'Close', { duration: 5000 });
        this.router.navigate(['/doctors']); // Redirect if no ID
      }
    });
  }

  loadReceptionistDetails(id: string): void {
    this.isLoading = true;
    this.errorMessage = ''; // Clear previous errors
    this.receptionistService.getreceptionistById(id).subscribe({
      next: (data: Receptionist) => {
        // Correctly assign and convert dateJoined from string to Date object
        this.receptionist = {
          ...data,
          dateJoined: data.dateJoined ? new Date(data.dateJoined) : null
        };
        this.isLoading = false;
        console.log('Receptionist loaded:', this.receptionist);
      },
      error: (err: any) => {
        console.error('Error loading receptionist details:', err);
        this.errorMessage = 'Failed to load receptionist details. Please try again.';
        this.isLoading = false;
        this.snackBar.open(this.errorMessage, 'Close', { duration: 5000 });
        this.router.navigate(['/receptionists']); // Redirect on error
      }
    });
  }

  updateReceptionist(form: NgForm): void {
    this.errorMessage = '';
    if (form.invalid || !this.receptionist || !this.receptionist.receptionistId) {
      this.snackBar.open('Please fill in all required fields and correct errors.', 'Close', { duration: 3000 });
      Object.keys(form.controls).forEach(key => {
        form.controls[key].markAsTouched();
      });
      return;
    }

    this.isSaving = true;

    // Prepare doctor object for sending to backend, converting Date to ISO string
    const receptionistToSend = {
      ...this.receptionist,
      dateJoined: this.receptionist.dateJoined instanceof Date
        ? this.receptionist.dateJoined.toISOString()
        : null
    };

    this.receptionistService.updatereceptionist(this.receptionist.receptionistId, receptionistToSend).subscribe({
      next: (response: string) => {
        this.snackBar.open('Receptionist updated successfully!', 'Close', { duration: 3000 });
        this.isSaving = false;
        this.router.navigate(['/receptionists']); // Navigate back to list after successful update
      },
      error: (err: any) => {
        console.error('Error updating receptionist:', err);
        this.errorMessage = 'Failed to update doctor: ' + (err.error?.message || err.message);
        this.snackBar.open(this.errorMessage, 'Close', { duration: 5000 });
        this.isSaving = false;
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/receptionists']);
  }
}