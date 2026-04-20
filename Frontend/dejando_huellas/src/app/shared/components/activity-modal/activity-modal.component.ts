import { Component, Input, Output, EventEmitter, signal, HostListener, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Post } from '../../../core/models';

@Component({
  selector: 'app-activity-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen && post) {
      <div class="modal-overlay" (click)="close.emit()" [attr.aria-hidden]="!isOpen">
        <div class="modal-container" (click)="$event.stopPropagation()" role="dialog" aria-modal="true" [attr.aria-label]="post?.title">
          <!-- Close Button -->
          <button class="close-btn" (click)="close.emit()" aria-label="Cerrar modal">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          
          <!-- Modal Content -->
          <div class="modal-content">
            <!-- Image Gallery -->
            @if (post?.image_url && post?.image_url!.length > 0) {
              <div class="gallery">
                @if (post?.image_url!.length === 1) {
                  <div class="single-image">
                    <img [src]="post?.image_url![0]" [alt]="post?.title" />
                  </div>
                } @else {
                  <div class="carousel">
                    <div 
                      class="carousel-main" 
                      (touchstart)="onTouchStart($event)" 
                      (touchend)="onTouchEnd($event)"
                    >
                      <img [src]="post?.image_url![currentImageIndex()]" [alt]="post?.title + ' imagen ' + (currentImageIndex() + 1)" />
                      @if (post?.image_url!.length > 1) {
                        <button class="carousel-btn prev desktop-only" (click)="prevImage()" aria-label="Imagen anterior">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M15 18l-6-6 6-6" />
                          </svg>
                        </button>
                        <button class="carousel-btn next desktop-only" (click)="nextImage()" aria-label="Imagen siguiente">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M9 18l6-6-6-6" />
                          </svg>
                        </button>
                      }
                    </div>
                    @if (post?.image_url!.length > 1) {
                      <div class="carousel-thumbnails">
                        @for (image of post?.image_url; track $index) {
                          <button 
                            class="thumbnail" 
                            [class.active]="currentImageIndex() === $index"
                            (click)="currentImageIndex.set($index)"
                            aria-label="Ver imagen {{ $index + 1 }}"
                          >
                            <img [src]="image" [alt]="'Miniatura ' + ($index + 1)" />
                          </button>
                        }
                      </div>
                    }
                    <div class="image-counter">
                      {{ currentImageIndex() + 1 }} / {{ post?.image_url!.length }}
                    </div>
                  </div>
                }
              </div>
            }
            
            <!-- Post Details -->
            <div class="post-details">
              <div class="post-meta">
                <span class="date">{{ formatDate(post!.created_at) }}</span>
                @if (post?.creator?.name) {
                  <span class="author">Por {{ post?.creator?.name }}</span>
                } @else if (post?.author_name) {
                  <span class="author">Por {{ post?.author_name }}</span>
                }
              </div>
              
              <h2 class="post-title">{{ post?.title }}</h2>
              
              <div class="post-body">
                <p>{{ post?.content }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      padding: 1rem;
      animation: fadeIn 0.2s ease;
      
      @media (max-width: 600px) {
        padding: 0;
        align-items: flex-start;
      }
    }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    .modal-container {
      background: white;
      border-radius: 16px;
      max-width: 800px;
      width: 100%;
      max-height: 90vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      animation: slideUp 0.3s ease;
      position: relative;
    }
    
    @keyframes slideUp {
      from {
        transform: translateY(30px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
    
    .close-btn {
      position: absolute;
      top: 1rem;
      right: 1rem;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: none;
      background: rgba(255, 255, 255, 0.9);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10;
      transition: all 0.2s ease;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      
      svg {
        width: 20px;
        height: 20px;
        color: #424242;
      }
      
      &:hover {
        background: white;
        transform: scale(1.1);
      }
    }
    
    .modal-content {
      overflow-y: auto;
      max-height: 90vh;
    }
    
    /* Gallery Styles */
    .gallery {
      background: #1a1a1a;
    }
    
    .single-image {
      width: 100%;
      max-height: 400px;
      overflow: hidden;
      
      img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        max-height: 400px;
      }
    }
    
    .carousel {
      position: relative;
    }
    
    .carousel-main {
      position: relative;
      width: 100%;
      height: 400px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      
      img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        max-height: 400px;
      }
    }
    
    .carousel-btn {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 44px;
      height: 44px;
      border-radius: 50%;
      border: none;
      background: rgba(255, 255, 255, 0.9);
      cursor: pointer;
      display: none;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      
      svg {
        width: 24px;
        height: 24px;
        color: #424242;
      }
      
      &:hover {
        background: white;
        transform: translateY(-50%) scale(1.1);
      }
      
      &.prev {
        left: 1rem;
      }
      
      &.next {
        right: 1rem;
      }
      
      /* Show buttons only on desktop (min-width: 1024px) */
      &.desktop-only {
        @media (min-width: 1024px) {
          display: flex;
        }
      }
    }
    
    .carousel-thumbnails {
      display: flex;
      gap: 0.5rem;
      padding: 0.75rem;
      justify-content: center;
      background: #1a1a1a;
      overflow-x: auto;
    }
    
    .thumbnail {
      width: 60px;
      height: 60px;
      border-radius: 8px;
      border: 2px solid transparent;
      overflow: hidden;
      cursor: pointer;
      padding: 0;
      transition: all 0.2s ease;
      flex-shrink: 0;
      
      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      
      &:hover {
        border-color: rgba(255, 255, 255, 0.5);
      }
      
      &.active {
        border-color: #4CAF50;
      }
    }
    
    .image-counter {
      position: absolute;
      bottom: 1rem;
      right: 1rem;
      background: rgba(0, 0, 0, 0.7);
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.875rem;
    }
    
    /* Post Details */
    .post-details {
      padding: 2rem;
    }
    
    @media (min-width: 768px) {
      .post-details {
        padding: 2.5rem;
      }
    }
    
    .post-meta {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
      font-size: 0.875rem;
      color: #757575;
    }
    
    .post-title {
      font-size: 1.75rem;
      color: #1B5E20;
      margin: 0 0 1.5rem;
      line-height: 1.3;
      
      @media (min-width: 768px) {
        font-size: 2rem;
      }
    }
    
    .post-body {
      p {
        color: #424242;
        line-height: 1.8;
        font-size: 1.0625rem;
        white-space: pre-wrap;
        margin: 0;
      }
    }
    
    /* Responsive */
    @media (max-width: 600px) {
      .modal-overlay {
        padding: 0;
      }
      
      .modal-container {
        width: 100%;
        height: 100%;
        max-height: 100vh;
        border-radius: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
      }
      
      .carousel-main {
        height: 250px;
        
        img {
          max-height: 250px;
        }
      }
      
      .carousel-btn {
        width: 36px;
        height: 36px;
        
        svg {
          width: 20px;
          height: 20px;
        }
      }
      
      .post-details {
        padding: 1.5rem;
        flex: 1;
        overflow-y: auto;
      }
      
      .thumbnail {
        width: 50px;
        height: 50px;
      }
      
      .close-btn {
        top: 0.75rem;
        right: 0.75rem;
        width: 36px;
        height: 36px;
      }
    }
    
    /* Very small mobile - max-width: 400px */
    @media (max-width: 400px) {
      .modal-container {
        max-height: 90vh;
        border-radius: 8px;
      }
      
      .carousel-main {
        height: 200px;
        
        img {
          max-height: 200px;
        }
      }
      
      .carousel-btn {
        width: 32px;
        height: 32px;
        
        svg {
          width: 18px;
          height: 18px;
        }
        
        &.prev {
          left: 0.5rem;
        }
        
        &.next {
          right: 0.5rem;
        }
      }
      
      .post-details {
        padding: 1rem;
      }
      
      .post-title {
        font-size: 1.375rem;
        margin-bottom: 1rem;
      }
      
      .post-body p {
        font-size: 0.9375rem;
        line-height: 1.6;
      }
    }
    
    /* Ensure modal is scrollable on small screens */
    @media (max-width: 480px) {
      .modal-overlay {
        padding: 0.5rem;
        align-items: flex-start;
      }
      
      .modal-content {
        max-height: calc(90vh - 1rem);
      }
    }
  `]
})
export class ActivityModalComponent {
  @Input() isOpen: boolean = false;
  @Input() post: Post | null = null;
  
  @Output() close = new EventEmitter<void>();
  
  currentImageIndex = signal(0);
  
  // Touch handling for swipe gestures
  private touchStartX: number = 0;
  private touchStartY: number = 0;
  private touchEndX: number = 0;
  private touchEndY: number = 0;
  private minSwipeDistance: number = 50;
  
  // Track touch start position
  onTouchStart(event: TouchEvent): void {
    const touch = event.touches[0];
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
  }
  
  // Track touch end position and detect swipe
  onTouchEnd(event: TouchEvent): void {
    const touch = event.changedTouches[0];
    this.touchEndX = touch.clientX;
    this.touchEndY = touch.clientY;
    this.detectSwipe();
  }
  
  // Detect swipe direction
  private detectSwipe(): void {
    const deltaX = this.touchEndX - this.touchStartX;
    const deltaY = this.touchEndY - this.touchStartY;
    
    // Only detect horizontal swipes (ignore vertical swipes)
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Check if swipe distance exceeds minimum threshold
      if (Math.abs(deltaX) > this.minSwipeDistance) {
        if (deltaX > 0) {
          // Swipe right → previous image
          this.prevImage();
        } else {
          // Swipe left → next image
          this.nextImage();
        }
      }
    }
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.isOpen) {
      this.close.emit();
    }
  }

  ngOnChanges(): void {
    if (this.isOpen) {
      this.currentImageIndex.set(0);
    }
  }
  
  nextImage(): void {
    const images = this.post?.image_url || [];
    if (images.length > 0) {
      this.currentImageIndex.set((this.currentImageIndex() + 1) % images.length);
    }
  }
  
  prevImage(): void {
    const images = this.post?.image_url || [];
    if (images.length > 0) {
      this.currentImageIndex.set((this.currentImageIndex() - 1 + images.length) % images.length);
    }
  }
  
  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
