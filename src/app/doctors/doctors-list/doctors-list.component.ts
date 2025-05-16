import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-doctors-list',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule
  ],
  template: `
    <div class="container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Doctors List</mat-card-title>
          <button mat-raised-button color="primary" [routerLink]="['/panel/doctors/new']">
            <mat-icon>add</mat-icon> Add Doctor
          </button>
        </mat-card-header>
        <mat-card-content>
          <table mat-table [dataSource]="dataSource">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Name</th>
              <td mat-cell *matCellDef="let doctor">{{doctor.name}}</td>
            </ng-container>
            
            <ng-container matColumnDef="specialty">
              <th mat-header-cell *matHeaderCellDef>Specialty</th>
              <td mat-cell *matCellDef="let doctor">{{doctor.specialty}}</td>
            </ng-container>
            
            <ng-container matColumnDef="phone">
              <th mat-header-cell *matHeaderCellDef>Phone</th>
              <td mat-cell *matCellDef="let doctor">{{doctor.phone}}</td>
            </ng-container>
            
            <ng-container matColumnDef="email">
              <th mat-header-cell *matHeaderCellDef>Email</th>
              <td mat-cell *matCellDef="let doctor">{{doctor.email}}</td>
            </ng-container>
            
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let doctor">
                <button mat-icon-button color="primary" [routerLink]="['/panel/doctors', doctor.id, 'edit']">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button color="warn">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </ng-container>
            
            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .container {
      padding: 20px;
    }
    mat-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    table {
      width: 100%;
    }
    .mat-mdc-row .mat-mdc-cell {
      cursor: pointer;
    }
    .mat-mdc-row:hover .mat-mdc-cell {
      background-color: #f5f5f5;
    }
  `]
})
export class DoctorsListComponent {
  displayedColumns: string[] = ['name', 'specialty', 'phone', 'email', 'actions'];
  dataSource = [
    { id: '1', name: 'Dr. John Doe', specialty: 'Cardiology', phone: '123-456-7890', email: 'john.doe@example.com' },
    { id: '2', name: 'Dr. Jane Smith', specialty: 'Dermatology', phone: '123-456-7891', email: 'jane.smith@example.com' },
  ];
}
