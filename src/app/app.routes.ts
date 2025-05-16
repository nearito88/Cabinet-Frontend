import { Routes } from '@angular/router';
import { HomepageComponent } from './homepage/homepage.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AdminLayoutComponent } from './component/admin-layout/admin-layout.component';
import { LoginComponent } from './login/login.component';
import { AuthGuard } from './auth.guard';
import { PatientsListComponent } from './component/patients/patients-list/patients-list.component';
import { PatientFormComponent } from './component/patients/patient-form/patient-form.component';
import { PatientDetailComponent } from './component/patients/patient-detail/patient-detail.component';

// Public routes (no authentication required)
export const publicRoutes: Routes = [
  { 
    path: '', 
    redirectTo: 'home', 
    pathMatch: 'full' 
  },
  { 
    path: 'home', 
    component: HomepageComponent,
    title: 'Medical Office - Home'
  },
  {
    path: 'login',
    component: LoginComponent,
    title: 'Login - Medical Office'
  }
];

// Protected routes (require authentication)
export const protectedRoutes: Routes = [
  {
    path: '', // Base path for protected routes
    component: AdminLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent, title: 'Dashboard', data: { title: 'Dashboard' } },
      {
        path: 'patients', // <-- The base path for patients
        component: PatientsListComponent,
        title: 'Patients',
        data: { title: 'Patients' },
        children: [
          { path: '', redirectTo: 'list', pathMatch: 'full' },
          { path: 'list', component: PatientsListComponent, title: 'Patients List' },
          { path: 'add', component: PatientFormComponent, title: 'Add Patient' },
          { path: ':id', component: PatientDetailComponent, title: 'Patient Details' }
        ]
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  }
];

// Combined routes for backward compatibility
export const routes: Routes = [
  ...publicRoutes,
  ...protectedRoutes,
  { 
    path: '**', 
    redirectTo: 'home' 
  }
];