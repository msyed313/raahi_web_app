import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DriverForgot } from './driver-forgot';

describe('DriverForgot', () => {
  let component: DriverForgot;
  let fixture: ComponentFixture<DriverForgot>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DriverForgot],
    }).compileComponents();

    fixture = TestBed.createComponent(DriverForgot);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
