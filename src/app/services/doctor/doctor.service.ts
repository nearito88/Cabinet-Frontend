import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Doctor } from '../../models/doctor';

@Injectable({
  providedIn: 'root'
})

export class DoctorService {
  private apiUrl = 'https://cabinet-backend-93017aca48c8.herokuapp.com/api/admin'; // Base URL for Service API
  private http = inject(HttpClient);

  getAllDoctors(): Observable<Doctor[]> {
    return this.http.get<Doctor[]>(`${this.apiUrl}/doctors`);
  }

  getDoctorById(DoctorId: string): Observable<Doctor> {
    return this.http.get<Doctor>(`${this.apiUrl}/doctors/${DoctorId}`);
  }

  addDoctor(Doctor: Doctor): Observable<string> {
    return this.http.post<string>(`${this.apiUrl}/addDoctor`, Doctor, { responseType: 'text' as 'json' });
  }

  updateDoctor(DoctorId: string, DoctorData: Doctor): Observable<string> {
    return this.http.put<string>(`${this.apiUrl}/doctors/${DoctorId}`, DoctorData, { responseType: 'text' as 'json' });
  }

  deleteDoctor(DoctorId: string): Observable<string> {
    return this.http.delete<string>(`${this.apiUrl}/doctors/${DoctorId}`, { responseType: 'text' as 'json' });
  }

}