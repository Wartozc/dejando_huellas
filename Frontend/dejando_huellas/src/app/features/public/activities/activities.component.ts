import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PublicationsService } from '../../../core/services';
import { CardComponent, SpinnerComponent, ActivityModalComponent } from '../../../shared/components';
import { Post } from '../../../core/models';

@Component({
  selector: 'app-activities',
  standalone: true,
  imports: [CommonModule, RouterModule, CardComponent, SpinnerComponent, ActivityModalComponent],
  template: `
    <div class="activities-page">
      <!-- Hero -->
      <section class="hero">
        <div class="container">
          <h1>Nuestras Actividades</h1>
          <p>Conoce los proyectos y actividades que realizan nuestros emprendedores</p>
        </div>
      </section>
      
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
      }
      
      p {
        font-size: 1.25rem;
        margin: 0;
        opacity: 0.9;
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
  `]
})
export class ActivitiesComponent implements OnInit {
  private publicationsService = inject(PublicationsService);
  
  posts = signal<Post[]>([]);
  isLoading = signal(true);
  error = signal(false);
  
  // Modal state
  isModalOpen = signal(false);
  selectedPost = signal<Post | null>(null);

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

  viewPost(id: string): void {
    window.location.href = `/actividades/${id}`;
  }
}
