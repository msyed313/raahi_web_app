import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AcceptQuote } from './accept-quote';

describe('AcceptQuote', () => {
  let component: AcceptQuote;
  let fixture: ComponentFixture<AcceptQuote>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AcceptQuote],
    }).compileComponents();

    fixture = TestBed.createComponent(AcceptQuote);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
