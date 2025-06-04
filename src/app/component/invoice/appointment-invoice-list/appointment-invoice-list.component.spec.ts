import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppointmentInvoiceListComponent } from './appointment-invoice-list.component';

describe('AppointmentInvoiceListComponent', () => {
  let component: AppointmentInvoiceListComponent;
  let fixture: ComponentFixture<AppointmentInvoiceListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppointmentInvoiceListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AppointmentInvoiceListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
