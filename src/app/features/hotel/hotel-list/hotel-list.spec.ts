import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { HotelList } from './hotel-list';

describe('HotelList', () => {
  let component: HotelList;
  let fixture: ComponentFixture<HotelList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HotelList],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { data: of({ hotels: [] }) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HotelList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
