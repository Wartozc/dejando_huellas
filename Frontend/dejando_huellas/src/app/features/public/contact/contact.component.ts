import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContactService, ToastService } from '../../../core/services';
import { ButtonComponent } from '../../../shared/components';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent],
  template: `
    <div class="contact-page">
      <!-- Hero -->
      <section class="hero">
        <div class="container">
          <h1>Contáctanos</h1>
          <p>Estamos aquí para ayudarte. Escríbenos y te responderemos pronto.</p>
        </div>
      </section>
      
      <!-- Contact Content -->
      <section class="contact-section">
        <div class="container">
          <div class="contact-grid">
            <!-- Contact Form -->
            <div class="contact-form-wrapper">
              <h2>Envíanos un mensaje</h2>
              
              @if (successMessage()) {
                <div class="success-message">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                    <polyline points="22,4 12,14.01 9,11.01"/>
                  </svg>
                  <div>
                    <h4>¡Mensaje enviado!</h4>
                    <p>Gracias por contactarnos. Te responderemos lo antes posible.</p>
                  </div>
                </div>
              } @else {
                <form (ngSubmit)="onSubmit()" class="contact-form">
                  <div class="form-group">
                    <label for="name">Nombre completo *</label>
                    <input 
                      type="text" 
                      id="name" 
                      name="name"
                      [(ngModel)]="formData.name"
                      placeholder="Tu nombre"
                      required
                      [disabled]="isLoading()"
                    />
                  </div>
                  
                  <div class="form-group">
                    <label for="email">Correo electrónico *</label>
                    <input 
                      type="email" 
                      id="email" 
                      name="email"
                      [(ngModel)]="formData.email"
                      placeholder="correo@ejemplo.com"
                      required
                      [disabled]="isLoading()"
                    />
                  </div>
                  
                  <div class="form-group">
                    <label for="message">Mensaje *</label>
                    <textarea 
                      id="message" 
                      name="message"
                      [(ngModel)]="formData.message"
                      placeholder="¿En qué podemos ayudarte?"
                      rows="5"
                      required
                      [disabled]="isLoading()"
                    ></textarea>
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
                    Enviar Mensaje
                  </app-button>
                </form>
              }
            </div>
            
            <!-- Contact Info -->
            <div class="contact-info">
              <div class="info-card">
                <div class="info-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                </div>
                <h3>Ubicación</h3>
                <p>Ebéjico, Antioquia<br/>Colombia</p>
              </div>
              
              <div class="info-card">
                <div class="info-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </div>
                <h3>Correo</h3>
                <p>contacto&#64;dejandohuellas.com</p>
              </div>
              
              <div class="info-card">
                <div class="info-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
                  </svg>
                </div>
                <h3>WhatsApp</h3>
                <p>+57 300 123 4567</p>
              </div>
              
              <div class="social-links">
                <h3>Síguenos</h3>
                <div class="social-icons">
                  <a href="#" class="social-icon" title="Facebook">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
                    </svg>
                  </a>
                  <a href="#" class="social-icon" title="Instagram">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                      <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/>
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .contact-page {
      overflow-x: hidden;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1.5rem;
    }
    
    /* Hero */
    .hero {
      background: linear-gradient(135deg, #1B5E20 0%, #4CAF50 100%);
      color: white;
      padding: 6rem 0 4rem;
      text-align: center;
      
      h1 {
        font-size: clamp(2rem, 5vw, 3rem);
        margin: 0 0 1rem;
      }
      
      p {
        font-size: 1.25rem;
        margin: 0;
        opacity: 0.9;
      }
    }
    
    /* Contact Section */
    .contact-section {
      padding: 4rem 0;
    }
    
    .contact-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 3rem;
      
      @media (min-width: 992px) {
        grid-template-columns: 1.5fr 1fr;
      }
    }
    
    /* Form */
    .contact-form-wrapper {
      background: white;
      padding: 2rem;
      border-radius: 16px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
      
      h2 {
        color: #1B5E20;
        margin: 0 0 1.5rem;
        font-size: 1.5rem;
      }
    }
    
    .contact-form {
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
      
      input,
      textarea {
        padding: 0.875rem 1rem;
        border: 2px solid #E0E0E0;
        border-radius: 8px;
        font-size: 1rem;
        font-family: inherit;
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
      
      textarea {
        resize: vertical;
        min-height: 120px;
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
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 1.5rem;
      background: rgba(76, 175, 80, 0.08);
      border: 1px solid rgba(76, 175, 80, 0.3);
      border-radius: 12px;
      
      svg {
        width: 48px;
        height: 48px;
        color: #4CAF50;
        flex-shrink: 0;
      }
      
      h4 {
        color: #4CAF50;
        margin: 0 0 0.5rem;
        font-size: 1.125rem;
      }
      
      p {
        color: #424242;
        margin: 0;
      }
    }
    
    /* Info Cards */
    .contact-info {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    
    .info-card {
      background: white;
      padding: 1.5rem;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      
      h3 {
        color: #1B5E20;
        margin: 0 0 0.25rem;
        font-size: 1rem;
      }
      
      p {
        color: #616161;
        margin: 0;
        line-height: 1.5;
      }
    }
    
    .info-icon {
      width: 48px;
      height: 48px;
      background: #A5D6A7;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #1B5E20;
      flex-shrink: 0;
      
      svg {
        width: 24px;
        height: 24px;
      }
    }
    
    .social-links {
      background: white;
      padding: 1.5rem;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      
      h3 {
        color: #1B5E20;
        margin: 0 0 1rem;
        font-size: 1rem;
      }
    }
    
    .social-icons {
      display: flex;
      gap: 0.75rem;
    }
    
    .social-icon {
      width: 44px;
      height: 44px;
      background: #F5F5F5;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #1B5E20;
      transition: all 0.2s ease;
      
      svg {
        width: 22px;
        height: 22px;
      }
      
      &:hover {
        background: #1B5E20;
        color: white;
      }
    }
  `]
})
export class ContactComponent {
  private contactService = inject(ContactService);
  private toastService = inject(ToastService);
  
  formData = {
    name: '',
    email: '',
    message: ''
  };
  
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal(false);

  onSubmit(): void {
    this.errorMessage.set('');

    if (!this.formData.name || !this.formData.email || !this.formData.message) {
      this.errorMessage.set('Por favor complete todos los campos');
      return;
    }

    this.isLoading.set(true);

    this.contactService.sendMessage({
      name: this.formData.name,
      email: this.formData.email,
      message: this.formData.message
    }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.successMessage.set(true);
        this.toastService.success('Mensaje enviado correctamente');
        this.resetForm();
      },
      error: (error) => {
        this.isLoading.set(false);
        if (error.status === 0) {
          this.errorMessage.set('Error de conexión. Verifique su conexión a internet.');
        } else {
          this.errorMessage.set('Error al enviar el mensaje. Intente nuevamente.');
        }
      }
    });
  }

  resetForm(): void {
    setTimeout(() => {
      this.formData = { name: '', email: '', message: '' };
      this.successMessage.set(false);
    }, 5000);
  }
}
