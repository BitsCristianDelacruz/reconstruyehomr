import { Component,inject,signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CatalogService } from '../../core/services';
import { uiError,UiError } from '../../core/api';
import { ErrorNotice } from '../../shared/feedback';
@Component({standalone:true,imports:[RouterLink,ErrorNotice],template:`
<section class="narrow"><span class="eyebrow">La confianza se cuida</span><h1>Ayuda con cuidado.</h1><p>Antes de compartir, contactar o acordar una entrega, toma un momento para protegerte y proteger a otras personas.</p>
<app-error [error]="error()" /><div class="stack">
@for(message of catalogs.entries('safety');track message.code){<article class="panel"><h2>{{heading(message.code)}}</h2><p>{{message.label}}</p></article>}
<article class="panel"><h2>Qué significa cada señal</h2><p><strong>Información declarada:</strong> la persona que publica la proporcionó. No equivale a identidad verificada ni a garantía.</p><p><strong>Aporte recibido:</strong> el autor de la solicitud confirmó su recepción. No constituye una certificación legal o tributaria.</p><p><strong>Validación de aliado:</strong> todavía no está disponible. Requiere definir aliados, alcance y evidencia.</p></article>
<article class="panel"><h2>Si algo no te parece seguro</h2><p>Abre la publicación y usa “Reportar”. Puedes indicar si el problema está en la publicación, en su responsable o en una contribución. Un moderador revisará el reporte; no hay un tiempo de respuesta aprobado aún.</p></article>
<article class="notice"><strong>Funciones pendientes:</strong> carga de imágenes y evidencia, validación de aliados y exportaciones permanecen deshabilitadas. No se reciben pagos.</article>
</div><div class="actions" style="margin-top:24px"><a class="button" routerLink="/">Volver al muro</a></div></section>`})
export class SafetyPage{
  readonly catalogs=inject(CatalogService);readonly error=signal<UiError|null>(null);
  constructor(){void this.catalogs.load().catch(e=>this.error.set(uiError(e)));}
  heading(code:string){return ({contact:'Acuerdos claros',emergency:'En una emergencia',privacy:'Tus datos, con cuidado',local:'Estamos en desarrollo'} as Record<string,string>)[code]??'Recomendación de seguridad';}
}

