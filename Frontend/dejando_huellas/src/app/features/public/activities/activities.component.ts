import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PublicationsService, ToastService } from '../../../core/services';
import { AuthService } from '../../../core/services';
import { CardComponent, SpinnerComponent, ActivityModalComponent } from '../../../shared/components';
import { Post } from '../../../core/models';

// Interface for managing images (either file or URL)
export interface ImageItem {
  id: string;
  type: 'file' | 'url';
  file?: File;
  url?: string;
  previewUrl: string;
}

@Component({
  selector: 'app-activities',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, CardComponent, SpinnerComponent, ActivityModalComponent],
  template: `
    <div class="activities-page">
      <!-- Hero -->
      <section class="hero">
        <div class="container">
          <h1>Nuestras Actividades</h1>
          <p>Conoce los proyectos y actividades que realizan nuestros emprendedores</p>
        </div>
      </section>
      
      <!-- Create Button for Authenticated Users -->
      @if (isAuthenticated()) {
        <div class="create-section">
          <div class="container">
            <button class="btn-create" (click)="openCreateModal()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Nueva Publicación
            </button>
          </div>
        </div>
      }
      
      <!-- Activities Grid -->
      <section class="activities-section">
        <div class="container">
          @if (isLoading()) {
            <div class="loading-state">
              <app-spinner [size]="48"></app-spinner>
              <p>Cargando actividades...</p>
            </div>
          } @else if (error()) {
            <div class="error-state">
              <p>No se pudieron cargar las actividades. Intente nuevamente.</p>
            </div>
          } @else {
            <div class="activities-grid">
              @for (post of posts(); track post.id) {
                <app-card 
                  [title]="post.title" 
                  [imageUrl]="post.image_url && post.image_url.length > 0 ? post.image_url[0] : ''"
                  [subtitle]="formatDate(post.created_at)"
                  [hoverable]="true"
                  [clickable]="true"
                  (click)="openModal(post)"
                >
                  <p class="post-excerpt">{{ truncateContent(post.content) }}</p>
                  <a [href]="'/actividades/' + post.id" class="read-more" (click)="$event.preventDefault(); openModal(post)">Leer más →</a>
                </app-card>
              } @empty {
                <div class="empty-state">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2"/>
                  </svg>
                  <h3>No hay actividades publicadas</h3>
                  <p>Pronto compartiremos las novedades de nuestra asociación</p>
                </div>
              }
            </div>
          }
        </div>
      </section>
      
      <!-- CTA -->
      <section class="cta">
        <div class="container">
          <h2>¿Quieres promover tu proyecto?</h2>
          <p>Únete a nuestra comunidad y da a conocer tus iniciativas</p>
          <a routerLink="/contacto" class="btn-primary">Contáctanos</a>
        </div>
      </section>
      
      <!-- Activity Detail Modal -->
      <app-activity-modal
        [isOpen]="isModalOpen()"
        [post]="selectedPost()"
        (close)="closeModal()"
      ></app-activity-modal>

      <!-- Create Post Modal -->
      @if (isCreateModalOpen()) {
        <div class="modal-overlay" (click)="closeCreateModal()" [attr.aria-hidden]="!isCreateModalOpen()">
          <div class="modal-container create-modal" (click)="$event.stopPropagation()" role="dialog" aria-modal="true" aria-label="Crear nueva publicación">
            <button class="close-btn" (click)="closeCreateModal()" aria-label="Cerrar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
            
            <div class="modal-content">
              <h2>Nueva Publicación</h2>
              
              <form (ngSubmit)="createPost()" #createForm="ngForm">
                <div class="form-group">
                  <label for="title">Título *</label>
                  <input 
                    type="text" 
                    id="title" 
                    [(ngModel)]="formData.title" 
                    name="title"
                    required
                    minlength="3"
                    maxlength="200"
                    placeholder="Título de la publicación"
                  />
                </div>
                
                <!-- Image Upload Section -->
                <div class="form-group">
                  <label>Imágenes (opcional)</label>
                  
                  <!-- Image Source Toggle -->
                  <div class="image-toggle">
                    <button 
                      type="button" 
                      class="toggle-btn" 
                      [class.active]="imageSourceType() === 'file'"
                      (click)="imageSourceType.set('file')"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                        <polyline points="17,8 12,3 7,8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                      Subir imagen
                    </button>
                    <button 
                      type="button" 
                      class="toggle-btn" 
                      [class.active]="imageSourceType() === 'url'"
                      (click)="imageSourceType.set('url')"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
                        <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
                      </svg>
                      URL de imagen
                    </button>
                  </div>
                  
                  <!-- File Upload Input -->
                  @if (imageSourceType() === 'file') {
                    <div class="file-upload-area">
                      <input 
                        type="file" 
                        id="imageFiles" 
                        (change)="onFileSelected($event)" 
                        accept="image/*" 
                        multiple 
                        hidden
                        #fileInput
                      />
                      <button type="button" class="upload-btn" (click)="fileInput.click()">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                          <polyline points="17,8 12,3 7,8"/>
                          <line x1="12" y1="3" x2="12" y2="15"/>
                        </svg>
                        Seleccionar imágenes
                      </button>
                      <span class="upload-hint">Selecciona varias imágenes (jpg, png, gif, webp)</span>
                    </div>
                  }
                  
                  <!-- URL Input -->
                  @if (imageSourceType() === 'url') {
                    <div class="url-input-area">
                      <div class="url-input-row">
                        <input 
                          type="url" 
                          id="newImageUrl" 
                          [(ngModel)]="newImageUrl" 
                          name="newImageUrl"
                          placeholder="https://ejemplo.com/imagen.jpg"
                          (keyup.enter)="addImageFromUrl()"
                        />
                        <button type="button" class="btn-add-url" (click)="addImageFromUrl()" [disabled]="!newImageUrl()">
                          Agregar
                        </button>
                      </div>
                    </div>
                  }
                  
                  <!-- Image Previews -->
                  @if (images().length > 0) {
                    <div class="image-previews">
                      <label>Imágenes agregadas ({{ images().length }})</label>
                      <div class="preview-grid">
                        @for (img of images(); track img.id) {
                          <div class="preview-item">
                            <img [src]="img.previewUrl" [alt]="'Imagen ' + img.id" />
                            <button type="button" class="remove-btn" (click)="removeImage(img.id)" title="Eliminar">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"/>
                                <line x1="6" y1="6" x2="18" y2="18"/>
                              </svg>
                            </button>
                          </div>
                        }
                      </div>
                    </div>
                  }
                </div>
                
                <div class="form-group">
                  <label for="content">Contenido *</label>
                  <textarea 
                    id="content" 
                    [(ngModel)]="formData.content" 
                    name="content"
                    required
                    minlength="10"
                    rows="8"
                    placeholder="Descripción de la actividad..."
                  ></textarea>
                </div>
                
                <div class="form-actions">
                  <button type="button" class="btn-cancel" (click)="closeCreateModal()">Cancelar</button>
                  <button type="submit" class="btn-submit" [disabled]="isSaving()">
                    @if (isSaving()) {
                      <app-spinner [size]="20"></app-spinner>
                    } @else {
                      Publicar
                    }
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .activities-page {
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
        color: white;
      }
      
      p {
        font-size: 1.25rem;
        margin: 0;
        opacity: 0.9;
      }
    }
    
    /* Create Section */
    .create-section {
      padding: 1.5rem 0;
      background: #F5F5F5;
      
      .container {
        display: flex;
        justify-content: flex-end;
      }
    }
    
    .btn-create {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: #4CAF50;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      
      svg {
        width: 20px;
        height: 20px;
      }
      
      &:hover {
        background: #388E3C;
        transform: translateY(-2px);
      }
    }
    
    /* Activities Section */
    .activities-section {
      padding: 4rem 0;
    }
    
    .activities-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 2rem;
      align-items: stretch;
    }
    
    .activities-grid > * {
      height: 100%;
    }
    
    .post-excerpt {
      color: #616161;
      line-height: 1.6;
      margin: 0 0 1rem;
      flex: 1;
      min-height: 60px;
    }
    
    .read-more {
      color: #4CAF50;
      text-decoration: none;
      font-weight: 500;
      
      &:hover {
        text-decoration: underline;
      }
    }
    
    /* States */
    .loading-state,
    .error-state {
      text-align: center;
      padding: 4rem;
      color: #757575;
      
      p {
        margin-top: 1rem;
      }
    }
    
    .empty-state {
      grid-column: 1 / -1;
      text-align: center;
      padding: 4rem 2rem;
      background: #F5F5F5;
      border-radius: 16px;
      
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
    
    /* CTA */
    .cta {
      background: #F5F5F5;
      padding: 4rem 0;
      text-align: center;
      
      h2 {
        font-size: 2rem;
        color: #1B5E20;
        margin: 0 0 1rem;
      }
      
      p {
        color: #616161;
        font-size: 1.125rem;
        margin: 0 0 2rem;
      }
    }
    
    .btn-primary {
      display: inline-block;
      padding: 0.875rem 2rem;
      background: #F4A261;
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      transition: all 0.3s ease;
      
      &:hover {
        background: #E08B4A;
        transform: translateY(-2px);
      }
    }
    
    /* Create Modal */
    .create-modal {
      max-width: 600px;
    }
    
    .modal-content {
      padding: 2rem;
      overflow-y: auto;
      max-height: calc(90vh - 80px);
      padding-right: 0.5rem;
      
      h2 {
        color: #1B5E20;
        margin: 0 0 1.5rem;
        font-size: 1.5rem;
        padding-right: 0.5rem;
      }
    }
    
    .form-group {
      margin-bottom: 1.5rem;
      
      label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: #424242;
        font-size: 0.9375rem;
      }
      
      input,
      textarea {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #E0E0E0;
        border-radius: 8px;
        font-size: 1rem;
        font-family: inherit;
        transition: border-color 0.2s;
        
        &:focus {
          outline: none;
          border-color: #4CAF50;
        }
        
        &::placeholder {
          color: #9E9E9E;
        }
        
        @media (max-width: 480px) {
          padding: 0.625rem 0.75rem;
          font-size: 16px; /* Prevent zoom on iOS */
        }
      }
      
      textarea {
        resize: vertical;
        min-height: 120px;
        
        @media (max-width: 480px) {
          min-height: 100px;
        }
      }
    }
    
    .form-actions {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
      margin-top: 2rem;
      padding: 0 0.5rem;
      flex-shrink: 0;
    }
    
    .btn-cancel {
      padding: 0.75rem 1.5rem;
      background: #F5F5F5;
      color: #616161;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;
      
      &:hover {
        background: #E0E0E0;
      }
    }
    
    .btn-submit {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: #4CAF50;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      min-width: 120px;
      
      &:hover:not(:disabled) {
        background: #388E3C;
      }
      
      &:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }
    }
    
    /* Modal overlay (reuse from activity modal) */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: flex-start;
      justify-content: center;
      z-index: 10000;
      padding: 2rem 1rem;
      overflow-y: auto;
      
      @media (max-width: 480px) {
        padding: 0.5rem;
        align-items: stretch;
      }
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
      position: relative;
      
      @media (max-width: 480px) {
        border-radius: 12px;
        max-height: 95vh;
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
      transition: all 0.2s;
      
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
    
    /* Image Upload Styles */
    .image-toggle {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
    }
    
    .toggle-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.625rem 1rem;
      border: 2px solid #E0E0E0;
      background: white;
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.875rem;
      color: #757575;
      transition: all 0.2s ease;
      
      svg {
        width: 18px;
        height: 18px;
      }
      
      &:hover {
        border-color: #4CAF50;
        color: #4CAF50;
      }
      
      &.active {
        border-color: #4CAF50;
        background: #E8F5E9;
        color: #1B5E20;
      }
    }
    
    .file-upload-area {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      padding: 1.5rem;
      border: 2px dashed #BDBDBD;
      border-radius: 8px;
      transition: all 0.2s ease;
      
      &:hover {
        border-color: #4CAF50;
        background: #F1F8E9;
      }
    }
    
    .upload-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.25rem;
      background: #4CAF50;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.9375rem;
      font-weight: 500;
      transition: all 0.2s ease;
      
      svg {
        width: 20px;
        height: 20px;
      }
      
      &:hover {
        background: #388E3C;
      }
    }
    
    .upload-hint {
      font-size: 0.75rem;
      color: #9E9E9E;
    }
    
    .url-input-area {
      margin-top: 0.5rem;
    }
    
    .url-input-row {
      display: flex;
      gap: 0.5rem;
      
      input {
        flex: 1;
        padding: 0.75rem 1rem;
        border: 2px solid #E0E0E0;
        border-radius: 8px;
        font-size: 0.9375rem;
        
        &:focus {
          outline: none;
          border-color: #4CAF50;
        }
      }
    }
    
    .btn-add-url {
      padding: 0.75rem 1.25rem;
      background: #4CAF50;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s ease;
      
      &:hover:not(:disabled) {
        background: #388E3C;
      }
      
      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
    
    .image-previews {
      margin-top: 0.75rem;
      padding-top: 0.75rem;
      border-top: 1px solid #E0E0E0;
      
      > label {
        display: block;
        margin-bottom: 0.75rem;
        font-size: 0.875rem;
      }
    }
    
    .preview-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
      gap: 0.75rem;
    }
    
    .preview-item {
      position: relative;
      aspect-ratio: 1;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      
      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }
    
    .remove-btn {
      position: absolute;
      top: 4px;
      right: 4px;
      width: 24px;
      height: 24px;
      background: rgba(0, 0, 0, 0.6);
      border: none;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      
      svg {
        width: 14px;
        height: 14px;
        color: white;
      }
      
      &:hover {
        background: #f44336;
      }
    }
  `]
})
export class ActivitiesComponent implements OnInit {
  private publicationsService = inject(PublicationsService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  
  // Authentication state
  isAuthenticated = this.authService.isAuthenticated;
  
  posts = signal<Post[]>([]);
  isLoading = signal(true);
  error = signal(false);
  
  // Modal state
  isModalOpen = signal(false);
  selectedPost = signal<Post | null>(null);
  
  // Create modal state
  isCreateModalOpen = signal(false);
  isSaving = signal(false);
  
  // Form data (new structure)
  formData = {
    title: '',
    content: '',
    imageUrl: ''
  };
  
  // Image handling
  imageSourceType = signal<'file' | 'url'>('file');
  images = signal<ImageItem[]>([]);
  newImageUrl = signal('');

  ngOnInit(): void {
    this.loadPosts();
  }

  loadPosts(): void {
    this.isLoading.set(true);
    this.error.set(false);

    this.publicationsService.getAllPosts().subscribe({
      next: (response) => {
        this.posts.set(response.posts);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.isLoading.set(false);
      }
    });
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  truncateContent(content: string, maxLength: number = 150): string {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  }

  openModal(post: Post): void {
    this.selectedPost.set(post);
    this.isModalOpen.set(true);
    document.body.style.overflow = 'hidden';
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.selectedPost.set(null);
    document.body.style.overflow = '';
  }

  // Create post methods
  openCreateModal(): void {
    // Reset form data
    this.formData = { title: '', content: '', imageUrl: '' };
    // Reset image state
    this.imageSourceType.set('file');
    this.images.set([]);
    this.newImageUrl.set('');
    this.isCreateModalOpen.set(true);
    document.body.style.overflow = 'hidden';
  }

  closeCreateModal(): void {
    this.isCreateModalOpen.set(false);
    this.formData = { title: '', content: '', imageUrl: '' };
    this.images.set([]);
    this.newImageUrl.set('');
    this.imageSourceType.set('file');
    document.body.style.overflow = '';
  }

  // Handle file selection
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    
    const files = Array.from(input.files);
    const currentImages = this.images();
    
    files.forEach((file) => {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.toastService.warning(`${file.name} no es una imagen válida`);
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.toastService.warning(`${file.name} excede el tamaño máximo de 5MB`);
        return;
      }
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      const newImage: ImageItem = {
        id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'file',
        file: file,
        previewUrl: previewUrl
      };
      
      currentImages.push(newImage);
    });
    
    this.images.set([...currentImages]);
    input.value = ''; // Reset input for new selections
  }

