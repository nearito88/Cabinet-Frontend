import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray, FormsModule } from '@angular/forms';
import { invoiceService } from '../../../services/invoice/invoice.service';
import { Invoice } from '../../../models/invoice';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';

import { appointmentService } from '../../../services/appointment/appointment.service';
import { Appointment } from '../../../models/appointment';
import { Appointmentproduct } from '../../../models/appointmentproduct';
import { Product } from '../../../models/product';
import { ProductService } from '../../../services/inventory/product.service';

@Component({
  selector: 'app-invoice-pay',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    FormsModule, // <--- Add FormsModule here
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatChipsModule,
    RouterModule
  ],
  templateUrl: './invoice-pay.component.html',
  styleUrls: ['./invoice-pay.component.css']
})
export class InvoicePayComponent implements OnInit, OnDestroy {
  public appointmentId!: string;
  invoice!: Invoice;
  appointment!: Appointment;
  paymentForm!: FormGroup;
  isLoading: boolean = false;
  errorMessage: string | null = null;
  paymentTypes: ('CASH' | 'CARD')[] = ['CASH', 'CARD'];
  usedProducts: Appointmentproduct[] = [];
  products: Product[] = [];
  selectedProductId: string = '';
  selectedQuantity: number = 1;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private invoiceService: invoiceService,
    private appointmentService: appointmentService,
    private productService: ProductService,
    private snackBar: MatSnackBar,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.appointmentId = params['appointmentId'];

