import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageHotels } from './manage-hotels';

describe('ManageHotels', () => {
  let component: ManageHotels;
  let fixture: ComponentFixture<ManageHotels>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageHotels],
    }).compileComponents();

    fixture = TestBed.createComponent(ManageHotels);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
