import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

// RxJS imports for reactive approach
import { Subject, switchMap, takeUntil } from 'rxjs'; // Removed 'of' as we won't create a new empty service

// Angular Material Imports
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

// Your Service Model and Service
import { Service } from '../../../models/service';
import { ServiceService } from '../../../services/medical-service/service.service';
@Component({
  selector: 'app-cabinet-service-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './service-detail.component.html',
  styleUrls: ['./service-detail.component.css']
})
export class CabinetServiceDetailComponent implements OnInit, OnDestroy {
  serviceId: string | null = null;
  service: Service | null = null; // Initialize as null as it must be loaded
  isLoading: boolean = true; // Start as true as we're always loading initially
  errorMessage: string = '';

  private readonly destroy$ = new Subject<void>(); // Used for managing subscriptions

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private serviceService = inject(ServiceService);
  private snackBar = inject(MatSnackBar);

  ngOnInit(): void {
    this.route.paramMap.pipe(
      switchMap(params => {
        this.serviceId = params.get('id');
        this.isLoading = true; // Set loading to true when starting a new load operation
        this.errorMessage = ''; // Clear previous errors
        this.service = null; // Clear previous service data

        if (!this.serviceId) {
          this.errorMessage = 'No service ID provided for editing.';
          this.isLoading = false;
          // Optionally, redirect if no ID is found
          this.router.navigate(['/services']);
          return new Subject<Service>(); // Return a non-emitting observable to stop the flow
        }
        // If ID is present, fetch the service
        return this.serviceService.getServiceById(this.serviceId);
      }),
      takeUntil(this.destroy$) // Unsubscribe when component is destroyed
    ).subscribe({
      next: (serviceData) => {
        this.isLoading = false;
        this.service = serviceData; // Assign loaded service data
      },
      error: (error: any) => {
        this.isLoading = false;
        this.errorMessage = 'Failed to load service details. Service may not exist or an error occurred.';
        console.error('Error loading service:', error);
        this.snackBar.open(this.errorMessage, 'Close', { duration: 5000 });
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  saveService(): void {
    // Only proceed if service data and ID are available (i.e., in edit mode)
    if (!this.service || !this.service.serviceId) {
      this.snackBar.open('Cannot save: Service data or ID is missing.', 'Close', { duration: 3000 });
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // Always call updateService as this component is for editing only
    this.serviceService.updateService(this.service.serviceId, this.service).pipe(
      takeUntil(this.destroy$) // Unsubscribe on component destroy
    ).subscribe({
      next: (response: string) => { // Expect CabinetService object back
        this.isLoading = false;
        this.snackBar.open('Service updated successfully!', 'Close', { duration: 3000 });
        this.router.navigate(['/services']); // Navigate back to list after save
      },
      error: (error: any) => {
        this.isLoading = false;
        this.errorMessage = 'Failed to update service. Please try again.';
        console.error('Error updating service:', error);
        this.snackBar.open(this.errorMessage, 'Close', { duration: 5000 });
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/services']); // Navigate back to the service list
  }
}