  // Add image from URL
  addImageFromUrl(): void {
    const url = this.newImageUrl().trim();
    if (!url) return;
    
    // Basic URL validation
    try {
      new URL(url);
    } catch {
      this.toastService.warning('URL de imagen no válida');
      return;
    }
    
    // Check if already added
    const currentImages = this.images();
    if (currentImages.some(img => img.url === url)) {
      this.toastService.warning('Esta URL ya ha sido agregada');
      return;
    }
    
    const newImage: ImageItem = {
      id: `url-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'url',
      url: url,
      previewUrl: url
    };
    
    this.images.set([...currentImages, newImage]);
    this.newImageUrl.set('');
  }

  // Remove image
  removeImage(id: string): void {
    const currentImages = this.images();
    const imageToRemove = currentImages.find(img => img.id === id);
    
    // Release object URL if it's a file
    if (imageToRemove?.type === 'file' && imageToRemove.previewUrl) {
      URL.revokeObjectURL(imageToRemove.previewUrl);
    }
    
    this.images.set(currentImages.filter(img => img.id !== id));
  }

  createPost(): void {
    if (!this.formData.title || !this.formData.content) {
      this.toastService.warning('Complete los campos requeridos');
      return;
    }

    this.isSaving.set(true);
    const currentImages = this.images();
    
    // Separate files and URLs
    const imageFiles = currentImages
      .filter(img => img.type === 'file' && img.file)
      .map(img => img.file!);
    
    const imageUrls = currentImages
      .filter(img => img.type === 'url' && img.url)
      .map(img => img.url!);

    // If there are files to upload, use with-images endpoint
    if (imageFiles.length > 0) {
      this.publicationsService.createPostWithImages(
        this.formData.title,
        this.formData.content,
        imageFiles
      ).subscribe({
        next: () => {
          this.toastService.success('Publicación creada con imágenes');
          this.isSaving.set(false);
          this.closeCreateModal();
          this.loadPosts();
        },
        error: () => {
          this.toastService.error('Error al crear la publicación');
          this.isSaving.set(false);
        }
      });
    } else {
      // Use regular create without files (just URLs or no images)
      this.publicationsService.createPost({
        title: this.formData.title,
        content: this.formData.content,
        image_url: imageUrls.length > 0 ? imageUrls : undefined
      }).subscribe({
        next: () => {
          this.toastService.success('Publicación creada');
          this.isSaving.set(false);
          this.closeCreateModal();
          this.loadPosts();
        },
        error: () => {
          this.toastService.error('Error al crear la publicación');
          this.isSaving.set(false);
        }
      });
    }
  }

  viewPost(id: string): void {
    window.location.href = `/actividades/${id}`;
  }
}
