import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { NgForm, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { FirebaseError } from 'firebase/app';  // Import FirebaseError

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  passwordVisible: boolean = false;
  errorMessage = '';
  isLoading = false;

  private router = inject(Router);
  private authService = inject(AuthService);

  togglePasswordVisibility() {
    this.passwordVisible = !this.passwordVisible;
  }

  onSubmit(form: NgForm) {
    if (form.invalid) {
      this.errorMessage = 'Please enter your email and password.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.loginWithEmailAndPassword(this.username, this.password)
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.router.navigate(['/dashboard']);
        },
        error: (error: unknown) => {
          console.error('Login failed:', error);
          this.isLoading = false;
          if (error instanceof FirebaseError) {
            switch (error.code) {
              case 'auth/user-not-found':
              case 'auth/wrong-password':
              case 'auth/invalid-email':
                this.errorMessage = 'Incorrect email or password.';
                break;
              case 'auth/too-many-requests':
                this.errorMessage = 'Too many failed attempts. Please try again later.';
                break;
              case 'auth/user-disabled':
                this.errorMessage = 'This account has been disabled.';
                break;
              default:
                this.errorMessage = 'An error occurred during login.';
                break;
            }
          } else {
            this.errorMessage = 'An unexpected error occurred. Please try again.';
          }
        },
      });
  }
}