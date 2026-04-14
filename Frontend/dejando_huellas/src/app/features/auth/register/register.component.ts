import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MembersService } from '../../../core/services';
import { ToastService } from '../../../core/services';
import { ButtonComponent } from '../../../shared/components';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ButtonComponent],
  template: `
    <div class="register-page">
      <div class="register-container">
        <div class="register-card">
          <div class="register-header">
            <img src="/logotipo.jpeg" alt="Logo" class="register-logo" />
            <h1>Crear Cuenta</h1>
            <p>Únete a Dejando Huellas</p>
          </div>
          
          <form (ngSubmit)="onSubmit()" class="register-form">
            <div class="form-group">
              <label for="name">Nombre completo</label>
              <input 
                type="text" 
                id="name" 
                name="name"
                [(ngModel)]="name"
                placeholder="Juan Pérez"
                required
                [disabled]="isLoading()"
              />
            </div>
            
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
              <label for="phone">Teléfono (opcional)</label>
              <input 
                type="tel" 
                id="phone" 
                name="phone"
                [(ngModel)]="phone"
                placeholder="300 123 4567"
                [disabled]="isLoading()"
              />
            </div>
            
            <div class="form-group">
              <label for="password">Contraseña</label>
              <input 
                type="password" 
                id="password" 
                name="password"
                [(ngModel)]="password"
                placeholder="••••••••"
                required
                minlength="6"
                [disabled]="isLoading()"
              />
              <span class="hint">Mínimo 6 caracteres</span>
            </div>
            
            <div class="form-group">
              <label for="confirmPassword">Confirmar contraseña</label>
              <input 
                type="password" 
                id="confirmPassword" 
                name="confirmPassword"
                [(ngModel)]="confirmPassword"
                placeholder="••••••••"
                required
                [disabled]="isLoading()"
              />
            </div>
            
            @if (errorMessage()) {
              <div class="error-message">
                {{ errorMessage() }}
              </div>
            }
            
            @if (successMessage()) {
              <div class="success-message">
                {{ successMessage() }}
              </div>
            }
            
            <app-button 
              type="submit" 
              [fullWidth]="true" 
              [loading]="isLoading()"
              size="large"
              [disabled]="successMessage() ? true : false"
            >
              {{ successMessage() ? 'Cuenta creada' : 'Crear Cuenta' }}
            </app-button>
          </form>
          
          <div class="register-footer">
            <p>¿Ya tiene cuenta? <a routerLink="/login">Iniciar sesión</a></p>
            <a routerLink="/" class="back-home">← Volver al inicio</a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .register-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #1B5E20 0%, #4CAF50 100%);
      padding: 2rem 1rem;
    }
    
    .register-container {
      width: 100%;
      max-width: 420px;
    }
    
    .register-card {
      background: white;
      border-radius: 16px;
      padding: 2.5rem;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    }
    
    .register-header {
      text-align: center;
      margin-bottom: 2rem;
    }
    
    .register-logo {
      width: 80px;
      height: 80px;
      border-radius: 16px;
      object-fit: cover;
      margin-bottom: 1rem;
    }
    
    .register-header h1 {
      margin: 0 0 0.5rem;
      color: #1B5E20;
      font-size: 1.75rem;
      font-weight: 700;
    }
    
    .register-header p {
      margin: 0;
      color: #757575;
    }
    
    .register-form {
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
      
      .hint {
        font-size: 0.75rem;
        color: #757575;
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
    
    .success-message {
      padding: 0.75rem 1rem;
      background: rgba(76, 175, 80, 0.08);
      border: 1px solid rgba(76, 175, 80, 0.3);
      border-radius: 8px;
      color: #4CAF50;
      font-size: 0.875rem;
    }
    
    .register-footer {
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
export class RegisterComponent {
  private membersService = inject(MembersService);
  private router = inject(Router);
  private toastService = inject(ToastService);
  
  name = '';
  email = '';
  phone = '';
  password = '';
  confirmPassword = '';
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  onSubmit(): void {
    this.errorMessage.set('');
    this.successMessage.set('');

    if (!this.name || !this.email || !this.password) {
      this.errorMessage.set('Por favor complete todos los campos requeridos');
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage.set('Las contraseñas no coinciden');
      return;
    }

    if (this.password.length < 6) {
      this.errorMessage.set('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    this.isLoading.set(true);

    this.membersService.registerMember({
      name: this.name,
      email: this.email,
      phone: this.phone || undefined,
      password: this.password
    }).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        this.successMessage.set('¡Cuenta creada exitosamente! Ahora puede iniciar sesión.');
        this.toastService.success('Cuenta creada. Espere aprobación del administrador.');
        
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (error) => {
        this.isLoading.set(false);
        if (error.status === 409) {
          this.errorMessage.set('Este correo ya está registrado');
        } else if (error.status === 0) {
          this.errorMessage.set('Error de conexión. Verifique su conexión a internet.');
        } else {
          this.errorMessage.set('Error al crear la cuenta. Intente nuevamente.');
        }
      }
    });
  }
}
