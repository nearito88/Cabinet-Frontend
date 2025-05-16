import { Component, OnInit, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';

// Material Modules
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { NgClass } from '@angular/common';

// Chart.js
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

// Register Chart.js components
import { Chart, registerables } from 'chart.js';
import 'chartjs-plugin-datalabels';

// Register the required Chart.js components
Chart.register(...registerables);

// Interfaces
interface DashboardCard {
  title: string;
  value: number | string;
  icon: string;
  color: string;
  textColor: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

interface Appointment {
  id: string;
  patient: { id: string; name: string };
  date: Date;
  time: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  doctor: string;
  type: string;
}

interface Patient {
  id: string;
  name: string;
  lastVisit: Date;
  status: string;
  avatar: string;
  color: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatChipsModule,
    MatMenuModule,
    MatDividerModule,
    MatTabsModule,
    MatProgressBarModule,
    NgClass,
    BaseChartDirective
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  // Stats cards data
  statsCards = [
    {
      title: 'Total Patients',
      value: 1245,
      icon: 'people',
      color: '#3f51b5',
      trend: {
        value: '+12%',
        isPositive: true
      }
    },
    {
      title: 'Today\'s Appointments',
      value: 24,
      icon: 'event',
      color: '#4caf50',
      trend: {
        value: '+3',
        isPositive: true
      }
    },
    {
      title: 'Available Doctors',
      value: 8,
      icon: 'medical_services',
      color: '#ff9800',
      trend: {
        value: '2 on leave',
        isPositive: false
      }
    },
    {
      title: 'Monthly Revenue',
      value: 24580,
      icon: 'attach_money',
      color: '#e91e63',
      trend: {
        value: '+8.5%',
        isPositive: true
      }
    }
  ];

  // Recent appointments
  recentAppointments = [
    {
      id: '1',
      patient: { id: '1', name: 'John Doe' },
      date: new Date(),
      time: '10:00 AM',
      status: 'scheduled',
      doctor: 'Dr. Smith',
      type: 'General Checkup'
    },
    {
      id: '2',
      patient: { id: '2', name: 'Jane Smith' },
      date: new Date(),
      time: '11:30 AM',
      status: 'confirmed',
      doctor: 'Dr. Johnson',
      type: 'Dental'
    },
    {
      id: '3',
      patient: { id: '3', name: 'Robert Wilson' },
      date: new Date(),
      time: '02:15 PM',
      status: 'scheduled',
      doctor: 'Dr. Davis',
      type: 'Eye Exam'
    }
  ];

  // Recent patients
  recentPatients: Patient[] = [
    {
      id: '1',
      name: 'John Doe',
      lastVisit: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      status: 'active',
      avatar: 'JD',
      color: '#3f51b5'
    },
    {
      id: '2',
      name: 'Jane Smith',
      lastVisit: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
      status: 'active',
      avatar: 'JS',
      color: '#e91e63'
    },
    {
      id: '3',
      name: 'Robert Wilson',
      lastVisit: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      status: 'active',
      avatar: 'RW',
      color: '#4caf50'
    }
  ];

  // Quick actions
  quickActions = [
    { icon: 'add', label: 'New Appointment', route: '/appointments/new' },
    { icon: 'person_add', label: 'Add Patient', route: '/patients/new' },
    { icon: 'receipt', label: 'Create Invoice', route: '/invoices/new' },
    { icon: 'note_add', label: 'New Prescription', route: '/prescriptions/new' }
  ];

  // Chart reference
  @ViewChild(BaseChartDirective) chart: BaseChartDirective | undefined;

  // Invoice Status Chart
  public pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'right',
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.label || '';
            const value = context.raw as number;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  } as any;

  public pieChartData: ChartData<'pie', number[], string> = {
    labels: ['Paid', 'Unpaid', 'Overdue', 'Partially Paid'],
    datasets: [{
      data: [65, 25, 8, 2],
      backgroundColor: [
        '#4caf50', // Green for Paid
        '#f44336', // Red for Unpaid
        '#ff9800', // Orange for Overdue
        '#2196f3'  // Blue for Partially Paid
      ],
      hoverBackgroundColor: [
        '#388e3c', // Darker Green
        '#d32f2f', // Darker Red
        '#f57c00', // Darker Orange
        '#1976d2'  // Darker Blue
      ]
    }]
  };

  public pieChartType: ChartType = 'pie';

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    // Initialization logic here if needed
  }

  // Helper method to get relative time
  getRelativeTime(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    const minute = 60;
    const hour = minute * 60;
    const day = hour * 24;
    const month = day * 30;
    const year = day * 365;

    if (diffInSeconds < minute) {
      return 'Just now';
    } else if (diffInSeconds < hour) {
      const minutes = Math.floor(diffInSeconds / minute);
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffInSeconds < day) {
      const hours = Math.floor(diffInSeconds / hour);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffInSeconds < month) {
      const days = Math.floor(diffInSeconds / day);
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    } else if (diffInSeconds < year) {
      const months = Math.floor(diffInSeconds / month);
      return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    } else {
      const years = Math.floor(diffInSeconds / year);
      return `${years} ${years === 1 ? 'year' : 'years'} ago`;
    }
  }

  // Get status color for appointments
  getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'scheduled':
        return '#2196f3'; // Blue
      case 'confirmed':
        return '#4caf50'; // Green
      case 'completed':
        return '#9e9e9e'; // Grey
      case 'cancelled':
        return '#f44336'; // Red
      default:
        return '#9e9e9e'; // Grey
    }
  }
}
