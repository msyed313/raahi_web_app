import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DriverDetail } from './driver-detail';

describe('DriverDetail', () => {
  let component: DriverDetail;
  let fixture: ComponentFixture<DriverDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DriverDetail],
    }).compileComponents();

    fixture = TestBed.createComponent(DriverDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
