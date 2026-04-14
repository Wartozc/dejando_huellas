import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services';
import { ToastService } from '../../../core/services';
import { ButtonComponent } from '../../../shared/components';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ButtonComponent],
  template: `
    <div class="login-page">
      <div class="login-container">
        <div class="login-card">
          <div class="login-header">
            <img src="/logotipo.jpeg" alt="Logo" class="login-logo" />
            <h1>Dejando Huellas</h1>
            <p>Iniciar sesión en su cuenta</p>
          </div>
          
          <form (ngSubmit)="onSubmit()" class="login-form">
            <div class="form-group">
              <label for="email">Correo electrónico</label>
              <input 
                type="email" 
                id="email" 
                name="email"
                [(ngModel)]="email"
                placeholder="correo@ejemplo.com"
                required
                [disabled]="isLoading()"
              />
            </div>
            
            <div class="form-group">
              <label for="password">Contraseña</label>
              <div class="password-input">
                <input 
                  [type]="showPassword() ? 'text' : 'password'" 
                  id="password" 
                  name="password"
                  [(ngModel)]="password"
                  placeholder="••••••••"
                  required
                  [disabled]="isLoading()"
                />
                <button 
                  type="button" 
                  class="toggle-password"
                  (click)="togglePassword()"
                >
                  @if (showPassword()) {
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  } @else {
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  }
                </button>
              </div>
            </div>
            
            @if (errorMessage()) {
              <div class="error-message">
                {{ errorMessage() }}
              </div>
            }
            
            <app-button 
              type="submit" 
              [fullWidth]="true" 
              [loading]="isLoading()"
              size="large"
            >
              Iniciar Sesión
            </app-button>
          </form>
          
          <div class="login-footer">
            <p>¿No tiene cuenta? <a routerLink="/register">Registrarse</a></p>
            <a routerLink="/" class="back-home">← Volver al inicio</a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #1B5E20 0%, #4CAF50 100%);
      padding: 1rem;
    }
    
    .login-container {
      width: 100%;
      max-width: 420px;
    }
    
    .login-card {
      background: white;
      border-radius: 16px;
      padding: 2.5rem;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    }
    
    .login-header {
      text-align: center;
      margin-bottom: 2rem;
    }
    
    .login-logo {
      width: 80px;
      height: 80px;
      border-radius: 16px;
      object-fit: cover;
      margin-bottom: 1rem;
    }
    
    .login-header h1 {
      margin: 0 0 0.5rem;
      color: #1B5E20;
      font-size: 1.75rem;
      font-weight: 700;
    }
    
    .login-header p {
      margin: 0;
      color: #757575;
    }
    
    .login-form {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      
      label {
        font-weight: 500;
        color: #424242;
        font-size: 0.875rem;
      }
      
      input {
        padding: 0.875rem 1rem;
        border: 2px solid #E0E0E0;
        border-radius: 8px;
        font-size: 1rem;
        transition: border-color 0.2s ease;
        
        &:focus {
          outline: none;
          border-color: #4CAF50;
        }
        
        &:disabled {
          background: #F5F5F5;
          cursor: not-allowed;
        }
        
        &::placeholder {
          color: #BDBDBD;
        }
      }
    }
    
    .password-input {
      position: relative;
      
      input {
        width: 100%;
        padding-right: 3rem;
      }
      
      .toggle-password {
        position: absolute;
        right: 0.75rem;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        cursor: pointer;
        color: #757575;
        padding: 0.25rem;
        
        svg {
          width: 20px;
          height: 20px;
        }
        
        &:hover {
          color: #1B5E20;
        }
      }
    }
    
    .error-message {
      padding: 0.75rem 1rem;
      background: rgba(244, 67, 54, 0.08);
      border: 1px solid rgba(244, 67, 54, 0.3);
      border-radius: 8px;
      color: #f44336;
      font-size: 0.875rem;
    }
    
    .login-footer {
      margin-top: 1.5rem;
      text-align: center;
      
      p {
        color: #757575;
        margin: 0 0 0.75rem;
        
        a {
          color: #1B5E20;
          font-weight: 500;
          text-decoration: none;
          
          &:hover {
            text-decoration: underline;
          }
        }
      }
      
      .back-home {
        color: #757575;
        text-decoration: none;
        font-size: 0.875rem;
        
        &:hover {
          color: #1B5E20;
        }
      }
    }
  `]
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toastService = inject(ToastService);
  
  email = '';
  password = '';
  showPassword = signal(false);
  isLoading = signal(false);
  errorMessage = signal('');

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }

  onSubmit(): void {
    if (!this.email || !this.password) {
      this.errorMessage.set('Por favor complete todos los campos');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: () => {
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
        this.toastService.success('Bienvenido');
        this.router.navigateByUrl(returnUrl);
      },
      error: (error) => {
        this.isLoading.set(false);
        if (error.status === 401) {
          this.errorMessage.set('Credenciales incorrectas');
        } else if (error.status === 0) {
          this.errorMessage.set('Error de conexión. Verifique su conexión a internet.');
        } else {
          this.errorMessage.set('Error al iniciar sesión. Intente nuevamente.');
        }
      }
    });
  }
}
