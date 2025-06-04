// src/app/invoice-form/invoice-form.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule, DatePipe } from '@angular/common';

// Angular Material Imports
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';

// Your Models and Services
import { Invoice } from '../../../models/invoice';
import { Appointmentproduct } from '../../../models/appointmentproduct'; // Ensure appointmentProductId and appointmentId are optional if needed
import { Product } from '../../../models/product';
import { Appointment } from '../../../models/appointment';
import { invoiceService } from '../../../services/invoice/invoice.service';
import { ProductService } from '../../../services/inventory/product.service';
import { appointmentService } from '../../../services/appointment/appointment.service';
import { InvoicePaymentUpdate } from '../../../models/invoice-payment-update';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-invoice-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule,
    MatIconModule, MatProgressSpinnerModule, MatChipsModule, MatListModule,
    RouterModule, DatePipe
  ],
  templateUrl: './invoice-form.component.html',
  styleUrls: ['./invoice-form.component.css']
})
export class InvoiceFormComponent implements OnInit, OnDestroy {
  invoiceForm!: FormGroup;
  invoiceId!: string;
  isLoading: boolean = false;
  errorMessage: string | null = null;
  paymentTypes: ('CASH' | 'CARD' | 'BANK_TRANSFER')[] = ['CASH', 'CARD', 'BANK_TRANSFER']; // Ensure this matches your backend enum
  allProducts: Product[] = [];
  currentUsedProducts: Appointmentproduct[] = [];

