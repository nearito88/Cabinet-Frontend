import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormArray, FormControl } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Observable, map, startWith } from 'rxjs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';


@Component({
  selector: 'app-service-form',
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
    MatSlideToggleModule,
    MatChipsModule,
    MatAutocompleteModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>{{ isEditMode ? 'Edit Service' : 'Add New Service' }}</mat-card-title>
          <button mat-raised-button color="primary" routerLink="/panel/medical-services">
            <mat-icon>arrow_back</mat-icon> Back to List
          </button>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="serviceForm" (ngSubmit)="onSubmit()">
            <div class="form-row">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Service Name</mat-label>
                <input matInput formControlName="name" required>
                <mat-error *ngIf="serviceForm.get('name')?.hasError('required')">
                  Service name is required
                </mat-error>
              </mat-form-field>
            </div>
            
            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Category</mat-label>
                <mat-select formControlName="category" required>
                  <mat-option *ngFor="let category of categories" [value]="category">
                    {{category}}
                  </mat-option>
                </mat-select>
                <mat-error *ngIf="serviceForm.get('category')?.hasError('required')">
                  Category is required
                </mat-error>
              </mat-form-field>
              
              <mat-form-field appearance="outline">
                <mat-label>Duration (minutes)</mat-label>
                <input matInput type="number" formControlName="duration" min="1" required>
                <mat-error *ngIf="serviceForm.get('duration')?.hasError('required')">
                  Duration is required
                </mat-error>
                <mat-error *ngIf="serviceForm.get('duration')?.hasError('min')">
                  Duration must be at least 1 minute
                </mat-error>
              </mat-form-field>
              
              <mat-form-field appearance="outline">
                <mat-label>Price</mat-label>
                <input matInput type="number" formControlName="price" min="0" step="0.01" required>
                <span matTextPrefix>$&nbsp;</span>
                <mat-error *ngIf="serviceForm.get('price')?.hasError('required')">
                  Price is required
                </mat-error>
                <mat-error *ngIf="serviceForm.get('price')?.hasError('min')">
                  Price cannot be negative
                </mat-error>
              </mat-form-field>
            </div>
            
            <div class="form-row">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Description</mat-label>
                <textarea matInput formControlName="description" rows="3"></textarea>
              </mat-form-field>
            </div>
            
            <div class="form-row">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Assigned Doctors</mat-label>
                <mat-chip-grid #chipGrid aria-label="Select doctors" formArrayName="doctors">
                  <mat-chip-row 
                    *ngFor="let doctor of selectedDoctors.controls; let i = index"
                    (removed)="removeDoctor(i)">
                    {{doctor.value}}
                    <button matChipRemove>
                      <mat-icon>cancel</mat-icon>
                    </button>
                  </mat-chip-row>
                  <input 
                    placeholder="Add doctor..."
                    #doctorInput
                    [formControl]="doctorControl"
                    [matAutocomplete]="auto"
                    [matChipInputFor]="chipGrid"
                    (matChipInputTokenEnd)="addDoctor($event)">
                </mat-chip-grid>
                <mat-autocomplete #auto="matAutocomplete" (optionSelected)="selected($event)">
                  <mat-option *ngFor="let doctor of filteredDoctors | async" [value]="doctor">
                    {{doctor}}
                  </mat-option>
                </mat-autocomplete>
              </mat-form-field>
            </div>
            
            <div class="form-row">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Preparation Instructions</mat-label>
                <textarea matInput formControlName="preparationInstructions" rows="2"></textarea>
              </mat-form-field>
            </div>
            
            <div class="form-row">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Follow-up Instructions</mat-label>
                <textarea matInput formControlName="followUpInstructions" rows="2"></textarea>
              </mat-form-field>
            </div>
            
            <div class="form-row">
              <mat-slide-toggle formControlName="isActive">
                {{ serviceForm.get('isActive')?.value ? 'Active' : 'Inactive' }}
              </mat-slide-toggle>
            </div>
            
            <div class="form-actions">
              <button type="button" mat-button routerLink="/panel/medical-services">Cancel</button>
              <button type="submit" mat-raised-button color="primary" [disabled]="!serviceForm.valid || isSubmitting">
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
      flex-wrap: wrap;
    }
    .form-row mat-form-field {
      flex: 1;
      min-width: 200px;
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
    mat-chip {
      margin: 2px;
    }
    mat-spinner {
      display: inline-block;
      margin-right: 8px;
    }
    mat-slide-toggle {
      margin: 10px 0;
    }
  `]
})
export class ServiceFormComponent implements OnInit {
  serviceForm: FormGroup;
  isEditMode = false;
  isSubmitting = false;
  serviceId: string | null = null;
  
  // Mock data - in a real app, this would come from a service
  categories: string[] = ['Consultation', 'Dental', 'Ophthalmology', 'Lab Test', 'Vaccination'];
  allDoctors: string[] = [
    'Dr. John Doe',
    'Dr. Jane Smith',
    'Dr. Robert Johnson',
    'Dr. Sarah Williams',
    'Dr. Michael Brown'
  ];
  
  doctorControl = new FormControl('');
  filteredDoctors: Observable<string[]>;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.serviceForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      category: ['', Validators.required],
      duration: [30, [Validators.required, Validators.min(1)]],
      price: [0, [Validators.required, Validators.min(0)]],
      preparationInstructions: [''],
      followUpInstructions: [''],
      isActive: [true],
      doctors: this.fb.array([])
    });
    
    this.filteredDoctors = this.doctorControl.valueChanges.pipe(
      startWith(null),
      map((doctor: string | null) => 
        doctor ? this._filter(doctor) : this.allDoctors.slice()
      )
    );
  }

  
  get selectedDoctors() {
    return this.serviceForm.get('doctors') as FormArray;
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEditMode = true;
        this.serviceId = id;
        this.loadService(id);
      }
    });
  }
  
  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.allDoctors.filter(doctor => 
      doctor.toLowerCase().includes(filterValue)
    );
  }
  
  addDoctor(event: any): void {
    const value = (event.value || '').trim();
    
    // Add our doctor
    if (value && !this.selectedDoctors.value.includes(value)) {
      this.selectedDoctors.push(this.fb.control(value));
    }
    
    // Clear the input value
    event.chipInput!.clear();
    this.doctorControl.setValue(null);
  }
  
  removeDoctor(index: number): void {
    this.selectedDoctors.removeAt(index);
  }
  
  selected(event: any): void {
    const value = event.option.viewValue;
    if (value && !this.selectedDoctors.value.includes(value)) {
      this.selectedDoctors.push(this.fb.control(value));
    }
    this.doctorControl.setValue(null);
  }

  loadService(id: string): void {
    // TODO: Load service data from service
    // For now, we'll use mock data
    const mockService = {
      name: 'General Consultation',
      description: 'General medical consultation',
      category: 'Consultation',
      duration: 30,
      price: 100,
      preparationInstructions: 'No special preparation required.',
      followUpInstructions: 'Schedule a follow-up if symptoms persist.',
      isActive: true,
      doctors: ['Dr. John Doe', 'Dr. Jane Smith']
    };
    
    this.serviceForm.patchValue(mockService);
    
    // Set the doctors
    mockService.doctors.forEach(doctor => {
      this.selectedDoctors.push(this.fb.control(doctor));
    });
  }

  onSubmit(): void {
    if (this.serviceForm.valid) {
      this.isSubmitting = true;
      const formData = this.serviceForm.value;
      
      // TODO: Save service data using service
      console.log('Form submitted:', formData);
      
      // Simulate API call
      setTimeout(() => {
        this.isSubmitting = false;
        this.snackBar.open(
          `Service ${this.isEditMode ? 'updated' : 'added'} successfully!`,
          'Close',
          { duration: 3000 }
        );
        
        if (!this.isEditMode) {
          this.router.navigate(['/panel/medical-services']);
        }
      }, 1500);
    }
  }
}
