import { Injectable, inject, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, filter, map, switchMap, take } from 'rxjs/operators';
import { User } from 'firebase/auth';
import { Auth, signOut, getIdToken, signInWithEmailAndPassword, onAuthStateChanged, Unsubscribe } from '@angular/fire/auth';
import { FirebaseError } from 'firebase/app';

@Injectable({
  providedIn: 'root',
})
export class AuthService implements OnDestroy {
  private auth: Auth = inject(Auth);
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  private userSubject = new BehaviorSubject<User | null>(null);
  private authStateChecked = new BehaviorSubject<boolean>(false);
  private authUnsubscribe: Unsubscribe;

  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  user$ = this.userSubject.asObservable();
  authStateReady$ = this.authStateChecked.asObservable().pipe(
    filter((ready: boolean) => ready),
    take(1)
  );

  constructor(
    private router: Router
  ) {
    // Use onAuthStateChanged instead of authState for more control
    this.authUnsubscribe = onAuthStateChanged(this.auth, 
      (user) => {
        this.userSubject.next(user);
        this.isAuthenticatedSubject.next(!!user);
        this.authStateChecked.next(true);
      },
      (error) => {
        console.error('Auth state listener error:', error);
        this.userSubject.next(null);
        this.isAuthenticatedSubject.next(false);
        this.authStateChecked.next(true);
      }
    );
  }

  ngOnDestroy() {
    if (this.authUnsubscribe) {
      this.authUnsubscribe();
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

  getAuthToken(): Promise<string | null> {
    const currentUser = this.userSubject.value;
    if (currentUser) {
      return getIdToken(currentUser);
    }
    return Promise.resolve(null);
  }
}