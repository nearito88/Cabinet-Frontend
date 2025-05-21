// src/app/product-list/product-list.component.ts
import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Router } from '@angular/router';
import { ProductService } from '../../../services/inventory/product.service';
import { Product } from '../../../models/product';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule } from '@angular/material/snack-bar';
@Component({
  selector: 'app-product-list',
  standalone: true,
  imports:[CommonModule,MatTableModule,MatSortModule,MatPaginatorModule,MatCardModule,MatFormFieldModule,MatInputModule,MatButtonModule,MatIconModule,MatProgressSpinnerModule,MatTooltipModule,MatSnackBarModule],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css']
})
export class ProductListComponent implements OnInit, AfterViewInit {
  // Defines the columns to be displayed in the table.
  // These match the properties of your Product interface.
  displayedColumns: string[] = ['name', 'price', 'quantity', 'minimum', 'dateUpdated', 'actions'];

  // MatTableDataSource handles the data for the Angular Material table,
  // providing features like filtering, sorting, and pagination.
  dataSource = new MatTableDataSource<Product>();

  isLoading = true; // Flag to indicate if data is being loaded
  errorMessage: string | null = null; // To display error messages

  // ViewChild decorators to get references to MatPaginator and MatSort components
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private productService: ProductService, // Inject ProductService
    private router: Router                  // Inject Router for navigation
  ) { }

  ngOnInit(): void {
    this.loadProducts(); // Load products when the component initializes
  }

  ngAfterViewInit(): void {
    // After the view has initialized, assign paginator and sort to the dataSource.
    // This is crucial for MatTable to use these features.
    if (this.dataSource) {
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;

        // Custom filter predicate: This allows searching across multiple columns.
        // By default, MatTable filters only on the data source's 'data' property.
        this.dataSource.filterPredicate = (data: Product, filter: string) => {
          const dataStr = (data.productName + data.price + data.quantity + data.minimum + data.dateUpdated).toLowerCase();
          return dataStr.includes(filter);
        };
    }
  }

  /**
   * Loads products from the ProductService.
   */
  loadProducts(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.productService.getAllProducts().subscribe({
      next: (products) => {
        // --- ADD THESE CONSOLE LOGS HERE ---
        console.log('Products loaded successfully:');
        products.forEach(product => {
          console.log(`  Product Name: ${product.productName}, ID: ${product.productId}, P`);
        });
        // --- END CONSOLE LOGS ---

        this.dataSource = new MatTableDataSource(products);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading products:', err);
        this.errorMessage = 'Failed to load products.';
        this.isLoading = false;
      }
    });
  }

  /**
   * Applies a filter to the table data based on user input.
   * @param event The keyup event from the filter input.
   */
  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase(); // Trim whitespace and convert to lowercase for case-insensitive search

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage(); // Go to the first page when a filter is applied
    }
  }

  /**
   * Navigates to the add product form.
   */
  addProduct(): void {
    this.router.navigate(['/addproduct']); // Assuming '/products/add' is your route for adding products
  }

  /**
   * Navigates to the edit product form for a specific product.
   * @param product The product to be edited.
   */
  editProduct(productId: string | undefined): void {
    this.router.navigate(['/inventory', productId]); // Assuming '/products/edit/:id' is your route for editing
  }

  /**
   * Deletes a product after confirmation.
   * @param product The product to be deleted.
   */
  deleteProduct(productId: string | undefined): void {
    if (confirm(`Are you sure you want to delete product "${this.productService.getProductName(productId!)}"?`)) {
      this.productService.deleteProduct(productId!).subscribe({ // Call deleteProduct from your service
        next: (response) => {
          console.log('Product deletion response:', response);
          // Assuming your backend returns a success message or similar text
          // You might want to check the response content for "success"
          this.loadProducts(); // Reload data after successful deletion
        },
        error: (err) => {
          console.error('Error deleting product:', err);
          this.errorMessage = 'An error occurred during deletion. Please try again.';
        }
      });
    }
  }
}