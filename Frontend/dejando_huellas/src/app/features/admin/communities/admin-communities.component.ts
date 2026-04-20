import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CommunitiesService, ToastService } from '../../../core/services';
import { Community } from '../../../core/models';
import { ButtonComponent, SpinnerComponent, ConfirmDialogComponent } from '../../../shared/components';

@Component({
  selector: 'app-admin-communities',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent, SpinnerComponent, ConfirmDialogComponent],
  template: `
    <div class="communities-page">
      <div class="page-header">
        <div>
          <h2>Gestión de Comunidades</h2>
          <p>Administra las comunidades de la asociación</p>
        </div>
        <app-button (onClick)="openForm()">
          + Agregar Comunidad
        </app-button>
      </div>
      
      @if (isLoading()) {
        <div class="loading-state">
          <app-spinner></app-spinner>
        </div>
      } @else {
        <!-- Communities Table -->
        <div class="table-container">
          <table class="communities-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Fecha de Creación</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (community of communities(); track community.id) {
                <tr>
                  <td>
                    <div class="community-info">
                      <div class="avatar">{{ getInitials(community.name) }}</div>
                      <span>{{ community.name }}</span>
                    </div>
                  </td>
                  <td>{{ formatDate(community.created_at) }}</td>
                  <td>
                    <div class="actions">
                      <button class="action-btn edit" (click)="editCommunity(community)" title="Editar">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      <button class="action-btn delete" (click)="confirmDelete(community)" title="Eliminar">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <polyline points="3,6 5,6 21,6"/>
                          <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="3" class="empty-row">
                    No hay comunidades registradas
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
      
      <!-- Form Modal -->
      @if (showForm()) {
        <div class="modal-overlay" (click)="closeForm()">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>{{ editingCommunity() ? 'Editar Comunidad' : 'Agregar Comunidad' }}</h3>
              <button class="close-btn" (click)="closeForm()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <form (ngSubmit)="saveCommunity()" class="community-form">
              <div class="form-group">
                <label for="name">Nombre *</label>
                <input type="text" id="name" [(ngModel)]="formData.name" name="name" required />
              </div>
              <div class="form-actions">
                <app-button variant="outline" type="button" (onClick)="closeForm()">
                  Cancelar
                </app-button>
                <app-button type="submit" [loading]="isSaving()">
                  {{ editingCommunity() ? 'Guardar' : 'Crear' }}
                </app-button>
              </div>
            </form>
          </div>
        </div>
      }
      
      <!-- Confirm Dialog -->
      <app-confirm-dialog
        [isOpen]="showConfirm()"
        title="Eliminar Comunidad"
        [message]="'¿Está seguro de que desea eliminar la comunidad ' + (communityToDelete()?.name || '') + '?'"
        confirmText="Eliminar"
        [confirmDanger]="true"
        (onConfirm)="deleteCommunity()"
        (onCancel)="cancelDelete()"
      ></app-confirm-dialog>
    </div>
  `,
  styles: [`
    .communities-page {
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
    
    .table-container {
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }
    
    .communities-table {
      width: 100%;
      border-collapse: collapse;
      
      th, td {
        padding: 1rem;
        text-align: left;
      }
      
      th {
        background: #F5F5F5;
        color: #616161;
        font-weight: 600;
        font-size: 0.875rem;
        text-transform: uppercase;
      }
      
      tr:not(:last-child) td {
        border-bottom: 1px solid #E0E0E0;
      }
      
      td {
        color: #424242;
      }
    }
    
    .community-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    
    .avatar {
      width: 36px;
      height: 36px;
      background: #A5D6A7;
      color: #1B5E20;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.875rem;
    }
    
    .actions {
      display: flex;
      gap: 0.5rem;
    }
    
    .action-btn {
      width: 32px;
      height: 32px;
      border: none;
      background: #F5F5F5;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      
      svg {
        width: 16px;
        height: 16px;
      }
      
      &:hover {
        background: #E0E0E0;
      }
      
      &.edit:hover { color: #2196F3; }
      &.delete:hover { color: #f44336; background: rgba(244, 67, 54, 0.1); }
    }
    
    .empty-row {
      text-align: center;
      color: #757575;
      padding: 2rem !important;
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
      max-width: 500px;
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
    
    .community-form {
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
      
      input {
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
    
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 0.5rem;
    }
  `]
})
export class AdminCommunitiesComponent implements OnInit {
  private communitiesService = inject(CommunitiesService);
  private toastService = inject(ToastService);
  
  communities = signal<Community[]>([]);
  isLoading = signal(true);
  isSaving = signal(false);
  showForm = signal(false);
  showConfirm = signal(false);
  editingCommunity = signal<Community | null>(null);
  communityToDelete = signal<Community | null>(null);
  
  formData = {
    name: ''
  };

  ngOnInit(): void {
    this.loadCommunities();
  }

  loadCommunities(): void {
    this.isLoading.set(true);
    this.communitiesService.getAllCommunities().subscribe({
      next: (response) => {
        this.communities.set(response.communities);
        this.isLoading.set(false);
      },
      error: () => {
        this.toastService.error('Error al cargar las comunidades');
        this.isLoading.set(false);
      }
    });
  }

  openForm(community?: Community): void {
    if (community) {
      this.editingCommunity.set(community);
      this.formData = {
        name: community.name
      };
    } else {
      this.editingCommunity.set(null);
      this.formData = {
        name: ''
      };
    }
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editingCommunity.set(null);
  }

  editCommunity(community: Community): void {
    this.openForm(community);
  }

  saveCommunity(): void {
    if (!this.formData.name) {
      this.toastService.warning('Ingrese el nombre de la comunidad');
      return;
    }

    this.isSaving.set(true);
    const editing = this.editingCommunity();

    if (editing) {
      this.communitiesService.updateCommunity(editing.id, this.formData.name).subscribe({
        next: () => {
          this.toastService.success('Comunidad actualizada correctamente');
          this.closeForm();
          this.loadCommunities();
        },
        error: (error) => {
          this.isSaving.set(false);
          if (error.status === 409) {
            this.toastService.error('Ya existe una comunidad con ese nombre');
          } else {
            this.toastService.error('Error al actualizar la comunidad');
          }
        }
      });
    } else {
      this.communitiesService.createCommunity(this.formData.name).subscribe({
        next: () => {
          this.toastService.success('Comunidad creada correctamente');
          this.closeForm();
          this.loadCommunities();
        },
        error: (error) => {
          this.isSaving.set(false);
          if (error.status === 409) {
            this.toastService.error('Ya existe una comunidad con ese nombre');
          } else {
            this.toastService.error('Error al crear la comunidad');
          }
        }
      });
    }
  }

  confirmDelete(community: Community): void {
    this.communityToDelete.set(community);
    this.showConfirm.set(true);
  }

  deleteCommunity(): void {
    const community = this.communityToDelete();
    if (community) {
      this.communitiesService.deleteCommunity(community.id).subscribe({
        next: () => {
          this.toastService.success('Comunidad eliminada');
          this.showConfirm.set(false);
          this.communityToDelete.set(null);
          this.loadCommunities();
        },
        error: () => {
          this.toastService.error('Error al eliminar la comunidad');
          this.showConfirm.set(false);
        }
      });
    }
  }

  cancelDelete(): void {
    this.showConfirm.set(false);
    this.communityToDelete.set(null);
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-CO');
  }
}