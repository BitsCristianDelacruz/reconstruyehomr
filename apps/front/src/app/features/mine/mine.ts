import { Component,inject,signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PublicationService,ContributionService,CatalogService } from '../../core/services';
import type { Publication,Contribution } from '../../core/models';
import { UiError,uiError } from '../../core/api';
import { ErrorNotice } from '../../shared/feedback';
import { AppDialog } from '../../shared/dialog';
import { stateLabel } from '../../shared/labels';
@Component({standalone:true,imports:[DatePipe,RouterLink,ErrorNotice,AppDialog],templateUrl:'./mine.html'})
export class MinePage{
  private readonly api=inject(PublicationService);private readonly contributionsApi=inject(ContributionService);readonly catalogs=inject(CatalogService);
  readonly items=signal<Publication[]>([]);readonly contributions=signal<Contribution[]>([]);readonly error=signal<UiError|null>(null);readonly loading=signal(true);readonly busy=signal(false);
  readonly pending=signal<{publication:Publication;action:string}|null>(null);readonly confirmed=signal(false);readonly label=stateLabel;
  constructor(){void this.load();}
  async load(){this.loading.set(true);this.error.set(null);try{const [publications,contributions]=await Promise.all([this.api.mine(),this.contributionsApi.mine(),this.catalogs.load()]);this.items.set(publications.items);this.contributions.set(contributions.items);}
    catch(e){this.error.set(uiError(e));}finally{this.loading.set(false);}}
  ask(publication:Publication,action:string){this.confirmed.set(false);this.pending.set({publication,action});this.error.set(null);}
  actionLabel(action:string){return ({publish:'Publicar',pause:'Pausar',close:'Cerrar',reopen:'Reabrir'} as Record<string,string>)[action]??action;}
  async transition(){const p=this.pending();if(!p||!this.confirmed())return;this.busy.set(true);try{await this.api.transition(p.publication,p.action);this.pending.set(null);await this.load();}catch(e){this.error.set(uiError(e));}finally{this.busy.set(false);}}
}

