import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card" [class.hoverable]="hoverable" [class.clickable]="clickable">
      @if (imageUrl) {
        <div class="card-image">
          <img [src]="imageUrl" [alt]="imageAlt || title" />
        </div>
      }
      @if (title || subtitle) {
        <div class="card-header">
          @if (title) {
            <h3 class="card-title">{{ title }}</h3>
          }
          @if (subtitle) {
            <p class="card-subtitle">{{ subtitle }}</p>
          }
        </div>
      }
      <div class="card-content">
        <ng-content></ng-content>
      </div>
      @if (footerTemplate) {
        <div class="card-footer">
          <ng-content select="[slot=footer]"></ng-content>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      height: 100%;
    }
    
    .card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      overflow: hidden;
      transition: box-shadow 0.3s ease, transform 0.3s ease;
      display: flex;
      flex-direction: column;
      width: 100%;
      
      &.hoverable:hover {
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
      }
      
      &.clickable {
        cursor: pointer;
        
        &:hover {
          transform: translateY(-2px);
        }
      }
    }
    
    .card-image {
      width: 100%;
      height: 200px;
      overflow: hidden;
      flex-shrink: 0;
      
      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }
    
    .card-header {
      padding: 1.25rem 1.25rem 0.5rem;
      flex-shrink: 0;
    }
    
    .card-title {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: #1B5E20;
      line-height: 1.3;
    }
    
    .card-subtitle {
      margin: 0.25rem 0 0;
      font-size: 0.875rem;
      color: #757575;
    }
    
    .card-content {
      padding: 1rem 1.25rem 1.25rem;
      color: #212121;
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    
    .card-footer {
      padding: 1rem 1.25rem;
      border-top: 1px solid #E0E0E0;
      background: #FAFAFA;
      flex-shrink: 0;
      margin-top: auto;
    }
  `]
})
export class CardComponent {
  @Input() title: string = '';
  @Input() subtitle: string = '';
  @Input() imageUrl: string = '';
  @Input() imageAlt: string = '';
  @Input() hoverable: boolean = false;
  @Input() clickable: boolean = false;
  @Input() footerTemplate: boolean = false;
}
