import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RideDetail } from './ride-detail';

describe('RideDetail', () => {
  let component: RideDetail;
  let fixture: ComponentFixture<RideDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RideDetail],
    }).compileComponents();

    fixture = TestBed.createComponent(RideDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
