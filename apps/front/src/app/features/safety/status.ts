import { Component,inject,signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AdminService } from '../../core/services';
import type { Ready } from '../../core/models';
import { uiError,UiError } from '../../core/api';
import { ErrorNotice } from '../../shared/feedback';
@Component({standalone:true,imports:[DatePipe,ErrorNotice],template:`<section class="narrow"><span class="eyebrow">Entorno de desarrollo</span><h1>Estado local</h1><p>Verifica la conexión entre Angular, la API y la base de datos.</p><app-error [error]="error()" /><div class="panel">@if(status();as s){<span class="tag">Conexión verificada</span><dl class="data-list"><div><dt>Frontend</dt><dd>Angular</dd></div><div><dt>API</dt><dd>{{s.status}}</dd></div><div><dt>Base de datos</dt><dd>{{s.database.name}} · {{s.database.status}}</dd></div><div><dt>Inicializada</dt><dd>{{s.application.initializedAt|date:'medium'}}</dd></div></dl>}<button (click)="check()" [disabled]="loading()">{{loading()?'Comprobando…':'Comprobar conexión'}}</button></div></section>`})
export class StatusPage{
  private readonly api=inject(AdminService);readonly status=signal<Ready|null>(null);readonly error=signal<UiError|null>(null);readonly loading=signal(false);
  constructor(){void this.check();}
  async check(){this.loading.set(true);this.error.set(null);try{this.status.set(await this.api.ready());}catch(e){this.error.set(uiError(e));}finally{this.loading.set(false);}}
}

