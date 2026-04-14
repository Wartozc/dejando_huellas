import { Injectable } from '@angular/core';
import { ToastService } from './toast.service';

// Type declaration for service worker update
interface SwUpdate {
  isEnabled: boolean;
  versionUpdates: any;
  checkForUpdate(): Promise<boolean>;
  activateUpdate(): Promise<boolean>;
}

declare const self: { ServiceWorkerContainer: { prototype: any } };

@Injectable({
  providedIn: 'root'
})
export class UpdateService {
  private swUpdate: SwUpdate | null = null;

  constructor(
    private toastService: ToastService
  ) {
    this.init();
  }

  private init(): void {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Check if SW is registered
      navigator.serviceWorker.ready.then(() => {
        // SW updates will be handled when available
        console.log('Update service initialized');
      });
    }
  }

  /**
   * Check for updates manually
   */
  checkForUpdates(): void {
    if (this.swUpdate) {
      this.swUpdate.checkForUpdate().then((available: boolean) => {
        if (available) {
          this.toastService.info('Nueva actualización disponible');
        }
      }).catch((error: Error) => {
        console.log('Update check failed:', error);
      });
    }
  }
}
