import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContactService, ToastService } from '../../../core/services';
import { ContactMessage } from '../../../core/models';
import { SpinnerComponent } from '../../../shared/components';

@Component({
  selector: 'app-admin-contact',
  standalone: true,
  imports: [CommonModule, SpinnerComponent],
  template: `
    <div class="contact-page">
      <div class="page-header">
        <div>
          <h2>Mensajes de Contacto</h2>
          <p>Gestiona los mensajes recibidos de usuarios interesados</p>
        </div>
      </div>
      
      @if (isLoading()) {
        <div class="loading-state">
          <app-spinner></app-spinner>
        </div>
      } @else {
        <div class="messages-list">
          @for (message of messages(); track message.id) {
            <div class="message-card" [class.unread]="!message.id">
              <div class="message-header">
                <div class="sender-info">
                  <div class="avatar">{{ getInitials(message.name) }}</div>
                  <div>
                    <h4>{{ message.name }}</h4>
                    <a [href]="'mailto:' + message.email" class="email">{{ message.email }}</a>
                  </div>
                </div>
                <span class="message-date">{{ formatDate(message.created_at) }}</span>
              </div>
              <div class="message-body">
                <p>{{ message.message }}</p>
              </div>
              <div class="message-actions">
                <a [href]="'mailto:' + message.email + '?subject=Re: Dejando Huellas'" class="action-btn reply">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  Responder
                </a>
              </div>
            </div>
          } @empty {
            <div class="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
              </svg>
              <h3>No hay mensajes</h3>
              <p>Los mensajes de contacto aparecerán aquí</p>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .contact-page {
      animation: fadeIn 0.3s ease;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    .page-header {
      margin-bottom: 1.5rem;
      
      h2 {
        color: #1B5E20;
        margin: 0 0 0.25rem;
        font-size: 1.5rem;
      }
      
      p {
        color: #757575;
        margin: 0;
      }
    }
    
    .loading-state {
      text-align: center;
      padding: 4rem;
    }
    
    .messages-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    
    .message-card {
      background: white;
      border-radius: 12px;
      padding: 1.25rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      border-left: 4px solid #E0E0E0;
      
      &.unread {
        border-left-color: #4CAF50;
        background: rgba(76, 175, 80, 0.04);
      }
    }
    
    .message-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    
    .sender-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      
      h4 {
        margin: 0;
        color: #212121;
        font-size: 1rem;
      }
      
      .email {
        color: #4CAF50;
        font-size: 0.875rem;
        text-decoration: none;
        
        &:hover {
          text-decoration: underline;
        }
      }
    }
    
    .avatar {
      width: 40px;
      height: 40px;
      background: #A5D6A7;
      color: #1B5E20;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.875rem;
    }
    
    .message-date {
      font-size: 0.75rem;
      color: #9E9E9E;
    }
    
    .message-body {
      p {
        margin: 0;
        color: #424242;
        line-height: 1.6;
        white-space: pre-wrap;
      }
    }
    
    .message-actions {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #F0F0F0;
    }
    
    .action-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: #F5F5F5;
      border-radius: 8px;
      color: #1B5E20;
      text-decoration: none;
      font-size: 0.875rem;
      font-weight: 500;
      transition: all 0.2s ease;
      
      svg {
        width: 16px;
        height: 16px;
      }
      
      &:hover {
        background: #E0E0E0;
      }
      
      &.reply:hover {
        background: rgba(76, 175, 80, 0.1);
      }
    }
    
    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      background: white;
      border-radius: 12px;
      
      svg {
        width: 80px;
        height: 80px;
        color: #A5D6A7;
        margin-bottom: 1rem;
      }
      
      h3 {
        color: #1B5E20;
        margin: 0 0 0.5rem;
      }
      
      p {
        color: #757575;
        margin: 0;
      }
    }
  `]
})
export class AdminContactComponent implements OnInit {
  private contactService = inject(ContactService);
  private toastService = inject(ToastService);
  
  messages = signal<ContactMessage[]>([]);
  isLoading = signal(true);

  ngOnInit(): void {
    this.loadMessages();
  }

  loadMessages(): void {
    this.isLoading.set(true);
    this.contactService.getAllMessages().subscribe({
      next: (response) => {
        this.messages.set(response.contacts);
        this.isLoading.set(false);
      },
      error: () => {
        this.toastService.error('Error al cargar los mensajes');
        this.isLoading.set(false);
      }
    });
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
