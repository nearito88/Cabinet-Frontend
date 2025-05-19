import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Patient } from '../../../models/patient'; // Adjust path
import { PatientService } from '../../../services/patients/patient.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'; // Import for editing
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'app-patient-detail',
  standalone : true,
  imports : [CommonModule,MatInputModule,MatButtonModule,MatFormFieldModule,RouterLink,ReactiveFormsModule],
  templateUrl: './patient-detail.component.html',
  styleUrls: ['./patient-detail.component.css']
})
export class PatientDetailComponent implements OnInit {
  patientId: string | null = null;
  patient: Patient | null = null;
  isEditMode = false;
  patientForm: FormGroup; // For editing

  constructor(
    private route: ActivatedRoute,
    private patientService: PatientService,
    private fb: FormBuilder // Inject FormBuilder
  ) {
    this.patientForm = this.fb.group({ // Initialize the form
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      gender: [''],
      phone: [''],
      age: [null, Validators.min(0)],
      dateJoined: [''],
      CIN: [''],
      disease: [''],
      insurance: [''],
      status: [''],
      // Add other form controls as needed
    });
  }

  ngOnInit(): void {
    console.log('PatientDetailComponent loaded');
    this.route.paramMap.subscribe(params => {
      this.patientId = params.get('id');
      console.log('Patient ID in Detail Component:', this.patientId); // Debugging
      if (this.patientId) {
        this.loadPatientDetails(this.patientId,this.isEditMode);
      }
    });
  }

  loadPatientDetails(id: string, isEditing: boolean): void {
    console.log('Loading details for patient ID:', id);
    this.patientService.getPatientById(id).subscribe(
      (patient) => {
        this.patient = patient;
        if (isEditing && patient) {
          this.populateForm(patient); // Populate form in edit mode
        }
      },
      (error) => {
        console.error('Error loading patient details:', error);
        // Handle error
      }
    );
  }

  enableEditMode(): void {
    this.isEditMode = true;
    if (this.patient) {
      this.populateForm(this.patient);
      // Optionally reload data specifically for editing if needed
      // this.loadPatientDetails(this.patientId!, true);
    }
  }

  populateForm(patient: Patient): void {
    this.patientForm.patchValue({
      name: patient.name,
      email: patient.email,
      gender: patient.gender,
      phone: patient.phone,
      age: patient.age,
      dateJoined: patient.dateJoined,
      CIN: patient.cin,
      disease: patient.disease,
      insurance: patient.insurance,
      status: patient.status,
      // Populate other form controls
    });
  }

  savePatientDetails(): void {
    if (this.patientForm.valid && this.patientId) {
      const updatedPatient = { ...this.patient, ...this.patientForm.value };
      this.patientService.updatePatient(this.patientId, updatedPatient).subscribe(
        (response) => {
          console.log('Patient details updated successfully:', response);
          this.isEditMode = false; // Go back to view mode
          this.loadPatientDetails(this.patientId!, false); // Reload updated data
          // Optionally show a success message
        },
        (error) => {
          console.error('Error updating patient details:', error);
          // Handle error
          // Optionally show an error message
        }
      );
    }
  }

  cancelEditMode(): void {
    this.isEditMode = false;
    this.loadPatientDetails(this.patientId!, false); // Reload original data
  }
}