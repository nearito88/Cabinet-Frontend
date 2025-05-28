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
import { DoctorListComponent } from './component/doctor/doctor-list/doctor-list.component';
import { DoctorDetailsComponent } from './component/doctor/doctor-detail/doctor-detail.component';
import { DoctorFormComponent } from './component/doctor/doctor-form/doctor-form.component';
import { AppointmentListComponent } from './component/appointment/appointment-list/appointment-list.component';
import { AppointmentDetailComponent } from './component/appointment/appointment-detail/appointment-detail.component';
import { AppointmentFormComponent } from './component/appointment/appointment-form/appointment-form.component';
import { ReceptionistListComponent } from './component/receptionist/receptionist-list/receptionist-list.component';
import { ReceptionistDetailsComponent } from './component/receptionist/receptionist-detail/receptionist-detail.component';
import { ReceptionistFormComponent } from './component/receptionist/receptionist-form/receptionist-form.component';
import { InvoiceListComponent } from './component/invoice/invoice-list/invoice-list.component';
import { InvoiceFormComponent } from './component/invoice/invoice-form/invoice-form.component';
import { InvoicePayComponent } from './component/invoice/invoice-pay/invoice-pay.component';
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
      { path: 'patients', component: PatientListComponent , title: 'Patient List' }, // Patient list
      { path: 'patients/:id', component: PatientDetailComponent , title: 'Patient Details' }, // Edit patient
      { path: 'addpatient', component: AddPatientComponent , title: 'Add Patient' }, // Add patient (top-level protected)
        // Service
      { path: 'services', component: CabinetServiceListComponent , title: 'Service List' },
      { path: 'services/:id', component: CabinetServiceDetailComponent , title: 'Service Details' },
      { path: 'addservice', component: CabinetServiceAddComponent , title: 'Add Service' },
        // Inventory
      { path: 'inventory', component: ProductListComponent , title: 'Inventory List' },
      { path: 'inventory/:id', component: ProductDetailComponent , title: 'Inventory Details' },
      { path: 'addproduct', component: ProductAddComponent , title: 'Add Inventory' },
        // Doctors
      { path: 'doctor', component: DoctorListComponent , title: 'Doctor List' },
      { path: 'doctor/:id', component: DoctorDetailsComponent , title: 'Doctor Details' },
      { path: 'adddoctor', component: DoctorFormComponent , title: 'Add Doctor' },
        // Appointments
      { path: 'appointments', component: AppointmentListComponent , title: 'Appointment List' },
      { path: 'appointments/:id', component: AppointmentDetailComponent , title: 'Appointment Details' },
      { path: 'addappointment', component: AppointmentFormComponent , title: 'Add Appointment' },
        // Receptionists 
      { path: 'receptionists', component: ReceptionistListComponent , title: 'Receptionist List' },
      { path: 'receptionists/:id', component: ReceptionistDetailsComponent , title: 'Receptionist Details' },
      { path: 'addreceptionist', component: ReceptionistFormComponent , title: 'Add Receptionist' },
        //Invoices
      { path: 'invoices', component: InvoiceListComponent , title: 'Invoice List' },
      { path: 'invoices/:id', component: InvoiceFormComponent , title: 'Invoice Details' },
      { path: 'invoices/:id/pay', component: InvoicePayComponent , title: 'Invoice Payment' },
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