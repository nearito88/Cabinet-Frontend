import { Component, OnInit, Output, EventEmitter, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { invoiceService } from '../../../services/invoice/invoice.service';
import { Invoice, InvoiceStatus } from '../../../models/invoice'; // Ensure InvoiceStatus is imported directly
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';
import { CommonModule, CurrencyPipe, TitleCasePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router'; // <--- NEW IMPORTS

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
    MatChipsModule,
    RouterModule // <--- Import RouterModule if you navigate from this component
  ],
  templateUrl: './invoice-pay.component.html',
  styleUrls: ['./invoice-pay.component.css']
})
export class InvoicePayComponent implements OnInit, OnDestroy {
  public invoiceId!: string; // Mark as definitely assigned in ngOnInit

  invoice!: Invoice; // This is the property that holds the invoice data
  paymentForm!: FormGroup;
  isLoading: boolean = false;
  errorMessage: string | null = null;
  paymentTypes: ('CASH' | 'CARD')[] = ['CASH', 'CARD'];

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private invoiceService: invoiceService,
    private snackBar: MatSnackBar,
    private route: ActivatedRoute, // Inject ActivatedRoute to get route params
    private router: Router // Inject Router for navigation
  ) {
    // Invoice ID will be assigned in ngOnInit from route.params
  }

  ngOnInit(): void {
    // Get invoiceId from route parameters
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.invoiceId = params['id']; // 'invoiceId' must match the route parameter name
      if (!this.invoiceId) {
        this.errorMessage = 'Invoice ID is missing from the route.';
        this.snackBar.open(this.errorMessage, 'Dismiss', { duration: 5000, panelClass: ['error-snackbar'] });
        this.router.navigate(['/invoices']); // Redirect back to invoice list if no ID
        return;
      }
      this.fetchInvoiceDetails();
      this.initPaymentForm();
    });
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
        next: (data: Invoice) => {
          if (data) {
            this.invoice = data;
            const remaining = this.invoice.totalAmount - this.invoice.paidAmount;

            // ⭐⭐⭐ ABSOLUTE LAST RESORT FIX FOR PERSISTENT TYPESCRIPT ERROR ⭐⭐⭐
            // Explicitly assert the type of this.invoice.invoiceStatus to string
            // so TypeScript does not do its overly-aggressive narrowing.
            if ((this.invoice.invoiceStatus as string) !== InvoiceStatus.PAID && remaining > 0) { // <--- FIXED LINE
              this.paymentForm.get('paymentAmount')?.enable();
              this.paymentForm.patchValue({ paymentAmount: remaining });
            } else {
              this.paymentForm.get('paymentAmount')?.disable();
              this.paymentForm.patchValue({ paymentAmount: 0 });
            }
          } else {
            this.errorMessage = 'Invoice not found.';
            this.snackBar.open(this.errorMessage, 'Dismiss', { duration: 5000, panelClass: ['error-snackbar'] });
            this.router.navigate(['/invoices']); // Redirect if invoice not found
          }
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error fetching invoice details:', err);
          this.errorMessage = 'Failed to load invoice details: ' + (err.error?.message || err.message || 'Unknown error');
          this.snackBar.open(this.errorMessage, 'Dismiss', { duration: 5000, panelClass: ['error-snackbar'] });
          this.isLoading = false;
          this.router.navigate(['/invoices']); // Redirect on error
        }
      });
  }

  initPaymentForm(): void {
    this.paymentForm = this.fb.group({
      paymentAmount: [
        { value: 0, disabled: true },
        [Validators.required, Validators.min(0.01)]
      ],
      paymentType: ['CASH', Validators.required]
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

    // ⭐⭐ ABSOLUTE LAST RESORT FIX FOR PERSISTENT TYPESCRIPT ERROR ⭐⭐
    if ((this.invoice.invoiceStatus as string) !== InvoiceStatus.PAID && remaining > 0) { // <--- FIXED LINE
      if (isNaN(currentInput) || currentInput < 0) {
        this.f['paymentAmount'].setValue(0);
      } else if (currentInput > remaining) {
        this.f['paymentAmount'].setValue(remaining);
      }
    } else {
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

    // ⭐⭐ ABSOLUTE LAST RESORT FIX FOR PERSISTENT TYPESCRIPT ERROR ⭐⭐
    if ((this.invoice.invoiceStatus as string) === InvoiceStatus.PAID) { // <--- FIXED LINE
        this.snackBar.open('Invoice is already fully paid.', 'Dismiss', { duration: 3000 });
        this.router.navigate(['/invoices']); // Redirect on success/info
        return;
    }
    // ⭐⭐ ABSOLUTE LAST RESORT FIX FOR PERSISTENT TYPESCRIPT ERROR ⭐⭐
    if (this.calculateRemainingAmount() <= 0 && (this.invoice.invoiceStatus as string) !== InvoiceStatus.PAID) { // <--- FIXED LINE
        this.snackBar.open('Invoice has no remaining amount to pay, but status is not PAID. Consider updating status manually if applicable.', 'Dismiss', { duration: 5000, panelClass: ['warn-snackbar'] });
        this.router.navigate(['/invoices']); // Redirect on success/info
        return;
    }


    const paymentAmount = this.f['paymentAmount'].value;
    const paymentType = this.f['paymentType'].value;

    this.isLoading = true;
    this.errorMessage = null;

    this.invoiceService.processPayment(this.invoiceId, paymentAmount, paymentType as 'CASH' | 'CARD')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedInvoice) => {
          this.invoice = updatedInvoice; // Update the local invoice object
          this.snackBar.open('Payment processed successfully!', 'Close', { duration: 3000 });
          this.isLoading = false;
          // Redirect to invoice list after successful payment
          this.router.navigate(['/invoices']);
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
    this.router.navigate(['/invoices']); // Redirect to invoice list on cancel
  }
}