import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DriverJobs } from './driver-jobs';

describe('DriverJobs', () => {
  let component: DriverJobs;
  let fixture: ComponentFixture<DriverJobs>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DriverJobs],
    }).compileComponents();

    fixture = TestBed.createComponent(DriverJobs);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
