import { Component, inject, OnInit, signal, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatBotService } from '../../../core/services';
import { ChatBotTreeNode } from '../../../core/models';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Floating Button -->
    <button 
      class="chatbot-float-btn" 
      (click)="toggleChat()"
      [attr.aria-label]="isOpen() ? 'Cerrar chat' : 'Abrir chat'"
    >
      @if (isOpen()) {
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      } @else {
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
        </svg>
      }
    </button>
    
    <!-- Chat Panel -->
    @if (isOpen()) {
      <div class="chatbot-panel chatbot-mobile">
        <div class="chatbot-header">
          <div class="header-content">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
            </svg>
            <span>Asistente Virtual</span>
          </div>
          <button class="header-close-btn" (click)="close()" aria-label="Cerrar chat">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div class="chatbot-content">
          @if (isLoading()) {
            <div class="loading">
              <div class="spinner"></div>
              <span>Cargando...</span>
            </div>
          } @else if (hasError()) {
            <div class="error">
              <p>No se pudo cargar el asistente. Intente más tarde.</p>
            </div>
          } @else {
            <!-- Current View: either options or answer -->
            @if (currentAnswer()) {
              <!-- Show answer with back button -->
              <div class="answer-view">
                <button class="back-btn" (click)="goBack()">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M15 18l-6-6 6-6"/>
                  </svg>
                  Volver
                </button>
                <div class="answer-content">
                  <p>{{ currentAnswer() }}</p>
                </div>
                @if (hasSubOptions()) {
                  <div class="sub-options">
                    @for (option of currentSubOptions(); track option.id) {
                      <button class="option-btn" (click)="selectOption(option)">
                        {{ option.question }}
                      </button>
                    }
                  </div>
                }
              </div>
            } @else {
              <!-- Show root options -->
              <div class="options-list">
                @for (option of rootOptions(); track option.id) {
                  <button class="option-btn" (click)="selectOption(option)">
                    {{ option.question }}
                  </button>
                } @empty {
                  <div class="no-options">
                    <p>No hay opciones disponibles en este momento.</p>
                  </div>
                }
              </div>
            }
          }
        </div>
      </div>
    }
  `,
  styles: [`
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    .chatbot-float-btn {
      position: fixed;
      bottom: 24px;
      right: 90px;
      width: 56px;
      height: 56px;
      background: #1B5E20;
      border-radius: 50%;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      box-shadow: 0 4px 12px rgba(27, 94, 32, 0.4);
      z-index: 1000;
      transition: all 0.3s ease;
    }
    .chatbot-float-btn svg {
      width: 28px;
      height: 28px;
    }
    .chatbot-float-btn:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 16px rgba(27, 94, 32, 0.5);
    }
    
    .chatbot-panel {
      position: fixed;
      bottom: 90px;
      right: 24px;
      width: 360px;
      max-width: calc(100vw - 48px);
      height: 480px;
      max-height: calc(100vh - 120px);
      background: white;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      z-index: 1000;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: slideUp 0.3s ease;
    }
    
    .chatbot-header {
      background: #1B5E20;
      color: white;
      padding: 1rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .chatbot-header .header-content {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .chatbot-header .header-content svg {
      width: 24px;
      height: 24px;
    }
    .chatbot-header span {
      font-weight: 600;
      font-size: 1rem;
    }
    
    .chatbot-header .header-close-btn {
      display: flex;
      width: 32px;
      height: 32px;
      border: none;
      background: transparent;
      color: white;
      cursor: pointer;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: background 0.2s ease;
      flex-shrink: 0;
    }
    .chatbot-header .header-close-btn svg {
      width: 24px;
      height: 24px;
    }
    .chatbot-header .header-close-btn:hover {
      background: rgba(255, 255, 255, 0.2);
    }
    
    .chatbot-content {
      flex: 1;
      overflow-y: auto;
      padding: 1rem;
    }
    
    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 200px;
      gap: 1rem;
      color: #757575;
    }
    .loading .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid #E0E0E0;
      border-top-color: #1B5E20;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    .error {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 200px;
      color: #f44336;
      text-align: center;
      padding: 1rem;
    }
    
    .options-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    
    .option-btn {
      width: 100%;
      padding: 0.875rem 1rem;
      background: #F5F5F5;
      border: none;
      border-radius: 8px;
      text-align: left;
      cursor: pointer;
      font-size: 0.9375rem;
      color: #424242;
      transition: all 0.2s ease;
    }
    .option-btn:hover {
      background: #E8F5E9;
      color: #1B5E20;
    }
    
    .no-options {
      text-align: center;
      color: #757575;
      padding: 2rem 1rem;
    }
    
    .answer-view {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    
    .back-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: none;
      border: none;
      color: #1B5E20;
      font-weight: 500;
      cursor: pointer;
      padding: 0;
      font-size: 0.875rem;
    }
    .back-btn svg {
      width: 18px;
      height: 18px;
    }
    .back-btn:hover {
      text-decoration: underline;
    }
    
    .answer-content {
      background: #F5F5F5;
      padding: 1rem;
      border-radius: 8px;
    }
    .answer-content p {
      margin: 0;
      color: #424242;
      line-height: 1.6;
      white-space: pre-wrap;
    }
    
    .sub-options {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    
    @media (max-width: 768px) {
      .chatbot-panel.chatbot-mobile {
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        width: 100%;
        height: 100%;
        max-width: 100%;
        max-height: 100%;
        border-radius: 0;
        z-index: 9999;
      }
      .chatbot-header .header-close-btn {
        display: flex;
      }
    }
    
    @media (max-width: 480px) {
      .chatbot-float-btn {
        bottom: 80px;
        right: 16px;
      }
      .chatbot-panel {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        width: 100vw;
        height: 100vh;
        max-height: 100vh;
        border-radius: 0;
        z-index: 9999;
        transform: none;
      }
      .chatbot-header {
        padding: 1rem;
        justify-content: space-between;
      }
    }
    
    @media (min-width: 481px) and (max-width: 768px) {
      .chatbot-float-btn {
        bottom: 80px;
        right: 24px;
      }
      .chatbot-panel {
        bottom: 144px;
        right: 24px;
        width: 340px;
      }
    }
  `]
})
export class ChatBotComponent implements OnInit {
  @Input() standalone = false;
  @Output() closed = new EventEmitter<void>();
  
  private chatBotService = inject(ChatBotService);
  
  isOpen = signal(false);
  isLoading = signal(true);
  hasError = signal(false);
  options = signal<ChatBotTreeNode[]>([]);
  
  // Navigation state
  currentOption = signal<ChatBotTreeNode | null>(null);
  currentAnswer = signal<string | null>(null);
  
  get rootOptions(): () => ChatBotTreeNode[] {
    return () => this.options();
  }
  
  get currentSubOptions(): () => ChatBotTreeNode[] {
    return () => {
      const current = this.currentOption();
      if (current && current.children) {
        return current.children;
      }
      return [];
    };
  }
  
  get hasSubOptions(): () => boolean {
    return () => {
      const current = this.currentOption();
      return !!(current && current.children && current.children.length > 0);
    };
  }

  ngOnInit(): void {
    this.loadOptions();
  }

  loadOptions(): void {
    this.isLoading.set(true);
    this.hasError.set(false);
    
    this.chatBotService.getAllOptions().subscribe({
      next: (response) => {
        this.options.set(response.options);
        this.isLoading.set(false);
      },
      error: () => {
        this.hasError.set(true);
        this.isLoading.set(false);
      }
    });
  }

  toggleChat(): void {
    this.isOpen.update(v => !v);
    if (!this.isOpen()) {
      this.closed.emit();
    }
  }

  close(): void {
    this.isOpen.set(false);
    this.closed.emit();
  }

  selectOption(option: ChatBotTreeNode): void {
    this.currentOption.set(option);
    this.currentAnswer.set(option.answer);
  }

  goBack(): void {
    const current = this.currentOption();
    if (current && current.parent_id) {
      // Find parent in options
      const parent = this.findOptionById(current.parent_id);
      if (parent) {
        this.currentOption.set(parent);
        this.currentAnswer.set(parent.answer);
      } else {
        this.resetView();
      }
    } else {
      this.resetView();
    }
  }

  private resetView(): void {
    this.currentOption.set(null);
    this.currentAnswer.set(null);
  }

  isMobile(): boolean {
    return window.innerWidth <= 768;
  }

  private findOptionById(id: string): ChatBotTreeNode | null {
    const findInOptions = (opts: ChatBotTreeNode[]): ChatBotTreeNode | null => {
      for (const opt of opts) {
        if (opt.id === id) return opt;
        if (opt.children && opt.children.length > 0) {
          const found = findInOptions(opt.children);
          if (found) return found;
        }
      }
      return null;
    };
    return findInOptions(this.options());
  }
}