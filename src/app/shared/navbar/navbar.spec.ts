import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { Navbar } from './navbar';
import { AuthService } from '../../services/auth-service';

describe('Navbar', () => {
  let component: Navbar;
  let fixture: ComponentFixture<Navbar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Navbar],
      providers: [
        {
          provide: AuthService,
          useValue: {
            currentUser$: of(null),
            isAuthenticated: () => false,
            isAdmin: () => false,
            logout: () => undefined,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Navbar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
