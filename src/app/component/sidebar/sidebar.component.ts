import { Component, Input, Output, EventEmitter, HostListener, inject, OnDestroy, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterModule, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { AuthService } from '../../auth.service';
import { Subscription, filter } from 'rxjs';

// Icons
import { faSignOutAlt, faUser, faCog, faCalendarAlt, faUserFriends, faHome, faBars, faTimes } from '@fortawesome/free-solid-svg-icons';

interface NavItem {
  title: string;
  icon: string;
  route: string;
  badge?: number;
  children?: NavItem[];
  isExpanded?: boolean;
  class?: string;
  isActive?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit, OnDestroy {
  @Input() isOpen = true;
  @Input() isCollapsed = false;
  @Output() toggleCollapse = new EventEmitter<void>();

  isMobile = false;
  user: any = null;
  private subscriptions = new Subscription();
  isMobileMenuOpen: boolean = false;
  currentYear: number = new Date().getFullYear();
  private router = inject(Router);
  private authService = inject(AuthService);
  private platformId = inject(PLATFORM_ID);
  isBrowser: boolean = isPlatformBrowser(this.platformId);

  // Icons
  faSignOutAlt = faSignOutAlt;
  faUser = faUser;
  faCog = faCog;
  faCalendarAlt = faCalendarAlt;
  faUserFriends = faUserFriends;
  faHome = faHome;
  faBars = faBars;
  faTimes = faTimes;

  navigationItems: NavItem[] = [
    {
      title: 'Dashboard',
      icon: 'fas fa-tachometer-alt',
      route: '/dashboard',
      isActive: false
    },
    {
      title: 'Appointments',
      icon: 'fas fa-calendar-check',
      route: '/panel/appointments',
      isActive: false,
      children: [
        {
          title: 'Appointment List',
          route: '/panel/appointments',
          icon: 'fas fa-list',
          isActive: false
        },
        {
          title: 'Calendar',
          route: '/panel/appointments/calendar',
          icon: 'fas fa-calendar-day',
          isActive: false
        },
        {
          title: 'New Appointment',
          route: '/panel/appointments/new',
          icon: 'fas fa-plus',
          isActive: false
        }
      ]
    },
    {
      title: 'Patients',
      icon: 'fas fa-user-injured',
      route: '/patient',
      isActive: false,
      children: [
        {
          title: 'Patient List',
          route: '/patient',
          icon: 'fas fa-list',
          isActive: false
        },
        {
          title: 'New Patient',
          route: '/patient/new',
          icon: 'fas fa-plus',
          isActive: false
        }
      ]
    },
    {
      title: 'Doctors',
      icon: 'fas fa-user-md',
      route: '/panel/doctors',
      isActive: false,
      children: [
        {
          title: 'Doctors List',
          route: '/panel/doctors',
          icon: 'fas fa-list',
          isActive: false
        },
        {
          title: 'Add Doctor',
          route: '/panel/doctors/new',
          icon: 'fas fa-plus',
          isActive: false
        },
        {
          title: 'Schedules',
          route: '/panel/doctors/schedules',
          icon: 'fas fa-calendar-alt',
          isActive: false
        }
      ]
    },
    {
      title: 'Receptionists',
      icon: 'fas fa-headset',
      route: '/panel/receptionists',
      isActive: false,
      children: [
        {
          title: 'Receptionists List',
          route: '/panel/receptionists',
          icon: 'fas fa-list',
          isActive: false
        },
        {
          title: 'Add Receptionist',
          route: '/panel/receptionists/new',
          icon: 'fas fa-plus',
          isActive: false
        }
      ]
    },
    {
      title: 'Services',
      icon: 'fas fa-procedures',
      route: '/panel/services',
      isActive: false,
      children: [
        {
          title: 'Services List',
          route: '/panel/services',
          icon: 'fas fa-list',
          isActive: false
        },
        {
          title: 'Add Service',
          route: '/panel/services/new',
          icon: 'fas fa-plus',
          isActive: false
        },
        {
          title: 'Service Categories',
          route: '/panel/services/categories',
          icon: 'fas fa-tags',
          isActive: false
        }
      ]
    },
    {
      title: 'Inventory',
      icon: 'fas fa-boxes',
      route: '/panel/inventory',
      isActive: false,
      children: [
        {
          title: 'Items List',
          route: '/panel/inventory/items',
          icon: 'fas fa-box',
          isActive: false
        },
        {
          title: 'Add Item',
          route: '/panel/inventory/items/new',
          icon: 'fas fa-plus',
          isActive: false
        },
        {
          title: 'Categories',
          route: '/panel/inventory/categories',
          icon: 'fas fa-tag',
          isActive: false
        },
        {
          title: 'Suppliers',
          route: '/panel/inventory/suppliers',
          icon: 'fas fa-truck',
          isActive: false
        },
        {
          title: 'Stock Movement',
          route: '/panel/inventory/movements',
          icon: 'fas fa-exchange-alt',
          isActive: false
        }
      ]
    },
    {
      title: 'Invoices',
      icon: 'fas fa-file-invoice',
      route: '/panel/invoices',
      isActive: false,
      children: [
        {
          title: 'All Invoices',
          route: '/panel/invoices',
          icon: 'fas fa-list',
          isActive: false
        },
        {
          title: 'Create Invoice',
          route: '/panel/invoices/new',
          icon: 'fas fa-plus',
          isActive: false
        },
        {
          title: 'Invoice Templates',
          route: '/panel/invoices/templates',
          icon: 'fas fa-file-alt',
          isActive: false
        }
      ]
    },
    {
      title: 'Settings',
      icon: 'fas fa-cog',
      route: '/panel/settings',
      isActive: false,
      children: [
        {
          title: 'Profile',
          route: '/panel/settings/profile',
          icon: 'fas fa-user',
          isActive: false
        },
        {
          title: 'Account',
          route: '/panel/settings/account',
          icon: 'fas fa-user-cog',
          isActive: false
        },
        {
          title: 'Notifications',
          route: '/panel/settings/notifications',
          icon: 'fas fa-bell',
          isActive: false
        }
      ]
    },
    {
      title: 'Logout',
      icon: 'fas fa-sign-out-alt',
      route: '/logout',
      class: 'logout',
      isActive: false
    }
  ];

  constructor() {
    // Initialize user data if already logged in
    this.setupAuthListener();
    const userData = this.authService.getCurrentUser();
    if (userData) {
      this.user = userData;
    }
  }

  private setupAuthListener(): void {
    const authSub = this.authService.user$.pipe(
      filter(user => user !== undefined) // Skip initial undefined state
    ).subscribe({
      next: (user: any) => {
        this.user = user ? this.authService.getCurrentUser() : null;
      },
      error: (error: any) => {
        console.error('Error in auth listener:', error);
        this.user = null;
      }
    });
  
    this.subscriptions.add(authSub);
  }

  logout(event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (error: any) => {
        console.error('Logout error:', error);
        this.router.navigate(['/login']);
      }
    });
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.checkIfMobile();
      window.addEventListener('resize', () => this.checkIfMobile());
    }
    
    // Set up route tracking first
    this.setupRouteTracking();
    
    // Then set up navigation items
    this.setupNavigationItems();
  
    // Close sidebar on mobile when route changes
    const routeSub = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd && this.isBrowser && this.isMobile)
    ).subscribe(() => {
      this.isOpen = false;
    });
  
    this.subscriptions.add(routeSub);
  }

  ngOnDestroy(): void {
    // Clean up all subscriptions
    this.subscriptions.unsubscribe();
    if (this.isBrowser) {
      window.removeEventListener('resize', () => this.checkIfMobile());
    }
  }

  private checkIfMobile(): void {
    this.isMobile = window.innerWidth < 992;
  }

  // Check if current route is active
  isRouteActive(route: string): boolean {
    if (!route) return false;

    const currentUrl = this.router.url.split('?')[0]; // Remove query params

    // Exact match
    if (currentUrl === route) {
      return true;
    }

    // Check if current URL starts with the route (for parent routes)
    if (route !== '/' && currentUrl.startsWith(route)) {
      // Make sure we're not matching partial segments
      const nextChar = currentUrl.length > route.length ? currentUrl[route.length] : '';
      return nextChar === '/' || nextChar === '' || nextChar === '?';
    }

    return false;
  }

  private setupRouteTracking(): void {
    // Initial update
    this.updateActiveStates();

    // Subscribe to route changes
    const routeSub = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.updateActiveStates();
    });

    this.subscriptions.add(routeSub);
  }

  private setupNavigationItems(): void {
    // Just subscribe to auth state changes without taking any action
    // The auth guard will handle route protection
    const authSub = this.authService.isAuthenticated$.pipe(
      filter(isAuthenticated => isAuthenticated !== null) // Skip initial null
    ).subscribe(() => {
      // Navigation is now handled by the auth guard
      // We don't need to do anything here
    });
  
    this.subscriptions.add(authSub);
  }
  private updateActiveStates(): void {
    const currentRoute = this.router.url.split('?')[0]; // Remove query params

    this.navigationItems.forEach(item => {
      // Reset active states
      item.isActive = false;

      // Check if the current route matches the item's route
      if (item.route && this.isRouteActive(item.route)) {
        item.isActive = true;
      }

      // Check children if they exist
      if (item.children) {
        let hasActiveChild = false;

        item.children.forEach(child => {
          child.isActive = false;

          if (child.route && this.isRouteActive(child.route)) {
            child.isActive = true;
            hasActiveChild = true;
          }
        });

        // Expand parent if any child is active
        item.isExpanded = hasActiveChild || (item.isExpanded && item.children.length > 0);
      }
    });
  }

  toggleItem(item: NavItem, event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    if (item.children && item.children.length) {
      item.isExpanded = !item.isExpanded;
    } else {
      if (item.route === '/logout') {
        this.logout();
      } else {
        this.router.navigate([item.route]);
      }
    }
  }

  get sidebarClasses() {
    return {
      'sidebar': true,
      'active': this.isOpen,
      'collapsed': this.isCollapsed
    };
  }

  onToggleCollapse(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.toggleCollapse.emit();
    this.isOpen = !this.isOpen;
  }

  navigate(route: string): void {
    this.router.navigate([route]);
    // Close sidebar on mobile after navigation
    if (this.isBrowser) {
      this.isOpen = false;
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    if (this.isBrowser) {
      this.checkIfMobile();
      // Auto-close sidebar when resizing to mobile view
      if (this.isMobile) {
        this.isOpen = false;
      }
    }
  }
}