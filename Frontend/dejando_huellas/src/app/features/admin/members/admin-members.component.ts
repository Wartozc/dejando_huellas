import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MembersService, CommunitiesService, ToastService } from '../../../core/services';
import { User, UserRole, UserStatus } from '../../../core/models';
import { Community } from '../../../core/models';
import { ButtonComponent, SpinnerComponent, ConfirmDialogComponent } from '../../../shared/components';

@Component({
  selector: 'app-admin-members',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent, SpinnerComponent, ConfirmDialogComponent],
  template: `
    <div class="members-page">
      <div class="page-header">
        <div>
          <h2>Gestión de Miembros</h2>
          <p>Administra los miembros de la asociación</p>
        </div>
        <app-button (onClick)="openForm()">
          + Agregar Miembro
        </app-button>
      </div>
      
      @if (isLoading()) {
        <div class="loading-state">
          <app-spinner></app-spinner>
        </div>
      } @else {
        <!-- Filters -->
        <div class="filters">
          <input 
            type="text" 
            placeholder="Buscar miembro..." 
            [(ngModel)]="searchTerm"
            (ngModelChange)="filterMembers()"
            class="search-input"
          />
          <select [(ngModel)]="filterStatus" (ngModelChange)="filterMembers()" class="filter-select">
            <option value="">Todos los estados</option>
            <option value="PENDING">Pendientes</option>
            <option value="APPROVED">Aprobados</option>
            <option value="REJECTED">Rechazados</option>
          </select>
          <select [(ngModel)]="filterRole" (ngModelChange)="filterMembers()" class="filter-select">
            <option value="">Todos los roles</option>
            <option value="ADMIN">Administrador</option>
            <option value="MEMBER">Miembro</option>
          </select>
        </div>
        
        <!-- Members Table -->
        <div class="table-container">
          <table class="members-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (member of filteredMembers(); track member.id) {
                <tr>
                  <td>
                    <div class="member-info">
                      <div class="avatar">{{ getInitials(member.name) }}</div>
                      <span>{{ member.name }}</span>
                    </div>
                  </td>
                  <td>{{ member.email }}</td>
                  <td>
                    <span class="badge" [class.admin]="member.role === 'ADMIN'" [class.member]="member.role === 'MEMBER'">
                      {{ member.role }}
                    </span>
                  </td>
                  <td>
                    <span class="status-badge" [class]="member.status.toLowerCase()">
                      {{ getStatusLabel(member.status) }}
                    </span>
                  </td>
                  <td>{{ formatDate(member.created_at) }}</td>
                  <td>
                    <div class="actions">
                      <button class="action-btn edit" (click)="editMember(member)" title="Editar">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      @if (member.status === 'PENDING') {
                        <button class="action-btn approve" (click)="approveMember(member)" title="Aprobar">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20 6L9 17l-5-5"/>
                          </svg>
                        </button>
                        <button class="action-btn reject" (click)="rejectMember(member)" title="Rechazar">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 6L6 18M6 6l12 12"/>
                          </svg>
                        </button>
                      }
                      <button class="action-btn delete" (click)="confirmDelete(member)" title="Eliminar">
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
                  <td colspan="6" class="empty-row">
                    No hay miembros registrados
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
              <h3>{{ editingMember() ? 'Editar Miembro' : 'Agregar Miembro' }}</h3>
              <button class="close-btn" (click)="closeForm()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <form (ngSubmit)="saveMember()" class="member-form">
              <div class="form-group">
                <label for="name">Nombre *</label>
                <input type="text" id="name" [(ngModel)]="formData.name" name="name" required />
              </div>
              <div class="form-group">
                <label for="email">Correo *</label>
                <input type="email" id="email" [(ngModel)]="formData.email" name="email" required />
              </div>
              <div class="form-group">
                <label for="phone">Teléfono</label>
                <input type="tel" id="phone" [(ngModel)]="formData.phone" name="phone" />
              </div>
              <div class="form-group">
                <label for="community">Comunidad *</label>
                <select id="community" [(ngModel)]="formData.community" name="community" required>
                  <option value="">Por favor seleccione la comunidad a la que pertenece</option>
                  @for (community of communities(); track community.id) {
                    <option [value]="community.name">{{ community.name }}</option>
                  }
                </select>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label for="role">Rol</label>
                  <select id="role" [(ngModel)]="formData.role" name="role">
                    <option value="MEMBER">Miembro</option>
                    <option value="ADMIN">Administrador</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="status">Estado</label>
                  <select id="status" [(ngModel)]="formData.status" name="status">
                    <option value="PENDING">Pendiente</option>
                    <option value="APPROVED">Aprobado</option>
                    <option value="REJECTED">Rechazado</option>
                  </select>
                </div>
              </div>
              @if (!editingMember()) {
                <div class="form-group">
                  <label for="password">Contraseña</label>
                  <input type="password" id="password" [(ngModel)]="formData.password" name="password" />
                </div>
              }
              <div class="form-actions">
                <app-button variant="outline" type="button" (onClick)="closeForm()">
                  Cancelar
                </app-button>
                <app-button type="submit" [loading]="isSaving()">
                  {{ editingMember() ? 'Guardar' : 'Crear' }}
                </app-button>
              </div>
            </form>
          </div>
        </div>
      }
      
      <!-- Confirm Dialog -->
      <app-confirm-dialog
        [isOpen]="showConfirm()"
        title="Eliminar Miembro"
        [message]="'¿Está seguro de que desea eliminar a ' + (memberToDelete()?.name || '') + '?'"
        confirmText="Eliminar"
        [confirmDanger]="true"
        (onConfirm)="deleteMember()"
        (onCancel)="cancelDelete()"
      ></app-confirm-dialog>
    </div>
  `,
  styles: [`
    .members-page {
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
    
    .filters {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }
    
    .search-input {
      flex: 1;
      min-width: 200px;
      padding: 0.75rem 1rem;
      border: 2px solid #E0E0E0;
      border-radius: 8px;
      font-size: 0.9375rem;
      
      &:focus {
        outline: none;
        border-color: #4CAF50;
      }
    }
    
    .filter-select {
      padding: 0.75rem 1rem;
      border: 2px solid #E0E0E0;
      border-radius: 8px;
      font-size: 0.9375rem;
      background: white;
      cursor: pointer;
      
      &:focus {
        outline: none;
        border-color: #4CAF50;
      }
    }
    
    .table-container {
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      overflow-x: auto;
    }
    
    .members-table {
      width: 100%;
      border-collapse: collapse;
      min-width: 600px;
      
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
    
    /* Mobile responsive for table */
    @media (max-width: 768px) {
      .table-container {
        border-radius: 8px;
      }
      
      .members-table {
        min-width: 500px;
        
        th, td {
          padding: 0.75rem;
        }
      }
    }
    
    @media (max-width: 480px) {
      .page-header {
        flex-direction: column;
        align-items: stretch;
        
        h2 {
          font-size: 1.25rem;
        }
      }
      
      .filters {
        flex-direction: column;
        
        .search-input, .filter-select {
          width: 100%;
        }
      }
      
      .members-table {
        font-size: 0.875rem;
        
        th, td {
          padding: 0.625rem;
        }
      }
      
      .member-info {
        gap: 0.5rem;
        
        .avatar {
          width: 32px;
          height: 32px;
          font-size: 0.75rem;
        }
      }
    }
    
    .member-info {
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
    
    .badge {
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      
      &.admin {
        background: rgba(244, 162, 97, 0.15);
        color: #E08B4A;
      }
      
      &.member {
        background: rgba(76, 175, 80, 0.15);
        color: #4CAF50;
      }
    }
    
    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      
      &.approved {
        background: rgba(76, 175, 80, 0.15);
        color: #4CAF50;
      }
      
      &.pending {
        background: rgba(255, 152, 0, 0.15);
        color: #FF9800;
      }
      
      &.rejected {
        background: rgba(244, 67, 54, 0.15);
        color: #f44336;
      }
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
      &.approve:hover { color: #4CAF50; }
      &.reject:hover { color: #f44336; }
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
      
      @media (max-width: 480px) {
        border-radius: 12px;
        max-height: 95vh;
      }
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
    
    .member-form {
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
      
      input, select {
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
    
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 0.5rem;
    }
  `]
})
export class AdminMembersComponent implements OnInit {
  private membersService = inject(MembersService);
  private communitiesService = inject(CommunitiesService);
  private toastService = inject(ToastService);
  
