import { Component, inject, signal, computed, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services';
import { WhatsAppButtonComponent } from '../../shared/components';
import { ToastContainerComponent } from '../../shared/components';
import { ChatBotComponent } from '../../features/public/chatbot/chatbot.component';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, WhatsAppButtonComponent, ToastContainerComponent, ChatBotComponent],
  template: `
    <div class="layout">
      <!-- Navbar -->
      <nav class="navbar" [class.scrolled]="isScrolled()">
        <div class="navbar-container">
          <a routerLink="/" class="navbar-brand">
            <img src="/logotipo.jpeg" alt="Dejando Huellas" class="logo" />
            <span class="brand-text">Dejando Huellas</span>
          </a>
          
          <!-- Desktop Menu -->
          <div class="navbar-menu" [class.is-open]="mobileMenuOpen()">
            <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-link" (click)="closeMobileMenu()">
              Inicio
            </a>
            <a routerLink="/nosotros" routerLinkActive="active" class="nav-link" (click)="closeMobileMenu()">
              Nosotros
            </a>
            <a routerLink="/actividades" routerLinkActive="active" class="nav-link" (click)="closeMobileMenu()">
              Actividades
            </a>
            <a routerLink="/contacto" routerLinkActive="active" class="nav-link" (click)="closeMobileMenu()">
              Contacto
            </a>
            
            @if (authService.isAuthenticated()) {
              @if (authService.isAdmin()) {
                <a routerLink="/admin/dashboard" class="nav-link admin-link" (click)="closeMobileMenu()">
                  Panel Admin
                </a>
              }
              <a routerLink="/comunidad" routerLinkActive="active" class="nav-link comunidad-link" (click)="closeMobileMenu()">
                Comunidad
              </a>
              <div class="user-menu">
                <button class="user-dropdown-toggle" (click)="toggleUserDropdown($event)">
                  <span class="user-name">{{ userName() }}</span>
                  <svg class="dropdown-arrow" [class.open]="dropdownOpen()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
                </button>
                @if (dropdownOpen()) {
                  <div class="user-dropdown-menu">
                    <button class="dropdown-item logout-item" (click)="logout()">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                        <polyline points="16,17 21,12 16,7"/>
                        <line x1="21" y1="12" x2="9" y2="12"/>
                      </svg>
                      Cerrar Sesión
                    </button>
                  </div>
                }
              </div>
            } @else {
              <a routerLink="/register" class="nav-link register-btn" (click)="closeMobileMenu()">
                Registrarse
              </a>
              <a routerLink="/login" class="nav-link login-btn" (click)="closeMobileMenu()">
                Iniciar Sesión
              </a>
            }
          </div>
          
          <!-- Mobile Menu Toggle -->
          <button class="mobile-menu-btn" (click)="toggleMobileMenu()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              @if (mobileMenuOpen()) {
                <path d="M18 6L6 18M6 6l12 12"/>
              } @else {
                <path d="M4 6h16M4 12h16M4 18h16"/>
              }
            </svg>
          </button>
        </div>
      </nav>
      
      <!-- Mobile Menu Overlay -->
      @if (mobileMenuOpen()) {
        <div class="mobile-menu-overlay" (click)="closeMobileMenu()"></div>
      }
      
      <!-- Main Content -->
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
      
      <!-- Footer -->
      <footer class="footer">
        <div class="footer-container">
          <div class="footer-section">
            <h4>Dejando Huellas</h4>
            <p>Asociación de Emprendedores de Ebéjico</p>
          </div>
          <div class="footer-section">
            <h4>Enlaces</h4>
            <a routerLink="/">Inicio</a>
            <a routerLink="/nosotros">Nosotros</a>
            <a routerLink="/actividades">Actividades</a>
            <a routerLink="/contacto">Contacto</a>
          </div>
          <div class="footer-section">
            <h4>Contacto</h4>
            <p>Ebéjico, Antioquia, Colombia</p>
          </div>
        </div>
        <div class="footer-bottom">
          <p>&copy; {{ currentYear }} Dejando Huellas. Todos los derechos reservados.</p>
        </div>
      </footer>
      
      <!-- WhatsApp Button -->
      <app-whatsapp-button></app-whatsapp-button>
      
      <!-- ChatBot -->
      <app-chatbot></app-chatbot>
      
      <!-- Toast Notifications -->
      <app-toast-container></app-toast-container>
    </div>
  `,
  styles: [`
    .layout {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    
    /* Navbar */
    .navbar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: white;
      z-index: 1000;
      transition: box-shadow 0.3s ease;
      
      &.scrolled {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }
    }
    
    .navbar-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0.75rem 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    
    .navbar-brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      text-decoration: none;
    }
    
    .logo {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      object-fit: cover;
    }
    
    .brand-text {
      font-size: 1.25rem;
      font-weight: 700;
      color: #1B5E20;
      
      @media (max-width: 600px) {
        display: none;
      }
    }
    
    .navbar-menu {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      
      @media (max-width: 768px) {
        position: fixed;
        top: 64px;
        left: 0;
        right: 0;
        background: white;
        flex-direction: column;
        padding: 1rem;
        gap: 0;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        transform: translateY(-100%);
        opacity: 0;
        pointer-events: none;
        transition: all 0.3s ease;
        
        &.is-open {
          transform: translateY(0);
          opacity: 1;
          pointer-events: all;
        }
      }
    }
    
    .nav-link {
      padding: 0.5rem 1rem;
      color: #424242;
      text-decoration: none;
      font-weight: 500;
      border-radius: 8px;
      transition: all 0.2s ease;
      background: none;
      border: none;
      cursor: pointer;
      font-size: 0.9375rem;
      
      &:hover {
        color: #1B5E20;
        background: rgba(27, 94, 32, 0.08);
      }
      
      &.active {
        color: #1B5E20;
        background: rgba(27, 94, 32, 0.12);
      }
    }
    
    .admin-link {
      color: #F4A261;
      
      &:hover {
        color: #E08B4A;
        background: rgba(244, 162, 97, 0.12);
      }
    }
    
    .comunidad-link {
      color: #1B5E20;
      
      &:hover {
        color: #2E7D32;
        background: rgba(27, 94, 32, 0.08);
      }
    }
    
    .register-btn {
      background: #4CAF50;
      color: white !important;
      
      &:hover {
        background: #43A047;
      }
    }
    
    .login-btn {
      background: #1B5E20;
      color: white !important;
      
      &:hover {
        background: #2E7D32;
      }
    }
    
    .user-menu {
      display: flex;
      align-items: center;
      position: relative;
      
      @media (max-width: 768px) {
        flex-direction: column;
        align-items: flex-start;
        padding: 0.5rem 1rem;
        width: 100%;
      }
    }
    
    .user-dropdown-toggle {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.5rem 0.75rem;
      background: none;
      border: none;
      cursor: pointer;
      border-radius: 8px;
      transition: all 0.2s ease;
      color: #1B5E20;
      font-weight: 600;
      font-size: 0.875rem;
      
      &:hover {
        background: rgba(27, 94, 32, 0.08);
      }
      
      @media (max-width: 768px) {
        padding: 0;
        width: 100%;
        justify-content: space-between;
      }
    }
    
    .dropdown-arrow {
      width: 16px;
      height: 16px;
      transition: transform 0.2s ease;
      
      &.open {
        transform: rotate(180deg);
      }
    }
    
    .user-dropdown-menu {
      position: absolute;
      top: calc(100% + 0.5rem);
      right: 0;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      min-width: 180px;
      overflow: hidden;
      z-index: 100;
      animation: dropdownFadeIn 0.2s ease;
      
      @media (max-width: 768px) {
        position: static;
        box-shadow: none;
        width: 100%;
        animation: none;
        background: transparent;
        padding-top: 0.5rem;
      }
    }
    
    @keyframes dropdownFadeIn {
      from {
        opacity: 0;
        transform: translateY(-8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .dropdown-item {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      width: 100%;
      padding: 0.75rem 1rem;
      background: none;
      border: none;
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 500;
      color: #424242;
      transition: all 0.2s ease;
      text-decoration: none;
      
      svg {
        width: 18px;
        height: 18px;
        flex-shrink: 0;
      }
      
      &:hover {
        background: rgba(0, 0, 0, 0.04);
      }
      
      @media (max-width: 768px) {
        padding: 0.75rem 0;
        justify-content: flex-start;
      }
    }
    
    .logout-item {
      color: #f44336;
      
      &:hover {
        background: rgba(244, 67, 54, 0.08);
        color: #d32f2f;
      }
    }
    
    .mobile-menu-btn {
      display: none;
      width: 40px;
      height: 40px;
      border: none;
      background: none;
      cursor: pointer;
      color: #1B5E20;
      
      @media (max-width: 768px) {
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      svg {
        width: 24px;
        height: 24px;
      }
    }
    
    /* Mobile Menu Overlay */
    .mobile-menu-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 999;
      animation: fadeIn 0.2s ease;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    /* Main Content */
    .main-content {
      flex: 1;
      margin-top: 64px;
    }
    
    /* Footer */
    .footer {
      background: #1B5E20;
      color: white;
      margin-top: auto;
    }
    
    .footer-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem 1.5rem;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
    }
    
    .footer-section {
      h4 {
        margin: 0 0 0.75rem;
        font-size: 1rem;
        font-weight: 600;
      }
      
      p, a {
        margin: 0.375rem 0;
        color: rgba(255, 255, 255, 0.8);
        font-size: 0.8125rem;
        line-height: 1.5;
      }
      
      a {
        display: block;
        text-decoration: none;
        
        &:hover {
          color: white;
        }
      }
    }
    
    .footer-bottom {
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      padding: 1rem 1.5rem;
      text-align: center;
      
      p {
        margin: 0;
        color: rgba(255, 255, 255, 0.6);
        font-size: 0.75rem;
      }
    }
    
    /* Mobile Responsive - max-width: 480px */
    @media (max-width: 480px) {
      .navbar-container {
        padding: 0.625rem 1rem;
      }
      
      .logo {
        width: 36px;
        height: 36px;
      }
      
      .brand-text {
        display: none;
      }
      
      .navbar-menu {
        top: 56px;
      }
      
      .main-content {
        margin-top: 56px;
      }
      
      .footer-container {
        padding: 1.5rem 1rem;
        grid-template-columns: 1fr;
        gap: 1.5rem;
        text-align: center;
      }
      
      .footer-section {
        h4 {
          margin-bottom: 0.5rem;
        }
      }
    }
    
    /* Tablet Responsive - 481px to 768px */
    @media (min-width: 481px) and (max-width: 768px) {
      .brand-text {
        display: block;
        font-size: 1rem;
      }
      
      .footer-container {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `]
})
export class PublicLayoutComponent {
  authService = inject(AuthService);
  private elementRef = inject(ElementRef);
  mobileMenuOpen = signal(false);
  isScrolled = signal(false);
  dropdownOpen = signal(false);
  currentYear = new Date().getFullYear();
  
