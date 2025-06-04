import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, ReactiveFormsModule } from '@angular/forms'; // Key Reactive Forms imports
import { CommonModule } from '@angular/common'; // For ngIf, ngFor, etc.
import { ActivatedRoute, Router, RouterModule } from '@angular/router'; // For routing capabilities
import { MatSnackBar } from '@angular/material/snack-bar'; // For notifications
import { Subject, takeUntil } from 'rxjs'; // For managing subscriptions

// Angular Material Imports - these now go directly into the component's imports
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core'; // Provides the date adapter for MatDatepicker
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox'; // For isCustomPrice checkbox

// Your services and models - Adjust paths if necessary based on your project structure
import { Patient } from '../../../models/patient';
import { Doctor } from '../../../models/doctor';
import { CabinetService } from '../../../models/cabinet-service';
import { Appointment } from '../../../models/appointment'; // Your Appointment interface/model
import { appointmentService } from '../../../services/appointment/appointment.service';
import { PatientService } from '../../../services/patients/patient.service';
import { DoctorService } from '../../../services/doctor/doctor.service';
import { ServiceService } from '../../../services/medical-service/service.service'; // Assuming this service provides CabinetService data

@Component({
  selector: 'app-appointment-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule, // ⭐ Required for Reactive Forms ⭐
    // FormsModule, // Not needed for Reactive Forms, remove this if standalone:true
    MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatDatepickerModule,
    MatNativeDateModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, MatCheckboxModule,
    RouterModule // If you navigate or link using router
  ],
  templateUrl: './appointment-form.component.html',
  styleUrls: ['./appointment-form.component.css']
})
export class AppointmentFormComponent implements OnInit, OnDestroy {
  appointmentForm!: FormGroup; // ⭐ This is your main form group ⭐
  appointmentId: string | null = null; // Will be null for new appointment, ID for edit
  isSaving: boolean = false;
  isLoading: boolean = false; // For initial data loading
  successMessage: string | null = null;
  errorMessage: string | null = null;

  patients: Patient[] = [];
  doctors: Doctor[] = [];
  allCabinetServices: CabinetService[] = []; // ⭐ All available cabinet services for selection ⭐

