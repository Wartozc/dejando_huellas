import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PublicationsService, ToastService } from '../../../core/services';
import { Post } from '../../../core/models';
import { ButtonComponent, SpinnerComponent, ConfirmDialogComponent } from '../../../shared/components';

// Interface for managing images (either file or URL)
export interface ImageItem {
  id: string;
  type: 'file' | 'url';
  file?: File;
  url?: string;
  previewUrl: string;
}

@Component({
  selector: 'app-admin-publications',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent, SpinnerComponent, ConfirmDialogComponent],
  template: `
    <div class="publications-page">
      <div class="page-header">
        <div>
          <h2>Gestión de Publicaciones</h2>
          <p>Crea y administra las publicaciones del blog</p>
        </div>
        <app-button (onClick)="openForm()">
          + Nueva Publicación
        </app-button>
      </div>
      
      @if (isLoading()) {
        <div class="loading-state">
          <app-spinner></app-spinner>
        </div>
      } @else {
        <!-- Publications Grid -->
        <div class="publications-grid">
          @for (post of posts(); track post.id) {
            <div class="publication-card">
              @if (post.image_url && post.image_url.length > 0) {
                <div class="card-image">
                  <img [src]="post.image_url[0]" [alt]="post.title" />
                </div>
              } @else {
                <div class="card-image placeholder">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21,15 16,10 5,21"/>
                  </svg>
                </div>
              }
              <div class="card-content">
                <h3>{{ post.title }}</h3>
                <p class="excerpt">{{ truncateContent(post.content, 100) }}</p>
                <div class="card-meta">
                  <span>{{ formatDate(post.created_at) }}</span>
                  @if (post.creator?.name) {
                    <span>Por {{ post.creator?.name }}</span>
                  } @else if (post.author_name) {
                    <span>Por {{ post.author_name }}</span>
                  }
                </div>
              </div>
              <div class="card-actions">
                <button class="action-btn edit" (click)="editPost(post)" title="Editar">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
                <button class="action-btn delete" (click)="confirmDelete(post)" title="Eliminar">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3,6 5,6 21,6"/>
                    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                  </svg>
                </button>
              </div>
            </div>
          } @empty {
            <div class="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
              </svg>
              <h3>No hay publicaciones</h3>
              <p>Crea tu primera publicación para informar a la comunidad</p>
              <app-button (onClick)="openForm()">Crear Publicación</app-button>
            </div>
          }
        </div>
      }
      
      <!-- Form Modal -->
      @if (showForm()) {
        <div class="modal-overlay" (click)="closeForm()">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>{{ editingPost() ? 'Editar Publicación' : 'Nueva Publicación' }}</h3>
              <button class="close-btn" (click)="closeForm()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <form (ngSubmit)="savePost()" class="post-form">
              <div class="form-group">
                <label for="title">Título *</label>
                <input type="text" id="title" [(ngModel)]="formData.title" name="title" required />
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
                      <app-button type="button" variant="outline" (onClick)="addImageFromUrl()" [disabled]="!newImageUrl()">
                        Agregar
                      </app-button>
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
                <textarea id="content" [(ngModel)]="formData.content" name="content" rows="8" required></textarea>
              </div>
              <div class="form-actions">
                <app-button variant="outline" type="button" (onClick)="closeForm()">
                  Cancelar
                </app-button>
                <app-button type="submit" [loading]="isSaving()">
                  {{ editingPost() ? 'Guardar' : 'Publicar' }}
                </app-button>
              </div>
            </form>
          </div>
        </div>
      }
      
      <!-- Confirm Dialog -->
      <app-confirm-dialog
        [isOpen]="showConfirm()"
        title="Eliminar Publicación"
        [message]="getDeleteMessage()"
        confirmText="Eliminar"
        [confirmDanger]="true"
        (onConfirm)="deletePost()"
        (onCancel)="cancelDelete()"
      ></app-confirm-dialog>
    </div>
  `,
  styles: [`
    .publications-page {
      animation: fadeIn 0.3s ease;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
      gap: 1rem;
      
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
    
    .publications-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
    }
    
    .publication-card {
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      display: flex;
      flex-direction: column;
      transition: all 0.2s ease;
      
      &:hover {
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
        
        .card-actions {
          opacity: 1;
        }
      }
    }
    
    .card-image {
      height: 180px;
      overflow: hidden;
      
      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      
      &.placeholder {
        background: linear-gradient(135deg, #A5D6A7 0%, #4CAF50 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        
        svg {
          width: 48px;
          height: 48px;
          color: white;
          opacity: 0.5;
        }
      }
    }
    
    .card-content {
      padding: 1rem;
      flex: 1;
      
      h3 {
        margin: 0 0 0.5rem;
        color: #1B5E20;
        font-size: 1.125rem;
      }
      
      .excerpt {
        color: #616161;
        margin: 0 0 1rem;
        font-size: 0.875rem;
        line-height: 1.5;
      }
    }
    
    .card-meta {
      display: flex;
      gap: 1rem;
      font-size: 0.75rem;
      color: #9E9E9E;
    }
    
    .card-actions {
      display: flex;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      border-top: 1px solid #E0E0E0;
      opacity: 0;
      transition: opacity 0.2s ease;
    }
    
    .action-btn {
      width: 36px;
      height: 36px;
      border: none;
      background: #F5F5F5;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      
      svg {
        width: 18px;
        height: 18px;
      }
      
      &:hover {
        background: #E0E0E0;
      }
      
      &.edit:hover { color: #2196F3; }
      &.delete:hover { color: #f44336; background: rgba(244, 67, 54, 0.1); }
    }
    
    .empty-state {
      grid-column: 1 / -1;
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
        margin: 0 0 1.5rem;
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
      max-width: 600px;
      max-height: 90vh;
      overflow-y: auto;
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
    
    .post-form {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
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
      
      input, textarea {
        padding: 0.75rem 1rem;
        border: 2px solid #E0E0E0;
        border-radius: 8px;
        font-size: 0.9375rem;
        font-family: inherit;
        
        &:focus {
          outline: none;
          border-color: #4CAF50;
        }
      }
      
      textarea {
        resize: vertical;
        min-height: 150px;
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
    
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 0.5rem;
    }
  `]
})
export class AdminPublicationsComponent implements OnInit {
  private publicationsService = inject(PublicationsService);
  private toastService = inject(ToastService);
  
