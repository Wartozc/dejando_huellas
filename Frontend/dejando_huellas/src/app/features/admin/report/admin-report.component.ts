import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PublicationsService } from '../../../core/services';
import { SpinnerComponent } from '../../../shared/components';
import * as XLSX from 'xlsx';

interface ReportData {
  'Título': string;
  'Imágenes': string;
  'Descripción': string;
  'Fecha': string;
  'Autor': string;
  'Comunidad': string;
}

@Component({
  selector: 'app-admin-report',
  standalone: true,
  imports: [CommonModule, SpinnerComponent],
  template: `
    <div class="report-container">
      <div class="report-header">
        <h2>Generar Informe de Actividades</h2>
        <p>Descarga un reporte completo de todas las publicaciones en formato Excel</p>
      </div>

      <div class="report-card">
        <div class="report-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <polyline points="14,2 14,8 20,8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10,9 9,9 8,9"/>
          </svg>
        </div>

        <div class="report-info">
          <h3>Informe de Publicaciones</h3>
          <p class="report-description">
            Este informe incluye todas las actividades publicadas con los siguientes datos:
          </p>
          <ul class="report-columns">
            <li><strong>Título:</strong> Nombre de la actividad</li>
            <li><strong>Imágenes:</strong> URLs de las imágenes asociadas</li>
            <li><strong>Descripción:</strong> Contenido completo de la publicación</li>
            <li><strong>Fecha:</strong> Fecha de creación</li>
            <li><strong>Autor:</strong> Nombre del creador</li>
            <li><strong>Comunidad:</strong> Comunidad a la que pertenece el autor</li>
          </ul>
          
          @if (years().length > 0) {
            <div class="year-filter">
              <label for="year-select">Filtrar por año:</label>
              <select 
                id="year-select"
                [value]="selectedYear()"
                (change)="onYearChange($event)"
              >
                <option [value]="null">Todos los años</option>
                @for (year of years(); track year) {
                  <option [value]="year">{{ year }}</option>
                }
              </select>
            </div>
          }

          @if (filteredCount() > 0) {
            <p class="report-stats">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
              </svg>
              {{ filteredCount() }} {{ filteredCount() === 1 ? 'publicación encontrada' : 'publicaciones encontradas' }}
              @if (selectedYear()) {
                <span class="year-badge">Año {{ selectedYear() }}</span>
              }
            </p>
          }
        </div>

        <div class="report-actions">
          @if (isLoading()) {
            <app-spinner [size]="36"></app-spinner>
            <span>Preparando informe...</span>
          } @else {
            <button 
              class="btn-download"
              (click)="downloadReport()"
              [disabled]="filteredCount() === 0"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="7,10 12,15 17,10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Descargar Informe Excel
            </button>
          }
        </div>
      </div>

      @if (error()) {
        <div class="error-message">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          <span>{{ error() }}</span>
        </div>
      }

      @if (success()) {
        <div class="success-message">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
            <polyline points="22,4 12,14.01 9,11.01"/>
          </svg>
          <span>{{ success() }}</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .report-container {
      animation: fadeIn 0.3s ease;
      max-width: 900px;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .report-header {
      margin-bottom: 2rem;

      h2 {
        color: #1B5E20;
        margin: 0 0 0.5rem;
        font-size: 1.75rem;
      }

      p {
        color: #757575;
        margin: 0;
      }
    }

    .report-card {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: 2rem;
      align-items: start;
    }

    .report-icon {
      width: 80px;
      height: 80px;
      background: rgba(76, 175, 80, 0.1);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #4CAF50;
      flex-shrink: 0;

      svg {
        width: 40px;
        height: 40px;
      }
    }

    .report-info {
      h3 {
        color: #1B5E20;
        margin: 0 0 1rem;
        font-size: 1.25rem;
      }

      .report-description {
        color: #616161;
        margin: 0 0 1rem;
      }

      .report-columns {
        list-style: none;
        padding: 0;
        margin: 0 0 1rem;

        li {
          color: #616161;
          padding: 0.25rem 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;

          &:before {
            content: '✓';
            color: #4CAF50;
            font-weight: bold;
          }

          strong {
            color: #212121;
          }
        }
      }

      .report-stats {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: #4CAF50;
        font-weight: 500;
        margin: 0;

        svg {
          width: 20px;
          height: 20px;
        }

        .year-badge {
          background: #1B5E20;
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
        }
      }

      .year-filter {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 1rem;

        label {
          color: #616161;
          font-weight: 500;
          font-size: 0.9375rem;
        }

        select {
          padding: 0.5rem 0.75rem;
          border: 1px solid #E0E0E0;
          border-radius: 6px;
          font-size: 0.9375rem;
          color: #212121;
          background: white;
          cursor: pointer;
          transition: border-color 0.2s ease;

          &:hover {
            border-color: #4CAF50;
          }

          &:focus {
            outline: none;
            border-color: #1B5E20;
            box-shadow: 0 0 0 2px rgba(27, 94, 32, 0.1);
          }
        }
      }
    }

    .report-actions {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;

      app-spinner {
        display: block;
      }

      span {
        color: #757575;
        font-size: 0.875rem;
      }
    }

    .btn-download {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem 1.5rem;
      background: #1B5E20;
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.2s ease;
      white-space: nowrap;

      svg {
        width: 20px;
        height: 20px;
      }

      &:hover:not(:disabled) {
        background: #2E7D32;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(27, 94, 32, 0.3);
      }

      &:active:not(:disabled) {
        transform: translateY(0);
      }

      &:disabled {
        background: #BDBDBD;
        cursor: not-allowed;
      }
    }

    .error-message,
    .success-message {
      margin-top: 1.5rem;
      padding: 1rem 1.25rem;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 0.75rem;

      svg {
        width: 24px;
        height: 24px;
        flex-shrink: 0;
      }

      span {
        font-weight: 500;
      }
    }

    .error-message {
      background: rgba(244, 67, 54, 0.1);
      color: #f44336;
      border: 1px solid rgba(244, 67, 54, 0.2);
    }

    .success-message {
      background: rgba(76, 175, 80, 0.1);
      color: #4CAF50;
      border: 1px solid rgba(76, 175, 80, 0.2);
    }

    @media (max-width: 768px) {
      .report-card {
        grid-template-columns: 1fr;
        gap: 1.5rem;
        padding: 1.5rem;
      }

      .report-icon {
        width: 60px;
        height: 60px;
        margin: 0 auto;

        svg {
          width: 30px;
          height: 30px;
        }
      }

      .report-info {
        text-align: center;

        .report-columns li {
          justify-content: center;
        }
      }

      .report-actions {
        width: 100%;

        .btn-download {
          width: 100%;
          justify-content: center;
        }
      }
    }
  `]
})
export class AdminReportComponent implements OnInit {
  private publicationsService = inject(PublicationsService);
  
