import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services';
import { WhatsAppButtonComponent } from '../../shared/components';
import { ToastContainerComponent } from '../../shared/components';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, WhatsAppButtonComponent, ToastContainerComponent],
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
            <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-link">
              Inicio
            </a>
            <a routerLink="/nosotros" routerLinkActive="active" class="nav-link">
              Nosotros
            </a>
            <a routerLink="/actividades" routerLinkActive="active" class="nav-link">
              Actividades
            </a>
            <a routerLink="/contacto" routerLinkActive="active" class="nav-link">
              Contacto
            </a>
            
            @if (authService.isAuthenticated()) {
              @if (authService.isAdmin()) {
                <a routerLink="/admin/dashboard" class="nav-link admin-link">
                  Panel Admin
                </a>
              }
              <button class="nav-link logout-btn" (click)="logout()">
                Cerrar Sesión
              </button>
            } @else {
              <a routerLink="/login" class="nav-link login-btn">
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
    
    .login-btn {
      background: #1B5E20;
      color: white !important;
      
      &:hover {
        background: #2E7D32;
      }
    }
    
    .logout-btn {
      color: #f44336;
      
      &:hover {
        background: rgba(244, 67, 54, 0.08);
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
      padding: 3rem 1.5rem;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 2rem;
    }
    
    .footer-section {
      h4 {
        margin: 0 0 1rem;
        font-size: 1.125rem;
        font-weight: 600;
      }
      
      p, a {
        margin: 0.5rem 0;
        color: rgba(255, 255, 255, 0.8);
        font-size: 0.875rem;
        line-height: 1.6;
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
      padding: 1.5rem;
      text-align: center;
      
      p {
        margin: 0;
        color: rgba(255, 255, 255, 0.6);
        font-size: 0.8125rem;
      }
    }
  `]
})
export class PublicLayoutComponent {
  authService = inject(AuthService);
  mobileMenuOpen = signal(false);
  isScrolled = signal(false);
  currentYear = new Date().getFullYear();

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

  logout(): void {
    this.authService.logout();
    this.mobileMenuOpen.set(false);
  }
}
