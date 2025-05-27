import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Receptionist } from '../../models/receptionist';

@Injectable({
  providedIn: 'root'
})

export class ReceptionistService {
  private apiUrl = 'https://cabinet-backend-93017aca48c8.herokuapp.com/api/admin'; // Base URL for Service API
  private http = inject(HttpClient);

  getAllreceptionists(): Observable<Receptionist[]> {
    return this.http.get<Receptionist[]>(`${this.apiUrl}/receptionists`);
  }

  getreceptionistById(receptionistId: string): Observable<Receptionist> {
    return this.http.get<Receptionist>(`${this.apiUrl}/receptionists/${receptionistId}`);
  }

  addreceptionist(receptionist: Receptionist): Observable<string> {
    return this.http.post<string>(`${this.apiUrl}/addReceptionist`, receptionist, { responseType: 'text' as 'json' });
  }

  updatereceptionist(receptionistId: string, receptionistData: Receptionist): Observable<string> {
    return this.http.put<string>(`${this.apiUrl}/receptionists/${receptionistId}`, receptionistData, { responseType: 'text' as 'json' });
  }

  deletereceptionist(receptionistId: string): Observable<string> {
    return this.http.delete<string>(`${this.apiUrl}/receptionists/${receptionistId}`, { responseType: 'text' as 'json' });
  }

}