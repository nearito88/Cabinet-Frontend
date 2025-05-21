import { Routes } from '@angular/router';
import { HomepageComponent } from './homepage/homepage.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AdminLayoutComponent } from './component/admin-layout/admin-layout.component';
import { LoginComponent } from './login/login.component';
import { AuthGuard } from './auth.guard';
import { PatientListComponent } from './component/patients/patients-list/patients-list.component';
import { PatientDetailComponent } from './component/patients/patient-detail/patient-detail.component';
import { AddPatientComponent } from './component/patients/patient-form/patient-form.component';
import { CabinetServiceListComponent } from './component/cabinet-service/service-list/service-list.component';
import { CabinetServiceDetailComponent } from './component/cabinet-service/service-detail/service-detail.component';
import { CabinetServiceAddComponent } from './component/cabinet-service/service-form/service-form.component';
import { ProductListComponent } from './component/inventory/product-list/product-list.component';
import { ProductDetailComponent } from './component/inventory/product-detail/product-detail.component';
import { ProductAddComponent } from './component/inventory/product-form/product-form.component';
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
  },
];

// Protected routes (require authentication)
export const protectedRoutes: Routes = [
  {
    path: '', // Base path for protected routes
    component: AdminLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
        // Patient
      { path: 'patients', component: PatientListComponent }, // Patient list
      { path: 'patients/:id', component: PatientDetailComponent }, // Edit patient
      { path: 'addpatient', component: AddPatientComponent }, // Add patient (top-level protected)
        // Service
      { path: 'services', component: CabinetServiceListComponent },
      { path: 'services/:id', component: CabinetServiceDetailComponent },
      { path: 'addservice', component: CabinetServiceAddComponent },
      // Inventory
      { path: 'inventory', component: ProductListComponent },
      { path: 'inventory/:id', component: ProductDetailComponent },
      { path: 'addproduct', component: ProductAddComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

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