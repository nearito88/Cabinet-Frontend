import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvoicePayComponent } from './invoice-pay.component';

describe('InvoicePayComponent', () => {
  let component: InvoicePayComponent;
  let fixture: ComponentFixture<InvoicePayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvoicePayComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InvoicePayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
