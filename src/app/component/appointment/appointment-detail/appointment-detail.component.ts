// src/app/appointment-detail/appointment-detail.component.ts

import { Component, OnInit, ViewChild } from '@angular/core';
import { NgForm, FormsModule } from '@angular/forms'; // Required for template-driven forms
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';

// Material UI Imports (ensure all are imported for standalone)
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';


// Your application-specific models and services (adjust paths if needed)
import { Appointment } from '../../../models/appointment';
import { appointmentService } from '../../../services/appointment/appointment.service';
import { PatientService } from '../../../services/patients/patient.service';
import { DoctorService } from '../../../services/doctor/doctor.service';
import { ServiceService } from '../../../services/medical-service/service.service';
import { Patient } from '../../../models/patient';
import { Doctor } from '../../../models/doctor';
import { Service } from '../../../models/service';
import { forkJoin } from 'rxjs';
import { catchError, map } from 'rxjs/operators'; // Ensure map and catchError are imported


@Component({
  selector: 'app-appointment-detail', // Keeping the name as per your instruction
  standalone: true,
  imports: [
    CommonModule,
    FormsModule, // Essential for template-driven forms
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './appointment-detail.component.html', // This template will be the "edit" form
  styleUrls: ['./appointment-detail.component.css']
})
export class AppointmentDetailComponent implements OnInit {
  @ViewChild('appointmentFormRef') appointmentFormRef!: NgForm;

  appointment: Appointment | undefined; // Will hold the loaded appointment data
  patients: Patient[] = [];
  doctors: Doctor[] = [];
  services: Service[] = [];

  isSaving: boolean = false;
  isLoading: boolean = true; // For initial data load (form dependencies AND existing appointment)
  errorMessage: string | null = null;
  successMessage: string | null = null;

  // No isEditMode needed here, this component is always for editing

  constructor(
    private appointmentService: appointmentService,
    private patientService: PatientService,
    private doctorService: DoctorService,
    private serviceService: ServiceService,
    private route: ActivatedRoute, // To read URL parameters for editing
    private router: Router, // To navigate after save/cancel
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.isLoading = true;
    this.errorMessage = null;

    // Load all necessary dropdown data (patients, doctors, services) in parallel
    forkJoin([
      this.patientService.getAllPatients(),
      this.doctorService.getAllDoctors(),
      this.serviceService.getAllServices()
    ]).subscribe({
      next: ([patients, doctors, services]) => {
        this.patients = patients;
        this.doctors = doctors;
        this.services = services;
        // Dependent data loaded, now proceed to load the specific appointment
        this.route.paramMap.subscribe(params => {
          const appointmentId = params.get('id'); // Get the 'id' parameter from the route
          if (appointmentId) {
            this.loadAppointment(appointmentId); // Load existing appointment data
          } else {
            this.errorMessage = 'No appointment ID provided for editing.';
            this.isLoading = false;
            this.snackBar.open('No appointment ID provided for editing!', 'Close', { duration: 3000, panelClass: ['snackbar-error'] });
            this.router.navigate(['/appointments']); // Redirect if no ID (e.g., direct access)
          }
        });
      },
      error: (err) => {
        this.errorMessage = 'Failed to load form dependencies (patients, doctors, services). Please try again.';
        this.isLoading = false;
        console.error('Error loading form dependencies:', err);
        this.snackBar.open('Error loading form dependencies!', 'Close', { duration: 3000, panelClass: ['snackbar-error'] });
      }
    });
  }

  // Method to load existing appointment data for editing
  loadAppointment(id: string): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.appointmentService.getappointmentById(id).subscribe({
      next: (dataFromBackend) => { // Renamed 'data' to 'dataFromBackend' for clarity

        // Create a new Appointment object to ensure all properties are properly initialized
        // This helps in aligning the types even if the backend DTO is slightly different
        const loadedAppointment: Appointment = {
          appointmentId: dataFromBackend.appointmentId || undefined, // Use undefined if not present
          dateAppointment: dataFromBackend.dateAppointment,
          startTime: dataFromBackend.startTime,
          endTime: dataFromBackend.endTime,
          appointmentStatus: dataFromBackend.appointmentStatus,
          paymentStatus: dataFromBackend.paymentStatus,
          totalAmount: dataFromBackend.totalAmount,
          description: dataFromBackend.description,
          isRelated: dataFromBackend.isRelated,
          patientName: dataFromBackend.patientName,
          doctorName: dataFromBackend.doctorName,
          serviceName: dataFromBackend.serviceName,
          partialAppointments: dataFromBackend.partialAppointments,

          // CRUCIAL: Initialize IDs to null (or actual ID if present) using nullish coalescing
          patientId: dataFromBackend.patientId ?? null,
          doctorId: dataFromBackend.doctorId ?? null,
          serviceId: dataFromBackend.serviceId ?? null,
        };

        // IMPORTANT: Ensure the dateAppointment is a Date object for the mat-datepicker
        if (typeof loadedAppointment.dateAppointment === 'string') {
          loadedAppointment.dateAppointment = new Date(loadedAppointment.dateAppointment);
        }
        // Patient mapping logic
        if (loadedAppointment.patientName && this.patients.length > 0) {
          const foundPatient = this.patients.find(p => p.name === loadedAppointment.patientName);
          if (foundPatient) {
            loadedAppointment.patientId = foundPatient.patientId ?? null;
          } else {
            loadedAppointment.patientId = null;
          }
        } else if (!loadedAppointment.patientId) {
            loadedAppointment.patientId = null;
        }


        // Doctor mapping logic
        if (loadedAppointment.doctorName && this.doctors.length > 0) {
          console.log(`Attempting to find doctor: ${loadedAppointment.doctorName}`);
          const foundDoctor = this.doctors.find(d => {
            console.log(`Comparing doctor name "${d.name}" with loaded doctor name "${loadedAppointment.doctorName}"`);
            return d.name === loadedAppointment.doctorName;
          });
          if (foundDoctor) {
            loadedAppointment.doctorId = foundDoctor.doctorId ?? null; // Assign the string ID, or null if undefined
            console.log('  -> Found Doctor:', foundDoctor);
            console.log('  -> Assigned doctorId:', loadedAppointment.doctorId);
          } else {
            loadedAppointment.doctorId = null; // Set to null if doctor name found but ID not found in lists
            console.log('  -> Doctor name matched, but doctor not found in available list. Setting doctorId to null.');
          }
        } else if (!loadedAppointment.doctorId) {
            // If no doctorName from backend AND no doctorId from backend, ensure it's null
            loadedAppointment.doctorId = null;
            console.log('  -> No doctorName from backend or initial doctorId. Setting doctorId to null.');
        }

        // Service mapping logic
        if (loadedAppointment.serviceName && this.services.length > 0) {
          console.log(`Attempting to find service: ${loadedAppointment.serviceName}`);
          const foundService = this.services.find(s => {
            console.log(`Comparing service name "${s.serviceName}" with loaded service name "${loadedAppointment.serviceName}"`);
            return s.serviceName === loadedAppointment.serviceName;
          });
          if (foundService) {
            loadedAppointment.serviceId = foundService.serviceId ?? null; // Assign the string ID, or null if undefined
            console.log('  -> Found Service:', foundService);
            console.log('  -> Assigned serviceId:', loadedAppointment.serviceId);
          } else {
            loadedAppointment.serviceId = null; // Set to null if service name matched but ID not found in lists
            console.log('  -> Service name matched, but service not found in available list. Setting serviceId to null.');
          }
        } else if (!loadedAppointment.serviceId) {
            loadedAppointment.serviceId = null;
            console.log('  -> No serviceName from backend or initial serviceId. Setting serviceId to null.');
        }

        console.log('Final loadedAppointment after all mapping:', loadedAppointment);

        this.appointment = loadedAppointment; // Assign the fully prepared appointment
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = `Failed to load appointment with ID ${id} for editing.`;
        this.isLoading = false;
        console.error('Error loading appointment for edit:', err);
        this.snackBar.open('Error loading appointment details for editing!', 'Close', { duration: 3000, panelClass: ['snackbar-error'] });
        this.router.navigate(['/appointments']);
      }
    });
  }

  // This method will now ONLY handle updating existing appointments
  saveAppointment(): void {
    if (this.appointmentFormRef.valid && this.appointment?.appointmentId) {
      this.isSaving = true;
      this.errorMessage = null;
      this.successMessage = null;

      const appointmentToSave = { ...this.appointment };
      if (appointmentToSave.dateAppointment instanceof Date) {
         appointmentToSave.dateAppointment = appointmentToSave.dateAppointment.toISOString().split('T')[0];
      }
        console.log('Appointment object being sent to backend:', appointmentToSave);
        console.log('*** APPOINTMENT OBJECT BEING SENT TO BACKEND (BEFORE API CALL) ***', appointmentToSave);
        console.log('Type of patientId:', typeof appointmentToSave.patientId, 'Value:', appointmentToSave.patientId);
        console.log('Type of doctorId:', typeof appointmentToSave.doctorId, 'Value:', appointmentToSave.doctorId);
        console.log('Type of serviceId:', typeof appointmentToSave.serviceId, 'Value:', appointmentToSave.serviceId);
        
      // Always call updateAppointment service method
      this.appointmentService.updateappointment(appointmentToSave.appointmentId!, appointmentToSave).subscribe({
        next: () => {
          this.successMessage = 'Appointment updated successfully!';
          this.snackBar.open('Appointment updated successfully!', 'Close', { duration: 3000, panelClass: ['snackbar-success'] });
          this.isSaving = false;
          this.router.navigate(['/appointments']); // Go back to list after update
        },
        error: (err) => {
          this.errorMessage = 'Failed to update appointment. Please try again.';
          this.snackBar.open('Failed to update appointment!', 'Close', { duration: 3000, panelClass: ['snackbar-error'] });
          this.isSaving = false;
          console.error('Error updating appointment:', err);
        }
      });
    } else {
      this.errorMessage = 'Please fill in all required fields and ensure a valid appointment is loaded.';
      this.snackBar.open('Please fill in all required fields.', 'Close', { duration: 3000, panelClass: ['snackbar-warning'] });
    }
  }

  // Navigate back to the appointment list
  cancel(): void {
    this.router.navigate(['/appointments']);
  }
}