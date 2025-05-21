import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product } from '../../models/product';

@Injectable({
  providedIn: 'root'
})

export class ProductService {
  private apiUrl = 'https://cabinet-backend-93017aca48c8.herokuapp.com/api/products'; // Base URL for Service API
  private http = inject(HttpClient);

  getAllProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/`);
  }

  getProductById(productId: string): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${productId}`);
  }

  addProduct(Product: Product): Observable<string> {
    return this.http.post<string>(`${this.apiUrl}/add`, Product, { responseType: 'text' as 'json' });
  }

  updateProduct(productId: string, ProductData: Product): Observable<string> {
    return this.http.put<string>(`${this.apiUrl}/${productId}`, ProductData, { responseType: 'text' as 'json' });
  }

  deleteProduct(productId: string): Observable<string> {
    return this.http.delete<string>(`${this.apiUrl}/${productId}`, { responseType: 'text' as 'json' });
  }

  getProductName(productId: string): Observable<string> {
    return this.http.get<string>(`${this.apiUrl}/name/${productId}`, { responseType: 'text' as 'json' });
  }
}