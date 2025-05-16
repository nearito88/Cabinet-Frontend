import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PatientService } from '../../../services/patients/patient.service';
import { Router } from '@angular/router';
import { Patient } from '../../../models/patient';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-patient-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './patient-form.component.html',
  styleUrl: './patient-form.component.css'
})
export class PatientFormComponent { // Removed OnInit interface as the initialization is in the constructor

  patientForm: FormGroup;
  successMessage: string = '';
  errorMessage: string = '';
  patientService = inject(PatientService);
  fb = inject(FormBuilder);
  router = inject(Router);

  constructor() {
    this.patientForm = this.fb.group({
      name: ['', Validators.required],
      CIN: ['', [Validators.required, Validators.pattern('^[0-9]{8}$')]],
      disease: [''],
      insurance: [''],
      // ... other form controls
      email: ['', [Validators.email]],
      phone: [''],
      age: ['', [Validators.pattern('^[0-9]+$')]],
      dateJoined: [''],
      documents: [[]],
      medicalHistory: [[]],
    });
  }

  onSubmit(): void {
    if (this.patientForm.valid) {
      this.successMessage = '';
      this.errorMessage = '';
      const newPatient: Patient = this.patientForm.value;

      this.patientService.addPatient(newPatient).subscribe({
        next: (response) => {
          this.successMessage = 'Patient added successfully!';
          this.patientForm.reset(); // Clear the form
          // Optionally navigate back to the patient list
          this.router.navigate(['/patients']);
        },
        error: (error) => {
          this.errorMessage = 'Error adding patient.';
          console.error('Error adding patient:', error);
          // Optionally display a more user-friendly error message
        }
      });
    } else {
      this.errorMessage = 'Please fill out all required fields correctly.';
    }
  }

  goBack(): void {
    this.router.navigate(['/patient']);
  }
}