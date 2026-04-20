import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      @for (toast of toastService.toasts(); track toast.id) {
        <div 
          class="toast" 
          [class.success]="toast.type === 'success'"
          [class.error]="toast.type === 'error'"
          [class.warning]="toast.type === 'warning'"
          [class.info]="toast.type === 'info'"
        >
          <div class="toast-icon">
            @switch (toast.type) {
              @case ('success') {
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
              }
              @case ('error') {
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M15 9l-6 6M9 9l6 6"/>
                </svg>
              }
              @case ('warning') {
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 9v4M12 17h.01"/>
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                </svg>
              }
              @default {
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 16v-4M12 8h.01"/>
                </svg>
              }
            }
          </div>
          <span class="toast-message">{{ toast.message }}</span>
          <button class="toast-close" (click)="toastService.remove(toast.id)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 1rem;
      right: 1rem;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      max-width: 400px;
      
      @media (max-width: 480px) {
        left: 0.5rem;
        right: 0.5rem;
        top: 0.5rem;
        max-width: none;
      }
    }
    
    .toast {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      border-radius: 8px;
      background: white;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      animation: slideIn 0.3s ease-out;
      
      @media (max-width: 480px) {
        padding: 0.75rem;
        gap: 0.5rem;
      }
    }
    
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    
    .toast.success {
      border-left: 4px solid #4CAF50;
      .toast-icon { color: #4CAF50; }
    }
    
    .toast.error {
      border-left: 4px solid #f44336;
      .toast-icon { color: #f44336; }
    }
    
    .toast.warning {
      border-left: 4px solid #F4A261;
      .toast-icon { color: #F4A261; }
    }
    
    .toast.info {
      border-left: 4px solid #2196F3;
      .toast-icon { color: #2196F3; }
    }
    
    .toast-icon {
      flex-shrink: 0;
      width: 24px;
      height: 24px;
      
      svg {
        width: 100%;
        height: 100%;
      }
      
      @media (max-width: 480px) {
        width: 20px;
        height: 20px;
      }
    }
    
    .toast-message {
      flex: 1;
      color: #212121;
      font-size: 0.9rem;
      
      @media (max-width: 480px) {
        font-size: 0.8125rem;
      }
    }
    
    .toast-close {
      flex-shrink: 0;
      width: 24px;
      height: 24px;
      border: none;
      background: none;
      cursor: pointer;
      color: #757575;
      padding: 0;
      transition: color 0.2s;
      
      &:hover {
        color: #212121;
      }
      
      svg {
        width: 100%;
        height: 100%;
      }
      
      @media (max-width: 480px) {
        width: 20px;
        height: 20px;
        min-width: 20px;
        min-height: 20px;
      }
    }
  `]
})
export class ToastContainerComponent {
  toastService = inject(ToastService);
}
