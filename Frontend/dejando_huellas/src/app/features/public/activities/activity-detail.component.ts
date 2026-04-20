import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PublicationsService } from '../../../core/services';
import { SpinnerComponent, ActivityModalComponent } from '../../../shared/components';
import { Post } from '../../../core/models';

@Component({
  selector: 'app-activity-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, SpinnerComponent, ActivityModalComponent],
  template: `
    <div class="detail-page">
      @if (isLoading()) {
        <div class="loading-state">
          <app-spinner [size]="48"></app-spinner>
          <p>Cargando actividad...</p>
        </div>
      } @else if (error()) {
        <div class="error-state">
          <h2>No se encontró la actividad</h2>
          <p>La actividad que buscas no existe o fue eliminada.</p>
          <a routerLink="/actividades" class="btn-primary">Volver a actividades</a>
        </div>
      } @else if (post()) {
        <article class="article">
          @if (post()!.image_url && post()!.image_url!.length > 0) {
            <div class="article-image">
              <img [src]="post()!.image_url![0]" [alt]="post()!.title" />
            </div>
          }
          <div class="article-content">
            <div class="article-meta">
              <span class="date">{{ formatDate(post()!.created_at) }}</span>
              @if (post()!.creator?.name) {
                <span class="author">Por {{ post()!.creator!.name }}</span>
              } @else if (post()!.author_name) {
                <span class="author">Por {{ post()!.author_name }}</span>
              }
            </div>
            <h1>{{ post()!.title }}</h1>
            <div class="article-body">
              <p>{{ post()!.content }}</p>
            </div>
            <div class="article-actions">
              <a routerLink="/actividades" class="btn-back">← Volver a actividades</a>
            </div>
          </div>
        </article>
      }
    </div>

    <!-- Activity Detail Modal -->
    @if (post()) {
      <app-activity-modal
        [isOpen]="true"
        [post]="post()"
        (close)="goBack()"
      ></app-activity-modal>
    }
  `,
  styles: [`
    .detail-page {
      min-height: 60vh;
      padding: 2rem 0;
    }
    
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 0 1.5rem;
    }
    
    /* States */
    .loading-state,
    .error-state {
      text-align: center;
      padding: 4rem 1.5rem;
      
      p {
        color: #757575;
        margin-top: 1rem;
      }
    }
    
    .error-state {
      h2 {
        color: #1B5E20;
        margin: 0 0 0.5rem;
      }
      
      .btn-primary {
        display: inline-block;
        margin-top: 1.5rem;
        padding: 0.75rem 1.5rem;
        background: #1B5E20;
        color: white;
        text-decoration: none;
        border-radius: 8px;
        font-weight: 500;
        
        &:hover {
          background: #2E7D32;
        }
      }
    }
    
    /* Article */
    .article {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    }
    
    .article-image {
      width: 100%;
      max-height: 400px;
      overflow: hidden;
      
      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }
    
    .article-content {
      padding: 2rem;
      
      @media (min-width: 768px) {
        padding: 3rem;
      }
    }
    
    .article-meta {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
      font-size: 0.875rem;
      color: #757575;
      
      .date {
        &::before {
          content: '📅 ';
        }
      }
      
      .author {
        &::before {
          content: '👤 ';
        }
      }
    }
    
    h1 {
      font-size: 2rem;
      color: #1B5E20;
      margin: 0 0 1.5rem;
      line-height: 1.3;
      
      @media (min-width: 768px) {
        font-size: 2.5rem;
      }
    }
    
    .article-body {
      p {
        color: #424242;
        line-height: 1.8;
        font-size: 1.0625rem;
        white-space: pre-wrap;
      }
    }
    
    .article-actions {
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid #E0E0E0;
    }
    
    .btn-back {
      color: #4CAF50;
      text-decoration: none;
      font-weight: 500;
      
      &:hover {
        text-decoration: underline;
      }
    }
  `]
})
export class ActivityDetailComponent implements OnInit {
  private publicationsService = inject(PublicationsService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  
  post = signal<Post | null>(null);
  isLoading = signal(true);
  error = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadPost(id);
    } else {
      this.error.set(true);
      this.isLoading.set(false);
    }
  }

  loadPost(id: string): void {
    this.isLoading.set(true);
    this.error.set(false);

    this.publicationsService.getPostById(id).subscribe({
      next: (response) => {
        this.post.set(response.post);
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

  goBack(): void {
    this.router.navigate(['/actividades']);
  }
}
