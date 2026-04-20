import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MembersService, CommunitiesService, HabeasDataService, ToastService } from '../../../core/services';
import { Community } from '../../../core/models';
import { ButtonComponent, SpinnerComponent } from '../../../shared/components';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ButtonComponent, SpinnerComponent],
  template: `
    <div class="register-page">
      <div class="register-container">
        <div class="register-card">
          <div class="register-header">
            <img src="/logotipo.jpeg" alt="Logo" class="register-logo" />
            <h1>Crear Cuenta</h1>
            <p>Únete a Dejando Huellas</p>
          </div>
          
          @if (isLoadingPage()) {
            <div class="loading-state">
              <app-spinner></app-spinner>
            </div>
          } @else {
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
                <label for="community">Comunidad *</label>
                <select 
                  id="community" 
                  name="community"
                  [(ngModel)]="community"
                  [disabled]="isLoading()"
                  required
                >
                  <option value="">Por favor seleccione la comunidad a la que pertenece</option>
                  @for (c of communities(); track c.id) {
                    <option [value]="c.name">{{ c.name }}</option>
                  }
                </select>
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
              
              <!-- Habeas Data Consent -->
              <div class="form-group habeas-consent">
                <label class="checkbox-label">
                  <input 
                    type="checkbox" 
                    name="habeasConsent"
                    [(ngModel)]="habeasConsent"
                    [disabled]="isLoading()"
                    required
                  />
                  <span class="checkbox-custom"></span>
                  <span class="checkbox-text">
                    Acepto el 
                    <button type="button" class="link-btn" (click)="openHabeasDataModal()">
                      tratamiento de mis datos personales
                    </button>
                  </span>
                </label>
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
          }
          
          <div class="register-footer">
            <p>¿Ya tiene cuenta? <a routerLink="/login">Iniciar sesión</a></p>
            <a routerLink="/" class="back-home">← Volver al inicio</a>
          </div>
        </div>
      </div>
      
      <!-- Habeas Data Modal -->
      @if (showHabeasModal()) {
        <div class="modal-overlay" (click)="closeHabeasDataModal()">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Tratamiento de Datos Personales</h3>
              <button class="close-btn" (click)="closeHabeasDataModal()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <div class="modal-content">
              <pre>{{ habeasDataContent() }}</pre>
            </div>
            <div class="modal-footer">
              <app-button (onClick)="closeHabeasDataModal()">
                Cerrar
              </app-button>
            </div>
          </div>
        </div>
      }
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
    
    .loading-state {
      display: flex;
      justify-content: center;
      padding: 3rem;
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
      
      input[type="text"],
      input[type="email"],
      input[type="tel"],
      input[type="password"],
      select {
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
      
      select {
        background: white;
        cursor: pointer;
      }
      
      .hint {
        font-size: 0.75rem;
        color: #757575;
      }
    }
    
    .habeas-consent {
      .checkbox-label {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        cursor: pointer;
        font-weight: normal;
        
        input[type="checkbox"] {
          display: none;
        }
        
        .checkbox-custom {
          width: 20px;
          height: 20px;
          border: 2px solid #E0E0E0;
          border-radius: 4px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          
          &::after {
            content: '';
            width: 10px;
            height: 10px;
            background: #4CAF50;
            border-radius: 2px;
            opacity: 0;
            transition: opacity 0.2s ease;
          }
        }
        
        input:checked + .checkbox-custom {
          border-color: #4CAF50;
          
          &::after {
            opacity: 1;
          }
        }
        
        .checkbox-text {
          font-size: 0.875rem;
          color: #616161;
          line-height: 1.4;
        }
        
        .link-btn {
          background: none;
          border: none;
          color: #1B5E20;
          font-weight: 500;
          cursor: pointer;
          text-decoration: underline;
          padding: 0;
          font-size: inherit;
          
          &:hover {
            color: #2E7D32;
          }
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
    
    /* Modal */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
    }
    
    .modal {
      background: white;
      border-radius: 16px;
      width: 100%;
      max-width: 500px;
      max-height: 80vh;
      display: flex;
      flex-direction: column;
    }
    
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #E0E0E0;
      
      h3 {
        margin: 0;
        color: #1B5E20;
      }
    }
    
    .close-btn {
      width: 32px;
      height: 32px;
      border: none;
      background: none;
      cursor: pointer;
      color: #757575;
      display: flex;
      align-items: center;
      justify-content: center;
      
      svg {
        width: 20px;
        height: 20px;
      }
      
      &:hover {
        color: #212121;
      }
    }
    
    .modal-content {
      padding: 1.5rem;
      overflow-y: auto;
      flex: 1;
      
      pre {
        margin: 0;
        white-space: pre-wrap;
        word-break: break-word;
        font-family: inherit;
        font-size: 0.875rem;
        color: #424242;
        line-height: 1.5;
      }
    }
    
    .modal-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid #E0E0E0;
      display: flex;
      justify-content: flex-end;
    }
  `]
})
export class RegisterComponent implements OnInit {
  private membersService = inject(MembersService);
  private communitiesService = inject(CommunitiesService);
  private habeasDataService = inject(HabeasDataService);
  private router = inject(Router);
  private toastService = inject(ToastService);
  
  name = '';
  email = '';
  phone = '';
  password = '';
  confirmPassword = '';
  community = '';
  habeasConsent = false;
  isLoading = signal(false);
  isLoadingPage = signal(true);
  errorMessage = signal('');
  successMessage = signal('');
  showHabeasModal = signal(false);
  habeasDataContent = signal('');
  
  communities = signal<Community[]>([]);
  
  ngOnInit(): void {
    this.loadData();
  }
  
  loadData(): void {
    // Load communities
    this.communitiesService.getAllCommunities().subscribe({
      next: (response) => {
        this.communities.set(response.communities);
      },
      error: () => {
        // Silently fail - communities are optional
      }
    });
    
    // Load habeas data
    this.habeasDataService.getHabeasData().subscribe({
      next: (response) => {
        this.habeasDataContent.set(response.habeasData.content);
        this.isLoadingPage.set(false);
      },
      error: () => {
        // Use default content
        this.habeasDataContent.set(' treatment of personal data.');
        this.isLoadingPage.set(false);
      }
    });
  }
  
  openHabeasDataModal(): void {
    this.showHabeasModal.set(true);
  }
  
  closeHabeasDataModal(): void {
    this.showHabeasModal.set(false);
  }
  
  onSubmit(): void {
    this.errorMessage.set('');
    this.successMessage.set('');

    if (!this.name || !this.email || !this.password) {
      this.errorMessage.set('Por favor complete todos los campos requeridos');
      return;
    }

    if (!this.habeasConsent) {
      this.errorMessage.set('Debe aceptar el tratamiento de datos personales para continuar');
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage.set('Las contraseñas no coinciden');
      return;
    }

    if (!this.community) {
      this.errorMessage.set('Por favor seleccione la comunidad a la que pertenece');
      return;
    }

    if (this.password.length < 6) {
      this.errorMessage.set('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    this.isLoading.set(true);

    console.log('Registering with community:', this.community);

    this.membersService.registerMember({
      name: this.name,
      email: this.email,
      phone: this.phone || undefined,
      password: this.password,
      community: this.community
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