      if (!this.appointmentId) {
        this.errorMessage = 'Appointment ID is missing from the route.';
        this.snackBar.open(this.errorMessage, 'Dismiss', { duration: 5000, panelClass: ['error-snackbar'] });
        this.router.navigate(['/appointments']);
        return;
      }
      this.productService.getAllProducts().subscribe(products => {
        this.products = products;
      });
      this.initPaymentForm();
      this.fetchAppointmentDetails();
      
    });
  }

  fetchAppointmentDetails(): void {
    this.isLoading = true;
    this.appointmentService.getappointmentById(this.appointmentId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: Appointment) => {
          this.appointment = data;
          this.isLoading = false;
        },
        error: (err) => {
          this.errorMessage = 'Failed to load appointment: ' + (err.message || 'Unknown error');
          this.snackBar.open(this.errorMessage, 'Dismiss', { duration: 5000, panelClass: ['error-snackbar'] });
          this.isLoading = false;
          this.router.navigate(['/appointments']);
        }
      });
  }

  initPaymentForm(): void {
    this.paymentForm = this.fb.group({
      paymentAmount: [0, [Validators.required, Validators.min(0.01)]],
      paymentType: ['CASH', Validators.required],
      usedProducts: this.fb.array([])
    });
  }
  get usedProductsControls() {
    return (this.paymentForm.get('usedProducts') as FormArray).controls;
  }

  addProduct() {
    if (!this.selectedProductId || this.selectedQuantity < 1) {
      this.snackBar.open('Please select a product and a valid quantity.', 'Dismiss', { duration: 3000 });
      return;
    }

    const productToAdd = this.products.find(p => p.productId === this.selectedProductId);

    if (!productToAdd) {
      this.snackBar.open('Selected product not found in inventory.', 'Dismiss', { duration: 3000 });
      return;
    }

    // ⭐⭐ NEW VALIDATION LOGIC ⭐⭐
    const currentQuantityInCart = this.usedProducts.find(p => p.productId === this.selectedProductId)?.quantity || 0;
    const totalRequestedQuantity = currentQuantityInCart + this.selectedQuantity;

    if (totalRequestedQuantity > productToAdd.quantity) {
      this.snackBar.open(
        `Insufficient stock for ${productToAdd.productName}. Available: ${productToAdd.quantity}, Requested: ${totalRequestedQuantity}.`,
        'Dismiss',
        { duration: 5000, panelClass: ['error-snackbar'] }
      );
      // Optionally reset quantity or selected product
      this.selectedQuantity = 1;
      return; // Stop adding the product
    }
    const existing = this.usedProducts.find(p => p.productId === this.selectedProductId);
    if (existing) {
      existing.quantity += this.selectedQuantity;
    } else {
      const product = this.products.find(p => p.productId === this.selectedProductId);
      if (product) {
        this.usedProducts.push({
          appointmentProductId: '', // This will be generated by backend
          appointmentId: this.appointmentId,
          productId: product.productId,
          productName: product.productName, // Keep product name for display
          quantity: this.selectedQuantity,
        });
      }
    }

    
  
    // Update FormArray accordingly
    const usedProductsFormArray = this.paymentForm.get('usedProducts') as FormArray;
    usedProductsFormArray.clear(); // Clear current controls
    this.usedProducts.forEach(p => {
      usedProductsFormArray.push(this.fb.group({
        productId: [p.productId, Validators.required],
        quantity: [p.quantity, [Validators.required, Validators.min(1)]]
      }));
    });
  
    // Log to console for debugging/confirmation
    console.log('Product added. Current usedProducts:', this.usedProducts);
    console.log('Current FormArray value:', usedProductsFormArray.value);
  
    this.selectedProductId = '';
    this.selectedQuantity = 1;
  }
  
  removeProduct(index: number) {
    this.usedProducts.splice(index, 1);
  
    const usedProductsFormArray = this.paymentForm.get('usedProducts') as FormArray;
    usedProductsFormArray.removeAt(index);
  }

  get f() { return this.paymentForm.controls; }

  onPaymentAmountChange(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const currentInput = parseFloat(inputElement.value);
  
    const alreadyPaid = this.appointment?.paidAmount || 0;
    const total = this.appointment?.totalAmount || 0;
    const remaining = total - alreadyPaid;
  
    if (isNaN(currentInput) || currentInput < 0) {
      this.f['paymentAmount'].setValue(0);
    } else if (currentInput > remaining) {
      this.f['paymentAmount'].setValue(remaining);
    }
  }

  processPayment(): void {
    this.paymentForm.markAllAsTouched();
    if (this.paymentForm.invalid) {
      this.snackBar.open('Please fix the form errors.', 'Dismiss', { duration: 3000, panelClass: ['error-snackbar'] });
      return;
    }
  
    const paymentAmount = this.f['paymentAmount'].value;
    const paymentType = this.f['paymentType'].value;
    this.isLoading = true;
  
    // Récupère les produits utilisés depuis le formulaire (FormArray)
    const usedProductsPayload = (this.paymentForm.get('usedProducts')?.value || []).map((p: any) => ({
      productId: p.productId,
      quantity: p.quantity
    }));


  
    // Envoie la liste des produits au backend lors de la création de la facture
    this.invoiceService.generateInvoiceForAppointment(this.appointmentId, usedProductsPayload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (invoice) => {
          this.invoice = invoice;
          this.invoiceService.processPayment(invoice.invoiceId, paymentAmount, paymentType)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: () => {
                this.snackBar.open('Payment processed successfully!', 'Close', { duration: 3000 });
                this.router.navigate(['/invoices']);
                this.isLoading = false;
              },
              error: (err) => {
                this.snackBar.open('Failed to process payment: ' + (err.error?.message || err.message), 'Dismiss', { duration: 5000 });
                this.isLoading = false;
              }
            });
        },
        error: (err) => {
          this.snackBar.open('Failed to generate invoice: ' + (err.error?.message || err.message), 'Dismiss', { duration: 5000 });
          this.isLoading = false;
        }
      });
  }

  getAvailableStock(productId: string): number | undefined {
    const product = this.products.find(p => p.productId === productId);
    return product?.quantity; // Returns product.quantity or undefined if not found
  }

  // ⭐ NEW HELPER METHOD: Get quantity of selected product already in cart ⭐
  getQuantityInCart(productId: string): number {
    const productInCart = this.usedProducts.find(p => p.productId === productId);
    return productInCart?.quantity || 0; // Returns quantity in cart or 0 if not found
  }
  

  cancel(): void {
    this.router.navigate(['/appointments']);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
