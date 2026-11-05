import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PaySandbox } from './pay-sandbox';

describe('PaySandbox', () => {
  let component: PaySandbox;
  let fixture: ComponentFixture<PaySandbox>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaySandbox],
    }).compileComponents();

    fixture = TestBed.createComponent(PaySandbox);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
