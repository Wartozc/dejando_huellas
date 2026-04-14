import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen) {
      <div class="dialog-overlay" (click)="onCancel.emit()">
        <div class="dialog-container" (click)="$event.stopPropagation()">
          <div class="dialog-header">
            <h3>{{ title }}</h3>
          </div>
          <div class="dialog-content">
            <p>{{ message }}</p>
          </div>
          <div class="dialog-actions">
            <button class="btn-cancel" (click)="onCancel.emit()">
              {{ cancelText }}
            </button>
            <button class="btn-confirm" [class.danger]="confirmDanger" (click)="onConfirm.emit()">
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .dialog-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      animation: fadeIn 0.2s ease;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    .dialog-container {
      background: white;
      border-radius: 12px;
      max-width: 400px;
      width: 90%;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      animation: slideUp 0.2s ease;
    }
    
    @keyframes slideUp {
      from {
        transform: translateY(20px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
    
    .dialog-header {
      padding: 1.25rem 1.25rem 0;
      
      h3 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: #1B5E20;
      }
    }
    
    .dialog-content {
      padding: 1rem 1.25rem;
      
      p {
        margin: 0;
        color: #424242;
        line-height: 1.5;
      }
    }
    
    .dialog-actions {
      padding: 0.5rem 1.25rem 1.25rem;
      display: flex;
      gap: 0.75rem;
      justify-content: flex-end;
    }
    
    button {
      padding: 0.625rem 1.25rem;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      border: none;
    }
    
    .btn-cancel {
      background: #E0E0E0;
      color: #616161;
      
      &:hover {
        background: #BDBDBD;
      }
    }
    
    .btn-confirm {
      background: #1B5E20;
      color: white;
      
      &:hover {
        background: #2E7D32;
      }
      
      &.danger {
        background: #f44336;
        
        &:hover {
          background: #E53935;
        }
      }
    }
  `]
})
export class ConfirmDialogComponent {
  @Input() isOpen: boolean = false;
  @Input() title: string = 'Confirmar';
  @Input() message: string = '¿Está seguro de que desea continuar?';
  @Input() confirmText: string = 'Aceptar';
  @Input() cancelText: string = 'Cancelar';
  @Input() confirmDanger: boolean = false;
  
  @Output() onConfirm = new EventEmitter<void>();
  @Output() onCancel = new EventEmitter<void>();
}
