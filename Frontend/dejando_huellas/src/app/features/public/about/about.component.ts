import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="about-page">
      <!-- Hero -->
      <section class="hero">
        <div class="container">
          <h1>Sobre Nosotros</h1>
          <p>Conociendo a la Asociación de Emprendedores Dejando Huellas de Ebéjico</p>
        </div>
      </section>
      
      <!-- History -->
      <section class="section history">
        <div class="container">
          <div class="content-grid">
            <div class="content-text">
              <h2>Nuestra Historia</h2>
              <p>
                La Asociación de Emprendedores Dejando Huellas de Ebéjico nació del sueño de un 
                grupo de emprendedores locales que buscaban unir fuerzas para transformar su 
                comunidad. Fundada en el corazón de Ebéjico, Antioquia, nuestra organización 
                ha crecido hasta convertirse en un pilar fundamental para el desarrollo económico 
                y social de la región.
              </p>
              <p>
                A través de los años, hemos impulsado numerosos proyectos que han mejorado la 
                calidad de vida de cientos de familias, promoviendo el emprendimiento responsable 
                y el trabajo en comunidad.
              </p>
            </div>
            <div class="content-image">
              <div class="image-placeholder">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M3 21h18M3 7v1a3 3 0 003 3h12a3 3 0 003-3V7M3 21V11M21 21V11M12 3v18M9 21l3-7 3 7"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <!-- Values -->
      <section class="section values">
        <div class="container">
          <h2>Nuestros Valores</h2>
          <div class="values-grid">
            <div class="value-card">
              <div class="value-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                </svg>
              </div>
              <h3>Solidaridad</h3>
              <p>Creemos en el apoyo mutuo y en levantar a nuestros compañeros emprendedores</p>
            </div>
            <div class="value-card">
              <div class="value-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                  <polyline points="22,4 12,14.01 9,11.01"/>
                </svg>
              </div>
              <h3>Compromiso</h3>
              <p>Trabajamos con dedicación para alcanzar nuestras metas colectivas</p>
            </div>
            <div class="value-card">
              <div class="value-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
                </svg>
              </div>
              <h3>Transparencia</h3>
              <p>Operamos con honestidad y claridad en todas nuestras acciones</p>
            </div>
            <div class="value-card">
              <div class="value-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                  <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <h3>Innovación</h3>
              <p>Abrazamos nuevas ideas y metodologías para el progreso</p>
            </div>
          </div>
        </div>
      </section>
      
      <!-- Team -->
      <section class="section team">
        <div class="container">
          <h2>Nuestra Comunidad</h2>
          <p class="section-intro">
            Somos una comunidad diversa de emprendedores unidos por el objetivo común 
            de transformar Ebéjico. Desde artesanos locales hasta pequeños comerciantes, 
            cada miembro aporta su granito de arena para construir un futuro mejor.
          </p>
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-number">50+</span>
              <span class="stat-label">Emprendedores</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">100+</span>
              <span class="stat-label">Proyectos realizados</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">5</span>
              <span class="stat-label">Años de trayectoria</span>
            </div>
          </div>
        </div>
      </section>
      
      <!-- CTA -->
      <section class="section cta">
        <div class="container">
          <h2>¿Quieres conocer más?</h2>
          <p>Contáctanos y descubre cómo puedes ser parte de nuestra comunidad</p>
          <a routerLink="/contacto" class="btn-primary">Contáctanos</a>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .about-page {
      overflow-x: hidden;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1.5rem;
    }
    
    .section {
      padding: 5rem 0;
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
    
    /* Content Grid */
    .content-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4rem;
      align-items: center;
      
      @media (max-width: 768px) {
        grid-template-columns: 1fr;
        gap: 2rem;
      }
    }
    
    .content-text {
      h2 {
        font-size: 2rem;
        color: #1B5E20;
        margin: 0 0 1.5rem;
      }
      
      p {
        color: #424242;
        line-height: 1.8;
        margin: 0 0 1rem;
        
        &:last-child {
          margin-bottom: 0;
        }
      }
    }
    
    .content-image {
      .image-placeholder {
        aspect-ratio: 4/3;
        background: linear-gradient(135deg, #A5D6A7 0%, #4CAF50 100%);
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        
        svg {
          width: 80px;
          height: 80px;
          color: white;
          opacity: 0.5;
        }
      }
    }
    
    /* Values */
    .values {
      background: #F5F5F5;
      
      h2 {
        font-size: 2rem;
        color: #1B5E20;
        text-align: center;
        margin: 0 0 3rem;
      }
    }
    
    .values-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
    }
    
    .value-card {
      background: white;
      padding: 2rem;
      border-radius: 16px;
      text-align: center;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      
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
    
    .value-icon {
      width: 56px;
      height: 56px;
      margin: 0 auto;
      color: #4CAF50;
      
      svg {
        width: 100%;
        height: 100%;
      }
    }
    
    /* Team */
    .team {
      h2 {
        font-size: 2rem;
        color: #1B5E20;
        text-align: center;
        margin: 0 0 1rem;
      }
      
      .section-intro {
        text-align: center;
        color: #616161;
        max-width: 700px;
        margin: 0 auto 3rem;
        line-height: 1.8;
      }
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 2rem;
      text-align: center;
    }
    
    .stat-item {
      .stat-number {
        display: block;
        font-size: 3rem;
        font-weight: 700;
        color: #4CAF50;
      }
      
      .stat-label {
        color: #757575;
        font-size: 1rem;
      }
    }
    
    /* CTA */
    .cta {
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
export class AboutComponent {}
