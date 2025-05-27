import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router'; // Removed ActivatedRoute
import { MatSnackBar } from '@angular/material/snack-bar';

// Angular Material Imports (for standalone component)
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
// REMOVED: MatProgressBarModule (no loading progress for existing data)
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'; // Keep for saving progress
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';

// Import your Doctor model and DoctorService
import { Doctor } from '../../../models/doctor';
import { DoctorService } from '../../../services/doctor/doctor.service';

@Component({
  selector: 'app-doctor-form',
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
    MatProgressSpinnerModule // Keep for saving spinner
  ],
  templateUrl: './doctor-form.component.html',
  styleUrls: ['./doctor-form.component.css']
})
export class DoctorFormComponent implements OnInit {
  doctor: Doctor = { // Initialize a fresh Doctor object for a new entry
    name: '',
    email: '',
    gender: '',
    phone: '',
    age: null,
    dateJoined: null,
    specialization: ''
  };

  isSaving: boolean = false; // Still needed for save operation feedback
  errorMessage: string = '';

  // Inject services
  private doctorService = inject(DoctorService);
  private router = inject(Router);
  // REMOVED: private route = inject(ActivatedRoute); // No need to read route params
  private snackBar = inject(MatSnackBar);

  ngOnInit(): void {
    // No logic needed here for loading existing data. Form starts fresh.
    // Initialize dateJoined to today's date or leave null depending on desired default
    this.doctor.dateJoined = new Date(); // Optional: Pre-fill with today's date
  }


  saveDoctor(form: NgForm): void {
    this.errorMessage = ''; // Clear previous errors

    // Check form validity using NgForm passed from template
    if (form.invalid) {
      this.snackBar.open('Please fill in all required fields and correct errors.', 'Close', { duration: 3000 });
      // Optionally, mark all controls as touched to display errors
      Object.keys(form.controls).forEach(key => {
        form.controls[key].markAsTouched();
      });
      return;
    }

    this.isSaving = true;

    // Create a copy of the doctor object to send to the backend
    const doctorToSend = {
      ...this.doctor,
      // Convert dateJoined Date object back to ISO string for backend
      dateJoined: this.doctor.dateJoined instanceof Date
        ? this.doctor.dateJoined.toISOString()
        : null // Ensure it's null if not a Date object
    };

    // Only add new doctor logic, no update/edit branch
    this.doctorService.addDoctor(doctorToSend).subscribe({
      next: (response: string) => { // Assuming backend returns a success message or new ID
        this.snackBar.open('Doctor added successfully!', 'Close', { duration: 3000 });
        this.isSaving = false;
        this.router.navigate(['/doctor']); // Navigate back to the list
      },
      error: (error: any) => {
        console.error('Error adding doctor:', error);
        this.errorMessage = 'Failed to add doctor: ' + (error.error?.message || error.message);
        this.snackBar.open(this.errorMessage, 'Close', { duration: 5000 });
        this.isSaving = false;
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/doctor']);
  }
}