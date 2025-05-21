import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router } from '@angular/router';
import { Patient } from '../../../models/patient';
import { of, Subject, switchMap, takeUntil } from 'rxjs';
import { PatientService } from '../../../services/patients/patient.service';

@Component({
  selector: 'app-patient-detail',
  standalone: true,
  imports: [
    MatButtonModule,
    MatCardModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatRadioModule,
    MatSelectModule,
    FormsModule,
    CommonModule,
  ],
  templateUrl: './patient-detail.component.html',
  styleUrls: ['./patient-detail.component.css'],
})
  export class PatientDetailComponent implements OnInit, OnDestroy {
  patientId: string | null = null;
  patient: Patient | null = null;
  isLoading: boolean = true;
  errorMessage: string = '';
  private readonly destroy$ = new Subject<void>();
  
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private patientService = inject(PatientService);

  ngOnInit(): void {
    this.route.paramMap.pipe(
      switchMap(params => {
        this.patientId = params.get('id');
        if (this.patientId) {
          this.isLoading = true;
          return this.patientService.getPatientById(this.patientId);
        }
        return of(null);
      }),
      takeUntil(this.destroy$) // Unsubscribe when component is destroyed
    ).subscribe({
      next: (patient) => {
        this.isLoading = false;
        this.patient = patient;
        this.populateForm();
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = 'Error loading patient details.';
        console.error('Error loading patient:', error);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  populateForm(): void {
    if (this.patient) {
      this.patientName = this.patient.name || '';
      this.patientCin = this.patient.cin || '';
      this.patientAge = this.patient.age !== undefined && this.patient.age !== null ? Number(this.patient.age) : null;
      this.patientGender = this.patient.gender || '';
      this.patientPhone = this.patient.phone || '';
      this.patientEmail = this.patient.email || '';
      this.patientStatus = this.patient.status || '';
      this.patientDisease = this.patient.disease || '';
      this.patientInsurance = this.patient.insurance || '';
      // Populate other fields as needed based on your Patient model
    }
  }

  patientName: string = '';
  patientCin: string = '';
  patientAge: number | null = null;
  patientGender: string = '';
  patientPhone: string = '';
  patientEmail: string = '';
  patientStatus: string = '';
  patientDisease: string = '';
  patientInsurance: string = '';
  newDocument: string = '';
  newMedicalHistory: string = '';

  savePatient(): void {
    console.log('Save button clicked!');
    if (this.patientId && this.patient) {
      this.isLoading = true;
      const updatedPatient = {
        ...this.patient, // Spread the existing patient data
        name: this.patientName,
        cin: this.patientCin,
        age: this.patientAge,
        gender: this.patientGender,
        phone: this.patientPhone,
        email: this.patientEmail,
        status: this.patientStatus,
        disease: this.patientDisease,
        insurance: this.patientInsurance
      };

      // Add new documents if they exist
      if (this.newDocument) {
        updatedPatient.documents = this.patient.documents ? [...this.patient.documents, this.newDocument] : [this.newDocument];
      }

      // Add new medical history if it exists
      if (this.newMedicalHistory) {
        updatedPatient.medicalHistory = this.patient.medicalHistory ? [...this.patient.medicalHistory, this.newMedicalHistory] : [this.newMedicalHistory];
      }

      this.patientService.updatePatient(this.patientId, updatedPatient).subscribe({
        next: (response: any) => {
          this.isLoading = false;
          console.log('Patient updated successfully:', response);
          // Reset the new document and medical history fields
          this.newDocument = '';
          this.newMedicalHistory = '';
          // Optionally, navigate back or show a success message
        },
        error: (error: any) => {
          this.isLoading = false;
          this.errorMessage = 'Error updating patient.';
          console.error('Error updating patient:', error);
          // Show an error message to the user
        }
      });
    } else {
      console.warn('Patient ID or data is missing.');
      this.errorMessage = 'Patient ID or data is missing.';
      // Handle this case (e.g., show an error)
    }
  }

  cancel(): void {
    console.log('Cancel clicked');
    this.router.navigate(['/patients']);
  }
}