  members = signal<User[]>([]);
  filteredMembers = signal<User[]>([]);
  communities = signal<Community[]>([]);
  isLoading = signal(true);
  isSaving = signal(false);
  showForm = signal(false);
  showConfirm = signal(false);
  editingMember = signal<User | null>(null);
  memberToDelete = signal<User | null>(null);
  
  searchTerm = '';
  filterStatus = '';
  filterRole = '';
  
  formData = {
    name: '',
    email: '',
    phone: '',
    community: '',
    role: 'MEMBER' as UserRole,
    status: 'PENDING' as UserStatus,
    password: ''
  };

  ngOnInit(): void {
    this.loadMembers();
    this.loadCommunities();
  }

  loadCommunities(): void {
    this.communitiesService.getAllCommunities().subscribe({
      next: (response) => {
        this.communities.set(response.communities);
      },
      error: () => {
        this.toastService.error('Error al cargar las comunidades');
      }
    });
  }

  loadMembers(): void {
    this.isLoading.set(true);
    this.membersService.getAllMembers().subscribe({
      next: (response) => {
        this.members.set(response.users);
        this.filterMembers();
        this.isLoading.set(false);
      },
      error: () => {
        this.toastService.error('Error al cargar los miembros');
        this.isLoading.set(false);
      }
    });
  }

