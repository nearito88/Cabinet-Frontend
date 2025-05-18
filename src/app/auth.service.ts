import { Injectable, inject, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, from, Observable, of, Subscription } from 'rxjs';
import { filter, map, switchMap, take } from 'rxjs/operators';
import { signInWithEmailAndPassword, User } from 'firebase/auth';
import { Auth, signOut, getIdToken, onAuthStateChanged } from '@angular/fire/auth';
import { FirebaseError } from 'firebase/app';

interface UserClaims {
  role?: string;
  // Add other custom claims as needed
}

@Injectable({
  providedIn: 'root',
})
export class AuthService implements OnDestroy {
  private auth: Auth = inject(Auth);
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  private userSubject = new BehaviorSubject<User | null>(null);
  private userClaimsSubject = new BehaviorSubject<UserClaims | null>(null);
  private authStateChecked = new BehaviorSubject<boolean>(false);
  private authStateSubscription: Subscription;

  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  user$ = this.userSubject.asObservable();
  userClaims$ = this.userClaimsSubject.asObservable();
  authStateReady$ = this.authStateChecked.asObservable().pipe(
    filter((ready: boolean) => ready),
    take(1)
  );

  constructor(
    private router: Router
  ) {
    this.authStateSubscription = new Subscription();
    const unsubscribeFn = onAuthStateChanged(this.auth,
      async (user) => {
        this.userSubject.next(user);
        this.isAuthenticatedSubject.next(!!user);
        this.authStateChecked.next(true);
        if (user) {
          try {
            const token = await getIdToken(user, true); // Force refresh the token
            console.log('Raw ID Token (Forced Refresh) in AuthService:', token); // Log raw token
            const decodedToken = this.decodeToken(token);
            console.log('Decoded Token in AuthService:', decodedToken); // Log decoded token
            this.userClaimsSubject.next(decodedToken?.claims as UserClaims || null);
          } catch (error) {
            console.error('Error getting ID token:', error);
            this.userClaimsSubject.next(null);
          }
        } else {
          this.userClaimsSubject.next(null);
        }
      },
      (error) => {
        console.error('Auth state listener error:', error);
        this.userSubject.next(null);
        this.isAuthenticatedSubject.next(false);
        this.authStateChecked.next(true);
        this.userClaimsSubject.next(null);
      }
    );
    this.authStateSubscription.add(() => unsubscribeFn()); // Add the unsubscribe function to the Subscription
  }

  ngOnDestroy() {
    if (this.authStateSubscription) {
      this.authStateSubscription.unsubscribe();
    }
  }

  loginWithEmailAndPassword(email: string, password: string): Observable<void> {
    return new Observable((observer) => {
      signInWithEmailAndPassword(this.auth, email, password)
        .then(() => {
          observer.next();
          observer.complete();
        })
        .catch((error: FirebaseError) => {
          observer.error(error);
        });
    });
  }

  logout(): Observable<void> {
    return new Observable((observer) => {
      signOut(this.auth)
        .then(() => {
          this.router.navigate(['/login']);
          observer.next();
          observer.complete();
        })
        .catch((error) => {
          console.error('Error signing out:', error);
          observer.error(error);
        });
    });
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  getCurrentUser(): User | null {
    return this.userSubject.value;
  }

  async getAuthToken(): Promise<string | null> {
    const currentUser = this.userSubject.value;
    if (currentUser) {
      return await getIdToken(currentUser);
    }
    return null;
  }

  // Helper function to decode the JWT token payload
  private decodeToken(token: string): any {
    try {
      // Split the token into header, payload, and signature
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.error('Invalid token format');
        return null;
      }

      // Decode the payload
      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const padding = '='.repeat((4 - base64.length % 4) % 4);
      const base64Padded = base64 + padding;
      const decodedData = JSON.parse(atob(base64Padded));

      // Return the claims
      return decodedData;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }
}