  // Computed signal to check if user is authenticated but NOT admin
  isMember = computed(() => {
    const user = this.authService.user();
    return this.authService.isAuthenticated() && user?.role !== 'ADMIN';
  });

  // Computed signal to get the authenticated user's name
  userName = computed(() => {
    const user = this.authService.user();
    return user?.name || '';
  });

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', () => {
        this.isScrolled.set(window.scrollY > 10);
      });
    }
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update(v => !v);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  toggleUserDropdown(event: Event): void {
    event.stopPropagation();
    this.dropdownOpen.update(v => !v);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    // Close mobile menu when clicking outside the menu
    if (this.mobileMenuOpen()) {
      const navbarMenu = this.elementRef.nativeElement.querySelector('.navbar-menu');
      const mobileMenuBtn = this.elementRef.nativeElement.querySelector('.mobile-menu-btn');
      const target = event.target as HTMLElement;
      
      const isClickInsideMenu = navbarMenu?.contains(target) || mobileMenuBtn?.contains(target);
      
      if (!isClickInsideMenu) {
        this.mobileMenuOpen.set(false);
      }
    }
    
    // Close user dropdown when clicking outside
    if (!this.dropdownOpen()) {
      return;
    }
    
    // Check if click is outside the dropdown menu element
    const dropdownMenu = this.elementRef.nativeElement.querySelector('.user-dropdown-menu');
    const dropdownToggle = this.elementRef.nativeElement.querySelector('.user-dropdown-toggle');
    
    const target = event.target as HTMLElement;
    const isClickInsideDropdown = dropdownMenu?.contains(target) || dropdownToggle?.contains(target);
    
    if (!isClickInsideDropdown) {
      this.dropdownOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.dropdownOpen.set(false);
  }

  logout(): void {
    this.authService.logout();
    this.mobileMenuOpen.set(false);
  }
}
