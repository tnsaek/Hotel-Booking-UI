import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HotelSearch } from './hotel-search';

describe('HotelSearch', () => {
  let component: HotelSearch;
  let fixture: ComponentFixture<HotelSearch>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HotelSearch],
    }).compileComponents();

    fixture = TestBed.createComponent(HotelSearch);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
