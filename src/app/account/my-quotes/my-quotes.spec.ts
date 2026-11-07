import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MyQuotes } from './my-quotes';

describe('MyQuotes', () => {
  let component: MyQuotes;
  let fixture: ComponentFixture<MyQuotes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyQuotes],
    }).compileComponents();

    fixture = TestBed.createComponent(MyQuotes);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
