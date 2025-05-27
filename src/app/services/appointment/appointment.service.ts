import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Appointment } from '../../models/appointment';

@Injectable({
  providedIn: 'root'
})

export class appointmentService {
  private apiUrl = 'https://cabinet-backend-93017aca48c8.herokuapp.com/api/appointments'; // Base URL for Service API
  private http = inject(HttpClient);

  getAllappointments(): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(this.apiUrl);
  }

  getappointmentById(appointmentId: string): Observable<Appointment> {
    return this.http.get<Appointment>(`${this.apiUrl}/${appointmentId}`);
  }

  addappointment(appointment: Appointment): Observable<string> {
    console.log('DEBUG: Sending appointment to backend:', appointment);
    return this.http.post<string>(this.apiUrl, appointment, { responseType: 'text' as 'json' });
  }

  updateappointment(appointmentId: string, appointmentData: Appointment): Observable<string> {
    return this.http.put<string>(`${this.apiUrl}/${appointmentId}`, appointmentData, { responseType: 'text' as 'json' });
  }

  deleteappointment(appointmentId: string): Observable<string> {
    return this.http.delete<string>(`${this.apiUrl}/${appointmentId}`, { responseType: 'text' as 'json' });
  }

  getAppointmentsByPatientId(patientId: string): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.apiUrl}/patient/${patientId}`);
  }

  markAppointmentAsPaid(appointmentId: string): Observable<Appointment> {
    const payload = { paymentStatus: 'Paid' };
    // Angular's HttpClient will automatically set Content-Type: application/json
    // because you're sending a JSON object (`payload`).
    // We expect a JSON object (`Appointment`) back, so no `responseType` is needed.
    return this.http.put<Appointment>(`${this.apiUrl}/${appointmentId}/mark-paid`, payload);  
  }

}