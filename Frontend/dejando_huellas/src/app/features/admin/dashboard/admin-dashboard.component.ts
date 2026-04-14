import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MembersService, PublicationsService, ContactService } from '../../../core/services';
import { SpinnerComponent } from '../../../shared/components';

interface DashboardStats {
  totalMembers: number;
  pendingMembers: number;
  totalPosts: number;
  totalMessages: number;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, SpinnerComponent],
  template: `
    <div class="dashboard">
      <div class="dashboard-header">
        <h2>Bienvenido, {{ userName() }}</h2>
        <p>Resumen de la actividad de la asociación</p>
      </div>
      
      @if (isLoading()) {
        <div class="loading-state">
          <app-spinner [size]="48"></app-spinner>
          <p>Cargando estadísticas...</p>
        </div>
      } @else {
        <div class="stats-grid">
          <a routerLink="/admin/members" class="stat-card stat-card-link">
            <div class="stat-icon members">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
              </svg>
            </div>
            <div class="stat-content">
              <span class="stat-value">{{ stats().totalMembers }}</span>
              <span class="stat-label">Total Miembros</span>
            </div>
          </a>
          
          <a routerLink="/admin/members" class="stat-card stat-card-link">
            <div class="stat-icon pending">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12,6 12,12 16,14"/>
              </svg>
            </div>
            <div class="stat-content">
              <span class="stat-value">{{ stats().pendingMembers }}</span>
              <span class="stat-label">Pendientes</span>
            </div>
          </a>
          
          <a routerLink="/admin/publications" class="stat-card stat-card-link">
            <div class="stat-icon posts">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
            </div>
            <div class="stat-content">
              <span class="stat-value">{{ stats().totalPosts }}</span>
              <span class="stat-label">Publicaciones</span>
            </div>
          </a>
          
          <a routerLink="/admin/contact" class="stat-card stat-card-link">
            <div class="stat-icon messages">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
              </svg>
            </div>
            <div class="stat-content">
              <span class="stat-value">{{ stats().totalMessages }}</span>
              <span class="stat-label">Mensajes</span>
            </div>
          </a>
        </div>
        
        <div class="quick-actions">
          <h3>Acciones Rápidas</h3>
          <div class="actions-grid">
            <a routerLink="/admin/members" class="action-card">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                <circle cx="8.5" cy="7" r="4"/>
                <line x1="20" y1="8" x2="20" y2="14"/>
                <line x1="23" y1="11" x2="17" y2="11"/>
              </svg>
              <span>Agregar Miembro</span>
            </a>
            <a routerLink="/admin/publications" class="action-card">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              <span>Nueva Publicación</span>
            </a>
            <a routerLink="/admin/contact" class="action-card">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>
              </svg>
              <span>Ver Mensajes</span>
            </a>
            <a routerLink="/" class="action-card">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                <polyline points="15,3 21,3 21,9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
              <span>Ver Sitio Público</span>
            </a>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .dashboard {
      animation: fadeIn 0.3s ease;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .dashboard-header {
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
    
    .loading-state {
      text-align: center;
      padding: 4rem;
      color: #757575;
      
      p {
        margin-top: 1rem;
      }
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    
    .stat-card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      
      &.stat-card-link {
        text-decoration: none;
        color: inherit;
        cursor: pointer;
        transition: all 0.2s ease;
        
        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          background: #F5F5F5;
        }
      }
    }
    
    .stat-icon {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      
      svg {
        width: 28px;
        height: 28px;
      }
      
      &.members {
        background: rgba(76, 175, 80, 0.1);
        color: #4CAF50;
      }
      
      &.pending {
        background: rgba(244, 162, 97, 0.1);
        color: #F4A261;
      }
      
      &.posts {
        background: rgba(33, 150, 243, 0.1);
        color: #2196F3;
      }
      
      &.messages {
        background: rgba(156, 39, 176, 0.1);
        color: #9C27B0;
      }
    }
    
    .stat-content {
      display: flex;
      flex-direction: column;
    }
    
    .stat-value {
      font-size: 2rem;
      font-weight: 700;
      color: #212121;
      line-height: 1;
    }
    
    .stat-label {
      font-size: 0.875rem;
      color: #757575;
      margin-top: 0.25rem;
    }
    
    .quick-actions {
      h3 {
        color: #1B5E20;
        margin: 0 0 1rem;
        font-size: 1.25rem;
      }
    }
    
    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }
    
    .action-card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      text-decoration: none;
      color: #1B5E20;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      transition: all 0.2s ease;
      
      svg {
        width: 32px;
        height: 32px;
        margin-bottom: 0.75rem;
        color: #4CAF50;
      }
      
      span {
        font-weight: 500;
      }
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        background: #F5F5F5;
      }
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
  private membersService = inject(MembersService);
  private publicationsService = inject(PublicationsService);
  private contactService = inject(ContactService);
  
  private _userName = signal('');
  stats = signal<DashboardStats>({
    totalMembers: 0,
    pendingMembers: 0,
    totalPosts: 0,
    totalMessages: 0
  });
  isLoading = signal(true);

  userName(): string {
    // Try to get from localStorage
    const userStr = localStorage.getItem('dh_user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return user.name || 'Administrador';
      } catch {
        return 'Administrador';
      }
    }
    return 'Administrador';
  }

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    // Load all stats in parallel
    this.membersService.getAllMembers().subscribe({
      next: (response) => {
        const members = response.users;
        const pending = members.filter(m => m.status === 'PENDING').length;
        this.stats.update(s => ({ ...s, totalMembers: members.length, pendingMembers: pending }));
      },
      error: () => {
        // Handle error silently
      }
    });

    this.publicationsService.getAllPosts().subscribe({
      next: (response) => {
        this.stats.update(s => ({ ...s, totalPosts: response.posts.length }));
      },
      error: () => {
        // Handle error silently
      }
    });

    this.contactService.getAllMessages().subscribe({
      next: (response) => {
        this.stats.update(s => ({ ...s, totalMessages: response.contacts.length }));
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }
}
