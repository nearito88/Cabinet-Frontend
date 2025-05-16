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

@Component({
  selector: 'app-doctor-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  template: `
    <div class="container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>{{ isEditMode ? 'Edit Doctor' : 'Add New Doctor' }}</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="doctorForm" (ngSubmit)="onSubmit()">
            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>First Name</mat-label>
                <input matInput formControlName="firstName" required>
                <mat-error *ngIf="doctorForm.get('firstName')?.hasError('required')">
                  First name is required
                </mat-error>
              </mat-form-field>
              
              <mat-form-field appearance="outline">
                <mat-label>Last Name</mat-label>
                <input matInput formControlName="lastName" required>
                <mat-error *ngIf="doctorForm.get('lastName')?.hasError('required')">
                  Last name is required
                </mat-error>
              </mat-form-field>
            </div>
            
            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Specialty</mat-label>
                <mat-select formControlName="specialty" required>
                  <mat-option *ngFor="let specialty of specialties" [value]="specialty">
                    {{specialty}}
                  </mat-option>
                </mat-select>
                <mat-error *ngIf="doctorForm.get('specialty')?.hasError('required')">
                  Specialty is required
                </mat-error>
              </mat-form-field>
              
              <mat-form-field appearance="outline">
                <mat-label>Phone</mat-label>
                <input matInput formControlName="phone" required>
                <mat-error *ngIf="doctorForm.get('phone')?.hasError('required')">
                  Phone is required
                </mat-error>
              </mat-form-field>
            </div>
            
            <div class="form-row">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Email</mat-label>
                <input matInput type="email" formControlName="email" required>
                <mat-error *ngIf="doctorForm.get('email')?.hasError('required')">
                  Email is required
                </mat-error>
                <mat-error *ngIf="doctorForm.get('email')?.hasError('email')">
                  Please enter a valid email
                </mat-error>
              </mat-form-field>
            </div>
            
            <div class="form-actions">
              <button type="button" mat-button routerLink="/panel/doctors">Cancel</button>
              <button type="submit" mat-raised-button color="primary" [disabled]="!doctorForm.valid">
                {{ isEditMode ? 'Update' : 'Save' }}
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
      max-width: 800px;
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
  `]
})
export class DoctorFormComponent implements OnInit {
  doctorForm: FormGroup;
  isEditMode = false;
  doctorId: string | null = null;
  
  specialties = [
    'Cardiology',
    'Dermatology',
    'Neurology',
    'Pediatrics',
    'Orthopedics',
    'Ophthalmology',
    'Psychiatry',
    'Urology'
  ];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.doctorForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      specialty: ['', Validators.required],
      phone: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      dateOfBirth: [''],
      address: [''],
      city: [''],
      state: [''],
      zipCode: [''],
      bio: ['']
    });
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEditMode = true;
        this.doctorId = id;
        this.loadDoctor(id);
      }
    });
  }

  loadDoctor(id: string): void {
    // TODO: Load doctor data from service
    // For now, we'll use mock data
    const mockDoctor = {
      firstName: 'John',
      lastName: 'Doe',
      specialty: 'Cardiology',
      phone: '123-456-7890',
      email: 'john.doe@example.com'
    };
    this.doctorForm.patchValue(mockDoctor);
  }

  onSubmit(): void {
    if (this.doctorForm.valid) {
      const formData = this.doctorForm.value;
      // TODO: Save doctor data using service
      console.log('Form submitted:', formData);
      
      // After successful save, navigate back to the list
      this.router.navigate(['/panel/doctors']);
    }
  }
}