  // For managing subscriptions
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder, // ⭐ Inject FormBuilder ⭐
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
    private appointmentApiService: appointmentService,
    private patientService: PatientService,
    private doctorService: DoctorService,
    private cabinetServiceService: ServiceService // Use the correct service name
  ) {}

  ngOnInit(): void {
    this.initForm(); // Initialize the form structure

    // Load dropdown data (patients, doctors, all services)
    this.loadDropdownData();

    // Check if we are in edit mode (has appointment ID in route)
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.appointmentId = id;
        this.loadAppointmentForEdit(this.appointmentId);
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

    // ⭐ Subscribe to services changes to recalculate totalAmount if not custom price ⭐
    this.servicesFormArray.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      if (!this.appointmentForm.get('isCustomPrice')?.value) {
        this.calculateAndSetTotalAmount();
      }
    });
  }

  initForm(): void {
    this.appointmentForm = this.fb.group({
      // --- Basic Appointment Details ---
      appointmentId: [{ value: '', disabled: true }], // For display/edit mode, will be set on load
      patientId: ['', Validators.required],
      doctorId: ['', Validators.required],
      dateAppointment: ['', Validators.required], // Store as Date object initially for MatDatepicker
      startTime: ['', Validators.required],
      endTime: ['', Validators.required],
      appointmentStatus: ['PENDING', Validators.required], // Default to PENDING
      paymentStatus: ['PENDING', Validators.required], // Default to 
      description: [''],
      isRelated: [false],

      // ⭐ New Custom Price and Total Amount fields ⭐
      isCustomPrice: [false], // Default: calculate price from services
      totalAmount: [{ value: 0, disabled: true }, [Validators.required, Validators.min(0)]], // Disabled by default

      // ⭐ Services FormArray ⭐
      services: this.fb.array([]) // Initialize as an empty FormArray
    });
  }

  loadDropdownData(): void {
    this.isLoading = true;
    // Use forkJoin if you want to load all simultaneously and handle loading state once
    this.patientService.getAllPatients().pipe(takeUntil(this.destroy$)).subscribe({
      next: data => this.patients = data,
      error: error => { this.errorMessage = 'Failed to load patients.'; console.error(error); }
    });
    this.doctorService.getAllDoctors().pipe(takeUntil(this.destroy$)).subscribe({
      next: data => this.doctors = data,
      error: error => { this.errorMessage = 'Failed to load doctors.'; console.error(error); }
    });
    this.cabinetServiceService.getAllServices().pipe(takeUntil(this.destroy$)).subscribe({ // Use correct service name
      next: data => { this.allCabinetServices = data; this.isLoading = false; },
      error: error => { this.errorMessage = 'Failed to load services.'; console.error(error); this.isLoading = false; }
    });
  }

  loadAppointmentForEdit(id: string): void {
    this.isLoading = true;
    this.appointmentApiService.getappointmentById(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (appointment) => {
        if (appointment) {
          this.appointmentForm.patchValue({
            appointmentId: appointment.appointmentId,
            patientId: appointment.patientId,
            doctorId: appointment.doctorId,
            // Convert date string from backend to Date object for MatDatepicker
            dateAppointment: appointment.dateAppointment ? new Date(appointment.dateAppointment) : null,
            startTime: appointment.startTime,
            endTime: appointment.endTime,
            appointmentStatus: appointment.appointmentStatus,
            paymentStatus: appointment.paymentStatus,
            description: appointment.description,
            isRelated: appointment.isRelated,
            isCustomPrice: appointment.isCustomPrice,
            totalAmount: appointment.totalAmount // Always patch totalAmount
          });

          // ⭐ Populate services FormArray from loaded data ⭐
          this.servicesFormArray.clear(); // Clear any default empty group
          if (appointment.services && appointment.services.length > 0) {
            appointment.services.forEach(service => {
              this.addService(service); // Add existing services with their data
            });
          }

          // Trigger isCustomPrice valueChanges manually to set initial state of totalAmount control
          this.appointmentForm.get('isCustomPrice')?.updateValueAndValidity({ emitEvent: true });

          this.isLoading = false;
        } else {
          this.errorMessage = 'Appointment not found.';
          this.snackBar.open(this.errorMessage, 'Dismiss', { duration: 3000, panelClass: ['error-snackbar'] });
          this.router.navigate(['/appointments']); // Or wherever you list appointments
          this.isLoading = false;
        }
      },
      error: (err) => {
        this.errorMessage = 'Failed to load appointment: ' + (err.error?.message || err.message || 'Error');
        this.snackBar.open(this.errorMessage, 'Dismiss', { duration: 3000, panelClass: ['error-snackbar'] });
        this.router.navigate(['/appointments']);
        this.isLoading = false;
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
    services.forEach((service: CabinetService) => { // Assuming CabinetService interface has 'price'
      if (service.price) {
        calculatedTotal += service.price;
      }
    });
    // Set the value without emitting event to prevent infinite loop (valueChanges -> calculate -> setValue -> valueChanges)
    this.appointmentForm.get('totalAmount')?.setValue(calculatedTotal, { emitEvent: false });
    this.appointmentForm.get('totalAmount')?.updateValueAndValidity(); // Ensure validators run
  }

  // Handle service selection from dropdown (if you have one for each service in the list)
  // This is typically used when you select an existing service from a master list
  onServiceSelected(index: number): void {
    const selectedServiceId = this.servicesFormArray.at(index).get('serviceId')?.value;
    const selectedService = this.allCabinetServices.find(s => s.serviceId === selectedServiceId);

    if (selectedService) {
      // Patch other fields of the specific service group in the form array
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


  saveAppointment(): void {
    this.appointmentForm.markAllAsTouched(); // Mark all controls touched to show validation errors
    this.successMessage = null;
    this.errorMessage = null;

    if (this.appointmentForm.invalid) {
      this.errorMessage = 'Please correct all form errors.';
      this.snackBar.open(this.errorMessage, 'Dismiss', { duration: 5000, panelClass: ['error-snackbar'] });
      return;
    }

    this.isSaving = true;
    const formValue = this.appointmentForm.getRawValue(); // Get all values, including disabled ones

    // Construct the payload to send to the backend, matching the Appointment interface
    const appointmentToSend: Appointment = {
      appointmentId: this.appointmentId || undefined, // Send ID if editing, undefined for new
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

      // TotalAmount will be correct as per isCustomPrice logic in the form
      totalAmount: formValue.totalAmount, // Get raw value, as it might be disabled but hold a value
      paidAmount: formValue.paidAmount || 0, // Ensure paidAmount is sent (default 0)

      services: formValue.services, // Send the array of services
      // Derived fields or fields handled by backend (set to undefined to not send)
      patientName: undefined,
      doctorName: undefined,
      serviceName: undefined, // Single service name/ID not needed in payload if list is source
      serviceId: undefined,
      invoiceId: undefined,
      invoices: undefined,
      partialAppointments: undefined
    };

    // Determine if adding or updating
    const apiCall = this.appointmentId
      ? this.appointmentApiService.updateappointment(this.appointmentId, appointmentToSend)
      : this.appointmentApiService.addappointment(appointmentToSend);

    apiCall.pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        this.successMessage = response;
        this.errorMessage = null;
        this.snackBar.open(this.successMessage, 'Close', { duration: 3000 });
        if (!this.appointmentId) { // Only reset form for new appointment creation
          this.appointmentForm.reset({
            appointmentStatus: 'PENDING',
            paymentStatus: 'PENDING',
            isRelated: false,
            isCustomPrice: false,
            totalAmount: 0 // Reset totalAmount
          });
          this.servicesFormArray.clear(); // Clear services array
        }
        this.router.navigate(['/appointments']); // Navigate to list view or details
      },
      error: (error) => {
        this.errorMessage = `Failed to save appointment: ${error.error?.message || error.message || 'Unknown error'}`;
        this.successMessage = null;
        this.snackBar.open(this.errorMessage, 'Dismiss', { duration: 5000, panelClass: ['error-snackbar'] });
        console.error('Error saving appointment:', error);
      }
    }).add(() => {
      this.isSaving = false;
    });
  }

  cancel(): void {
    // Navigate back or reset based on context
    this.router.navigate(['/appointments']);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}