import { Component, Input, Output, EventEmitter, HostListener, inject, OnDestroy, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterModule, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { AuthService } from '../../auth.service';
import { Subscription, filter, take } from 'rxjs';
import { UserClaims } from '../../models/userClaims';


// Icons
import { faSignOutAlt, faUser, faCog, faCalendarAlt, faUserFriends, faHome, faBars, faTimes } from '@fortawesome/free-solid-svg-icons';

export interface NavItem {
  title: string;
  icon: string;
  route: string;
  badge?: number;
  children?: NavItem[];
  isExpanded?: boolean;
  class?: string;
  isActive?: boolean;
  allowedRoles?: string[];
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
  userRole: string | null = null; // Declare userRole property
  userClaims: UserClaims | null = null; // Declare the userClaims property
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
      isActive: false,
      isExpanded: false,
      allowedRoles: ['admin', 'doctor', 'receptionist']
    },
    {
      title: 'Appointments',
      icon: 'fas fa-calendar-check',
      route: '/panel/appointments',
      isActive: false,
      isExpanded: false,
      allowedRoles: ['admin', 'doctor', 'receptionist'],
      children: [
        {
          title: 'Appointment List',
          route: '/panel/appointments',
          icon: 'fas fa-list',
          isActive: false,
          isExpanded: false
        },
        {
          title: 'New Appointment',
          route: '/panel/appointments/new',
          icon: 'fas fa-plus',
          isActive: false,
          isExpanded: false
        }
      ]
    },
    {
      title: 'Patients',
      icon: 'fas fa-user-injured',
      route: '/patients',
      isActive: false,
      isExpanded: false,
      allowedRoles: ['admin', 'doctor', 'receptionist'],
      children: [
        {
          title: 'List Patients',
          route: '/patients',
          icon: 'fas fa-list',
          isActive: false,
          isExpanded: false
        },
        {
          title: 'Add Patient',
          route: '/addpatient',
          icon: 'fas fa-plus',
          isActive: false,
          isExpanded: false
        }
      ]
    },
    {
      title: 'Doctors',
      icon: 'fas fa-user-md',
      route: '/panel/doctors',
      isActive: false,
      allowedRoles: ['admin'],
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
      allowedRoles: ['admin'],
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
      allowedRoles: ['admin', 'doctor'],
      children: [
        {
          title: 'Services List',
          route: '/services',
          icon: 'fas fa-list',
          isActive: false
        },
        {
          title: 'Add Service',
          route: '/addservice',
          icon: 'fas fa-plus',
          isActive: false
        },  
      ]
    },
    {
      title: 'Inventory',
      icon: 'fas fa-boxes',
      route: '/panel/inventory',
      allowedRoles: ['admin', 'doctor'],
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
      allowedRoles: ['admin', 'doctor', 'receptionist'],
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
      ]
    },
    {
      title: 'Settings',
      icon: 'fas fa-cog',
      route: '/panel/settings',
      isActive: false,
      allowedRoles: ['admin', 'doctor', 'receptionist'],
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
      isActive: false,
      allowedRoles: ['admin', 'doctor', 'receptionist']
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
      filter(user => user !== undefined)
    ).subscribe({
      next: (user: any) => {
        this.user = user ? this.authService.getCurrentUser() : null;
      },
      error: (error: any) => {
        console.error('Error in auth listener:', error);
        this.user = null;
        this.userRole = null;
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
    
    this.setupRouteTracking();
    this.setupNavigationItems();
    
    // Initialize user and user claims subscriptions
    this.subscribeToUser();
    this.subscribeToUserClaims();

    // Handle route changes
    const routeSub = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd && this.isBrowser && this.isMobile)
    ).subscribe(() => {
      this.isOpen = false;
    });

    this.subscriptions.add(routeSub);
  }

  private subscribeToUser(): void {
    const userSub = this.authService.user$.pipe(
      filter(user => user !== undefined)
    ).subscribe({
      next: (user: any) => {
        this.user = user ? this.authService.getCurrentUser() : null;
      },
      error: (error: any) => {
        console.error('Error in user listener:', error);
        this.user = null;
      }
    });
    this.subscriptions.add(userSub);
  }

  private subscribeToUserClaims(): void {
    const claimsSub = this.authService.userClaims$.subscribe(claims => {
      // The auth service is sending the full decoded token object
      // The role is directly in the claims object
      this.userRole = claims?.role || null;
      console.log('User role in Sidebar:', this.userRole);
      console.log('Full Claims Object in Sidebar:', claims); 
      // Update navigation items based on role
      this.updateNavigationItems();
    });
    this.subscriptions.add(claimsSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    if (this.isBrowser) {
      window.removeEventListener('resize', () => this.checkIfMobile());
    }
  }

  private checkIfMobile(): void {
    this.isMobile = window.innerWidth < 992;
  }

  private isRouteActive(route: string): boolean {
    if (!route) return false;

    const currentUrl = this.router.url.split('?')[0];
    if (currentUrl === route) {
      return true;
    }

    if (route !== '/' && currentUrl.startsWith(route)) {
      const nextChar = currentUrl.length > route.length ? currentUrl[route.length] : '';
      return nextChar === '/' || nextChar === '' || nextChar === '?';
    }

    return false;
  }

  private setupRouteTracking(): void {
    this.updateActiveStates();

    const routeSub = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.updateActiveStates();
    });

    this.subscriptions.add(routeSub);
  }

  private setupNavigationItems(): void {
    const authSub = this.authService.isAuthenticated$.pipe(
      filter(isAuthenticated => isAuthenticated !== null)
    ).subscribe(() => {
      // Navigation is handled by auth guard
    });

    this.subscriptions.add(authSub);
  }

  private updateActiveStates(): void {
    const currentRoute = this.router.url.split('?')[0];

    this.navigationItems.forEach(item => {
      item.isActive = false;
      if (item.route && this.isRouteActive(item.route)) {
        item.isActive = true;
      }

      if (item.children) {
        let hasActiveChild = false;
        item.children.forEach(child => {
          child.isActive = false;
          if (child.route && this.isRouteActive(child.route)) {
            child.isActive = true;
            hasActiveChild = true;
          }
        });
        item.isExpanded = hasActiveChild || (item.isExpanded && item.children.length > 0);
      }
    });
  }

  private updateNavigationItemsVisibility(): void {
    if (this.userClaims) { // Check if userClaims is not null
      const userRole = this.userClaims.role; // Store role in a variable
  
      if (userRole) { // Check if userRole exists
        this.navigationItems = this.navigationItems.filter(item => {
          if (item.allowedRoles) {
            return item.allowedRoles.includes(userRole);
          }
          return true;
        });
  
        // Filter children as well
        this.navigationItems.forEach(item => {
          if (item.children) {
            item.children = item.children.filter(child => {
              if (child.allowedRoles) {
                return child.allowedRoles.includes(userRole);
              }
              return true;
            });
            // If a parent has no visible children, collapse it
            if (item.children.length === 0 && item.children.length > 0) {
              item.isExpanded = false;
            }
          }
        });
  
        // Specific role-based removals (as per your requirements)
        if (userRole === 'doctor') {
          this.navigationItems = this.navigationItems.filter(item =>
            item.title !== 'Receptionists' && item.title !== 'Doctors'
          );
        } else if (userRole === 'receptionist') {
          this.navigationItems = this.navigationItems.filter(item =>
            item.title !== 'Services' && item.title !== 'Inventory' && item.title !== 'Doctors' && item.title !== 'Receptionists'
          );
        }
      } else {
        // If userClaims exists but role is undefined, show no role-based items
        this.navigationItems = this.navigationItems.filter(item => !item.allowedRoles);
      }
    } else {
      // If userClaims is null, show no role-based items
      this.navigationItems = this.navigationItems.filter(item => !item.allowedRoles);
    }
  }

  private updateNavigationItems(): void {
    // Update visibility of navigation items based on user role
    if (this.userRole) {
      // You can implement specific visibility rules here based on role
      // For example:
      // if (this.userRole === 'admin') {
      //   // Show all items
      // } else if (this.userRole === 'doctor') {
      //   // Show doctor-specific items
      // }
    }
  }

  toggleItem(item: NavItem, event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    if (item.children && item.children.length) {
      // Toggle this item's expanded state
      item.isExpanded = !item.isExpanded;
      
      // If expanding, make sure parent is also expanded
      if (item.isExpanded) {
        const parent = this.navigationItems.find(navItem => 
          navItem.children?.some(child => child === item)
        );
        if (parent) {
          parent.isExpanded = true;
        }
        // Expand all children
        item.children.forEach(child => {
          if (child.children?.length) {
            child.isExpanded = true;
          }
        });
      }
      // If collapsing, collapse all children
      else {
        const collapseChildren = (items: NavItem[]) => {
          items.forEach(child => {
            child.isExpanded = false;
            if (child.children) {
              collapseChildren(child.children);
            }
          });
        };
        collapseChildren(item.children);
      }
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
      'active': this.isOpen,
      'collapsed': this.isCollapsed
    };
  }

  onToggleCollapse(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.isOpen = !this.isOpen;
    this.toggleCollapse.emit();
  }

  navigate(route: string) {
    this.router.navigate([route]);
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
} // End of SidebarComponent class

// Export the NavItem interface
export interface NavItem {
  title: string;
  icon: string;
  route: string;
  badge?: number;
  children?: NavItem[];
  isExpanded?: boolean;
  class?: string;
  isActive?: boolean;
}