  private fetchedInvoice: Invoice | null = null;
  private fetchedAppointment: Appointment | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
    private invoiceService: invoiceService,
    private productService: ProductService,
    private appointmentService: appointmentService
  ) {}

  ngOnInit(): void {
    this.initForm();

    this.productService.getAllProducts().pipe(takeUntil(this.destroy$)).subscribe({
      next: (products) => this.allProducts = products,
      error: (err) => this.snackBar.open('Failed to load products for selection: ' + (err.message || 'Error'), 'Dismiss')
    });

    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.invoiceId = id;
        this.loadInvoiceForEdit(this.invoiceId);
      } else {
        this.errorMessage = 'Invoice ID is missing for editing.';
        this.snackBar.open(this.errorMessage, 'Dismiss', { duration: 5000, panelClass: ['error-snackbar'] });
        this.router.navigate(['/invoices']);
      }
    });
  }

  initForm(): void {
    this.invoiceForm = this.fb.group({
      // --- Read-Only Fields ---
      invoiceId: [{ value: '', disabled: true }],
      patientName: [{ value: '', disabled: true }],
      appointmentDate: [{ value: '', disabled: true }],
      invoiceDate: [{ value: '', disabled: true }],
      invoiceStatus: [{ value: '', disabled: true }],

      totalAmountFromAppointment: [{ value: 0, disabled: true }],
      alreadyPaidAmountOnAppointment: [{ value: 0, disabled: true }],
      remainingAmountOnAppointment: [{ value: 0, disabled: true }],

      // --- Editable Fields ---
      paymentType: ['', Validators.required],
      // Renamed from currentPaymentAmount to paidAmount for consistency with backend DTO
      paidAmount: [0, [Validators.required, Validators.min(0.01)]],

      usedProducts: this.fb.array([])
    });
  }

  loadInvoiceForEdit(id: string): void {
    this.isLoading = true;
    this.invoiceService.getInvoiceById(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (invoice) => {
        if (invoice) {
          this.fetchedInvoice = invoice;

          if (invoice.appointmentId) { // Check if appointmentId exists before fetching appointment
            this.appointmentService.getappointmentById(invoice.appointmentId).pipe(takeUntil(this.destroy$)).subscribe({
              next: (appointment) => {
                this.fetchedAppointment = appointment;
                console.log('Appointment loaded for invoice:', appointment);

                this.invoiceForm.patchValue({
                  invoiceId: invoice.invoiceId,
                  patientName: invoice.patientName,
                  appointmentDate: invoice.appointmentDate,
                  invoiceDate: invoice.invoiceDate,
                  invoiceStatus: invoice.invoiceStatus,
                  paymentType: invoice.paymentType,
                  // Patch the fetched invoice's paidAmount
                  paidAmount: invoice.paidAmount, // Use invoice.paidAmount here

                  totalAmountFromAppointment: appointment.totalAmount,
                  alreadyPaidAmountOnAppointment: appointment.paidAmount,
                  remainingAmountOnAppointment: (appointment.totalAmount || 0) - (appointment.paidAmount || 0)
                });

                this.currentUsedProducts = invoice.usedProducts || [];
                this.updateUsedProductsFormArray();

                this.isLoading = false;
              },
              error: (err) => {
                this.errorMessage = 'Failed to load associated appointment: ' + (err.message || 'Error');
                this.snackBar.open(this.errorMessage, 'Dismiss', { duration: 3000, panelClass: ['error-snackbar'] });
                this.isLoading = false;
                this.router.navigate(['/invoices']);
              }
            });
          } else {
            // Handle invoices with no associated appointment (if your design allows)
            this.errorMessage = 'Invoice is not linked to an appointment.';
            this.snackBar.open(this.errorMessage, 'Dismiss', { duration: 3000, panelClass: ['error-snackbar'] });
            this.isLoading = false;
             this.router.navigate(['/invoices']);
          }
        } else {
          this.errorMessage = 'Invoice not found.';
          this.snackBar.open(this.errorMessage, 'Dismiss', { duration: 3000, panelClass: ['error-snackbar'] });
          this.isLoading = false;
          this.router.navigate(['/invoices']);
        }
      },
      error: (err) => {
        this.errorMessage = 'Failed to load invoice: ' + (err.error?.message || err.message || 'Error');
        this.snackBar.open(this.errorMessage, 'Dismiss', { duration: 3000, panelClass: ['error-snackbar'] });
        this.isLoading = false;
        this.router.navigate(['/invoices']);
      }
    });
  }

  onPaidAmountChange(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    let currentInput = parseFloat(inputElement.value);

    // 1. Handle invalid or negative input
    if (isNaN(currentInput) || currentInput < 0) {
      // If invalid, clear the input or set to 0, and return.
      // Use emitEvent: false to prevent re-triggering the event.
      this.invoiceForm.get('paidAmount')?.setValue(0, { emitEvent: false });
      this.snackBar.open('Amount must be a non-negative number.', 'Dismiss', { duration: 3000, panelClass: ['error-snackbar'] });
      return;
    }

    // 2. Apply capping logic based on appointment's total amount
    if (this.fetchedAppointment && this.fetchedInvoice) {
      const totalAppointmentAmount = this.fetchedAppointment.totalAmount || 0;
      const alreadyPaidOnAppointment = this.fetchedAppointment.paidAmount || 0;
      const originalInvoiceContribution = this.fetchedInvoice.paidAmount || 0; // The amount this invoice paid *before* editing

      // Calculate how much has been paid for the appointment, EXCLUDING the original contribution of THIS invoice.
      const appointmentPaidExcludingThisInvoice = alreadyPaidOnAppointment - originalInvoiceContribution;

      // The maximum remaining amount that needs to be paid for the *entire appointment*
      const remainingToPayForAppointment = totalAppointmentAmount - appointmentPaidExcludingThisInvoice;

      // If the current input amount exceeds what's left for the appointment to be fully paid
      if (currentInput > remainingToPayForAppointment) {
        currentInput = Math.max(0, remainingToPayForAppointment); // Cap the input at the remaining amount (ensure not negative)
        this.invoiceForm.get('paidAmount')?.setValue(currentInput, { emitEvent: false }); // Update form control
        this.snackBar.open(`Amount capped to ${currentInput.toFixed(2)} (remaining for appointment).`, 'Dismiss', { duration: 3000 });
      }
    }

    // Ensure the form control's value is explicitly updated if not already by capping logic.
    // This handles cases where input is valid but no capping was applied.
    if (this.invoiceForm.get('paidAmount')?.value !== currentInput) {
        this.invoiceForm.get('paidAmount')?.setValue(currentInput, { emitEvent: false });
    }
  }

  selectedProductId: string = '';
  selectedQuantity: number = 1;

  addProductToInvoice(): void {
    if (!this.selectedProductId || this.selectedQuantity < 1) {
      this.snackBar.open('Please select a product and a valid quantity.', 'Dismiss', { duration: 3000 });
      return;
    }

    const productToAdd = this.allProducts.find(p => p.productId === this.selectedProductId);
    if (!productToAdd) {
      this.snackBar.open('Selected product not found.', 'Dismiss', { duration: 3000 });
      return;
    }

    const currentQuantityInCart = this.currentUsedProducts.find(p => p.productId === this.selectedProductId)?.quantity || 0;
    const totalRequestedQuantity = currentQuantityInCart + this.selectedQuantity;

    if (totalRequestedQuantity > productToAdd.quantity) {
      this.snackBar.open(
        `Insufficient stock for ${productToAdd.productName}. Available: ${productToAdd.quantity}, Requested: ${totalRequestedQuantity}.`,
        'Dismiss',
        { duration: 5000, panelClass: ['error-snackbar'] }
      );
      this.selectedQuantity = 1;
      return;
    }

    const existing = this.currentUsedProducts.find(p => p.productId === this.selectedProductId);
    if (existing) {
      existing.quantity = totalRequestedQuantity;
    } else {
      this.currentUsedProducts.push({
        // For new items, these might be null or generated by backend
        appointmentProductId: undefined, // Let backend generate if it's a new entry's AP ID
        appointmentId: this.fetchedInvoice?.appointmentId, // Link to this invoice's appointment
        productId: productToAdd.productId,
        productName: productToAdd.productName,
        quantity: this.selectedQuantity,
      });
    }

    this.updateUsedProductsFormArray();

    this.selectedProductId = '';
    this.selectedQuantity = 1;
  }

  removeProductFromInvoice(index: number): void {
    this.currentUsedProducts.splice(index, 1);
    this.updateUsedProductsFormArray();
  }

  private updateUsedProductsFormArray(): void {
    const usedProductsFormArray = this.invoiceForm.get('usedProducts') as FormArray;
    usedProductsFormArray.clear();
    this.currentUsedProducts.forEach(p => {
      usedProductsFormArray.push(this.fb.group({
        // Pass all properties as they are expected by backend DTO
        appointmentProductId: [p.appointmentProductId],
        appointmentId: [p.appointmentId],
        productId: [p.productId, Validators.required],
        productName: [p.productName, Validators.required],
        quantity: [p.quantity, [Validators.required, Validators.min(1)]]
      }));
    });
  }

  getAvailableStock(productId: string): number | undefined {
    const product = this.allProducts.find(p => p.productId === productId);
    return product?.quantity;
  }

  getQuantityInCart(productId: string): number {
    const productInCart = this.currentUsedProducts.find(p => p.productId === productId);
    return productInCart?.quantity || 0;
  }

  saveInvoice(): void {
    this.invoiceForm.markAllAsTouched();
    if (this.invoiceForm.invalid) {
      this.snackBar.open('Please fix form errors.', 'Dismiss', { duration: 3000, panelClass: ['error-snackbar'] });
      return;
    }

    this.isLoading = true;
    const formValue = this.invoiceForm.getRawValue();

    // Prepare the payload for the backend
    const updatePayload: InvoicePaymentUpdate = {
      paidAmount: formValue.paidAmount,
      paymentType: formValue.paymentType,
      // Ensure usedProducts array is sent correctly
      usedProducts: this.currentUsedProducts.map(p => ({
        appointmentProductId: p.appointmentProductId,
        appointmentId: p.appointmentId,
        productId: p.productId,
        productName: p.productName,
        quantity: p.quantity
        
      }))

    };

    // --- ADD THIS CONSOLE.LOG ---
    console.log('DEBUG: Frontend Payload to send:', updatePayload);
    console.log('DEBUG: Frontend Paid Amount to send:', updatePayload.paidAmount);
    // --- END CONSOLE.LOG ---
    
    // Remove null/undefined/empty arrays for fields not being updated, if desired.
    // This allows backend to correctly interpret partial updates.
    if (updatePayload.paidAmount === null || updatePayload.paidAmount === undefined) {
      console.warn('DEBUG FE: paidAmount is null or undefined, DELETING from payload.');
      delete updatePayload.paidAmount;
    }
    if (updatePayload.paymentType === null || updatePayload.paymentType === undefined || updatePayload.paymentType === '') {
      console.warn('DEBUG FE: paymentType is null or undefined, DELETING from payload.');
      delete updatePayload.paymentType;
    }
    // Only send usedProducts if there are actual products in the array
    if (updatePayload.usedProducts && updatePayload.usedProducts.length === 0) {
      console.warn('DEBUG FE: usedProducts is empty, DELETING from payload.');
      delete updatePayload.usedProducts;
    }
    console.log('DEBUG FE: FINAL Payload to send:', updatePayload);
    console.log('DEBUG FE: FINAL Paid Amount to send:', updatePayload.paidAmount);
    // --- END CRITICAL CHECKS ---

    // ⭐ Calling the correct updateInvoicePaymentDetails method ⭐
    this.invoiceService.updateInvoicePaymentDetails(this.invoiceId, updatePayload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (responseMessage :any) => { // Backend returns a string message
          this.snackBar.open(responseMessage, 'Close', { duration: 3000 });
          this.isLoading = false;
          this.router.navigate(['/invoices']);
        },
        error: (err :any ) => {
          this.errorMessage = 'Failed to save invoice: ' + (err.error || err.message || 'Error');
          this.snackBar.open(this.errorMessage, 'Dismiss', { duration: 5000, panelClass: ['error-snackbar'] });
          this.isLoading = false;
        }
      });
  }

  cancel(): void {
    this.router.navigate(['/invoices']);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}