  posts = signal<Post[]>([]);
  isLoading = signal(true);
  isSaving = signal(false);
  showForm = signal(false);
  showConfirm = signal(false);
  editingPost = signal<Post | null>(null);
  postToDelete = signal<Post | null>(null);
  
  // Image handling
  imageSourceType = signal<'file' | 'url'>('file');
  images = signal<ImageItem[]>([]);
  newImageUrl = signal('');
  
  formData = {
    title: '',
    content: '',
    image_url: '' // Kept for backward compatibility
  };

  ngOnInit(): void {
    this.loadPosts();
  }

  loadPosts(): void {
    this.isLoading.set(true);
    this.publicationsService.getAllPosts().subscribe({
      next: (response) => {
        this.posts.set(response.posts);
        this.isLoading.set(false);
      },
      error: () => {
        this.toastService.error('Error al cargar las publicaciones');
        this.isLoading.set(false);
      }
    });
  }

  openForm(post?: Post): void {
    // Reset image state
    this.imageSourceType.set('file');
    this.images.set([]);
    this.newImageUrl.set('');
    
    if (post) {
      this.editingPost.set(post);
      // Convert string[] to ImageItem[] for form display
      const imageItems: ImageItem[] = [];
      if (post.image_url && post.image_url.length > 0) {
        post.image_url.forEach((url, index) => {
          imageItems.push({
            id: `existing-${index}-${Date.now()}`,
            type: 'url',
            url: url,
            previewUrl: url
          });
        });
      }
      this.images.set(imageItems);
      
      this.formData = {
        title: post.title,
        content: post.content,
        image_url: ''
      };
    } else {
      this.editingPost.set(null);
      this.formData = {
        title: '',
        content: '',
        image_url: ''
      };
    }
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editingPost.set(null);
    this.images.set([]);
    this.newImageUrl.set('');
    this.imageSourceType.set('file');
  }

  editPost(post: Post): void {
    this.openForm(post);
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

  savePost(): void {
    if (!this.formData.title || !this.formData.content) {
      this.toastService.warning('Complete los campos requeridos');
      return;
    }

    this.isSaving.set(true);
    const editing = this.editingPost();
    const currentImages = this.images();
    
    // Separate files and URLs
    const imageFiles = currentImages
      .filter(img => img.type === 'file' && img.file)
      .map(img => img.file!);
    
    const imageUrls = currentImages
      .filter(img => img.type === 'url' && img.url)
      .map(img => img.url!);

    if (editing) {
      // If there are files to upload, use with-images endpoint
      if (imageFiles.length > 0) {
        this.publicationsService.updatePostWithImages(
          editing.id,
          this.formData.title,
          this.formData.content,
          imageFiles
        ).subscribe({
          next: () => {
            this.toastService.success('Publicación actualizada con imágenes');
            this.closeForm();
            this.loadPosts();
            this.isSaving.set(false);
          },
          error: () => {
            this.toastService.error('Error al actualizar la publicación');
            this.isSaving.set(false);
          }
        });
      } else {
        // Use regular update without files (just URLs or no images)
        this.publicationsService.updatePost(editing.id, {
          title: this.formData.title,
          content: this.formData.content,
          image_url: imageUrls.length > 0 ? imageUrls : undefined
        }).subscribe({
          next: () => {
            this.toastService.success('Publicación actualizada');
            this.closeForm();
            this.loadPosts();
            this.isSaving.set(false);
          },
          error: () => {
            this.toastService.error('Error al actualizar la publicación');
            this.isSaving.set(false);
          }
        });
      }
    } else {
      // If there are files to upload, use with-images endpoint
      if (imageFiles.length > 0) {
        this.publicationsService.createPostWithImages(
          this.formData.title,
          this.formData.content,
          imageFiles
        ).subscribe({
          next: () => {
            this.toastService.success('Publicación creada con imágenes');
            this.closeForm();
            this.loadPosts();
            this.isSaving.set(false);
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
            this.closeForm();
            this.loadPosts();
            this.isSaving.set(false);
          },
          error: () => {
            this.toastService.error('Error al crear la publicación');
            this.isSaving.set(false);
          }
        });
      }
    }
  }

  confirmDelete(post: Post): void {
    this.postToDelete.set(post);
    this.showConfirm.set(true);
  }

  deletePost(): void {
    const post = this.postToDelete();
    if (post) {
      this.publicationsService.deletePost(post.id).subscribe({
        next: () => {
          this.toastService.success('Publicación eliminada');
          this.showConfirm.set(false);
          this.postToDelete.set(null);
          this.loadPosts();
        },
        error: () => {
          this.toastService.error('Error al eliminar la publicación');
          this.showConfirm.set(false);
        }
      });
    }
  }

  cancelDelete(): void {
    this.showConfirm.set(false);
    this.postToDelete.set(null);
  }

  getDeleteMessage(): string {
    const title = this.postToDelete()?.title || '';
    return `¿Está seguro de que desea eliminar la publicación "${title}"?`;
  }

  truncateContent(content: string, maxLength: number): string {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}