  filterMembers(): void {
    let filtered = this.members();
    
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(m => 
        m.name.toLowerCase().includes(term) || 
        m.email.toLowerCase().includes(term)
      );
    }
    
    if (this.filterStatus) {
      filtered = filtered.filter(m => m.status === this.filterStatus);
    }
    
    if (this.filterRole) {
      filtered = filtered.filter(m => m.role === this.filterRole);
    }
    
    this.filteredMembers.set(filtered);
  }

  openForm(member?: User): void {
    if (member) {
      this.editingMember.set(member);
      this.formData = {
        name: member.name,
        email: member.email,
        phone: member.phone || '',
        community: '',
        role: member.role,
        status: member.status,
        password: ''
      };
      // Set community explicitly when editing to ensure dropdown shows user's current community
      let communityValue = member.community || '';
      // If community looks like a MongoDB ID (24 hex chars), try to find the name
      if (communityValue && communityValue.length === 24 && /^[a-f0-9]+$/i.test(communityValue)) {
        const found = this.communities().find(c => c.id === communityValue);
        if (found) {
          communityValue = found.name;
        } else {
          communityValue = ''; // Clear invalid ID
        }
      }
      this.formData.community = communityValue;
    } else {
      this.editingMember.set(null);
      this.formData = {
        name: '',
        email: '',
        phone: '',
        community: '',
        role: 'MEMBER',
        status: 'PENDING',
        password: ''
      };
    }
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editingMember.set(null);
  }

  editMember(member: User): void {
    this.openForm(member);
  }

  saveMember(): void {
    if (!this.formData.name || !this.formData.email || !this.formData.community) {
      this.toastService.warning('Complete los campos requeridos');
      return;
    }

    this.isSaving.set(true);
    const editing = this.editingMember();

    if (editing) {
      this.membersService.updateMember(editing.id, {
        name: this.formData.name,
        email: this.formData.email,
        phone: this.formData.phone || undefined,
        role: this.formData.role,
        status: this.formData.status,
        community: this.formData.community || undefined
      }).subscribe({
        next: (response) => {
          this.toastService.success('Miembro actualizado correctamente');
          this.closeForm();
          this.loadMembers();
        },
        error: () => {
          this.toastService.error('Error al actualizar el miembro');
          this.isSaving.set(false);
        }
      });
    } else {
      if (!this.formData.password) {
        this.toastService.warning('Ingrese una contraseña');
        this.isSaving.set(false);
        return;
      }
      
      this.membersService.registerMember({
        name: this.formData.name,
        email: this.formData.email,
        phone: this.formData.phone || undefined,
        password: this.formData.password,
        community: this.formData.community || undefined
      }).subscribe({
        next: (response) => {
          this.toastService.success('Miembro creado correctamente');
          this.closeForm();
          this.loadMembers();
        },
        error: () => {
          this.toastService.error('Error al crear el miembro');
          this.isSaving.set(false);
        }
      });
    }
  }

  approveMember(member: User): void {
    this.membersService.approveMember(member.id).subscribe({
      next: (response) => {
        this.toastService.success('Miembro aprobado');
        this.loadMembers();
      },
      error: () => {
        this.toastService.error('Error al aprobar el miembro');
      }
    });
  }

  rejectMember(member: User): void {
    this.membersService.rejectMember(member.id).subscribe({
      next: (response) => {
        this.toastService.success('Miembro rechazado');
        this.loadMembers();
      },
      error: () => {
        this.toastService.error('Error al rechazar el miembro');
      }
    });
  }

  confirmDelete(member: User): void {
    this.memberToDelete.set(member);
    this.showConfirm.set(true);
  }

  deleteMember(): void {
    const member = this.memberToDelete();
    if (member) {
      this.membersService.deleteMember(member.id).subscribe({
        next: () => {
          this.toastService.success('Miembro eliminado');
          this.showConfirm.set(false);
          this.memberToDelete.set(null);
          this.loadMembers();
        },
        error: () => {
          this.toastService.error('Error al eliminar el miembro');
          this.showConfirm.set(false);
        }
      });
    }
  }

  cancelDelete(): void {
    this.showConfirm.set(false);
    this.memberToDelete.set(null);
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  getStatusLabel(status: UserStatus): string {
    const labels: Record<UserStatus, string> = {
      'PENDING': 'Pendiente',
      'APPROVED': 'Aprobado',
      'REJECTED': 'Rechazado'
    };
    return labels[status];
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-CO');
  }
}
