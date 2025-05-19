import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter, take } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { SidebarComponent } from './component/sidebar/sidebar.component';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent],
  template: `
    @if (showApp) {
      @if (showSidebar) {
        <app-sidebar [isOpen]="isSidebarOpen" (toggleCollapse)="onToggleSidebar()"></app-sidebar>
      }
      <div class="main-content" [class.sidebar-collapsed]="!isSidebarOpen" [class.sidebar-visible]="showSidebar">
        <router-outlet></router-outlet>
      </div>
    } @else {
      <router-outlet></router-outlet>
    }
  `,
  styles: [`
    .main-content {
      margin-left: 250px;
      transition: margin-left 0.3s ease;
      min-height: 100vh;
      padding: 20px;
      background-color: #f5f7fa;
    }
    
    .sidebar-collapsed {
      margin-left: 70px;
    }
    
    @media (max-width: 991px) {
      .main-content {
        margin-left: 0;
      }
      
      .sidebar-collapsed {
        margin-left: 0;
      }
    }
  `]
})
export class AppComponent implements OnInit {

  authStateReady$: Observable<boolean> | undefined;

  title = 'Medical Office';
  isSidebarOpen = true;
  showApp = false;
  showSidebar = true;
  private auth = inject(AuthService);
  private router = inject(Router);

  constructor(private authService: AuthService){}
  
  ngOnInit() {
    
    this.authStateReady$ = this.authService.authStateReady$;
    // Check initial authentication state and handle sidebar visibility
    this.auth.user$.pipe(take(1)).subscribe((user: any) => {
      if (user) {
        this.showApp = true;
        this.handleAuthenticatedNavigation();
        this.showSidebar = true; // Show sidebar for authenticated users
      } else {
        this.handleUnauthenticatedNavigation();
        this.showSidebar = false; // Hide sidebar for unauthenticated users
      }
    });

    // Handle route changes
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      // No need to update sidebar visibility here
    });
  }

  private checkAuthState() {
    this.auth.user$.pipe(take(1)).subscribe((user: any) => {
      if (user) {
        this.showApp = true;
        this.handleAuthenticatedNavigation();
      } else {
        this.handleUnauthenticatedNavigation();
      }
    });
  }


  onToggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  private handleAuthenticatedNavigation() {
    const currentUrl = this.router.url;
    if (['/login', '/register', '/forgot-password', '/'].includes(currentUrl)) {
      this.router.navigate(['/dashboard']);
    }
    this.showApp = true;
  }

  private handleUnauthenticatedNavigation() {
    const currentUrl = this.router.url;
    const publicRoutes = ['/login', '/register', '/forgot-password', '/'];
    
    if (!publicRoutes.some(route => currentUrl.startsWith(route))) {
      this.router.navigate(['/login'], { 
        queryParams: { returnUrl: currentUrl }
      });
    }
    this.showApp = false;
  }
}
