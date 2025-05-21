// src/app/cabinet-services/cabinet-service-add/cabinet-service-add.component.ts

import { Component, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs'; // For managing subscriptions

// Material Imports
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar'; // For notifications

// Your Service Model and Service
import { Service } from '../../../models/service';
import { ServiceService } from '../../../services/medical-service/service.service';

@Component({
  selector: 'app-cabinet-service-add',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './service-form.component.html',
  styleUrls: ['./service-form.component.css']
})
export class CabinetServiceAddComponent implements OnDestroy {
  service: Service = { // Initialize an empty service object
    serviceId: undefined, // Backend will generate this
    serviceName: '',
    description: '',
    price: 0 // Use null for number fields if they can be empty initially
  };

  isLoading: boolean = false;
  errorMessage: string = '';

  private readonly destroy$ = new Subject<void>(); // For managing subscriptions

  private router = inject(Router);
  private serviceService = inject(ServiceService);
  private snackBar = inject(MatSnackBar);

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  saveService(): void {
    // Optional: Add basic client-side validation
    if (!this.service.serviceName || this.service.price === null || this.service.price < 0) {
      this.errorMessage = 'Please fill in required fields (Service Name, Price) and ensure price is not negative.';
      this.snackBar.open(this.errorMessage, 'Close', { duration: 5000 });
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // Call the addService method from your service
    this.serviceService.addService(this.service).pipe(
      takeUntil(this.destroy$) // Unsubscribe when component is destroyed
    ).subscribe({
      next: (response: string) => { // IMPORTANT: Expect string or CabinetService based on ServiceService
        this.isLoading = false;
        this.snackBar.open(response || 'Service added successfully!', 'Close', { duration: 3000 });
        this.router.navigate(['/services']); // Navigate back to the service list
      },
      error: (error: any) => {
        this.isLoading = false;
        this.errorMessage = 'Failed to add service. Please try again.';
        console.error('Error adding service:', error);
        this.snackBar.open(this.errorMessage, 'Close', { duration: 5000 });
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/services']); // Navigate back to the service list
  }
}