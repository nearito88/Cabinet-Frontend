import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Service } from '../../models/service';

@Injectable({
  providedIn: 'root'
})

export class ServiceService {
  private apiUrl = 'https://cabinet-backend-93017aca48c8.herokuapp.com/api/services'; // Base URL for Service API
  private http = inject(HttpClient);

  getAllServices(): Observable<Service[]> {
    return this.http.get<Service[]>(`${this.apiUrl}/`);
  }

  getServiceById(ServiceId: string): Observable<Service> {
    return this.http.get<Service>(`${this.apiUrl}/${ServiceId}`);
  }

  addService(Service: Service): Observable<string> {
    return this.http.post<string>(`${this.apiUrl}/add`, Service, { responseType: 'text' as 'json' });
  }

  updateService(ServiceId: string, ServiceData: Service): Observable<string> {
    return this.http.put<string>(`${this.apiUrl}/${ServiceId}`, ServiceData, { responseType: 'text' as 'json' });
  }

  deleteService(ServiceId: string): Observable<string> {
    return this.http.delete<string>(`${this.apiUrl}/${ServiceId}`, { responseType: 'text' as 'json' });
  }

  getServiceName(ServiceId: string): Observable<string> {
    return this.http.get<string>(`${this.apiUrl}/name/${ServiceId}`, { responseType: 'text' as 'json' });
  }
}