  isLoading = signal(true);
  years = signal<number[]>([]);
  selectedYear = signal<number | null>(null);
  posts = signal<any[]>([]);
  filteredCount = signal(0);
  error = signal('');
  success = signal('');

  ngOnInit(): void {
    this.loadPosts();
  }

  loadPosts(): void {
    this.isLoading.set(true);
    this.error.set('');

    this.publicationsService.getAllPosts().subscribe({
      next: (response) => {
        this.posts.set(response.posts);
        
        // Extract unique years from posts
        const uniqueYears = new Set(
          response.posts.map(post => new Date(post.created_at).getFullYear())
        );
        this.years.set([...uniqueYears].sort((a, b) => b - a));
        
        // Update filtered count
        this.updateFilteredCount();
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set('Error al cargar las publicaciones. Intenta de nuevo.');
        this.isLoading.set(false);
        console.error('Error loading posts:', err);
      }
    });
  }

  onYearChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const value = target.value;
    this.selectedYear.set(value ? parseInt(value, 10) : null);
    this.updateFilteredCount();
  }

  private updateFilteredCount(): void {
    const year = this.selectedYear();
    if (year === null) {
      this.filteredCount.set(this.posts().length);
    } else {
      const filtered = this.posts().filter(post => 
        new Date(post.created_at).getFullYear() === year
      );
      this.filteredCount.set(filtered.length);
    }
  }

  private getFilteredPosts(): any[] {
    const year = this.selectedYear();
    if (year === null) {
      return this.posts();
    }
    return this.posts().filter(post => 
      new Date(post.created_at).getFullYear() === year
    );
  }

  downloadReport(): void {
    this.error.set('');
    this.success.set('');
    this.isLoading.set(true);

    this.publicationsService.getAllPosts().subscribe({
      next: (response) => {
        try {
          let posts = response.posts;
          
          // Filter by selected year if any
          const year = this.selectedYear();
          if (year !== null) {
            posts = posts.filter(post => 
              new Date(post.created_at).getFullYear() === year
            );
          }
          
          // Transform data for Excel
          const reportData: ReportData[] = posts.map(post => ({
            'Título': post.title,
            'Descripción': post.content || 'Sin descripción',
            'Fecha': new Date(post.created_at).toLocaleDateString('es-CO'),
            'Autor': post.author_name || 'Desconocido',
            'Comunidad': post.community || 'Sin comunidad',
            'Imágenes': post.image_url?.join(', ') || 'Sin imágenes'
          }));

          // Create worksheet from the data
          const worksheet = XLSX.utils.json_to_sheet(reportData);

          // Set column widths for better readability
          worksheet['!cols'] = [
            { wch: 40 },  // Título
            { wch: 80 },  // Descripción
            { wch: 15 },  // Fecha
            { wch: 25 },  // Autor
            { wch: 25 },  // Comunidad
            { wch: 60 }   // Imágenes
          ];

          // Create workbook and append worksheet
          const workbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(workbook, worksheet, 'Actividades');

          // Generate filename with current date and optional year
          const currentDate = new Date().toISOString().split('T')[0];
          const yearSuffix = year ? `_${year}` : '';
          const filename = `informe_actividades${yearSuffix}_${currentDate}.xlsx`;

          // Download the file
          XLSX.writeFile(workbook, filename);

          this.success.set(`¡Informe descargado exitosamente! (${posts.length} publicaciones)`);
          this.isLoading.set(false);

          // Clear success message after 5 seconds
          setTimeout(() => {
            this.success.set('');
          }, 5000);

        } catch (err) {
          this.error.set('Error al generar el archivo Excel. Intenta de nuevo.');
          this.isLoading.set(false);
          console.error('Error generating Excel:', err);
        }
      },
      error: (err) => {
        this.error.set('Error al obtener los datos. Intenta de nuevo.');
        this.isLoading.set(false);
        console.error('Error fetching posts:', err);
      }
    });
  }
}
