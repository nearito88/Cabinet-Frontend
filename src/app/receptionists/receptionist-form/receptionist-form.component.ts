import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-receptionist-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule
  ],
  template: `
    <div class="container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>{{ isEditMode ? 'Edit Receptionist' : 'Add New Receptionist' }}</mat-card-title>
          <button mat-raised-button color="primary" routerLink="/panel/receptionists">
            <mat-icon>arrow_back</mat-icon> Back to List
          </button>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="receptionistForm" (ngSubmit)="onSubmit()">
            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>First Name</mat-label>
                <input matInput formControlName="firstName" required>
                <mat-error *ngIf="receptionistForm.get('firstName')?.hasError('required')">
                  First name is required
                </mat-error>
              </mat-form-field>
              
              <mat-form-field appearance="outline">
                <mat-label>Last Name</mat-label>
                <input matInput formControlName="lastName" required>
                <mat-error *ngIf="receptionistForm.get('lastName')?.hasError('required')">
                  Last name is required
                </mat-error>
              </mat-form-field>
            </div>
            
            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Email</mat-label>
                <input matInput type="email" formControlName="email" required>
                <mat-error *ngIf="receptionistForm.get('email')?.hasError('required')">
                  Email is required
                </mat-error>
                <mat-error *ngIf="receptionistForm.get('email')?.hasError('email')">
                  Please enter a valid email
                </mat-error>
              </mat-form-field>
              
              <mat-form-field appearance="outline">
                <mat-label>Phone</mat-label>
                <input matInput formControlName="phone" required>
                <mat-error *ngIf="receptionistForm.get('phone')?.hasError('required')">
                  Phone is required
                </mat-error>
              </mat-form-field>
            </div>
            
            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Date of Birth</mat-label>
                <input matInput [matDatepicker]="picker" formControlName="dateOfBirth">
                <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
                <mat-datepicker #picker></mat-datepicker>
              </mat-form-field>
              
              <mat-form-field appearance="outline">
                <mat-label>Status</mat-label>
                <mat-select formControlName="isActive">
                  <mat-option [value]="true">Active</mat-option>
                  <mat-option [value]="false">Inactive</mat-option>
                </mat-select>
              </mat-form-field>
            </div>
            
            <div class="form-row">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Address</mat-label>
                <input matInput formControlName="address">
              </mat-form-field>
            </div>
            
            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>City</mat-label>
                <input matInput formControlName="city">
              </mat-form-field>
              
              <mat-form-field appearance="outline">
                <mat-label>State</mat-label>
                <input matInput formControlName="state">
              </mat-form-field>
              
              <mat-form-field appearance="outline">
                <mat-label>ZIP Code</mat-label>
                <input matInput formControlName="zipCode">
              </mat-form-field>
            </div>
            
            <div class="form-row">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Notes</mat-label>
                <textarea matInput formControlName="notes" rows="3"></textarea>
              </mat-form-field>
            </div>
            
            <div class="form-actions">
              <button type="button" mat-button routerLink="/panel/receptionists">Cancel</button>
              <button type="submit" mat-raised-button color="primary" [disabled]="!receptionistForm.valid || isSubmitting">
                <mat-icon *ngIf="!isSubmitting">{{ isEditMode ? 'save' : 'add' }}</mat-icon>
                <mat-spinner *ngIf="isSubmitting" diameter="20"></mat-spinner>
                {{ isSubmitting ? 'Saving...' : (isEditMode ? 'Update' : 'Save') }}
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .container {
      padding: 20px;
    }
    mat-card {
      max-width: 1000px;
      margin: 0 auto;
    }
    .form-row {
      display: flex;
      gap: 20px;
      margin-bottom: 20px;
    }
    .form-row mat-form-field {
      flex: 1;
    }
    .full-width {
      width: 100%;
    }
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 20px;
    }
    mat-spinner {
      display: inline-block;
      margin-right: 8px;
    }
  `]
})
export class ReceptionistFormComponent implements OnInit {
  receptionistForm: FormGroup;
  isEditMode = false;
  isSubmitting = false;
  receptionistId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.receptionistForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      dateOfBirth: [''],
      address: [''],
      city: [''],
      state: [''],
      zipCode: [''],
      isActive: [true],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEditMode = true;
        this.receptionistId = id;
        this.loadReceptionist(id);
      }
    });
  }

  loadReceptionist(id: string): void {
    // TODO: Load receptionist data from service
    // For now, we'll use mock data
    const mockReceptionist = {
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah.j@example.com',
      phone: '123-456-7890',
      dateOfBirth: new Date('1990-01-01'),
      address: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      isActive: true,
      notes: 'Senior receptionist with 5+ years of experience.'
    };
    this.receptionistForm.patchValue(mockReceptionist);
  }

  onSubmit(): void {
    if (this.receptionistForm.valid) {
      this.isSubmitting = true;
      const formData = this.receptionistForm.value;
      
      // TODO: Save receptionist data using service
      console.log('Form submitted:', formData);
      
      // Simulate API call
      setTimeout(() => {
        this.isSubmitting = false;
        this.snackBar.open(
          `Receptionist ${this.isEditMode ? 'updated' : 'added'} successfully!`,
          'Close',
          { duration: 3000 }
        );
        
        if (!this.isEditMode) {
          this.router.navigate(['/panel/receptionists']);
        }
      }, 1500);
    }
  }
}
