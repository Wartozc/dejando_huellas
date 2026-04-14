import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PublicationsService } from '../../../core/services';
import { CardComponent, SpinnerComponent } from '../../../shared/components';
import { Post } from '../../../core/models';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, CardComponent, SpinnerComponent],
  template: `
    <div class="home-page">
      <!-- Hero Section -->
      <section class="hero">
        <div class="hero-content">
          <h1>Dejando Huellas de Ebéjico</h1>
          <p class="hero-subtitle">
            Juntos construimos un futuro mejor para nuestra comunidad
          </p>
          <div class="hero-actions">
            <a routerLink="/actividades" class="btn-primary">Ver Actividades</a>
            <a routerLink="/contacto" class="btn-outline">Contáctanos</a>
          </div>
        </div>
        <div class="hero-decoration"></div>
      </section>
      
      <!-- Mission Section -->
      <section class="mission">
        <div class="container">
          <div class="section-header">
            <h2>Nuestra Misión</h2>
            <p>Fomentar el emprendimiento y el desarrollo social en Ebéjico</p>
          </div>
          <div class="mission-cards">
            <div class="mission-card">
              <div class="mission-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
                </svg>
              </div>
              <h3>Comunidad</h3>
              <p>Unimos a emprendedores locales para crear oportunidades de crecimiento compartido</p>
            </div>
            <div class="mission-card">
              <div class="mission-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                  <path d="M2 17l10 5 10-5"/>
                  <path d="M2 12l10 5 10-5"/>
                </svg>
              </div>
              <h3>Desarrollo</h3>
              <p>Impulsamos proyectos que generan impacto positivo en nuestra región</p>
            </div>
            <div class="mission-card">
              <div class="mission-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 16v-4M12 8h.01"/>
                </svg>
              </div>
              <h3>Innovación</h3>
              <p>Promovemos ideas creativas que transforman desafíos en soluciones</p>
            </div>
          </div>
        </div>
      </section>
      
      <!-- Recent Activities Section -->
      <section class="activities">
        <div class="container">
          <div class="section-header">
            <h2>Actividades Recientes</h2>
            <a routerLink="/actividades" class="view-all">Ver todas →</a>
          </div>
          
          @if (isLoading()) {
            <div class="loading-state">
              <app-spinner [size]="48"></app-spinner>
              <p>Cargando actividades...</p>
            </div>
          } @else if (error()) {
            <div class="error-state">
              <p>No se pudieron cargar las actividades</p>
            </div>
          } @else {
            <div class="activities-grid">
              @for (post of recentPosts(); track post.id) {
                <app-card 
                  [title]="post.title" 
                  [imageUrl]="post.image_url && post.image_url.length > 0 ? post.image_url[0] : ''"
                  [subtitle]="formatDate(post.created_at)"
                  [hoverable]="true"
                  [clickable]="true"
                  (click)="viewPost(post.id)"
                >
                  <p class="post-excerpt">{{ truncateContent(post.content) }}</p>
                </app-card>
              } @empty {
                <div class="empty-state">
                  <p>No hay actividades publicadas aún</p>
                </div>
              }
            </div>
          }
        </div>
      </section>
      
      <!-- CTA Section -->
      <section class="cta">
        <div class="container">
          <h2>¿Quieres ser parte de nuestra comunidad?</h2>
          <p>Únete a nosotros y juntos dejemos huellas que transformen Ebéjico</p>
          <a routerLink="/contacto" class="btn-primary">Contáctanos</a>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .home-page {
      overflow-x: hidden;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1.5rem;
    }
    
    /* Hero Section */
    .hero {
      min-height: 70vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #1B5E20 0%, #2E7D32 50%, #4CAF50 100%);
      position: relative;
      overflow: hidden;
      padding: 4rem 1.5rem;
    }
    
    .hero-content {
      text-align: center;
      color: white;
      z-index: 1;
      max-width: 700px;
      
      h1 {
        font-size: clamp(2rem, 5vw, 3.5rem);
        font-weight: 700;
        margin: 0 0 1rem;
        line-height: 1.2;
      }
    }
    
    .hero-subtitle {
      font-size: clamp(1rem, 2vw, 1.25rem);
      margin: 0 0 2rem;
      opacity: 0.9;
    }
    
    .hero-actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
    }
    
    .btn-primary {
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
    
    .btn-outline {
      padding: 0.875rem 2rem;
      background: transparent;
      color: white;
      text-decoration: none;
      border: 2px solid white;
      border-radius: 8px;
      font-weight: 600;
      transition: all 0.3s ease;
      
      &:hover {
        background: white;
        color: #1B5E20;
      }
    }
    
    .hero-decoration {
      position: absolute;
      width: 400px;
      height: 400px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 50%;
      top: -200px;
      right: -100px;
    }
    
    /* Section Styles */
    .section-header {
      text-align: center;
      margin-bottom: 3rem;
      
      h2 {
        font-size: 2rem;
        color: #1B5E20;
        margin: 0 0 0.5rem;
      }
      
      p {
        color: #757575;
        margin: 0;
      }
      
      .view-all {
        color: #4CAF50;
        text-decoration: none;
        font-weight: 500;
        
        &:hover {
          text-decoration: underline;
        }
      }
    }
    
    /* Mission Section */
    .mission {
      padding: 5rem 0;
      background: white;
    }
    
    .mission-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 2rem;
    }
    
    .mission-card {
      text-align: center;
      padding: 2rem;
      background: #F5F5F5;
      border-radius: 16px;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      
      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
      }
      
      h3 {
        color: #1B5E20;
        margin: 1rem 0 0.5rem;
      }
      
      p {
        color: #616161;
        margin: 0;
        line-height: 1.6;
      }
    }
    
    .mission-icon {
      width: 64px;
      height: 64px;
      margin: 0 auto;
      color: #4CAF50;
      
      svg {
        width: 100%;
        height: 100%;
      }
    }
    
    /* Activities Section */
    .activities {
      padding: 5rem 0;
      background: #F5F5F5;
    }
    
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      text-align: left;
      flex-wrap: wrap;
      gap: 1rem;
      
      .view-all {
        margin-left: auto;
      }
    }
    
    .activities-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
    }
    
    .post-excerpt {
      color: #616161;
      line-height: 1.6;
      margin: 0;
    }
    
    .loading-state,
    .error-state,
    .empty-state {
      text-align: center;
      padding: 3rem;
      color: #757575;
    }
    
    /* CTA Section */
    .cta {
      padding: 5rem 0;
      background: linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%);
      color: white;
      text-align: center;
      
      h2 {
        font-size: 2rem;
        margin: 0 0 1rem;
      }
      
      p {
        font-size: 1.125rem;
        margin: 0 0 2rem;
        opacity: 0.9;
      }
      
      .btn-primary {
        background: #F4A261;
        
        &:hover {
          background: #E08B4A;
        }
      }
    }
  `]
})
export class HomeComponent implements OnInit {
  private publicationsService = inject(PublicationsService);
  
  recentPosts = signal<Post[]>([]);
  isLoading = signal(true);
  error = signal(false);

  ngOnInit(): void {
    this.loadRecentPosts();
  }

  loadRecentPosts(): void {
    this.isLoading.set(true);
    this.error.set(false);

    this.publicationsService.getAllPosts().subscribe({
      next: (response) => {
        this.recentPosts.set(response.posts.slice(0, 6));
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

  truncateContent(content: string, maxLength: number = 120): string {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  }

  viewPost(id: string): void {
    window.location.href = `/actividades/${id}`;
  }
}
