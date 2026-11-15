import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DriverLogin } from './driver-login';

describe('DriverLogin', () => {
  let component: DriverLogin;
  let fixture: ComponentFixture<DriverLogin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DriverLogin],
    }).compileComponents();

    fixture = TestBed.createComponent(DriverLogin);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
