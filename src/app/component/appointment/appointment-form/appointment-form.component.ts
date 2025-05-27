import { Component, OnInit, ViewChild } from '@angular/core';
import { NgForm, FormsModule } from '@angular/forms'; // Import FormsModule for standalone
import { CommonModule } from '@angular/common'; // Import CommonModule for ngIf, ngFor

// Angular Material Imports - these now go directly into the component's imports
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';

// Your services and models - Adjust paths if necessary based on your project structure
import { Patient } from '../../../models/patient';
import { Doctor } from '../../../models/doctor';
import { Service } from '../../../models/service';
import { Appointment } from '../../../models/appointment'; // Your flat Appointment model
import { appointmentService } from '../../../services/appointment/appointment.service';
import { PatientService } from '../../../services/patients/patient.service';
import { DoctorService } from '../../../services/doctor/doctor.service';
import { ServiceService } from '../../../services/medical-service/service.service';


@Component({
  selector: 'app-appointment-form',
  standalone: true, // Make it a standalone component
  imports: [          // Import all necessary modules here
    CommonModule,     // Required for Angular structural directives like *ngIf, *ngFor
    FormsModule,      // Required for [(ngModel)] in template-driven forms

    // Angular Material Modules
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule, // Provides the date adapter for MatDatepicker
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatCheckboxModule
  ],
  templateUrl: './appointment-form.component.html',
  styleUrls: ['./appointment-form.component.css']
})
export class AppointmentFormComponent implements OnInit {
  @ViewChild('appointmentFormRef') appointmentFormRef!: NgForm; // Reference to the NgForm

  // The model for your form inputs using [(ngModel)]
  // Ensure the types here exactly match your Appointment interface
  appointment: {
    patientId: string;
    doctorId: string;
    serviceId: string;
    dateAppointment: string | Date;
    startTime: string;
    endTime: string;
    // Use the exact casing from your Appointment model interface for status types
    appointmentStatus: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'PENDING';
    paymentStatus: 'PAID' | 'PENDING' | 'PARTIAL';
    totalAmount: number;
    description: string;
    isRelated: boolean;
  } = {
    patientId: '',
    doctorId: '',
    serviceId: '',
    dateAppointment: '',
    startTime: '',
    endTime: '',
    // Initialize with the correct casing matching the interface
    appointmentStatus: 'SCHEDULED',
    paymentStatus: 'PENDING',
    totalAmount: 0,
    description: '',
    isRelated: false
  };

  patients: Patient[] = [];
  doctors: Doctor[] = [];
  services: Service[] = []; // Changed from CabinetService to Service
  isSaving: boolean = false;
  successMessage: string | null = null;
  errorMessage: string | null = null;

  constructor(
    private appointmentApiService: appointmentService,
    private patientService: PatientService,
    private doctorService: DoctorService,
    private serviceService: ServiceService
  ) {}

  ngOnInit(): void {
    this.loadDropdownData();
  }

  loadDropdownData(): void {
    this.patientService.getAllPatients().subscribe({
      next: data => this.patients = data,
      error: error => {
        this.errorMessage = 'Failed to load patients for dropdown.';
        console.error('Error loading patients:', error);
      }
    });
    this.doctorService.getAllDoctors().subscribe({
      next: data => this.doctors = data,
      error: error => {
        this.errorMessage = 'Failed to load doctors for dropdown.';
        console.error('Error loading doctors:', error);
      }
    });
    this.serviceService.getAllServices().subscribe({
      next: data => this.services = data,
      error: error => {
        this.errorMessage = 'Failed to load services for dropdown.';
        console.error('Error loading services:', error);
      }
    });
  }

  saveAppointment(form: NgForm): void {
    this.isSaving = true;
    this.successMessage = null;
    this.errorMessage = null;

    if (form.valid) {
      // Construct the object to send. It should match your backend's expected Appointment model.
      // Since your frontend Appointment model is flat, we send it directly.
      const appointmentToSend: Appointment = {
        ...this.appointment,
        appointmentStatus: this.appointment.appointmentStatus.toUpperCase() as Appointment['appointmentStatus'],
        paymentStatus: this.appointment.paymentStatus.toUpperCase() as Appointment['paymentStatus'],
        dateAppointment: this.appointment.dateAppointment instanceof Date
          ? this.appointment.dateAppointment.toISOString().split('T')[0]
          : this.appointment.dateAppointment,
        appointmentId: undefined,
        patientName: undefined,
        doctorName: undefined,
        partialAppointments: undefined
      };
      console.log('Appointment Payload:', appointmentToSend);
      this.appointmentApiService.addappointment(appointmentToSend).subscribe({
        next: response => {
          this.successMessage = response;
          this.errorMessage = null;
          // Reset the form after successful submission, using correct casing for defaults
          form.resetForm({
            patientId: '', // Reset dropdowns
            doctorId: '',
            serviceId: '',
            dateAppointment: '',
            startTime: '',
            endTime: '',
            appointmentStatus: 'SCHEDULED', // Use correct casing
            paymentStatus: 'PENDING',     // Use correct casing
            totalAmount: 0,
            description: '',
            isRelated: false
          });
        },
        error: error => {
          // Adjust error.error?.message based on your backend's actual error response format
          this.errorMessage = `Failed to add appointment: ${error.error?.message || error.message || 'Unknown error'}`;
          this.successMessage = null;
          console.error('Error adding appointment:', error);
        }
      }).add(() => {
        this.isSaving = false;
      });
    } else {
      this.errorMessage = 'Please fill in all required fields.';
      this.isSaving = false;
      // Optionally, mark all form controls as touched to display validation errors
      Object.values(form.controls).forEach(control => control.markAsTouched());
    }
  }

  cancel(): void {
    // Reset the form using correct casing for defaults
    this.appointmentFormRef.resetForm({
      patientId: '',
      doctorId: '',
      serviceId: '',
      dateAppointment: '',
      startTime: '',
      endTime: '',
      appointmentStatus: 'SCHEDULED', // Use correct casing
      paymentStatus: 'PENDING',     // Use correct casing
      totalAmount: 0,
      isRelated: false
    });
    this.successMessage = null;
    this.errorMessage = null;
  }
}