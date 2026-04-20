import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatBotService, ToastService } from '../../../core/services';
import { ChatBotOption, ChatBotTreeNode, CreateChatBotRequest, UpdateChatBotRequest } from '../../../core/models';
import { ButtonComponent, SpinnerComponent, ConfirmDialogComponent } from '../../../shared/components';

@Component({
  selector: 'app-admin-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent, SpinnerComponent, ConfirmDialogComponent],
  template: `
    <div class="chatbot-page">
      <div class="page-header">
        <div>
          <h2>Gestión del ChatBot</h2>
          <p>Administra las opciones del chatbot de preguntas frecuentes</p>
        </div>
        <app-button (onClick)="openForm()">
          + Agregar Opción
        </app-button>
      </div>
      
      @if (isLoading()) {
        <div class="loading-state">
          <app-spinner></app-spinner>
        </div>
      } @else {
        <!-- Tree View -->
        <div class="tree-container">
          @for (option of rootOptions(); track option.id) {
            <div class="tree-node">
              <div class="option-item" [class.has-children]="option.children && option.children.length > 0">
                <div class="option-info">
                  <span class="option-question">{{ option.question }}</span>
                  <span class="option-answer">{{ truncateAnswer(option.answer) }}</span>
                </div>
                <div class="option-actions">
                  @if (option.children && option.children.length > 0) {
                    <button class="action-btn expand" (click)="toggleExpand(option.id)" [class.expanded]="isExpanded(option.id)">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 18l6-6-6-6"/>
                      </svg>
                    </button>
                  }
                  <button class="action-btn add-sub" (click)="openForm(option)" title="Agregar sub-opción">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M12 5v14M5 12h14"/>
                    </svg>
                  </button>
                  <button class="action-btn edit" (click)="editOption(option)" title="Editar">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                  <button class="action-btn delete" (click)="confirmDelete(option)" title="Eliminar">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="3,6 5,6 21,6"/>
                      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                    </svg>
                  </button>
                </div>
              </div>
              
              <!-- Children -->
              @if (isExpanded(option.id) && option.children && option.children.length > 0) {
                <div class="children">
                  @for (child of option.children; track child.id) {
                    <div class="option-item child">
                      <div class="option-info">
                        <span class="option-question">{{ child.question }}</span>
                        <span class="option-answer">{{ truncateAnswer(child.answer) }}</span>
                      </div>
                      <div class="option-actions">
                        <button class="action-btn edit" (click)="editOption(child)" title="Editar">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <button class="action-btn delete" (click)="confirmDelete(child)" title="Eliminar">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3,6 5,6 21,6"/>
                            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          } @empty {
            <div class="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
              </svg>
              <p>No hay opciones de chatbot configuradas</p>
              <app-button (onClick)="openForm()">
                Crear primera opción
              </app-button>
            </div>
          }
        </div>
      }
      
      <!-- Form Modal -->
      @if (showForm()) {
        <div class="modal-overlay" (click)="closeForm()">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>{{ editingOption() ? 'Editar Opción' : 'Agregar Opción' }}</h3>
              <button class="close-btn" (click)="closeForm()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <form (ngSubmit)="saveOption()" class="chatbot-form">
              <div class="form-group">
                <label for="question">Pregunta *</label>
                <input type="text" id="question" [(ngModel)]="formData.question" name="question" required />
              </div>
              <div class="form-group">
                <label for="answer">Respuesta *</label>
                <textarea id="answer" [(ngModel)]="formData.answer" name="answer" rows="4" required></textarea>
              </div>
              <div class="form-group">
                <label for="parent">Opción Padre (opcional)</label>
                <select id="parent" [(ngModel)]="formData.parent_id" name="parent_id">
                  <option [ngValue]="null">Ninguna (opción raíz)</option>
                  @for (option of allOptions(); track option.id) {
                    @if (option.id !== editingOption()?.id) {
                      <option [value]="option.id">{{ option.question }}</option>
                    }
                  }
                </select>
              </div>
              <div class="form-group">
                <label for="order">Orden</label>
                <input type="number" id="order" [(ngModel)]="formData.order" name="order" min="0" />
              </div>
              <div class="form-actions">
                <app-button variant="outline" type="button" (onClick)="closeForm()">
                  Cancelar
                </app-button>
                <app-button type="submit" [loading]="isSaving()">
                  {{ editingOption() ? 'Guardar' : 'Crear' }}
                </app-button>
              </div>
            </form>
          </div>
        </div>
      }
      
      <!-- Confirm Dialog -->
      <app-confirm-dialog
        [isOpen]="showConfirm()"
        title="Eliminar Opción"
        [message]="getDeleteMessage()"
        confirmText="Eliminar"
        [confirmDanger]="true"
        (onConfirm)="deleteOption()"
        (onCancel)="cancelDelete()"
      ></app-confirm-dialog>
    </div>
  `,
  styles: [`
    .chatbot-page {
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
    
    .tree-container {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    
    .tree-node {
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }
    
    .option-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid #E0E0E0;
      
      &:last-child {
        border-bottom: none;
      }
      
      &.child {
        background: #FAFAFA;
        padding-left: 2.5rem;
      }
    }
    
    .option-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      flex: 1;
      min-width: 0;
    }
    
    .option-question {
      font-weight: 600;
      color: #1B5E20;
    }
    
    .option-answer {
      color: #757575;
      font-size: 0.875rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .option-actions {
      display: flex;
      gap: 0.5rem;
      margin-left: 1rem;
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
      
      &.expand {
        &.expanded svg {
          transform: rotate(90deg);
        }
      }
      
      &.add-sub:hover { color: #4CAF50; }
      &.edit:hover { color: #2196F3; }
      &.delete:hover { color: #f44336; background: rgba(244, 67, 54, 0.1); }
    }
    
    .children {
      border-top: 1px solid #E0E0E0;
    }
    
    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      
      svg {
        width: 64px;
        height: 64px;
        color: #BDBDBD;
        margin-bottom: 1rem;
      }
      
      p {
        color: #757575;
        margin-bottom: 1.5rem;
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
    
    .chatbot-form {
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
      
      input, textarea, select {
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
        min-height: 100px;
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
export class AdminChatBotComponent implements OnInit {
  private chatBotService = inject(ChatBotService);
  private toastService = inject(ToastService);
  
  options = signal<ChatBotTreeNode[]>([]);
  allOptionsList = signal<ChatBotOption[]>([]);
  isLoading = signal(true);
  isSaving = signal(false);
  showForm = signal(false);
  showConfirm = signal(false);
  editingOption = signal<ChatBotOption | null>(null);
  optionToDelete = signal<ChatBotOption | null>(null);
  expandedIds = signal<Set<string>>(new Set());
  
  formData: CreateChatBotRequest = {
    question: '',
    answer: '',
    parent_id: null,
    order: 0
  };

  ngOnInit(): void {
    this.loadOptions();
  }

  get rootOptions(): () => ChatBotTreeNode[] {
    return () => this.options();
  }

  get allOptions(): () => ChatBotOption[] {
    return () => this.allOptionsList();
  }

  loadOptions(): void {
    this.isLoading.set(true);
    this.chatBotService.getAllOptions().subscribe({
      next: (response) => {
        this.options.set(response.options);
        // Flatten options for parent selection
        const flatOptions: ChatBotOption[] = [];
        const flatten = (opts: ChatBotTreeNode[]) => {
          opts.forEach(opt => {
            flatOptions.push(opt);
            if (opt.children && opt.children.length > 0) {
              flatten(opt.children);
            }
          });
        };
        flatten(response.options);
        this.allOptionsList.set(flatOptions);
        this.isLoading.set(false);
      },
      error: () => {
        this.toastService.error('Error al cargar las opciones del chatbot');
        this.isLoading.set(false);
      }
    });
  }

  openForm(parent?: ChatBotOption): void {
    if (parent) {
      this.editingOption.set(null);
      this.formData = {
        question: '',
        answer: '',
        parent_id: parent.id,
        order: 0
      };
    } else {
      this.editingOption.set(null);
      this.formData = {
        question: '',
        answer: '',
        parent_id: null,
        order: 0
      };
    }
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editingOption.set(null);
  }

  editOption(option: ChatBotOption): void {
    this.editingOption.set(option);
    this.formData = {
      question: option.question,
      answer: option.answer,
      parent_id: option.parent_id || null,
      order: option.order
    };
    this.showForm.set(true);
  }

  saveOption(): void {
    if (!this.formData.question || !this.formData.answer) {
      this.toastService.warning('Complete todos los campos requeridos');
      return;
    }

    this.isSaving.set(true);
    const editing = this.editingOption();

    if (editing) {
      const updateData: UpdateChatBotRequest = {
        question: this.formData.question,
        answer: this.formData.answer,
        parent_id: this.formData.parent_id,
        order: this.formData.order
      };
      
      this.chatBotService.updateOption(editing.id, updateData).subscribe({
        next: () => {
          this.toastService.success('Opción actualizada correctamente');
          this.closeForm();
          this.loadOptions();
        },
        error: () => {
          this.isSaving.set(false);
          this.toastService.error('Error al actualizar la opción');
        }
      });
    } else {
      this.chatBotService.createOption(this.formData).subscribe({
        next: () => {
          this.toastService.success('Opción creada correctamente');
          this.closeForm();
          this.loadOptions();
        },
        error: () => {
          this.isSaving.set(false);
          this.toastService.error('Error al crear la opción');
        }
      });
    }
  }

  confirmDelete(option: ChatBotOption): void {
    this.optionToDelete.set(option);
    this.showConfirm.set(true);
  }

  deleteOption(): void {
    const option = this.optionToDelete();
    if (option) {
      this.chatBotService.deleteOption(option.id).subscribe({
        next: () => {
          this.toastService.success('Opción eliminada');
          this.showConfirm.set(false);
          this.optionToDelete.set(null);
          this.loadOptions();
        },
        error: () => {
          this.toastService.error('Error al eliminar la opción');
          this.showConfirm.set(false);
        }
      });
    }
  }

  cancelDelete(): void {
    this.showConfirm.set(false);
    this.optionToDelete.set(null);
  }

  getDeleteMessage(): string {
    const option = this.optionToDelete();
    if (!option) return '';
    
    const hasChildren = option.children && option.children.length > 0;
    if (hasChildren) {
      return `¿Está seguro de que desea eliminar la opción "${option.question}"? También se eliminarán todas sus sub-opciones.`;
    }
    return `¿Está seguro de que desea eliminar la opción "${option.question}"?`;
  }

  toggleExpand(id: string): void {
    const current = this.expandedIds();
    if (current.has(id)) {
      current.delete(id);
    } else {
      current.add(id);
    }
    this.expandedIds.set(new Set(current));
  }

  isExpanded(id: string): boolean {
    return this.expandedIds().has(id);
  }

  truncateAnswer(answer: string): string {
    if (answer.length > 80) {
      return answer.substring(0, 80) + '...';
    }
    return answer;
  }
}