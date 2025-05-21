// src/app/product-detail/product-detail.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Product } from '../../../models/product';
import { ProductService } from '../../../services/inventory/product.service';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
@Component({
  selector: 'app-product-detail',
  standalone:true,
  imports:[
    CommonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.css']
})
export class ProductDetailComponent implements OnInit {
  productForm!: FormGroup; // Use definite assignment assertion for non-null
  product: Product | undefined; // To hold the product data if in edit mode
  isLoading: boolean = false;
  errorMessage: string | null = null;
  productId: string | null = null; // Assuming product IDs are strings, e.g., UUIDs or numbers as strings

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService // Inject your product service
  ) {}

  ngOnInit(): void {
    this.productId = this.route.snapshot.paramMap.get('id');
    this.initForm(); // Initialize form structure

    if (this.productId) {
      this.loadProduct(this.productId);
    } else {
      // Set default date for new products, or leave empty if desired
      this.productForm.patchValue({ dateUpdated: new Date() });
    }
  }

  initForm(): void {
    this.productForm = this.fb.group({
      productName: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(0)]],
      quantity: [0, [Validators.required, Validators.min(0)]],
      minimum: [0, [Validators.required, Validators.min(0)]],
      dateUpdated: [new Date(), Validators.required] // Default to current date
    });
  }

  loadProduct(id: string): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.productService.getProductById(id).subscribe({ // Assuming getProduct returns an Observable<Product>
      next: (product: Product) => {
        this.product = product;
        // Patch form values from the loaded product data
        this.productForm.patchValue({
          productName: product.productName,
          price: product.price,
          quantity: product.quantity,
          minimum: product.minimum,
          dateUpdated: product.dateUpdated ? new Date(product.dateUpdated) : new Date() // Convert to Date object
        });
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading product:', err);
        this.errorMessage = 'Failed to load product details. Please try again.';
        this.isLoading = false;
      }
    });
  }

  saveProduct(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      this.errorMessage = 'Please correct the form errors.';
      return;
    }

    // Ensure we have a product ID to update
    if (!this.productId || !this.product) {
      this.errorMessage = 'Cannot save: Product ID is missing or product data not loaded.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    const productData: Product = {
      productId: this.productId, // Always use the ID from the route/loaded product
      ...this.productForm.value,
      dateUpdated: new Date() // Always update the date on save
    };

    // This component is exclusively for updating.
    // There is no 'else' block for adding new products here.
    this.productService.updateProduct(this.productId, productData).subscribe({
      next: () => {
        this.router.navigate(['/inventory']); // Navigate back to product list on success
      },
      error: (err) => {
        console.error('Error updating product:', err);
        this.errorMessage = 'Failed to update product. Please try again.';
        this.isLoading = false;
      }
    });
  }

  deleteProduct(): void {
    if (confirm('Are you sure you want to delete this product?')) {
      this.isLoading = true;
      this.errorMessage = null;
      if (this.product?.productId) {
        this.productService.deleteProduct(this.product.productId).subscribe({
          next: () => {
            this.router.navigate(['/inventory']); // Navigate back to product list
          },
          error: (err) => {
            console.error('Error deleting product:', err);
            this.errorMessage = 'Failed to delete product. Please try again.';
            this.isLoading = false;
          }
        });
      } else {
        this.errorMessage = 'Product ID not found for deletion.';
        this.isLoading = false;
      }
    }
  }

  cancel(): void {
    this.router.navigate(['/inventory']); // Navigate back to product list
  }
}