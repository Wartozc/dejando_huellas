import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'text' | 'danger';
type ButtonSize = 'small' | 'medium' | 'large';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      [type]="type"
      [class]="buttonClasses"
      [disabled]="disabled || loading"
      (click)="onClick.emit($event)"
    >
      @if (loading) {
        <span class="btn-spinner"></span>
      }
      <ng-content></ng-content>
    </button>
  `,
  styles: [`
    button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      font-family: 'Roboto', sans-serif;
      font-weight: 500;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      
      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      
      &:focus {
        outline: 2px solid #A5D6A7;
        outline-offset: 2px;
      }
    }
    
    /* Sizes */
    .btn-small {
      padding: 0.5rem 1rem;
      font-size: 0.8125rem;
    }
    
    .btn-medium {
      padding: 0.75rem 1.5rem;
      font-size: 0.875rem;
    }
    
    .btn-large {
      padding: 1rem 2rem;
      font-size: 1rem;
    }
    
    /* Variants */
    .btn-primary {
      background: #1B5E20;
      color: white;
      
      &:hover:not(:disabled) {
        background: #2E7D32;
      }
      
      &:active:not(:disabled) {
        background: #1B5E20;
      }
    }
    
    .btn-secondary {
      background: #4CAF50;
      color: white;
      
      &:hover:not(:disabled) {
        background: #66BB6A;
      }
      
      &:active:not(:disabled) {
        background: #4CAF50;
      }
    }
    
    .btn-outline {
      background: transparent;
      color: #1B5E20;
      border: 2px solid #1B5E20;
      
      &:hover:not(:disabled) {
        background: rgba(27, 94, 32, 0.08);
      }
    }
    
    .btn-text {
      background: transparent;
      color: #1B5E20;
      padding-left: 0.5rem;
      padding-right: 0.5rem;
      
      &:hover:not(:disabled) {
        background: rgba(27, 94, 32, 0.08);
      }
    }
    
    .btn-danger {
      background: #f44336;
      color: white;
      
      &:hover:not(:disabled) {
        background: #E53935;
      }
    }
    
    .btn-full-width {
      width: 100%;
    }
    
    .btn-spinner {
      width: 16px;
      height: 16px;
      border: 2px solid currentColor;
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class ButtonComponent {
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'medium';
  @Input() disabled: boolean = false;
  @Input() loading: boolean = false;
  @Input() fullWidth: boolean = false;
  @Output() onClick = new EventEmitter<MouseEvent>();

  get buttonClasses(): string {
    return [
      `btn-${this.size}`,
      `btn-${this.variant}`,
      this.fullWidth ? 'btn-full-width' : ''
    ].filter(Boolean).join(' ');
  }
}
