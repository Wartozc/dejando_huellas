import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

interface PushSubscriptionResponse {
  message: string;
  success: boolean;
}

interface PushSubscriptionJSON {
  endpoint: string;
  keys?: {
    p256dh?: string;
    auth?: string;
  };
}

interface PushData {
  title?: string;
  body?: string;
  icon?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PushNotificationService {
  private apiUrl = environment.apiUrl;
  private http = inject(HttpClient);
  
  // Service worker registration
  private swRegistration: ServiceWorkerRegistration | null = null;
  
  // State signals
  isSupported = signal(false);
  isSubscribed = signal(false);
  
  constructor() {
    this.checkSupport();
  }
  
  /**
   * Check if push notifications are supported
   */
  private checkSupport(): void {
    this.isSupported.set('serviceWorker' in navigator && 'PushManager' in window);
  }
  
  /**
   * Initialize the service worker and subscribe to push notifications
   */
  async initialize(): Promise<void> {
    if (!this.isSupported()) {
      console.log('Push notifications not supported in this browser');
      return;
    }
    
    try {
      // Register service worker
      this.swRegistration = await navigator.serviceWorker.register('ngsw-worker.js');
      console.log('Service Worker registered:', this.swRegistration);
      
      // Subscribe to push notifications
      await this.subscribeToPush();
      
      // Listen for incoming push messages
      this.swRegistration.addEventListener('push', (event: Event) => {
        this.handlePushEvent(event);
      });
      
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
    }
  }
  
  /**
   * Subscribe to push notifications
   */
  private async subscribeToPush(): Promise<void> {
    if (!this.swRegistration) {
      return;
    }
    
    try {
      // Check existing subscription
      const existingSubscription = await this.swRegistration.pushManager.getSubscription();
      
      if (existingSubscription) {
        console.log('Already subscribed to push notifications');
        this.isSubscribed.set(true);
        return;
      }
      
      // Subscribe with VAPID public key (placeholder - replace with actual VAPID key)
      const vapidPublicKey = this.getVapidPublicKey();
      const subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey)
      });
      
      console.log('Push subscription successful:', subscription);
      
      // Send subscription to backend
      this.sendSubscriptionToBackend(subscription).subscribe({
        next: (response) => {
          console.log('Subscription saved to backend:', response);
          this.isSubscribed.set(true);
        },
        error: (error) => {
          console.error('Failed to save subscription to backend:', error);
        }
      });
      
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
    }
  }
  
  /**
   * Send push subscription to backend
   */
  private sendSubscriptionToBackend(subscription: PushSubscription): Observable<PushSubscriptionResponse> {
    const subscriptionJson = subscription.toJSON();
    const endpoint = subscriptionJson.endpoint || '';
    
    return this.http.post<PushSubscriptionResponse>(`${this.apiUrl}/push/subscribe`, {
      endpoint: endpoint,
      keys: {
        p256dh: subscriptionJson.keys?.['p256dh'] || '',
        auth: subscriptionJson.keys?.['auth'] || ''
      }
    }).pipe(
      tap(response => console.log('Backend subscription response:', response)),
      catchError(error => {
        console.error('Error sending subscription to backend:', error);
        return of({ message: 'Failed to subscribe', success: false });
      })
    );
  }
  
  /**
   * Handle incoming push event
   */
  private handlePushEvent(event: Event): void {
    // Handle push event without using the PushEvent type
    const pushEvent = event as { data?: { json: () => PushData } };
    
    if (!pushEvent || !pushEvent.data) {
      console.log('Push event received but no data');
      return;
    }
    
    try {
      const data = pushEvent.data.json();
      console.log('Push message received:', data);
      
      // Show notification
      this.showPushNotification(data);
    } catch (error) {
      console.error('Error parsing push data:', error);
    }
  }
  
  /**
   * Show push notification
   */
  private showPushNotification(data: { title?: string; body?: string; icon?: string }): void {
    if (!('Notification' in window)) {
      return;
    }
    
    if (Notification.permission === 'granted') {
      const notification = new Notification(data.title || 'Nuevo mensaje', {
        body: data.body || 'Tienes un nuevo mensaje en el chat',
        icon: data.icon || '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: 'push-notification',
        requireInteraction: false
      });
      
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }
  }
  
  /**
   * Get VAPID public key (placeholder - replace with actual key)
   * In production, this should be fetched from the backend
   */
  private getVapidPublicKey(): string {
    // This is a placeholder VAPID public key
    // In production, you would fetch this from your backend
    // e.g., GET /api/v1/push/vapid-public-key
    return 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';
  }
  
  /**
   * Convert VAPID key from base64 to Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): ArrayBuffer {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    
    return outputArray.buffer as ArrayBuffer;
  }
  
  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(): Promise<void> {
    if (!this.swRegistration) {
      return;
    }
    
    try {
      const subscription = await this.swRegistration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        console.log('Successfully unsubscribed from push notifications');
        this.isSubscribed.set(false);
        
        // Notify backend to remove subscription
        this.http.post(`${this.apiUrl}/push/unsubscribe`, {
          endpoint: subscription.endpoint
        }).subscribe({
          next: () => console.log('Subscription removed from backend'),
          error: (error) => console.error('Failed to remove subscription from backend:', error)
        });
      }
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
    }
  }
  
  /**
   * Manually trigger subscription (can be called from UI)
   */
  subscribe(): void {
    this.initialize();
  }
}