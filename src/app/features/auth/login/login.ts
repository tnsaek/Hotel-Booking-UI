import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth-service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  loginForm: any;
  isLoading = false;
  errorMessage = '';

  constructor(private fb: FormBuilder, private router: Router, private authService: AuthService) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.loginForm.disable();

    this.authService.login(this.loginForm.value).pipe(
      finalize(() => {
        this.isLoading = false;
        this.loginForm.enable();
      })
    ).subscribe({
      next: (response) => {
        this.router.navigate([response.role === 'ADMIN' ? '/admin/hotels' : '/search']);
      },
      error: (error) => {
        this.errorMessage =
          error.error?.message ||
          (typeof error.error === 'string' ? error.error : 'Login failed. Please try again.');
      },
    });
  }
}
