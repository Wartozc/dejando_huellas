import { Component, OnInit, OnDestroy, inject, signal, ViewChild, ElementRef, AfterViewChecked, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessagesService } from '../../core/services/messages.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { PushNotificationService } from '../../core/services/push-notification.service';
import { Message } from '../../core/models';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="chat-container">
      <!-- Chat Header (minimal - admin button only) -->
      <div class="chat-header">
        <span class="chat-title">Dejando Huellas</span>
        @if (isAdmin()) {
          <button 
            class="clear-chat-btn" 
            (click)="confirmClearChat()"
            title="Eliminar todos los mensajes"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              <line x1="10" y1="11" x2="10" y2="17"/>
              <line x1="14" y1="11" x2="14" y2="17"/>
            </svg>
            <span>Limpiar Chat</span>
          </button>
        }
      </div>
      
      <!-- Messages List -->
      <div class="messages-list" #messagesContainer>
        @if (isLoading()) {
          <div class="loading-indicator">
            <div class="spinner"></div>
            <span>Cargando mensajes...</span>
          </div>
        }
        
        @if (messages().length === 0 && !isLoading()) {
          <div class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <p>No hay mensajes aún.</p>
            <span>Sé el primero en escribir!</span>
          </div>
        }
        
        @for (message of messages(); track message.id) {
          <div class="message-bubble" [class.own-message]="isOwnMessage(message)">
            <!-- Message Content -->
            @if (editingMessageId() === message.id) {
              <!-- Edit Mode -->
              <div class="edit-mode">
                <textarea
                  [(ngModel)]="editContent"
                  class="edit-textarea"
                  rows="2"
                ></textarea>
                <div class="edit-actions">
                  <button class="btn-cancel" (click)="cancelEdit()">Cancelar</button>
                  <button class="btn-save" (click)="saveEdit(message.id)">Guardar</button>
                </div>
              </div>
            } @else {
              <!-- Normal Display -->
              <div class="message-content" [class.emoji-only]="isEmojiOnlyMessage(message.content)">
                {{ message.content }}
              </div>
              
              <!-- Reactions Display -->
              @if (message.reactions && message.reactions.length > 0) {
                <div class="reactions-display">
                  @for (reaction of getGroupedReactions(message.reactions); track reaction.emoji) {
                    <button 
                      class="reaction-badge" 
                      [class.own-reaction]="hasUserReaction(message.reactions, reaction.emoji)"
                      (click)="toggleReaction(message.id, reaction.emoji)"
                      [title]="getReactionTooltip(message.reactions, reaction.emoji)"
                    >
                      {{ reaction.emoji }} {{ reaction.count }}
                    </button>
                  }
                </div>
              }
              
              <!-- Message Actions -->
              <div class="message-actions">
                <!-- Reaction Button -->
                <button 
                  class="action-btn reaction-btn" 
                  (click)="showEmojiPicker(message.id)"
                  [class.active]="showEmojiPickerFor() === message.id"
                  title="Reaccionar"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                    <line x1="9" y1="9" x2="9.01" y2="9"/>
                    <line x1="15" y1="9" x2="15.01" y2="9"/>
                  </svg>
                </button>
                
                <!-- Edit Button (only for own messages) -->
                @if (isOwnMessage(message)) {
                  <button class="action-btn edit-btn" (click)="startEdit(message)" title="Editar">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                  
                  <!-- Delete Button (only for own messages) -->
                  <button class="action-btn delete-btn" (click)="confirmDelete(message)" title="Eliminar">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                  </button>
                }
              </div>
              
              <!-- Emoji Picker Overlay for Reactions (Centered with full emoji grid) -->
              @if (showEmojiPickerFor() === message.id) {
                <div class="emoji-picker-overlay" (click)="closeEmojiPicker()">
                  <div class="input-emoji-picker centered" (click)="$event.stopPropagation()">
                    <!-- Emoji Categories -->
                    <div class="emoji-categories">
                      @for (category of emojiCategories; track category.name) {
                        <button 
                          class="category-btn" 
                          [class.active]="selectedReactionCategory() === category.name"
                          (click)="selectReactionCategory(category.name)"
                          [title]="category.name"
                        >
                          {{ category.icon }}
                        </button>
                      }
                    </div>
                    
                    <!-- Emoji Grid -->
                    <div class="emoji-grid">
                      @for (emoji of getCurrentReactionCategoryEmojis(); track emoji) {
                        <button class="emoji-option" (click)="addReaction(message.id, emoji)">
                          {{ emoji }}
                        </button>
                      }
                    </div>
                  </div>
                </div>
              }
            }
            
            <!-- Message Meta -->
            <div class="message-meta">
              <span class="author">{{ isOwnMessage(message) ? 'Tú' : message.user_name }}</span>
              <span class="timestamp">{{ formatTime(message.created_at) }}</span>
              @if (message.is_edited) {
                <span class="edited-indicator">(editado)</span>
              }
            </div>
          </div>
        }
      </div>
      
      <!-- Input Area -->
      <div class="input-area">
        <button 
          class="emoji-button" 
          (click)="toggleInputEmojiPicker()"
          [class.active]="showInputEmojiPicker()"
        >
          😊
        </button>
        
        @if (showInputEmojiPicker()) {
          <div class="emoji-picker-overlay" (click)="closeInputEmojiPicker()">
            <div class="input-emoji-picker centered" (click)="$event.stopPropagation()">
              <!-- Emoji Categories -->
              <div class="emoji-categories">
                @for (category of emojiCategories; track category.name) {
                  <button 
                    class="category-btn" 
                    [class.active]="selectedEmojiCategory() === category.name"
                    (click)="selectEmojiCategory(category.name)"
                    [title]="category.name"
                  >
                    {{ category.icon }}
                  </button>
                }
              </div>
              
              <!-- Emoji Grid -->
              <div class="emoji-grid">
                @for (emoji of getCurrentCategoryEmojis(); track emoji) {
                  <button class="emoji-option" (click)="addEmojiToInput(emoji)">
                    {{ emoji }}
                  </button>
                }
              </div>
            </div>
          </div>
        }
        
        <input 
          type="text" 
          [(ngModel)]="newMessage" 
          (keyup.enter)="sendMessage()"
          placeholder="Escribe un mensaje..."
          [disabled]="isSending()"
          class="message-input"
        />
        <button 
          (click)="sendMessage()" 
          [disabled]="!canSend() || isSending()"
          class="send-button"
        >
          @if (isSending()) {
            <div class="button-spinner"></div>
          } @else {
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          }
        </button>
      </div>

      <!-- Delete Confirmation Modal -->
      @if (showDeleteConfirm()) {
        <div class="modal-overlay" (click)="cancelDelete()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <h3>Eliminar mensaje</h3>
            <p>¿Estás seguro de que quieres eliminar este mensaje?</p>
            <div class="modal-actions">
              <button class="btn-cancel" (click)="cancelDelete()">Cancelar</button>
              <button class="btn-delete" (click)="deleteMessage()">Eliminar</button>
            </div>
          </div>
        </div>
      }

      <!-- Clear Chat Confirmation Modal (Admin only) -->
      @if (showClearChatConfirm()) {
        <div class="modal-overlay" (click)="cancelClearChat()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <div class="modal-icon warning">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <h3>Limpiar Chat</h3>
            <p>¿Estás seguro de que quieres eliminar TODOS los mensajes del chat? Esta acción no se puede deshacer.</p>
            <div class="modal-actions">
              <button class="btn-cancel" (click)="cancelClearChat()">Cancelar</button>
              <button class="btn-delete-all" (click)="clearAllMessages()">
                @if (isClearingChat()) {
                  <div class="button-spinner"></div>
                } @else {
                  Eliminar todo
                }
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .chat-container {
      display: flex;
      flex-direction: column;
      /* Account for: navbar (64px) + footer (~140px) = 204px total */
      height: calc(100vh - 64px - 140px);
      max-width: 800px;
      margin: 0 auto;
      padding: 0;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
      overflow: visible;
      position: relative;
    }
    
    /* Header (minimal) */
    .chat-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 1rem;
      background: #1B5E20;
      color: white;
      min-height: 36px;
    }
    
    .chat-title {
      font-size: 1rem;
      font-weight: 600;
      letter-spacing: 0.5px;
    }
    
    .clear-chat-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.25rem 0.5rem;
      background: rgba(244, 67, 54, 0.9);
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 0.6875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      white-space: nowrap;

      svg {
        width: 12px;
        height: 12px;
      }

      &:hover {
        background: #d32f2f;
        transform: scale(1.02);
      }
    }
    
    /* Messages List */
    .messages-list {
      flex: 1;
      overflow-y: auto;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      background: #f5f5f5;
      min-height: 0; /* Important for flex child to shrink properly */
    }
    
    /* Message Bubble */
    .message-bubble {
      max-width: 75%;
      padding: 0.625rem 0.875rem;
      border-radius: 16px;
      background: white;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
      align-self: flex-start;
      animation: slideIn 0.2s ease;
      position: relative;
      overflow: visible;
      
      &.own-message {
        align-self: flex-end;
        background: #1B5E20;
        color: white;
        
        .message-meta {
          justify-content: flex-end;
          
          .author, .timestamp, .edited-indicator {
            color: rgba(255, 255, 255, 0.8);
          }
        }
        
        .action-btn {
          color: rgba(255, 255, 255, 0.7);
          
          &:hover {
            color: white;
            background: rgba(255, 255, 255, 0.2);
          }
        }
        
        .reaction-badge {
          background: rgba(255, 255, 255, 0.2);
          
          &.own-reaction {
            background: #4CAF50;
          }
        }
      }
    }
    
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .message-content {
      font-size: 0.9375rem;
      line-height: 1.4;
      word-wrap: break-word;
      white-space: pre-wrap;
      
      &.emoji-only {
        font-size: 2.5rem;
        text-align: center;
        padding: 0.5rem;
        line-height: 1.2;
      }
    }
    
    /* Reactions Display */
    .reactions-display {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
      margin-top: 0.5rem;
      margin-bottom: 0.25rem;
    }
    
    .reaction-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.125rem 0.5rem;
      border-radius: 12px;
      background: #f0f0f0;
      border: none;
      font-size: 0.75rem;
      cursor: pointer;
      transition: all 0.2s ease;
      
      &:hover {
        background: #e0e0e0;
      }
      
      &.own-reaction {
        background: #C8E6C9;
        border: 1px solid #1B5E20;
      }
    }
    
    /* Message Actions */
    .message-actions {
      display: flex;
      gap: 0.25rem;
      opacity: 0;
      transition: opacity 0.2s ease;
      margin-top: 0.25rem;
    }
    
    /* Always show actions on mobile and for reaction button */
    @media (max-width: 600px) {
      .message-actions {
        opacity: 1;
      }
    }
    
    /* Also show actions when emoji picker is active */
    .message-bubble:has(.emoji-picker) .message-actions {
      opacity: 1;
    }
    
    /* Make sure reaction button is always accessible */
    .message-bubble .reaction-btn {
      opacity: 1;
      visibility: visible;
    }
    
    .message-bubble:hover .message-actions {
      opacity: 1;
    }
    
    .action-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border: none;
      border-radius: 50%;
      background: transparent;
      color: #757575;
      cursor: pointer;
      transition: all 0.2s ease;
      
      svg {
        width: 14px;
        height: 14px;
      }
      
      &:hover {
        background: #f0f0f0;
        color: #333;
      }
      
      &.reaction-btn.active {
        color: #1B5E20;
      }
    }
    
    /* Edit Mode */
    .edit-mode {
      margin-bottom: 0.5rem;
    }
    
    .edit-textarea {
      width: 100%;
      padding: 0.5rem;
      border: 2px solid #1B5E20;
      border-radius: 8px;
      font-size: 0.9375rem;
      font-family: inherit;
      resize: none;
      outline: none;
    }
    
    .edit-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }
    
    .btn-cancel, .btn-save, .btn-delete {
      padding: 0.375rem 0.75rem;
      border-radius: 6px;
      font-size: 0.8125rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      border: none;
    }
    
    .btn-cancel {
      background: #f5f5f5;
      color: #666;
      
      &:hover {
        background: #e0e0e0;
      }
    }
    
    .btn-save {
      background: #1B5E20;
      color: white;
      
      &:hover {
        background: #2E7D32;
      }
    }
    
    .btn-delete {
      background: #f44336;
      color: white;
      
      &:hover {
        background: #d32f2f;
      }
    }

    .btn-delete-all {
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 100px;
      padding: 0.375rem 0.75rem;
      background: #d32f2f;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 0.8125rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      
      &:hover:not(:disabled) {
        background: #b71c1c;
      }

      &:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }

      .button-spinner {
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
    }

    .modal-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      margin: 0 auto 1rem;

      &.warning {
        background: #ffebee;
        color: #d32f2f;
      }

      svg {
        width: 24px;
        height: 24px;
      }
    }
    
    /* Emoji Picker Overlay - Full screen backdrop with dark modal effect */
    .emoji-picker-overlay {
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
    }
    
    /* Centered Emoji Pickers */
    .emoji-picker.centered, .input-emoji-picker.centered {
      padding: 0.75rem;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05);
      animation: pickerFadeIn 0.15s ease-out;
    }
    
    .emoji-picker.centered {
      width: 320px;
    }
    
    .input-emoji-picker.centered {
      width: 340px;
      max-height: 320px;
    }
    
    @keyframes pickerFadeIn {
      from {
        opacity: 0;
        transform: scale(0.95);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }
    
    /* Legacy styles kept for compatibility */
    .emoji-picker, .input-emoji-picker {
      padding: 0.5rem;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      margin-top: 0.5rem;
    }

    /* Emoji Categories */
    .emoji-categories {
      display: flex;
      gap: 0.25rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid #e0e0e0;
      margin-bottom: 0.5rem;
      overflow-x: auto;
    }

    .category-btn {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      border-radius: 6px;
      background: transparent;
      font-size: 1.25rem;
      cursor: pointer;
      transition: all 0.2s ease;
      flex-shrink: 0;

      &:hover {
        background: #f0f0f0;
      }

      &.active {
        background: #E8F5E9;
      }
    }
    
    .emoji-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
      max-height: 150px;
      overflow-y: auto;
    }
    
    .emoji-option {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      border-radius: 6px;
      background: transparent;
      font-size: 1.25rem;
      cursor: pointer;
      transition: all 0.2s ease;
      
      &:hover {
        background: #f0f0f0;
        transform: scale(1.1);
      }
    }
    
    .message-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.5rem;
      margin-top: 0.25rem;
      font-size: 0.6875rem;
      color: #757575;
      
      .author {
        font-weight: 500;
      }
      
      .timestamp {
        opacity: 0.7;
      }
      
      .edited-indicator {
        font-style: italic;
        opacity: 0.7;
      }
    }
    
    /* Empty State */
    .empty-state {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #9e9e9e;
      text-align: center;
      
      svg {
        width: 64px;
        height: 64px;
        margin-bottom: 1rem;
        opacity: 0.5;
      }
      
      p {
        margin: 0;
        font-size: 1rem;
        color: #757575;
      }
      
      span {
        font-size: 0.8125rem;
      }
    }
    
    /* Loading */
    .loading-indicator {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      color: #9e9e9e;
      
      .spinner {
        width: 32px;
        height: 32px;
        border: 3px solid #e0e0e0;
        border-top-color: #1B5E20;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    /* Input Area */
    .input-area {
      display: flex;
      gap: 0.5rem;
      padding: 1rem;
      background: white;
      border-top: 1px solid #e0e0e0;
      position: relative;
      overflow: visible;
    }
    
    .emoji-button {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid #e0e0e0;
      border-radius: 50%;
      background: white;
      font-size: 1.25rem;
      cursor: pointer;
      transition: all 0.2s ease;
      
      &:hover {
        border-color: #1B5E20;
      }
      
      &.active {
        border-color: #1B5E20;
        background: #E8F5E9;
      }
    }
    
    .message-input {
      flex: 1;
      padding: 0.75rem 1rem;
      border: 2px solid #e0e0e0;
      border-radius: 24px;
      font-size: 0.9375rem;
      outline: none;
      transition: border-color 0.2s ease;
      
      &:focus {
        border-color: #1B5E20;
      }
      
      &:disabled {
        background: #f5f5f5;
        cursor: not-allowed;
      }
    }
    
    .send-button {
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #1B5E20;
      color: white;
      border: none;
      border-radius: 50%;
      cursor: pointer;
      transition: all 0.2s ease;
      
      &:hover:not(:disabled) {
        background: #2E7D32;
        transform: scale(1.05);
      }
      
      &:disabled {
        background: #ccc;
        cursor: not-allowed;
      }
      
      svg {
        width: 20px;
        height: 20px;
      }
      
      .button-spinner {
        width: 20px;
        height: 20px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
    }
    
    /* Modal */
    .modal-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100;
    }
    
    .modal-content {
      background: white;
      padding: 1.5rem;
      border-radius: 12px;
      max-width: 400px;
      width: 90%;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
      
      h3 {
        margin: 0 0 0.5rem 0;
        font-size: 1.125rem;
        color: #333;
      }
      
      p {
        margin: 0 0 1rem 0;
        color: #666;
      }
    }
    
    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
    }
    
    @media (max-width: 600px) {
      .chat-container {
        /* Account for: navbar (64px) + footer (~100px mobile) = 164px total */
        height: calc(100vh - 64px - 100px);
        border-radius: 0;
      }
      
      .message-bubble {
        max-width: 85%;
      }
      
      .message-actions {
        opacity: 1;
      }
    }
  `]
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  
  private messagesService = inject(MessagesService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private pushNotificationService = inject(PushNotificationService);
  
  // Close emoji pickers when Escape key is pressed
  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.showEmojiPickerFor()) {
      this.closeEmojiPicker();
    }
    if (this.showInputEmojiPicker()) {
      this.closeInputEmojiPicker();
    }
  }
  
  messages = this.messagesService.messages;
  isLoading = this.messagesService.isLoading;
  
  // Current authenticated user
  currentUser = this.authService.user;
  isAdmin = this.authService.isAdmin;
  
  newMessage = signal('');
  isSending = signal(false);
  private shouldScrollToBottom = signal(false);
  
  // Edit state
  editingMessageId = signal<string | null>(null);
  editContent = signal('');
  
  // Emoji picker state
  showEmojiPickerFor = signal<string | null>(null);
  reactionPickerPosition = signal<'above' | 'below'>('below'); // Position relative to message
  showInputEmojiPicker = signal(false);
  selectedEmojiCategory = signal<string>('caritas');
  inputEmojiPickerPosition = signal<'top' | 'bottom'>('top'); // Smart positioning
  
  // Reaction emoji picker state (uses full emoji grid like input picker)
  selectedReactionCategory = signal<string>('caritas');
  
  // Delete confirmation
  showDeleteConfirm = signal(false);
  messageToDelete = signal<Message | null>(null);
  
  // Clear chat confirmation (Admin only)
  showClearChatConfirm = signal(false);
  isClearingChat = signal(false);
  
  // Emoji categories with expanded emojis
  emojiCategories = [
    { name: 'caritas', icon: '😀', emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '☺️', '😚', '😙', '🥲', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '🥸', '😎', '🤓', '🧐', '😕', '😟', '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈', '👿', '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽', '👾', '🤖'] },
    { name: 'gestos', icon: '👍', emojis: ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🫀', '🫁', '🦷', '🦴', '👀', '👁️', '👅', '👄', '👶', '🧒', '👦', '👧', '🧑', '👱', '👨', '🧔', '👩', '🧓', '👴', '👵'] },
    { name: 'corazones', icon: '❤️', emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️', '📴', '📳', '🈶', '🈚', '🈸', '🈺', '🈷️', '✴️', '🆚', '💮', '🉐', '㊙️', '㊗️', '🈴', '🈵', '🈹', '🈲', '🅰️', '🅱️', '🆎', '🆑', '🅾️', '🆘', '❌', '⭕', '🛑', '⛔', '📛', '🚫', '💯', '💢', '♨️', '🚷', '🚯', '🚳', '🚱', '🔞', '📵', '🚭', '❗', '❕', '❓', '❔', '‼️', '⁉️', '🔅', '🔆', '〽️', '⚠️', '🚸', '🔱', '⚜️', '🔰', '♻️', '✅', '🈯', '💹', '❇️', '✳️', '❎', '🌐', '💠', 'Ⓜ️', '🌀', '💤', '🏧', '🚾', '♿', '🅿️', '🛗', '🈳', '🈂️', '🛂', '🛃', '🛄', '🛅', '🚹', '🚺', '🚼', '⚧️', '🚻', '🚮', '🎦', '📶', '🈁', '🔣', 'ℹ️', '🔤', '🔡', '🔠', '🆖', '🆗', '🆙', '🆒', '🆕', '🆓', '0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟', '🔢', '#️⃣', '*️⃣', '⏏️', '▶️', '⏸️', '⏯️', '⏹️', '⏺️', '⏭️', '⏮️', '⏩', '⏪', '⏫', '⏬', '◀️', '🔼', '🔽', '➡️', '⬅️', '⬆️', '⬇️', '↗️', '↘️', '↙️', '↖️', '↕️', '↔️', '↪️', '↩️', '⤴️', '⤵️', '🔀', '🔁', '🔂', '🔄', '🔃', '🎵', '🎶', '➕', '➖', '➗', '✖️', '♾️', '💲', '💱', '™️', '©️', '®️', '〰️', '➰', '➿', '🔚', '🔙', '🔛', '🔝', '🔜', '✔️', '☑️', '🔘', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫', '⚪', '🟤', '🔺', '🔻', '🔸', '🔹', '🔶', '🔷', '🔳', '🔲', '▪️', '▫️', '◾', '◽', '◼️', '◻️', '🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '⬛', '⬜', '🟫', '🔈', '🔇', '🔉', '🔊', '🔔', '🔕', '📣', '📢', '💬', '💭', '🗯️', '♠️', '♣️', '♥️', '♦️', '🃏', '🎴', '🀄', '🕐', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖', '🕗', '🕘', '🕙', '🕚', '🕛', '🕜', '🕝', '🕞', '🕟', '🕠', '🕡', '🕢', '🕣', '🕤', '🕥', '🕦', '🕧'] },
    { name: 'animales', icon: '🐶', emojis: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐻‍❄️', '🐨', '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🪱', '🐛', '🦋', '🐌', '🐞', '🐜', '🪰', '🪲', '🪳', '🦟', '🦗', '🕷️', '🕸️', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🦣', '🐘', '🦛', '🦏', '🐪', '🐫', '🦒', '🦘', '🦬', '🦕', '🦎', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑', '🦙', '🐐', '🦌', '🐕', '🐩', '🦮', '🐈', '🐈‍⬛', '🪶', '🐓', '🦃', '🦤', '🦚', '🦜', '🦢', '🦩', '🕊️', '🐇', '🦝', '🦨', '🦡', '🦫', '🦦', '🦥', '🐁', '🐀', '🐿️', '🦔', '🪤', '🐾', '🐉', '🐲'] },
    { name: 'comida', icon: '🍎', emojis: ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠', '🥐', '🥖', '🍞', '🥨', '🥯', '🧇', '🥞', '🧈', '🍳', '🥚', '🧀', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕', '🫓', '🥪', '🥙', '🧆', '🌮', '🌯', '🫔', '🥗', '🥘', '🫕', '🥫', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🦪', '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🥮', '🍢', '🍡', '🍧', '🍨', '🍦', '🥧', '🧁', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫', '🍿', '🍩', '🍪', '🌰', '🥜', '🍯', '🥛', '🍼', '🫖', '☕', '🍵', '🧃', '🥤', '🧋', '🍶', '🍺', '🍻', '🥂', '🍷', '🥃', '🍸', '🍹', '🧉', '🍾', '🧊', '🥄', '🍴', '🍽️', '🥣', '🥡', '🥢', '🧂'] },
    { name: 'actividades', icon: '⚽', emojis: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛼', '🛷', '⛸️', '🥌', '🎿', '⛷️', '🏂', '🪂', '🏋️', '🤼', '🤸', '🤺', '⛹️', '🤾', '🏌️', '🏇', '⛳', '🧘', '🏄', '🏊', '🤽', '🚣', '🧗', '🚵', '🚴', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '🏵️', '🎗️', '🎫', '🎟️', '🎪', '🤹', '🎭', '🩰', '🎨', '🎬', '🎤', '🎧', '🎼', '🎹', '🥁', '🪘', '🎷', '🎺', '🪗', '🎸', '🪕', '🎻', '🎲', '♟️', '🎯', '🎳', '🎮', '🕹️', '🎰', '🧩', '🪅', '🪆', '🪄', '🎁', '🎀', '🎊', '🎉', '🎈', '🎌', '🏮', '🪔', '🎐', '🎑', '🧧', '🎎', '🎍', '🎎', '🎑', '🎏', '🎐', '🎃', '🎄', '🎅', '🎇', '🎆', '🧨', '🎋', '🎍', '🌸', '🌺', '🌻', '🌹', '🌷', '🌱', '🌲', '🌳', '🌴', '🌵', '🌾', '🌿', '☘️', '🍀', '🍁', '🍂', '🍃'] },
    { name: 'viajes', icon: '🚗', emojis: ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🦯', '🦽', '🦼', '🛴', '🚲', '🛵', '🏍️', '🛺', '🚨', '🚔', '🚍', '🚘', '🚖', '🛞', '🚡', '🚠', '🚟', '🚃', '🚋', '🚞', '🚝', '🚄', '🚅', '🚈', '🚂', '🚆', '🚇', '🚊', '🚉', '✈️', '🛫', '🛬', '🛩️', '💺', '🛰️', '🚀', '🛸', '🚁', '🛶', '⛵', '🚤', '🛥️', '🛕', '⛵', '🚤', '⚓', '🪝', '⛴️', '🚢', '⚓', '🚧', '🚦', '🚥', '🚏', '🗺️', '🗿', '🗽', '🗼', '🏰', '🏯', '🏟️', '🎡', '🎢', '🎠', '⛲', '⛱️', '🏖️', '🏝️', '🏜️', '🌋', '⛰️', '🏔️', '🗻', '🏕️', '⛺', '🛖', '🏠', '🏡', '🏘️', '🏚️', '🏗️', '🏭', '🏢', '🏬', '🏣', '🏤', '🏥', '🏦', '🏨', '🏪', '🏫', '🏩', '💒', '🏛️', '⛪', '🕌', '🕍', '🛕', '🕋', '⛩️'] },
    { name: 'objetos', icon: '💡', emojis: ['💡', '🔦', '🏮', '🪔', '📱', '📲', '💻', '🖥️', '🖨️', '⌨️', '🖱️', '🖲️', '💽', '💾', '💿', '📀', '🧮', '🎥', '🎞️', '📽️', '🎬', '📺', '📷', '📸', '📹', '📼', '🔍', '🔎', '🕯️', '💵', '💴', '💶', '💷', '🪙', '💰', '💳', '💎', '⚖️', '🪜', '🧰', '🪛', '🔧', '🔨', '⚒️', '🛠️', '⛏️', '🪚', '🔩', '⚙️', '🪤', '🧱', '⛓️', '🧲', '🔫', '💣', '🧨', '🪓', '🔪', '🗡️', '⚔️', '🛡️', '🚬', '⚰️', '🪦', '⚱️', '🏺', '🔮', '📿', '🧿', '💈', '⚗️', '🔭', '🔬', '🕳️', '🩹', '🩺', '💊', '💉', '🩸', '🧬', '🦠', '🧫', '🧪', '🌡️', '🧹', '🪠', '🧺', '🧻', '🚽', '🚰', '🚿', '🛁', '🛀', '🧼', '🪥', '🪒', '🧽', '🪣', '🧴', '🛎️', '🔑', '🗝️', '🚪', '🪑', '🛋️', '🛏️', '🛌', '🧸', '🪆', '🖼️', '🪞', '🪟', '🛍️', '🛒', '🎁', '🎈', '🎏', '🎀', '🪄', '🎊', '🎉', '🎎', '🏮', '🎐', '🧧', '✉️', '📩', '📨', '📧', '💌', '📥', '📤', '📦', '🏷️', '📪', '📫', '📬', '📭', '📮', '📯', '📜', '📃', '📄', '📑', '🧾', '📊', '📈', '📉', '🗒️', '🗓️', '📆', '📅', '🗑️', '📇', '🗃️', '🗳️', '🗄️', '📋', '📁', '📂', '🗂️', '🗞️', '📰', '📓', '📔', '📒', '📕', '📗', '📘', '📙', '📚', '📖', '🔖', '🧷', '🔗', '📎', '🖇️', '📐', '📏', '🧮', '📌', '📍', '✂️', '🖊️', '🖋️', '✒️', '🖌️', '🖍️', '📝', '✏️', '🔍', '🔎', '🔏', '🔐', '🔒', '🔓'] }
  ];
  
  // Quick access emojis for reactions (smaller set)
  availableEmojis = ['👍', '👎', '❤️', '😂', '😮', '😢', '🎉', '🔥', '😊', '😍', '🤔', '👏', '🙏', '💯', '✨', '💪', '🥰', '😎', '🤩', '😡', '😱', '🥳', '🫠', '💅', '🤌', '🫰', '👀', '🙈', '❤️‍🔥', '💀', '🤡'];
  
  private pollingInterval: ReturnType<typeof setInterval> | null = null;
  private documentVisibilityChangeHandler: (() => void) | null = null;
  private isPageVisible = signal(true);
  private previousMessageCount = signal(0);

  ngOnInit(): void {
    // Request notification permission on first visit
    this.requestNotificationPermission();
    
    // Initialize push notifications (PWA)
    this.pushNotificationService.initialize();
    
    // Load initial messages
    this.messagesService.getMessages().subscribe({
      error: () => {
        this.toastService.error('Error al cargar los mensajes');
      }
    });
    
    // Start polling every 2 seconds (improved from 5s)
    this.startPolling();
    
    // Listen for page visibility changes
    this.documentVisibilityChangeHandler = () => {
      this.isPageVisible.set(document.visibilityState === 'visible');
    };
    document.addEventListener('visibilitychange', this.documentVisibilityChangeHandler);
  }
  
  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom()) {
      this.scrollToBottom();
      this.shouldScrollToBottom.set(false);
    }
  }
  
ngOnDestroy(): void {
     this.stopPolling();
     
     // Clean up visibility change listener
     if (this.documentVisibilityChangeHandler) {
       document.removeEventListener('visibilitychange', this.documentVisibilityChangeHandler);
       this.documentVisibilityChangeHandler = null;
     }
   }
  
/**
    * Start polling for new messages
    */
   startPolling(): void {
     // Initialize with current message count
     this.previousMessageCount.set(this.messages().length);
     
     this.pollingInterval = setInterval(() => {
       const lastTime = this.messagesService.lastUpdateTime();
       if (lastTime) {
         this.messagesService.getMessagesSince(lastTime).subscribe({
           next: (response) => {
             // Check and show notification for new messages
             if (response.messages && response.messages.length > 0) {
               this.checkAndNotifyNewMessages(this.messages(), this.previousMessageCount());
               // Update previous count
               this.previousMessageCount.set(this.messages().length);
             }
           }
         });
       }
     }, 2000); // Poll every 2 seconds (improved from 5 seconds)
   }
  
/**
    * Stop polling
    */
   stopPolling(): void {
     if (this.pollingInterval) {
       clearInterval(this.pollingInterval);
       this.pollingInterval = null;
     }
   }

   // ========== Browser Notification Functions ==========

   /**
    * Request permission for browser notifications
    */
   private requestNotificationPermission(): void {
     if (!('Notification' in window)) {
       console.log('This browser does not support desktop notifications');
       return;
     }

     // Request permission if not already granted or denied
     if (Notification.permission === 'default') {
       Notification.requestPermission().then(permission => {
         if (permission === 'granted') {
           console.log('Notification permission granted');
         } else if (permission === 'denied') {
           console.log('Notification permission denied');
         }
       }).catch(error => {
         console.error('Error requesting notification permission:', error);
       });
     }
   }

   /**
    * Show a browser notification for a new message
    */
   private showNotification(senderName: string, messageContent: string): void {
     // Only show notification if page is not visible
     if (!this.isPageVisible()) {
       if (Notification.permission === 'granted') {
         // Truncate message for preview (max 50 chars)
         const preview = messageContent.length > 50 
           ? messageContent.substring(0, 50) + '...' 
           : messageContent;
         
         const notification = new Notification(`Nuevo mensaje de ${senderName}`, {
           body: preview,
           icon: '/icons/icon-192x192.png',
           badge: '/icons/icon-72x72.png',
           tag: 'new-message',
           requireInteraction: false
         });

         // Close notification after 5 seconds
         setTimeout(() => {
           notification.close();
         }, 5000);

         // Handle notification click
         notification.onclick = () => {
           window.focus();
           notification.close();
         };
       }
     }
   }

   /**
    * Check and show notification for new messages
    */
   private checkAndNotifyNewMessages(currentMessages: Message[], previousLength: number): void {
     // Only notify for truly new messages (not on initial load)
     if (previousLength > 0 && currentMessages.length > previousLength) {
       const newMessages = currentMessages.slice(previousLength);
       const currentUserId = this.authService.user()?.id;
       
       for (const message of newMessages) {
         // Don't notify for own messages
         if (message.user_id !== currentUserId) {
           this.showNotification(message.user_name || 'Unknown', message.content || '');
           break; // Only notify for the most recent message
         }
       }
     }
   }
  
  /**
   * Check if the message is from the current user
   */
  isOwnMessage(message: Message): boolean {
    const currentUser = this.authService.user();
    return currentUser?.id === message.user_id;
  }
  
  /**
   * Format timestamp for display
   */
  formatTime(timestamp: string): string {
    if (!timestamp) return '';
    
    try {
      const date = new Date(timestamp);
      const now = new Date();
      
      // Same day - show time only
      if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
      }
      
      // Yesterday
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      if (date.toDateString() === yesterday.toDateString()) {
        return 'Ayer ' + date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
      }
      
      // Other days
      return date.toLocaleDateString('es-CO', { 
        day: '2-digit', 
        month: '2-digit',
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return '';
    }
  }
  
  /**
   * Check if message can be sent
   */
  canSend(): boolean {
    const content = this.newMessage().trim();
    return content.length > 0 && content.length <= 1000;
  }
  
  /**
   * Send a new message
   */
  sendMessage(): void {
    if (!this.canSend() || this.isSending()) return;
    
    const content = this.newMessage().trim();
    this.isSending.set(true);
    
    this.messagesService.createMessage(content).subscribe({
      next: () => {
        this.newMessage.set('');
        this.showInputEmojiPicker.set(false);
        this.shouldScrollToBottom.set(true);
      },
      error: (error) => {
        console.error('Error sending message:', error);
        this.toastService.error('Error al enviar el mensaje');
      },
      complete: () => {
        this.isSending.set(false);
      }
    });
  }
  
  // ========== Edit Functions ==========
  
  /**
   * Start editing a message
   */
  startEdit(message: Message): void {
    this.editingMessageId.set(message.id);
    this.editContent.set(message.content);
  }
  
  /**
   * Cancel editing
   */
  cancelEdit(): void {
    this.editingMessageId.set(null);
    this.editContent.set('');
  }
  
  /**
   * Save the edited message
   */
  saveEdit(messageId: string): void {
    const content = this.editContent().trim();
    if (!content || content.length > 1000) {
      this.toastService.error('El mensaje debe tener entre 1 y 1000 caracteres');
      return;
    }
    
    this.messagesService.updateMessage(messageId, content).subscribe({
      next: () => {
        this.editingMessageId.set(null);
        this.editContent.set('');
        this.toastService.success('Mensaje actualizado');
      },
      error: (error) => {
        console.error('Error updating message:', error);
        this.toastService.error('Error al actualizar el mensaje');
      }
    });
  }
  
  // ========== Delete Functions ==========
  
  /**
   * Show delete confirmation
   */
  confirmDelete(message: Message): void {
    this.messageToDelete.set(message);
    this.showDeleteConfirm.set(true);
  }
  
  /**
   * Cancel delete
   */
  cancelDelete(): void {
    this.messageToDelete.set(null);
    this.showDeleteConfirm.set(false);
  }
  
  /**
   * Delete the message
   */
  deleteMessage(): void {
    const message = this.messageToDelete();
    if (!message) return;
    
    this.messagesService.deleteMessage(message.id).subscribe({
      next: () => {
        this.toastService.success('Mensaje eliminado');
        this.cancelDelete();
      },
      error: (error) => {
        console.error('Error deleting message:', error);
        this.toastService.error('Error al eliminar el mensaje');
      }
    });
  }
  
  // ========== Reaction Functions ==========
  
/**
    * Toggle emoji picker for a message
    * Smart positioning: if message is near top of viewport, show below; if near bottom, show above
    */
  showEmojiPicker(messageId: string): void {
    const current = this.showEmojiPickerFor();
    if (current === messageId) {
      this.showEmojiPickerFor.set(null);
    } else {
      // Calculate smart position based on message position in viewport
      this.calculateReactionPickerPosition(messageId);
      this.showEmojiPickerFor.set(messageId);
    }
  }
  
  /**
     * Calculate and set the reaction picker position based on message location in viewport
     * Standard chat behavior: if message is near top, show picker BELOW; if near bottom, show picker ABOVE
     */
  private calculateReactionPickerPosition(messageId: string): void {
    const viewportHeight = window.innerHeight;
    const viewportMiddle = viewportHeight / 2;
    
    // Find the message element by its ID in the DOM
    // We'll use the message's position in the messages array to help identify it
    const messages = this.messages();
    const messageIndex = messages.findIndex(m => m.id === messageId);
    
    if (messageIndex === -1) {
      // Default to below if message not found
      this.reactionPickerPosition.set('below');
      return;
    }
    
    // Get the message element from DOM - find all message-bubble elements
    const messageElements = document.querySelectorAll('.message-bubble');
    
    if (messageElements.length === 0 || messageIndex >= messageElements.length) {
      this.reactionPickerPosition.set('below');
      return;
    }
    
    const messageElement = messageElements[messageIndex] as HTMLElement;
    const messageRect = messageElement.getBoundingClientRect();
    const messageTop = messageRect.top;
    
    // Standard chat behavior:
    // - Message in UPPER half of viewport → picker opens DOWN (below the message)
    // - Message in LOWER half of viewport → picker opens UP (above the message)
    if (messageTop < viewportMiddle) {
      // Message is in upper half (near top) → picker goes BELOW
      this.reactionPickerPosition.set('below');
    } else {
      // Message is in lower half (near bottom) → picker goes ABOVE
      this.reactionPickerPosition.set('above');
    }
  }
  
  /**
   * Add reaction to a message
   */
  addReaction(messageId: string, emoji: string): void {
    this.messagesService.addReaction(messageId, emoji).subscribe({
      next: () => {
        this.showEmojiPickerFor.set(null);
        // Refetch messages to get updated reactions
        this.messagesService.getMessages().subscribe();
      },
      error: (error) => {
        console.error('Error adding reaction:', error);
        this.toastService.error('Error al añadir reacción');
      }
    });
  }
  
  /**
   * Toggle reaction (add if not present, remove if present)
   */
  toggleReaction(messageId: string, emoji: string): void {
    this.addReaction(messageId, emoji);
  }
  
  /**
   * Close the reaction emoji picker
   */
  closeEmojiPicker(): void {
    this.showEmojiPickerFor.set(null);
  }
  
  /**
   * Close the input emoji picker
   */
  closeInputEmojiPicker(): void {
    this.showInputEmojiPicker.set(false);
  }
  
  /**
   * Group reactions by emoji and count them
   */
  getGroupedReactions(reactions: { emoji: string }[]): { emoji: string; count: number }[] {
    const grouped: Map<string, number> = new Map();
    
    for (const reaction of reactions) {
      const count = grouped.get(reaction.emoji) || 0;
      grouped.set(reaction.emoji, count + 1);
    }
    
    return Array.from(grouped.entries()).map(([emoji, count]) => ({ emoji, count }));
  }
  
  /**
   * Check if current user has a specific reaction
   */
  hasUserReaction(reactions: { user_id: string; emoji: string }[], emoji: string): boolean {
    const currentUser = this.authService.user();
    if (!currentUser) return false;
    
    return reactions.some(r => r.user_id === currentUser.id && r.emoji === emoji);
  }
  
  /**
   * Get tooltip for reaction
   */
  getReactionTooltip(reactions: { user_name: string; emoji: string }[], emoji: string): string {
    const users = reactions
      .filter(r => r.emoji === emoji)
      .map(r => r.user_name)
      .join(', ');
    
    return users || '';
  }
  
  // ========== Input Emoji Functions ==========
  
  /**
   * Toggle emoji picker in input area
   * Smart positioning: opens above if input is in lower half, below if in upper half
   */
  toggleInputEmojiPicker(): void {
    if (!this.showInputEmojiPicker()) {
      // Calculate smart position based on input location in viewport
      this.calculateEmojiPickerPosition();
    }
    this.showInputEmojiPicker.update(v => !v);
  }
  
  /**
   * Calculate and set the smart emoji picker position
   */
  private calculateEmojiPickerPosition(): void {
    // Get viewport height
    const viewportHeight = window.innerHeight;
    // Get the input area position (it's at the bottom of the chat)
    const chatContainer = document.querySelector('.chat-container');
    if (!chatContainer) {
      this.inputEmojiPickerPosition.set('top');
      return;
    }
    
    const containerRect = chatContainer.getBoundingClientRect();
    const inputArea = document.querySelector('.input-area');
    if (!inputArea) {
      this.inputEmojiPickerPosition.set('top');
      return;
    }
    
    const inputRect = inputArea.getBoundingClientRect();
    // Calculate where the input is relative to the viewport
    const inputMiddle = inputRect.top + (inputRect.height / 2);
    const viewportMiddle = viewportHeight / 2;
    
    // If input is below the middle of the viewport, open picker above
    // If input is above the middle of the viewport, open picker below
    if (inputMiddle > viewportMiddle) {
      this.inputEmojiPickerPosition.set('top');
    } else {
      this.inputEmojiPickerPosition.set('bottom');
    }
  }
  
  /**
   * Add emoji to message input
   */
  addEmojiToInput(emoji: string): void {
    this.newMessage.update(current => current + emoji);
  }
  
  /**
   * Select an emoji category
   */
  selectEmojiCategory(categoryName: string): void {
    this.selectedEmojiCategory.set(categoryName);
  }
  
  /**
   * Get emojis for the currently selected category (input picker)
   */
  getCurrentCategoryEmojis(): string[] {
    const category = this.emojiCategories.find(c => c.name === this.selectedEmojiCategory());
    return category?.emojis || [];
  }
  
  /**
   * Select an emoji category for reactions
   */
  selectReactionCategory(categoryName: string): void {
    this.selectedReactionCategory.set(categoryName);
  }
  
  /**
   * Get emojis for the currently selected reaction category
   */
  getCurrentReactionCategoryEmojis(): string[] {
    const category = this.emojiCategories.find(c => c.name === this.selectedReactionCategory());
    return category?.emojis || [];
  }
  
  /**
   * Check if a message contains only emojis (for large display)
   */
  isEmojiOnlyMessage(content: string): boolean {
    if (!content || content.trim().length === 0) return false;
    
    // Emoji regex pattern - matches emoji characters
    const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2300}-\u{23FF}]|[\u{2B50}]|[\u{200D}]|[\u{FE0F}]|[\u{20E3}]|[\u{2194}-\u{2199}]|[\u{231A}-\u{231B}]|[\u{2328}]|[\u{23CF}]|[\u{24C2}]|[\u{25AA}-\u{25AB}]|[\u{25B6}]|[\u{25C0}]|[\u{25FB}-\u{25FE}]|[\u{2614}-\u{2615}]|[\u{2648}-\u{2653}]|[\u{267F}]|[\u{2693}]|[\u{26A1}]|[\u{26AA}-\u{26AB}]|[\u{26BD}-\u{26BE}]|[\u{26C4}-\u{26C5}]|[\u{26CE}]|[\u{26D4}]|[\u{26EA}]|[\u{26F2}-\u{26F3}]|[\u{26F5}]|[\u{26FA}]|[\u{26FD}]|[\u{2702}]|[\u{2705}]|[\u{2708}-\u{270D}]|[\u{270F}]|[\u{2712}]|[\u{2714}]|[\u{2716}]|[\u{271D}]|[\u{2721}]|[\u{2728}]|[\u{2733}-\u{2734}]|[\u{2744}]|[\u{2747}]|[\u{274C}]|[\u{274E}]|[\u{2753}-\u{2755}]|[\u{2757}]|[\u{2763}-\u{2764}]|[\u{2795}-\u{2797}]|[\u{27A1}]|[\u{27B0}]|[\u{27BF}]|[\u{2934}-\u{2935}]|[\u{2B05}-\u{2B07}]|[\u{2B1B}-\u{2B1C}]|[\u{2B55}]|[\u{3030}]|[\u{303D}]|[\u{3297}]|[\u{3299}]|[\u{1F004}]|[\u{1F0CF}]|[\u{1F170}-\u{1F171}]|[\u{1F17E}-\u{1F17F}]|[\u{1F18E}]|[\u{1F191}-\u{1F19A}]|[\u{1F201}-\u{1F202}]|[\u{1F21A}]|[\u{1F22F}]|[\u{1F237}-\u{1F23A}]|[\u{1F250}-\u{1F251}]|[\u{1F3F3}]|[\u{1F3F4}]|[\u{1F3F8}-\u{1F407}]|[\u{1F409}]|[\u{1F40C}-\u{1F40F}]|[\u{1F411}-\u{1F417}]|[\u{1F41A}-\u{1F41F}]|[\u{1F425}-\u{1F43F}]|[\u{1F442}-\u{1F4F7}]|[\u{1F4F9}-\u{1F4FD}]|[\u{1F500}-\u{1F53E}]|[\u{1F54A}-\u{1F54B}]|[\u{1F550}-\u{1F579}]|[\u{1F57B}-\u{1F5A3}]|[\u{1F5A5}-\u{1F5D4}]|[\u{1F5D5}-\u{1F607}]|[\u{1F608}-\u{1F610}]|[\u{1F611}]|[\u{1F612}-\u{1F614}]|[\u{1F615}-\u{1F620}]|[\u{1F621}-\u{1F62B}]|[\u{1F62C}-\u{1F62D}]|[\u{1F62E}-\u{1F63A}]|[\u{1F63B}-\u{1F63F}]|[\u{1F640}]|[\u{1F641}-\u{1F644}]|[\u{1F645}-\u{1F64F}]|[\u{1F680}-\u{1F6C5}]|[\u{1F6CB}-\u{1F6D0}]|[\u{1F6D1}-\u{1F6D2}]|[\u{1F6D3}-\u{1F6D7}]|[\u{1F6E0}-\u{1F6E5}]|[\u{1F6E9}]|[\u{1F6F0}]|[\u{1F6F3}]|[\u{1F6F7}-\u{1F6F8}]|[\u{1F700}-\u{1F773}]|[\u{1F780}-\u{1F7D4}]|[\u{1F800}-\u{1F80B}]|[\u{1F810}-\u{1F847}]|[\u{1F850}-\u{1F859}]|[\u{1F860}-\u{1F887}]|[\u{1F890}-\u{1F8AD}]|[\u{1F8B0}]|[\u{1F8B1}]|[\u{1F900}-\u{1F978}]|[\u{1F97A}-\u{1F9CB}]|[\u{1F9CD}-\u{1F9FF}]|[\u{1FA70}-\u{1FA73}]|[\u{1FA78}-\u{1FA7A}]|[\u{1FA80}-\u{1FA82}]|[\u{1FA90}-\u{1FA95}]|[\u{1FAE0}-\u{1FAE7}]|[\u{1FAF0}-\u{1FAF6}]/gu;
    
    // Remove emoji characters and whitespace
    const withoutEmojis = content.replace(emojiRegex, '').trim();
    
    // If everything was emojis (or whitespace), return true
    return withoutEmojis.length === 0 && content.trim().length > 0;
  }
  
  // ========== Clear Chat Functions (Admin only) ==========
  
  /**
   * Show clear chat confirmation
   */
  confirmClearChat(): void {
    this.showClearChatConfirm.set(true);
  }
  
  /**
   * Cancel clear chat
   */
  cancelClearChat(): void {
    this.showClearChatConfirm.set(false);
  }
  
  /**
   * Clear all messages (Admin only)
   */
  clearAllMessages(): void {
    if (this.isClearingChat()) return;
    
    this.isClearingChat.set(true);
    
    this.messagesService.clearAllMessages().subscribe({
      next: () => {
        this.toastService.success('Todos los mensajes han sido eliminados');
        this.showClearChatConfirm.set(false);
      },
      error: (error) => {
        console.error('Error clearing all messages:', error);
        this.toastService.error('Error al limpiar el chat. Solo los administradores pueden realizar esta acción.');
      },
      complete: () => {
        this.isClearingChat.set(false);
      }
    });
  }
  
  /**
   * Scroll to bottom of messages list
   */
  private scrollToBottom(): void {
    if (this.messagesContainer?.nativeElement) {
      const container = this.messagesContainer.nativeElement;
      container.scrollTop = container.scrollHeight;
    }
  }
}