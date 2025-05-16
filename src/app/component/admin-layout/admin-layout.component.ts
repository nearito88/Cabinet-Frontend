import { Component, OnInit, ViewChild, ElementRef, HostListener, OnDestroy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    CommonModule, 
    RouterOutlet, 
    SidebarComponent
  ],
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.css']
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  @ViewChild('sidebarOverlay') sidebarOverlay!: ElementRef<HTMLElement>;
  isSidebarActive = true;
  isSidebarCollapsed = false;
  isMobile = false;
  showOverlay = false;
  currentPageTitle = 'Dashboard'; // Default title, can be updated based on route

  constructor() {
    // Set initial state based on screen size
    this.checkScreenSize();
  }

  ngOnInit() {
    // Add any initialization logic here
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkScreenSize();
  }

  private checkScreenSize() {
    if (typeof window !== 'undefined') {
      const wasMobile = this.isMobile;
      this.isMobile = window.innerWidth < 992;
      
      // Reset body class and state if switching from mobile to desktop
      if (wasMobile && !this.isMobile) {
        document.body.classList.remove('sidebar-open');
        this.showOverlay = false;
        this.isSidebarActive = true;
        this.isSidebarCollapsed = false;
      } else if (this.isMobile) {
        // Mobile view - ensure sidebar is not collapsed
        this.isSidebarCollapsed = false;
        this.showOverlay = this.isSidebarActive;
        if (this.isSidebarActive) {
          document.body.classList.add('sidebar-open');
        } else {
          document.body.classList.remove('sidebar-open');
        }
      }
    }
  }

  toggleSidebar() {
    // Only toggle the active state if on mobile or if the sidebar is collapsed
    if (this.isMobile || this.isSidebarCollapsed) {
      this.isSidebarActive = !this.isSidebarActive;
      this.showOverlay = this.isSidebarActive && this.isMobile;
      
      // Toggle body class to prevent scrolling when sidebar is open on mobile
      if (this.isMobile) {
        if (this.isSidebarActive) {
          document.body.classList.add('sidebar-open');
        } else {
          document.body.classList.remove('sidebar-open');
        }
      }
    }
  }
  
  onSidebarToggleCollapse() {
    // Only allow collapsing/expanding on desktop
    if (!this.isMobile) {
      this.isSidebarCollapsed = !this.isSidebarCollapsed;
      
      // If collapsing, make sure the sidebar is open first
      if (this.isSidebarCollapsed && !this.isSidebarActive) {
        this.isSidebarActive = true;
      }
    }
  }

  closeSidebar() {
    if (this.isMobile) {
      this.isSidebarActive = false;
      this.showOverlay = false;
      document.body.classList.remove('sidebar-open');
    } else if (this.isSidebarCollapsed) {
      // If on desktop and sidebar is collapsed, close it completely
      this.isSidebarActive = false;
      this.isSidebarCollapsed = false;
    }
  }

  ngOnDestroy(): void {
    // Clean up body class when component is destroyed
    if (typeof document !== 'undefined') {
      document.body.classList.remove('sidebar-open');
    }
  }

  // Method to be called from child components to toggle the sidebar
  toggleSidebarFromChild() {
    this.toggleSidebar();
  }
}
