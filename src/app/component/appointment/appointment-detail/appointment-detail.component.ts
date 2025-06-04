// src/app/appointment-detail/appointment-detail.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core'; // Removed ViewChild for NgForm
import { FormBuilder, FormGroup, Validators, FormArray, ReactiveFormsModule } from '@angular/forms'; // Reactive Forms imports
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common'; // For ngIf, ngFor, etc.
import { Subject, forkJoin } from 'rxjs'; // For managing subscriptions and parallel loads
import { takeUntil } from 'rxjs/operators'; // For RxJS operators

// Angular Material Imports (ensure all are imported for standalone)
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
import { Appointment } from '../../../models/appointment'; // Your Appointment interface
import { CabinetService } from '../../../models/cabinet-service';
import { Patient } from '../../../models/patient';
import { Doctor } from '../../../models/doctor';

import { appointmentService } from '../../../services/appointment/appointment.service';
import { PatientService } from '../../../services/patients/patient.service';
import { DoctorService } from '../../../services/doctor/doctor.service';
import { ServiceService } from '../../../services/medical-service/service.service'; // Assuming this provides CabinetService data


@Component({
  selector: 'app-appointment-detail',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule, // ⭐ Required for Reactive Forms ⭐
    // FormsModule, // Not needed for Reactive Forms, remove this
    RouterModule,
    MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatDatepickerModule,
    MatNativeDateModule, MatCheckboxModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './appointment-detail.component.html', // This template will be the "edit" form
  styleUrls: ['./appointment-detail.component.css']
})
export class AppointmentDetailComponent implements OnInit, OnDestroy {
  appointmentForm!: FormGroup; // ⭐ Main FormGroup for Reactive Forms ⭐
  appointmentId: string | null = null; // ID of the appointment being edited

  patients: Patient[] = [];
  doctors: Doctor[] = [];
  allCabinetServices: CabinetService[] = []; // All available cabinet services for selection

  isSaving: boolean = false;
  isLoading: boolean = true; // For initial data load
  errorMessage: string | null = null;
  successMessage: string | null = null;

  private destroy$ = new Subject<void>(); // For managing RxJS subscriptions

