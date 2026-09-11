import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { timeout } from 'rxjs';

interface ReadyResponse {
  status: string;
  database: { status: string; name: string; time: string };
  application: { name: string; initializedAt: string };
}
declare global {
  interface Window { __APP_CONFIG__?: { apiBaseUrl?: string } }
}

@Component({
  selector: 'app-root', standalone: true, imports: [DatePipe], templateUrl: './app.html'
})
export class App {
  private readonly http = inject(HttpClient);
  private readonly api = (window.__APP_CONFIG__?.apiBaseUrl ?? '/api').replace(/\/$/, '');
  readonly loading = signal(false);
  readonly status = signal<ReadyResponse | null>(null);
  readonly error = signal('');

  constructor() { this.checkConnection(); }

  checkConnection() {
    this.loading.set(true);
    this.error.set('');
    this.status.set(null);
    this.http.get<ReadyResponse>(this.api + '/ready').pipe(timeout(10000)).subscribe({
      next: response => { this.status.set(response); this.loading.set(false); },
      error: () => {
        this.error.set('No se pudo completar la conexión con la API y la base de datos. Revisa los contenedores y vuelve a intentar.');
        this.loading.set(false);
      }
    });
  }
}
