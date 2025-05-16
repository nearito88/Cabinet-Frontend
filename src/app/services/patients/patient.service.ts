import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Patient } from '../../models/patient';

@Injectable({
  providedIn: 'root'
})
export class PatientService {
  private apiUrl = 'https://cabinet-backend-93017aca48c8.herokuapp.com/api/patients'; // Base URL for patient API
  private http = inject(HttpClient);

  getAllPatients(): Observable<Patient[]> {
    return this.http.get<Patient[]>(`${this.apiUrl}/`);
  }

  getPatientById(patientId: string): Observable<Patient> {
    return this.http.get<Patient>(`${this.apiUrl}/${patientId}`);
  }

  addPatient(patient: Patient): Observable<string> {
    return this.http.post<string>(`${this.apiUrl}/add`, patient, { responseType: 'text' as 'json' });
  }

  updatePatient(patientId: string, patientData: Patient): Observable<string> {
    return this.http.put<string>(`${this.apiUrl}/${patientId}`, patientData, { responseType: 'text' as 'json' });
  }

  deletePatient(patientId: string): Observable<string> {
    return this.http.delete<string>(`${this.apiUrl}/${patientId}`, { responseType: 'text' as 'json' });
  }

  getPatientByCin(patientCIN: string): Observable<Patient> {
    return this.http.get<Patient>(`${this.apiUrl}/cin/${patientCIN}`);
  }

  getPatientName(patientId: string): Observable<string> {
    return this.http.get<string>(`${this.apiUrl}/name/${patientId}`, { responseType: 'text' as 'json' });
  }
}