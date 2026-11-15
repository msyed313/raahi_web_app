import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DriverShell } from './driver-shell';

describe('DriverShell', () => {
  let component: DriverShell;
  let fixture: ComponentFixture<DriverShell>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DriverShell],
    }).compileComponents();

    fixture = TestBed.createComponent(DriverShell);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