  constructor(
    private fb: FormBuilder, // ⭐ Inject FormBuilder ⭐
    private appointmentApiService: appointmentService,
    private patientService: PatientService,
    private doctorService: DoctorService,
    private cabinetServiceService: ServiceService, // Use the correct service name
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.initForm(); // Initialize the form structure

    // Load all necessary dropdown data (patients, doctors, all services) in parallel
    this.isLoading = true;
    this.errorMessage = null;

    forkJoin([
      this.patientService.getAllPatients(),
      this.doctorService.getAllDoctors(),
      this.cabinetServiceService.getAllServices() // Use cabinetServiceService here
    ]).pipe(takeUntil(this.destroy$)).subscribe({
      next: ([patients, doctors, services]) => {
        this.patients = patients;
        this.doctors = doctors;
        this.allCabinetServices = services; // Store all available services
        this.isLoading = false;

        // Dependencies loaded, now load the specific appointment for editing
        this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
          const id = params.get('id');
          if (id) {
            this.appointmentId = id;
            this.loadAppointment(this.appointmentId);
          } else {
            this.errorMessage = 'No appointment ID provided for editing.';
            this.snackBar.open(this.errorMessage, 'Dismiss', { duration: 3000, panelClass: ['snackbar-error'] });
            this.router.navigate(['/appointments']);
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

    // ⭐ Subscribe to isCustomPrice changes to toggle totalAmount field ⭐
    this.appointmentForm.get('isCustomPrice')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(isCustom => {
      const totalAmountControl = this.appointmentForm.get('totalAmount');
      if (totalAmountControl) {
        if (isCustom) {
          totalAmountControl.enable(); // Enable totalAmount for custom input
          totalAmountControl.setValidators([Validators.required, Validators.min(0)]);
        } else {
          totalAmountControl.disable(); // Disable totalAmount for calculated value
          this.calculateAndSetTotalAmount(); // Recalculate when switching off custom price
          totalAmountControl.setValidators([]); // Remove validators when disabled
        }
        totalAmountControl.updateValueAndValidity(); // Re-run validation
      }
    });

    // ⭐ Subscribe to services FormArray changes to recalculate totalAmount if not custom price ⭐
    this.servicesFormArray.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      if (!this.appointmentForm.get('isCustomPrice')?.value) {
        this.calculateAndSetTotalAmount();
      }
    });
  }

  // ⭐ Initialize the Reactive Form structure ⭐
  initForm(): void {
    this.appointmentForm = this.fb.group({
      appointmentId: [{ value: '', disabled: true }], // Display, not editable by user
      patientId: ['', Validators.required],
      doctorId: ['', Validators.required],
      // Using null for date/time fields initially, will be patched from backend
      dateAppointment: [null, Validators.required], // Will hold Date object for MatDatepicker
      startTime: ['', Validators.required],
      endTime: ['', Validators.required],
      appointmentStatus: ['PENDING', Validators.required],
      paymentStatus: ['PENDING', Validators.required], // Default for new appointments
      description: [''],
      isRelated: [false],

      isCustomPrice: [false], // Default: calculate price from services
      // totalAmount disabled by default, will be enabled by isCustomPrice change listener
      totalAmount: [{ value: 0, disabled: true }, [Validators.required, Validators.min(0)]],
      paidAmount: [0, Validators.min(0)], // Can be partially paid

      // ⭐ FormArray for dynamically adding/removing services ⭐
      services: this.fb.array([])
    });
  }

  // ⭐ Method to load existing appointment data for editing ⭐
  loadAppointment(id: string): void {
    this.isLoading = true; // Keep loading true during this specific fetch
    this.errorMessage = null;

    this.appointmentApiService.getappointmentById(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (dataFromBackend) => {
        if (dataFromBackend) {
          // IMPORTANT: Map backend DTO to form structure
          this.appointmentForm.patchValue({
            appointmentId: dataFromBackend.appointmentId,
            patientId: dataFromBackend.patientId,
            doctorId: dataFromBackend.doctorId,
            // Convert date string from backend to Date object for MatDatepicker
            dateAppointment: dataFromBackend.dateAppointment ? new Date(dataFromBackend.dateAppointment) : null,
            startTime: dataFromBackend.startTime,
            endTime: dataFromBackend.endTime,
            appointmentStatus: dataFromBackend.appointmentStatus,
            paymentStatus: dataFromBackend.paymentStatus,
            description: dataFromBackend.description,
            isRelated: dataFromBackend.isRelated,
            isCustomPrice: dataFromBackend.isCustomPrice,
            totalAmount: dataFromBackend.totalAmount, // This is always patched
            paidAmount: dataFromBackend.paidAmount || 0 // Default to 0 if null/undefined
          });

          // ⭐ Populate services FormArray from loaded data ⭐
          this.servicesFormArray.clear(); // Clear any default empty group
          if (dataFromBackend.services && dataFromBackend.services.length > 0) {
            dataFromBackend.services.forEach(service => {
              this.addService(service); // Add existing services with their data
            });
          }

          // Trigger isCustomPrice valueChanges manually after patching, to set initial state of totalAmount control
          this.appointmentForm.get('isCustomPrice')?.updateValueAndValidity({ emitEvent: true });

          this.isLoading = false; // Finished loading appointment data
        } else {
          this.errorMessage = 'Appointment not found.';
          this.snackBar.open(this.errorMessage, 'Dismiss', { duration: 3000, panelClass: ['snackbar-error'] });
          this.router.navigate(['/appointments']);
          this.isLoading = false;
        }
      },
      error: (err) => {
        this.errorMessage = `Failed to load appointment with ID ${id} for editing: ${err.error?.message || err.message || 'Error'}`;
        this.isLoading = false;
        console.error('Error loading appointment for edit:', err);
        this.snackBar.open('Error loading appointment details!', 'Close', { duration: 3000, panelClass: ['snackbar-error'] });
        this.router.navigate(['/appointments']);
      }
    });
  }

  // ⭐ Helper getter for easy access to the services FormArray in the template ⭐
  get servicesFormArray(): FormArray {
    return this.appointmentForm.get('services') as FormArray;
  }

  // ⭐ Method to add a new service form group to the FormArray ⭐
  addService(service?: CabinetService): void {
    this.servicesFormArray.push(this.fb.group({
      serviceId: [service ? service.serviceId : '', Validators.required],
      serviceName: [service ? service.serviceName : '', Validators.required],
      price: [service ? service.price : 0, [Validators.required, Validators.min(0)]]
    }));
  }

  // ⭐ Method to remove a service form group from the FormArray ⭐
  removeService(index: number): void {
    this.servicesFormArray.removeAt(index);
    // Recalculation will be triggered by valueChanges listener on servicesFormArray
  }

  // ⭐ Method to calculate total amount from services and set it on the form ⭐
  calculateAndSetTotalAmount(): void {
    const services = this.servicesFormArray.value; // Get current values of services in the array
    let calculatedTotal = 0;
    services.forEach((service: CabinetService) => {
      if (service.price) { // Ensure price is a valid number before adding
        calculatedTotal += service.price;
      }
    });
    // Set the value without emitting event to prevent infinite loop (valueChanges -> calculate -> setValue -> valueChanges)
    this.appointmentForm.get('totalAmount')?.setValue(calculatedTotal, { emitEvent: false });
    this.appointmentForm.get('totalAmount')?.updateValueAndValidity(); // Ensure validators run
  }

  // Handle service selection from dropdown (if you have one for each service in the list)
  onServiceSelected(index: number): void {
    const selectedServiceId = this.servicesFormArray.at(index).get('serviceId')?.value;
    const selectedService = this.allCabinetServices.find(s => s.serviceId === selectedServiceId);

    if (selectedService) {
      this.servicesFormArray.at(index).patchValue({
        serviceName: selectedService.serviceName,
        price: selectedService.price
      });
    } else {
      // Clear fields if service not found or selection is cleared
      this.servicesFormArray.at(index).patchValue({
        serviceName: '',
        price: 0
      });
    }
    // Recalculation will be triggered by valueChanges listener
  }


  // ⭐ Method to save (update) the appointment ⭐
  saveAppointment(): void {
    this.appointmentForm.markAllAsTouched(); // Mark all controls touched to show validation errors
    this.successMessage = null;
    this.errorMessage = null;

    if (this.appointmentForm.invalid) {
      this.errorMessage = 'Please correct all form errors.';
      this.snackBar.open(this.errorMessage, 'Dismiss', { duration: 5000, panelClass: ['snackbar-error'] });
      return;
    }

    this.isSaving = true;
    const formValue = this.appointmentForm.getRawValue(); // Get all values, including disabled ones

    // Construct the payload to send to the backend, matching the Appointment interface
    const appointmentToSend: Appointment = {
      appointmentId: this.appointmentId || undefined, // Send ID for update
      patientId: formValue.patientId,
      doctorId: formValue.doctorId,
      description: formValue.description,
      isRelated: formValue.isRelated,
      isCustomPrice: formValue.isCustomPrice, // Send this flag

      // Convert Date object from MatDatepicker to string for backend
      dateAppointment: formValue.dateAppointment ? formValue.dateAppointment.toISOString().split('T')[0] : '',
      startTime: formValue.startTime,
      endTime: formValue.endTime,
      appointmentStatus: formValue.appointmentStatus,
      paymentStatus: formValue.paymentStatus,

      totalAmount: formValue.totalAmount, // Get raw value, as it might be disabled but hold a value
      paidAmount: formValue.paidAmount || 0, // Ensure paidAmount is sent (default 0)

      services: formValue.services, // Send the array of services

      // Set derived or backend-only fields to undefined so they are not sent in the update payload
      patientName: undefined, doctorName: undefined, serviceName: undefined, serviceId: undefined,
      invoiceId: undefined, invoices: undefined, partialAppointments: undefined
    };

    // Call the updateAppointment service method
    this.appointmentApiService.updateappointment(this.appointmentId!, appointmentToSend).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.successMessage = response;
        this.errorMessage = null;
        this.snackBar.open(this.successMessage, 'Close', { duration: 3000 });
        this.router.navigate(['/appointments']); // Navigate back to list after update
      },
      error: (error) => {
        this.errorMessage = `Failed to save appointment: ${error.error?.message || error.message || 'Unknown error'}`;
        this.successMessage = null;
        this.snackBar.open(this.errorMessage, 'Dismiss', { duration: 5000, panelClass: ['snackbar-error'] });
        console.error('Error saving appointment:', error);
      }
    }).add(() => {
      this.isSaving = false;
    });
  }

  // Navigate back to the appointment list
  cancel(): void {
    this.router.navigate(['/appointments']);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}