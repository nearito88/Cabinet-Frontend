import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';

interface MedicalService {
  id: string;
  name: string;
  description: string;
  category: string;
  duration: number; // in minutes
  price: number;
  isActive: boolean;
  doctors: string[];
}

@Component({
  selector: 'app-services-list',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule,
    MatDividerModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatMenuModule,
    MatFormFieldModule,
    MatInputModule,
    MatPaginatorModule,
    MatChipsModule,
    MatTooltipModule
  ],
  template: `
    <div class="container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Medical Services</mat-card-title>
          <div class="header-actions">
            <button mat-button [matMenuTriggerFor]="categoryMenu">
              <mat-icon>category</mat-icon> Categories
            </button>
            <mat-menu #categoryMenu="matMenu">
              <button mat-menu-item [routerLink]="['/panel/medical-services/categories']">
                <mat-icon>list</mat-icon> Manage Categories
              </button>
              <mat-divider></mat-divider>
              <button mat-menu-item (click)="filterByCategory('all')">
                All Categories
              </button>
              <button mat-menu-item *ngFor="let category of categories" (click)="filterByCategory(category)">
                {{category}}
              </button>
            </mat-menu>
            <button mat-raised-button color="primary" [routerLink]="['/panel/medical-services/new']">
              <mat-icon>add</mat-icon> Add Service
            </button>
          </div>
        </mat-card-header>
        <mat-card-content>
          <div class="table-container">
            <div class="table-actions">
              <mat-form-field appearance="outline" class="search-field">
                <mat-label>Search services</mat-label>
                <input matInput placeholder="Search by name or description..." (keyup)="applyFilter($event)">
                <mat-icon matSuffix>search</mat-icon>
              </mat-form-field>
              
              <button mat-button [matMenuTriggerFor]="filterMenu">
                <mat-icon>filter_list</mat-icon> Filter
              </button>
              <mat-menu #filterMenu="matMenu">
                <button mat-menu-item (click)="filterByStatus('active')">
                  <mat-icon>check_circle</mat-icon> Active
                </button>
                <button mat-menu-item (click)="filterByStatus('inactive')">
                  <mat-icon>cancel</mat-icon> Inactive
                </button>
                <button mat-menu-item (click)="clearFilters()">
                  <mat-icon>clear_all</mat-icon> Clear Filters
                </button>
              </mat-menu>
            </div>
            
            <table mat-table [dataSource]="filteredServices">
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>Service Name</th>
                <td mat-cell *matCellDef="let service">{{service.name}}</td>
              </ng-container>
              
              <ng-container matColumnDef="category">
                <th mat-header-cell *matHeaderCellDef>Category</th>
                <td mat-cell *matCellDef="let service">
                  <span class="category-badge">{{service.category}}</span>
                </td>
              </ng-container>
              
              <ng-container matColumnDef="duration">
                <th mat-header-cell *matHeaderCellDef>Duration</th>
                <td mat-cell *matCellDef="let service">
                  {{service.duration}} min
                </td>
              </ng-container>
              
              <ng-container matColumnDef="price">
                <th mat-header-cell *matHeaderCellDef>Price</th>
                <td mat-cell *matCellDef="let service">
                  {{service.price | currency}}
                </td>
              </ng-container>
              
              <ng-container matColumnDef="doctors">
                <th mat-header-cell *matHeaderCellDef>Doctors</th>
                <td mat-cell *matCellDef="let service">
                  <div class="doctors-list">
                    <mat-chip-set>
                      <mat-chip *ngFor="let doctor of service.doctors.slice(0, 2)">
                        {{doctor}}
                      </mat-chip>
                      <mat-chip *ngIf="service.doctors.length > 2" matTooltip="{{getAdditionalDoctors(service)}}">
                        +{{service.doctors.length - 2}} more
                      </mat-chip>
                    </mat-chip-set>
                  </div>
                </td>
              </ng-container>
              
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let service">
                  <span class="status-badge" [class.active]="service.isActive">
                    {{ service.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </td>
              </ng-container>
              
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let service">
                  <button mat-icon-button [matMenuTriggerFor]="actionMenu" (click)="$event.stopPropagation()">
                    <mat-icon>more_vert</mat-icon>
                  </button>
                  <mat-menu #actionMenu="matMenu">
                    <button mat-menu-item [routerLink]="['/panel/medical-services', service.id, 'edit']">
                      <mat-icon>edit</mat-icon> Edit
                    </button>
                    <button mat-menu-item (click)="toggleStatus(service)">
                      <mat-icon>{{ service.isActive ? 'toggle_off' : 'toggle_on' }}</mat-icon>
                      {{ service.isActive ? 'Deactivate' : 'Activate' }}
                    </button>
                    <button mat-menu-item class="delete-action" (click)="deleteService(service)">
                      <mat-icon>delete</mat-icon> Delete
                    </button>
                  </mat-menu>
                </td>
              </ng-container>
              
              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr 
                mat-row 
                *matRowDef="let row; columns: displayedColumns;"
                [routerLink]="['/panel/medical-services', row.id]"
                class="clickable-row">
              </tr>
              
              <tr class="mat-row" *matNoDataRow>
                <td class="mat-cell no-data" [colSpan]="displayedColumns.length">
                  No services found
                </td>
              </tr>
            </table>
            
            <mat-paginator 
              [length]="services.length"
              [pageSize]="10"
              [pageSizeOptions]="[5, 10, 25, 100]"
              aria-label="Select page">
            </mat-paginator>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .container {
      padding: 20px;
    }
    mat-card {
      max-width: 1200px;
      margin: 0 auto;
    }
    .header-actions {
      display: flex;
      gap: 10px;
      margin-left: auto;
    }
    .table-container {
      overflow-x: auto;
    }
    .table-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      flex-wrap: wrap;
      gap: 15px;
    }
    .search-field {
      min-width: 300px;
    }
    .category-badge {
      background-color: #e3f2fd;
      color: #1976d2;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }
    .status-badge {
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
      background-color: #f5f5f5;
      color: #666;
    }
    .status-badge.active {
      background-color: #e8f5e9;
      color: #2e7d32;
    }
    .doctors-list {
      max-width: 200px;
    }
    .clickable-row {
      cursor: pointer;
    }
    .clickable-row:hover {
      background-color: #f5f5f5;
    }
    .no-data {
      text-align: center;
      padding: 20px;
      color: #666;
    }
    .delete-action {
      color: #f44336;
    }
    mat-paginator {
      margin-top: 20px;
    }
  `]
})
export class ServicesListComponent {
  displayedColumns: string[] = ['name', 'category', 'duration', 'price', 'doctors', 'status', 'actions'];
  services: MedicalService[] = [
    { 
      id: '1', 
      name: 'General Consultation', 
      description: 'General medical consultation',
      category: 'Consultation',
      duration: 30,
      price: 100,
      isActive: true,
      doctors: ['Dr. John Doe', 'Dr. Jane Smith']
    },
    { 
      id: '2', 
      name: 'Dental Checkup', 
      description: 'Routine dental examination',
      category: 'Dental',
      duration: 45,
      price: 150,
      isActive: true,
      doctors: ['Dr. Robert Johnson']
    },
    { 
      id: '3', 
      name: 'Eye Examination', 
      description: 'Complete eye examination',
      category: 'Ophthalmology',
      duration: 60,
      price: 120,
      isActive: false,
      doctors: ['Dr. Sarah Williams', 'Dr. Michael Brown']
    },
  ];
  filteredServices: MedicalService[] = [];
  categories: string[] = ['Consultation', 'Dental', 'Ophthalmology', 'Lab Test', 'Vaccination'];

