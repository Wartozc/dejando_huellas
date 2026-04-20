import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services';
import { ToastContainerComponent } from '../../shared/components';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, ToastContainerComponent],
  template: `
    <div class="admin-layout">
      <!-- Mobile Overlay -->
      @if (mobileMenuOpen()) {
        <div class="sidebar-overlay" (click)="closeMobileMenu()"></div>
      }
      
      <!-- Sidebar -->
      <aside class="sidebar" [class.collapsed]="sidebarCollapsed()" [class.mobile-open]="mobileMenuOpen()">
        <div class="sidebar-header">
          <a (click)="toggleSidebar()" class="sidebar-brand" style="cursor: pointer;">
            <img src="/logotipo.jpeg" alt="Logo" class="sidebar-logo" />
            @if (!sidebarCollapsed()) {
              <span>Menú Principal</span>
            }
          </a>
          <button class="sidebar-toggle desktop-only" (click)="toggleSidebar()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              @if (sidebarCollapsed()) {
                <path d="M9 18l6-6-6-6"/>
              } @else {
                <path d="M15 18l-6-6 6-6"/>
              }
            </svg>
          </button>
        </div>
        
        <nav class="sidebar-nav">
          @for (item of navItems; track item.route) {
            <a 
              [routerLink]="item.route" 
              routerLinkActive="active"
              class="nav-item"
              [title]="sidebarCollapsed() ? item.label : ''"
              (click)="onNavItemClick()"
            >
              <span class="nav-icon" [innerHTML]="item.icon"></span>
              @if (!sidebarCollapsed()) {
                <span class="nav-label">{{ item.label }}</span>
              }
            </a>
          }
        </nav>
        
        <div class="sidebar-footer">
          <a routerLink="/" class="nav-item" title="Volver al sitio" (click)="onNavItemClick()">
            <span class="nav-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </span>
            @if (!sidebarCollapsed()) {
              <span class="nav-label">Volver al sitio</span>
            }
          </a>
        </div>
      </aside>
      
      <!-- Main Content -->
      <div class="admin-main">
        <!-- Top Bar -->
        <header class="admin-header">
          <div class="header-left">
            <button class="mobile-menu-toggle" (click)="toggleMobileMenu()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                @if (mobileMenuOpen()) {
                  <path d="M18 6L6 18M6 6l12 12"/>
                } @else {
                  <path d="M4 6h16M4 12h16M4 18h16"/>
                }
              </svg>
            </button>
            <h1 class="page-title">{{ pageTitle() }}</h1>
          </div>
          <div class="header-right">
            <a routerLink="/" class="mobile-back-btn desktop-hidden" title="Volver al sitio">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </a>
            <div class="user-menu">
              <span class="user-name">{{ authService.user()?.name }}</span>
              <span class="user-role">{{ authService.user()?.role }}</span>
            </div>
            <button class="logout-btn" (click)="logout()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                <polyline points="16,17 21,12 16,7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              <span class="logout-text">Cerrar Sesión</span>
            </button>
          </div>
        </header>
        
        <!-- Page Content -->
        <main class="admin-content">
          <router-outlet></router-outlet>
        </main>
      </div>
      
      <!-- Toast Notifications -->
      <app-toast-container></app-toast-container>
    </div>
  `,
  styles: [`
    .admin-layout {
      display: flex;
      min-height: 100vh;
      background: #F5F5F5;
    }
    
    /* Sidebar Overlay for Mobile */
    .sidebar-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 99;
      animation: fadeIn 0.2s ease;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    /* Sidebar */
    .sidebar {
      width: 260px;
      background: white;
      display: flex;
      flex-direction: column;
      transition: width 0.3s ease, transform 0.3s ease;
      box-shadow: 2px 0 8px rgba(0, 0, 0, 0.08);
      z-index: 100;
      
      &.collapsed {
        width: 72px;
        
        .sidebar-brand span,
        .nav-label {
          display: none;
        }
        
        .nav-item {
          justify-content: center;
          padding: 0.875rem;
        }
      }
    }
    
    .sidebar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem;
      border-bottom: 1px solid #E0E0E0;
    }
    
    .sidebar-brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      text-decoration: none;
      color: #1B5E20;
      font-weight: 700;
      font-size: 1.125rem;
      overflow: hidden;
    }
    
    .sidebar-logo {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      object-fit: cover;
      flex-shrink: 0;
    }
    
    .sidebar-toggle {
      width: 32px;
      height: 32px;
      border: none;
      background: #F5F5F5;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #757575;
      flex-shrink: 0;
      
      &:hover {
        background: #E0E0E0;
        color: #1B5E20;
      }
      
      svg {
        width: 18px;
        height: 18px;
      }
    }
    
    .desktop-only {
      @media (max-width: 768px) {
        display: none !important;
      }
    }
    
    .sidebar-nav {
      flex: 1;
      padding: 1rem 0.5rem;
      overflow-y: auto;
    }
    
    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      color: #616161;
      text-decoration: none;
      border-radius: 8px;
      margin-bottom: 0.25rem;
      transition: all 0.2s ease;
      
      &:hover {
        background: rgba(27, 94, 32, 0.08);
        color: #1B5E20;
      }
      
      &.active {
        background: #1B5E20;
        color: white;
        
        .nav-icon svg {
          stroke: white;
        }
      }
    }
    
    .nav-icon {
      width: 24px;
      height: 24px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      
      svg, img {
        width: 100%;
        height: 100%;
      }
    }
    
    .nav-label {
      font-weight: 500;
      white-space: nowrap;
    }
    
    .sidebar-footer {
      padding: 1rem 0.5rem;
      border-top: 1px solid #E0E0E0;
    }
    
    /* Main Content */
    .admin-main {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    
    .admin-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.5rem;
      background: white;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
    }
    
    .header-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    
    .mobile-menu-toggle {
      display: none;
      width: auto;
      min-width: 40px;
      height: 40px;
      padding: 0 0.75rem;
      border: none;
      background: #F5F5F5;
      border-radius: 8px;
      cursor: pointer;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      color: #1B5E20;
      flex-shrink: 0;
      font-weight: 500;
      font-size: 0.875rem;
      
      svg {
        width: 24px;
        height: 24px;
        flex-shrink: 0;
      }
      
      &:hover {
        background: #E0E0E0;
      }
    }
    
    .page-title {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
      color: #1B5E20;
    }
    
    .header-right {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .mobile-back-btn {
      display: none;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 8px;
      background: #F5F5F5;
      color: #1B5E20;
      transition: all 0.2s ease;
      
      svg {
        width: 20px;
        height: 20px;
      }
      
      &:hover {
        background: #E8F5E9;
      }
    }

    .desktop-hidden {
      display: flex !important;
    }

    @media (min-width: 769px) {
      .desktop-hidden {
        display: none !important;
      }
    }

    .user-menu {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }
    
    .user-name {
      font-weight: 600;
      color: #212121;
      font-size: 0.875rem;
    }
    
    .user-role {
      font-size: 0.7rem;
      color: #757575;
      text-transform: uppercase;
    }
    
    .logout-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: none;
      border: 1px solid #E0E0E0;
      border-radius: 8px;
      color: #616161;
      cursor: pointer;
      transition: all 0.2s ease;
      font-weight: 500;
      font-size: 0.875rem;
      
      svg {
        width: 18px;
        height: 18px;
        flex-shrink: 0;
      }
      
      &:hover {
        border-color: #f44336;
        color: #f44336;
        background: rgba(244, 67, 54, 0.04);
      }
    }
    
    .admin-content {
      flex: 1;
      padding: 1.5rem;
      overflow-y: auto;
    }
    
    /* Responsive - Tablet and Mobile */
    @media (max-width: 768px) {
      .mobile-menu-toggle {
        display: flex;
      }
      
      .sidebar {
        position: fixed;
        left: 0;
        top: 0;
        bottom: 0;
        transform: translateX(-100%);
        
        &.mobile-open {
          transform: translateX(0);
        }
        
        &.collapsed {
          width: 260px;
          
          .sidebar-brand span,
          .nav-label {
            display: block;
          }
          
          .nav-item {
            justify-content: flex-start;
            padding: 0.75rem 1rem;
          }
        }
      }
      
      .admin-header {
        padding: 0.75rem 1rem;
      }
      
      .page-title {
        font-size: 1.25rem;
      }
      
      .user-menu {
        display: none;
      }
      
      .logout-text {
        display: none;
      }
      
      .logout-btn {
        padding: 0.5rem;
        min-width: 40px;
        justify-content: center;
      }
      
      .admin-content {
        padding: 1rem;
      }
    }
    
    /* Very small mobile */
    @media (max-width: 480px) {
      .sidebar {
        width: 100%;
      }
      
      .admin-header {
        padding: 0.625rem 0.75rem;
      }
      
      .page-title {
        font-size: 1.125rem;
      }
      
      .admin-content {
        padding: 0.75rem;
      }
    }
  `]
})
export class AdminLayoutComponent {
  authService = inject(AuthService);
  sidebarCollapsed = signal(false);
  mobileMenuOpen = signal(false);
  pageTitle = signal('Dashboard');

  navItems: NavItem[] = [
    {
      label: 'Dashboard',
      route: '/admin/dashboard',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>'
    },
    {
      label: 'Miembros',
      route: '/admin/members',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>'
    },
    {
      label: 'Comunidades',
      route: '/admin/communities',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>'
    },
    {
      label: 'Publicaciones',
      route: '/admin/publications',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>'
    },
    {
      label: 'Mensajes',
      route: '/admin/contact',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>'
    },
    {
      label: 'Habeas Data',
      route: '/admin/habeas-data',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>'
    },
    {
      label: 'ChatBot',
      route: '/admin/chatbot',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>'
    },
    {
      label: 'Informe',
      route: '/admin/report',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.21 15.89A10 10 0 118 2.83"/><path d="M22 12A10 10 0 0012 2v10z"/></svg>'
    }
  ];

  toggleSidebar(): void {
    this.sidebarCollapsed.update(v => !v);
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update(v => !v);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  onNavItemClick(): void {
    // Close mobile menu when clicking nav items
    this.closeMobileMenu();
  }

  logout(): void {
    this.authService.logout();
  }
}
