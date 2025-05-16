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

interface Receptionist {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  isActive: boolean;
}

@Component({
  selector: 'app-receptionists-list',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatMenuModule,
    MatFormFieldModule,
    MatInputModule,
    MatPaginatorModule
  ],
  template: `
    <div class="container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Receptionists</mat-card-title>
          <button mat-raised-button color="primary" [routerLink]="['/panel/receptionists/new']">
            <mat-icon>add</mat-icon> Add Receptionist
          </button>
        </mat-card-header>
        <mat-card-content>
          <div class="table-container">
            <div class="table-actions">
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
              
              <mat-form-field appearance="outline" class="search-field">
                <mat-label>Search</mat-label>
                <input matInput placeholder="Search receptionists..." (keyup)="applyFilter($event)">
                <mat-icon matSuffix>search</mat-icon>
              </mat-form-field>
            </div>
            
            <table mat-table [dataSource]="filteredReceptionists">
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>Name</th>
                <td mat-cell *matCellDef="let receptionist">
                  {{receptionist.firstName}} {{receptionist.lastName}}
                </td>
              </ng-container>
              
              <ng-container matColumnDef="email">
                <th mat-header-cell *matHeaderCellDef>Email</th>
                <td mat-cell *matCellDef="let receptionist">{{receptionist.email}}</td>
              </ng-container>
              
              <ng-container matColumnDef="phone">
                <th mat-header-cell *matHeaderCellDef>Phone</th>
                <td mat-cell *matCellDef="let receptionist">{{receptionist.phone}}</td>
              </ng-container>
              
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let receptionist">
                  <span class="status-badge" [class.active]="receptionist.isActive">
                    {{ receptionist.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </td>
              </ng-container>
              
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let receptionist">
                  <button mat-icon-button [matMenuTriggerFor]="actionMenu" (click)="$event.stopPropagation()">
                    <mat-icon>more_vert</mat-icon>
                  </button>
                  <mat-menu #actionMenu="matMenu">
                    <button mat-menu-item [routerLink]="['/panel/receptionists', receptionist.id, 'edit']">
                      <mat-icon>edit</mat-icon> Edit
                    </button>
                    <button mat-menu-item (click)="toggleStatus(receptionist)">
                      <mat-icon>{{ receptionist.isActive ? 'toggle_off' : 'toggle_on' }}</mat-icon>
                      {{ receptionist.isActive ? 'Deactivate' : 'Activate' }}
                    </button>
                    <button mat-menu-item class="delete-action" (click)="deleteReceptionist(receptionist)">
                      <mat-icon>delete</mat-icon> Delete
                    </button>
                  </mat-menu>
                </td>
              </ng-container>
              
              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr 
                mat-row 
                *matRowDef="let row; columns: displayedColumns;"
                [routerLink]="['/panel/receptionists', row.id]"
                class="clickable-row">
              </tr>
              
              <tr class="mat-row" *matNoDataRow>
                <td class="mat-cell no-data" [colSpan]="displayedColumns.length">
                  No receptionists found
                </td>
              </tr>
            </table>
            
            <mat-paginator 
              [length]="receptionists.length"
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
      min-width: 250px;
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
export class ReceptionistsListComponent {
  displayedColumns: string[] = ['name', 'email', 'phone', 'status', 'actions'];
  receptionists: Receptionist[] = [
    { 
      id: '1', 
      firstName: 'Sarah', 
      lastName: 'Johnson', 
      email: 'sarah.j@example.com', 
      phone: '123-456-7890', 
      isActive: true 
    },
    { 
      id: '2', 
      firstName: 'Michael', 
      lastName: 'Brown', 
      email: 'michael.b@example.com', 
      phone: '123-456-7891', 
      isActive: true 
    },
    { 
      id: '3', 
      firstName: 'Emily', 
      lastName: 'Davis', 
      email: 'emily.d@example.com', 
      phone: '123-456-7892', 
      isActive: false 
    },
  ];
  filteredReceptionists: Receptionist[] = [];

  constructor() {
    this.filteredReceptionists = [...this.receptionists];
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredReceptionists = this.receptionists.filter(receptionist => 
      receptionist.firstName.toLowerCase().includes(filterValue) ||
      receptionist.lastName.toLowerCase().includes(filterValue) ||
      receptionist.email.toLowerCase().includes(filterValue) ||
      receptionist.phone.includes(filterValue)
    );
  }

  filterByStatus(status: 'active' | 'inactive'): void {
    this.filteredReceptionists = this.receptionists.filter(receptionist => 
      status === 'active' ? receptionist.isActive : !receptionist.isActive
    );
  }

  clearFilters(): void {
    this.filteredReceptionists = [...this.receptionists];
  }

  toggleStatus(receptionist: Receptionist): void {
    receptionist.isActive = !receptionist.isActive;
    // TODO: Update status in the backend
  }

  deleteReceptionist(receptionist: Receptionist): void {
    if (confirm(`Are you sure you want to delete ${receptionist.firstName} ${receptionist.lastName}?`)) {
      this.receptionists = this.receptionists.filter(r => r.id !== receptionist.id);
      this.filteredReceptionists = this.filteredReceptionists.filter(r => r.id !== receptionist.id);
      // TODO: Delete from backend
    }
  }
}