  constructor() {
    this.filteredServices = [...this.services];
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredServices = this.services.filter(service => 
      service.name.toLowerCase().includes(filterValue) ||
      service.description.toLowerCase().includes(filterValue) ||
      service.category.toLowerCase().includes(filterValue)
    );
  }

  filterByCategory(category: string): void {
    if (category === 'all') {
      this.filteredServices = [...this.services];
    } else {
      this.filteredServices = this.services.filter(service => 
        service.category === category
      );
    }
  }

  filterByStatus(status: 'active' | 'inactive'): void {
    this.filteredServices = this.services.filter(service => 
      status === 'active' ? service.isActive : !service.isActive
    );
  }

  clearFilters(): void {
    this.filteredServices = [...this.services];
  }

  getAdditionalDoctors(service: MedicalService): string {
    return service.doctors.slice(2).join(', ');
  }

  toggleStatus(service: MedicalService): void {
    service.isActive = !service.isActive;
    // TODO: Update status in the backend
  }

  deleteService(service: MedicalService): void {
    if (confirm(`Are you sure you want to delete ${service.name}?`)) {
      this.services = this.services.filter(s => s.id !== service.id);
      this.filteredServices = this.filteredServices.filter(s => s.id !== service.id);
      // TODO: Delete from backend
    }
  }
}
