import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HabeasDataService, ToastService } from '../../../core/services';
import { ButtonComponent, SpinnerComponent } from '../../../shared/components';

@Component({
  selector: 'app-admin-habeas-data',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent, SpinnerComponent],
  template: `
    <div class="habeas-data-page">
      <div class="page-header">
        <div>
          <h2>Habeas Data</h2>
          <p>Gestiona el texto de tratamiento de datos personales</p>
        </div>
      </div>
      
      @if (isLoading()) {
        <div class="loading-state">
          <app-spinner></app-spinner>
        </div>
      } @else {
        <div class="content-card">
          <div class="card-header">
            <div class="header-info">
              <h3>Texto de Habeas Data</h3>
              @if (habeasData()?.updated_at) {
                <p class="last-updated">
                  Última actualización: {{ formatDate(habeasData()!.updated_at) }}
                </p>
              }
            </div>
            <app-button (onClick)="saveHabeasData()" [loading]="isSaving()">
              Guardar Cambios
            </app-button>
          </div>
          
          <div class="form-group">
            <label for="content">Contenido del tratamiento de datos</label>
            <textarea 
              id="content" 
              [(ngModel)]="content"
              name="content"
              rows="20"
              placeholder="Escribe el texto de habeas data aquí..."
            ></textarea>
            <span class="hint">
              Este texto será mostrado a los usuarios durante el registro para que acepten el tratamiento de sus datos personales.
            </span>
          </div>
        </div>
        
        <div class="preview-card">
          <h3>Vista Previa</h3>
          <div class="preview-content">
            <pre>{{ content }}</pre>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .habeas-data-page {
      animation: fadeIn 0.3s ease;
      max-width: 900px;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    .page-header {
      margin-bottom: 1.5rem;
      
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
    
    .content-card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      margin-bottom: 1.5rem;
    }
    
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
      gap: 1rem;
      
      h3 {
        margin: 0 0 0.25rem;
        color: #1B5E20;
        font-size: 1.25rem;
      }
      
      .last-updated {
        font-size: 0.875rem;
        color: #757575;
        margin: 0;
      }
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
      
      textarea {
        padding: 1rem;
        border: 2px solid #E0E0E0;
        border-radius: 8px;
        font-size: 0.9375rem;
        font-family: inherit;
        resize: vertical;
        min-height: 300px;
        
        &:focus {
          outline: none;
          border-color: #4CAF50;
        }
      }
      
      .hint {
        font-size: 0.75rem;
        color: #757575;
      }
    }
    
    .preview-card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      
      h3 {
        margin: 0 0 1rem;
        color: #1B5E20;
        font-size: 1.125rem;
      }
      
      .preview-content {
        background: #F5F5F5;
        border-radius: 8px;
        padding: 1rem;
        max-height: 300px;
        overflow-y: auto;
        
        pre {
          margin: 0;
          white-space: pre-wrap;
          word-break: break-word;
          font-family: inherit;
          font-size: 0.875rem;
          color: #424242;
        }
      }
    }
  `]
})
export class AdminHabeasDataComponent implements OnInit {
  private habeasDataService = inject(HabeasDataService);
  private toastService = inject(ToastService);
  
  habeasData = signal<{ content: string; updated_at?: string } | null>(null);
  content = '';
  isLoading = signal(true);
  isSaving = signal(false);

  ngOnInit(): void {
    this.loadHabeasData();
  }

  loadHabeasData(): void {
    this.isLoading.set(true);
    this.habeasDataService.getHabeasData().subscribe({
      next: (response) => {
        this.habeasData.set(response.habeasData);
        this.content = response.habeasData.content;
        this.isLoading.set(false);
      },
      error: () => {
        this.toastService.error('Error al cargar el texto de habeas data');
        this.isLoading.set(false);
      }
    });
  }

  saveHabeasData(): void {
    if (!this.content) {
      this.toastService.warning('El contenido no puede estar vacío');
      return;
    }

    this.isSaving.set(true);
    this.habeasDataService.updateHabeasData(this.content).subscribe({
      next: (response) => {
        this.habeasData.set(response.habeasData);
        this.toastService.success('Texto de habeas data guardado correctamente');
        this.isSaving.set(false);
      },
      error: () => {
        this.toastService.error('Error al guardar el texto de habeas data');
        this.isSaving.set(false);
      }
    });
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('es-CO');
  }
}