import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DriverSignup } from './driver-signup';

describe('DriverSignup', () => {
  let component: DriverSignup;
  let fixture: ComponentFixture<DriverSignup>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DriverSignup],
    }).compileComponents();

    fixture = TestBed.createComponent(DriverSignup);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
