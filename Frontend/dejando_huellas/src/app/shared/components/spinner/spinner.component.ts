import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="spinner-container" [class.overlay]="overlay" [class.fullscreen]="fullscreen">
      <div class="spinner" [style.width.px]="size" [style.height.px]="size">
        <div class="spinner-circle"></div>
      </div>
      @if (message) {
        <p class="spinner-message">{{ message }}</p>
      }
    </div>
  `,
  styles: [`
    .spinner-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      
      &.overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.8);
        z-index: 9999;
      }
      
      &.fullscreen {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: #F5F5F5;
        z-index: 9999;
      }
    }
    
    .spinner {
      border-radius: 50%;
      position: relative;
    }
    
    .spinner-circle {
      width: 100%;
      height: 100%;
      border: 3px solid #A5D6A7;
      border-top-color: #1B5E20;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    .spinner-message {
      margin-top: 1rem;
      color: #1B5E20;
      font-weight: 500;
    }
  `]
})
export class SpinnerComponent {
  @Input() size: number = 40;
  @Input() overlay: boolean = false;
  @Input() fullscreen: boolean = false;
  @Input() message: string = '';
}
