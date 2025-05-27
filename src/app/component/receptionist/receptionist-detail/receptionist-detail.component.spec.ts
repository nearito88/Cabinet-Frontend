import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReceptionistDetailsComponent } from './receptionist-detail.component';

describe('ReceptionistDetailsComponent', () => {
  let component: ReceptionistDetailsComponent;
  let fixture: ComponentFixture<ReceptionistDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReceptionistDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReceptionistDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
