import { Component,inject,signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder,ReactiveFormsModule,Validators } from '@angular/forms';
import { ActivatedRoute,RouterLink } from '@angular/router';
import { AuthStore,CatalogService,PublicationService,ContributionService,ModerationService } from '../../core/services';
import type { Publication,Contribution,TimelineEvent } from '../../core/models';
import { UiError,uiError } from '../../core/api';
import { ErrorNotice,FieldError } from '../../shared/feedback';
import { AppDialog } from '../../shared/dialog';
import { stateLabel } from '../../shared/labels';
@Component({standalone:true,imports:[RouterLink,DatePipe,ReactiveFormsModule,ErrorNotice,FieldError,AppDialog],templateUrl:'./detail.html'})
export class DetailPage{
  readonly auth=inject(AuthStore);readonly catalogs=inject(CatalogService);private readonly publications=inject(PublicationService);private readonly contributionApi=inject(ContributionService);private readonly moderation=inject(ModerationService);
  private readonly id=inject(ActivatedRoute).snapshot.paramMap.get('id')!;private readonly fb=inject(FormBuilder).nonNullable;
  readonly publication=signal<Publication|null>(null);readonly contributions=signal<Contribution[]>([]);readonly loading=signal(true);readonly busy=signal(false);readonly error=signal<UiError|null>(null);readonly success=signal('');
  readonly modal=signal<'contact'|'contribute'|'report'|'transition'|'history'|null>(null);readonly confirmed=signal(false);readonly contactUrl=signal('');
  readonly reportTarget=signal({type:'publication',id:this.id});readonly pending=signal<{contribution:Contribution;action:string}|null>(null);
  readonly history=signal<TimelineEvent[]>([]);readonly label=stateLabel;
  readonly contributionForm=this.fb.group({type:['',Validators.required],note:['',Validators.maxLength(1000)]});
  readonly reportForm=this.fb.group({category:['',Validators.required],detail:['',Validators.maxLength(1000)]});
  private contributionKey=crypto.randomUUID();
  constructor(){void this.load();}
  async load(){this.loading.set(true);this.error.set(null);
    try{await this.auth.ready.catch(()=>undefined);const [p,c]=await Promise.all([this.publications.detail(this.id),this.contributionApi.list(this.id),this.catalogs.load()]);this.publication.set(p);this.contributions.set(c.items);}
    catch(e){this.error.set(uiError(e));this.publication.set(null);}finally{this.loading.set(false);}}
  open(mode:'contact'|'contribute'|'report'){this.modal.set(mode);this.confirmed.set(false);this.error.set(null);this.contactUrl.set('');if(mode==='report')this.reportTarget.set({type:'publication',id:this.id});}
  close(){this.modal.set(null);this.error.set(null);}
  async contact(){if(!this.confirmed())return;this.busy.set(true);try{const response=await this.publications.contact(this.id);const url=new URL(response.url);if(url.origin!=='https://wa.me'||!/^\/\d+$/.test(url.pathname))throw new UiError('El enlace de contacto no es válido');this.contactUrl.set(url.href);}catch(e){this.error.set(uiError(e));}finally{this.busy.set(false);}}
  async contribute(){if(!this.confirmed()||this.contributionForm.invalid){this.contributionForm.markAllAsTouched();return;}this.busy.set(true);this.error.set(null);
    try{const v=this.contributionForm.getRawValue();await this.contributionApi.create(this.id,v.type,v.note,this.contributionKey);this.contributionKey=crypto.randomUUID();this.contributionForm.reset();this.close();this.success.set('Aporte declarado. Coordina los detalles con el responsable del caso.');await this.load();}
    catch(e){this.error.set(uiError(e));}finally{this.busy.set(false);}}
  reportContribution(c:Contribution){this.open('report');this.reportTarget.set({type:'contribution',id:c.id});}
  async report(){if(!this.confirmed()||this.reportForm.invalid){this.reportForm.markAllAsTouched();return;}this.busy.set(true);this.error.set(null);
    try{const v=this.reportForm.getRawValue(),target=this.reportTarget();const result=await this.moderation.report(target.type,target.id,v.category,v.detail);this.reportForm.reset();this.close();this.success.set(result.message);}
    catch(e){this.error.set(uiError(e));}finally{this.busy.set(false);}}
  ask(c:Contribution,action:string){this.pending.set({contribution:c,action});this.modal.set('transition');this.confirmed.set(false);this.error.set(null);}
  actionLabel(action:string){return ({coordinate:'Marcar coordinado',cancel:'Cancelar aporte',receive:'Confirmar recibido',dispute:'Disputar recepción'} as Record<string,string>)[action]??action;}
  async transition(){const p=this.pending();if(!p||!this.confirmed())return;this.busy.set(true);try{await this.contributionApi.transition(p.contribution,p.action);this.close();this.success.set('Estado del aporte actualizado. El caso conserva su estado.');await this.load();}catch(e){this.error.set(uiError(e));}finally{this.busy.set(false);}}
  async showHistory(c:Contribution){this.busy.set(true);this.error.set(null);try{const result=await this.contributionApi.detail(c.id);this.history.set(result.history??[]);this.modal.set('history');}catch(e){this.error.set(uiError(e));}finally{this.busy.set(false);}}
  eventLabel(event:TimelineEvent){return ({'publication.created':'Publicación creada','publication.edited':'Información actualizada','publication.publish':'Publicación abierta','publication.pause':'Publicación pausada','publication.close':'Publicación cerrada','publication.reopen':'Publicación reabierta','contribution.declared':'Aporte declarado','contribution.coordinate':'Coordinación registrada','contribution.cancel':'Aporte cancelado','contribution.receive':'Recepción confirmada por el caso','contribution.dispute':'Recepción disputada','moderation.hide':'Contenido ocultado','moderation.restore':'Contenido restaurado'} as Record<string,string>)[event.action]??this.label(event.state);}
}

