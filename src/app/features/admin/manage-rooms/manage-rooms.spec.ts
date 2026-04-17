import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageRooms } from './manage-rooms';

describe('ManageRooms', () => {
  let component: ManageRooms;
  let fixture: ComponentFixture<ManageRooms>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageRooms],
    }).compileComponents();

    fixture = TestBed.createComponent(ManageRooms);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
