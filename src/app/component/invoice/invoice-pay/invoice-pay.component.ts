import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { invoiceService } from '../../../services/invoice/invoice.service';
import { Invoice, InvoiceStatus } from '../../../models/invoice'; // <--- Using your provided frontend Invoice interface
// import { PaymentType } from '../enums/payment-type.enum'; // No longer needed if paymentType is a simple union type in Invoice
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';
import { CommonModule, CurrencyPipe, TitleCasePipe } from '@angular/common';

// Angular Material Imports
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-invoice-pay',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatChipsModule
  ],
  templateUrl: './invoice-pay.component.html',
  styleUrls: ['./invoice-pay.component.css']
})
export class InvoicePayComponent implements OnInit, OnDestroy {
  @Input() invoiceId!: string;
  @Output() paymentProcessed = new EventEmitter<Invoice>(); // <--- Emits frontend Invoice
  @Output() closeDialog = new EventEmitter<void>();

  invoice!: Invoice; // <--- Using frontend Invoice
  paymentForm!: FormGroup;
  isLoading: boolean = false;
  errorMessage: string | null = null;
  // Based on your Invoice interface:
  paymentTypes: ('CASH' | 'CARD')[] = ['CASH', 'CARD']; // <--- Specific payment types

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private invoiceService: invoiceService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    if (!this.invoiceId) {
      this.errorMessage = 'Invoice ID is missing.';
      return;
    }
    this.fetchInvoiceDetails();
    this.initPaymentForm();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  fetchInvoiceDetails(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.invoiceService.getInvoiceById(this.invoiceId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          if (data) {
            this.invoice = data;
            const remaining = this.invoice.totalAmount - this.invoice.paidAmount;

            // Enable payment amount field and pre-fill if applicable
            if (this.invoice.invoiceStatus !== InvoiceStatus.PAID && remaining > 0) {
              this.paymentForm.get('paymentAmount')?.enable();
              this.paymentForm.patchValue({ paymentAmount: remaining });
            } else {
              // If invoice is already paid or remaining is 0, disable payment field
              this.paymentForm.get('paymentAmount')?.disable();
              this.paymentForm.patchValue({ paymentAmount: 0 });
            }
          } else {
            this.errorMessage = 'Invoice not found.';
          }
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error fetching invoice details:', err);
          this.errorMessage = 'Failed to load invoice details: ' + (err.error?.message || err.message || 'Unknown error');
          this.isLoading = false;
        }
      });
  }

  initPaymentForm(): void {
    this.paymentForm = this.fb.group({
      paymentAmount: [
        { value: 0, disabled: true }, // Start disabled, enable after invoice loads
        [Validators.required, Validators.min(0.01)]
      ],
      paymentType: ['CASH', Validators.required] // Default to CASH, as per your model
    });
  }

  get f() { return this.paymentForm.controls; }

  calculateRemainingAmount(): number {
    if (!this.invoice) {
      return 0;
    }
    const remaining = this.invoice.totalAmount - this.invoice.paidAmount;
    return Math.max(0, remaining);
  }

  onPaymentAmountChange(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    let currentInput = parseFloat(inputElement.value);
    const remaining = this.calculateRemainingAmount();

    // Only allow changes if the invoice is not fully paid and there's a remaining amount
    if (this.invoice.invoiceStatus !== InvoiceStatus.PAID && remaining > 0) {
      if (isNaN(currentInput) || currentInput < 0) {
        this.f['paymentAmount'].setValue(0);
      } else if (currentInput > remaining) {
        this.f['paymentAmount'].setValue(remaining); // Cap at remaining amount
      }
    } else {
      // If invoice is paid or no remaining amount, keep it at 0 and disabled
      this.f['paymentAmount'].setValue(0);
      this.f['paymentAmount'].disable();
    }
  }

  processPayment(): void {
    this.paymentForm.markAllAsTouched();
    if (this.paymentForm.invalid) {
      this.errorMessage = 'Please fix the form errors.';
      this.snackBar.open(this.errorMessage, 'Dismiss', { duration: 3000, panelClass: ['error-snackbar'] });
      return;
    }

    // Check if the invoice is already fully paid based on its status
    if (this.invoice.invoiceStatus === InvoiceStatus.PAID) {
        this.snackBar.open('Invoice is already fully paid.', 'Dismiss', { duration: 3000 });
        this.closeDialog.emit(); // Close the dialog if already paid and no action is needed
        return;
    }
    // Check if the remaining amount is zero but status is not PAID
    if (this.calculateRemainingAmount() <= 0 && ![InvoiceStatus.PAID].includes(this.invoice.invoiceStatus)) {
        this.snackBar.open('Invoice has no remaining amount to pay, but status is not PAID. Consider updating status manually if applicable.', 'Dismiss', { duration: 5000, panelClass: ['warn-snackbar'] });
        this.closeDialog.emit();
        return;
    }


    const paymentAmount = this.f['paymentAmount'].value;
    const paymentType = this.f['paymentType'].value; // This will be 'CASH' or 'CARD'

    this.isLoading = true;
    this.errorMessage = null;

    // Use the string literal type for paymentType as per your model
    this.invoiceService.processPayment(this.invoiceId, paymentAmount, paymentType as 'CASH' | 'CARD')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedInvoice) => { // Expects frontend Invoice model
          this.invoice = updatedInvoice; // Update the local invoice object
          this.snackBar.open('Payment processed successfully!', 'Close', { duration: 3000 });
          this.paymentProcessed.emit(this.invoice); // Emit the updated invoice
          this.isLoading = false;
          // If fully paid, disable further payment input and update to 0
          if (this.invoice.invoiceStatus === InvoiceStatus.PAID) {
            this.f['paymentAmount'].disable();
            this.f['paymentAmount'].setValue(0);
          }
          this.closeDialog.emit(); // Close the dialog/modal
        },
        error: (err) => {
          console.error('Error processing payment:', err);
          this.errorMessage = 'Failed to process payment: ' + (err.error?.message || err.message || 'Unknown error');
          this.snackBar.open(this.errorMessage, 'Dismiss', { duration: 5000, panelClass: ['error-snackbar'] });
          this.isLoading = false;
        }
      });
  }

  cancel(): void {
    this.closeDialog.emit(); // Emit to close the dialog/modal
  }
}