import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoomCard } from './room-card';

describe('RoomCard', () => {
  let component: RoomCard;
  let fixture: ComponentFixture<RoomCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoomCard],
    }).compileComponents();

    fixture = TestBed.createComponent(RoomCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the room card placeholder text', () => {
    expect(fixture.nativeElement.textContent.trim()).toBe('room-card works!');
  });
});
