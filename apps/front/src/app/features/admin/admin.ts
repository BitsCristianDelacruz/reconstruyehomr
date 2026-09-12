import { Component,inject,signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder,ReactiveFormsModule,Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminService,AuthStore,CatalogService,ModerationService } from '../../core/services';
import type { Report,CatalogEntry,ManagedAccount,AuditEntry } from '../../core/models';
import { UiError,uiError } from '../../core/api';
import { AppDialog } from '../../shared/dialog';
import { ErrorNotice,FieldError } from '../../shared/feedback';
import { roleOptions,stateLabel } from '../../shared/labels';
type Tab='reports'|'catalogs'|'accounts'|'audit';
@Component({standalone:true,imports:[DatePipe,RouterLink,ReactiveFormsModule,AppDialog,ErrorNotice,FieldError],templateUrl:'./admin.html'})
export class AdminPage{
  readonly auth=inject(AuthStore);readonly catalogs=inject(CatalogService);private readonly admin=inject(AdminService);private readonly moderation=inject(ModerationService);private readonly fb=inject(FormBuilder).nonNullable;
  readonly tab=signal<Tab>('reports');readonly reports=signal<Report[]>([]);readonly entries=signal<CatalogEntry[]>([]);readonly accounts=signal<ManagedAccount[]>([]);readonly audit=signal<AuditEntry[]>([]);
  readonly page=signal(1);readonly loading=signal(false);readonly busy=signal(false);readonly error=signal<UiError|null>(null);readonly success=signal('');
  readonly modal=signal<'decision'|'catalog'|'account'|null>(null);readonly selectedReport=signal<Report|null>(null);readonly selectedAccount=signal<ManagedAccount|null>(null);readonly existingCatalog=signal(false);readonly label=stateLabel;
  readonly groups=[{code:'category',label:'Categorías de ayuda'},{code:'territory',label:'Territorios'},{code:'urgency',label:'Urgencias'},{code:'reportCategory',label:'Motivos de reporte'},{code:'needState',label:'Estados de solicitudes'},{code:'offerState',label:'Estados de ofertas'},{code:'safety',label:'Mensajes de seguridad'}];
  readonly roles=[...roleOptions,{code:'moderator',label:'Moderador'},{code:'admin',label:'Administrador'}];
  readonly search=this.fb.group({query:''});
  readonly decision=this.fb.group({decision:'dismiss',reason:['',[Validators.required,Validators.minLength(5),Validators.maxLength(1000)]]});
  readonly catalogForm=this.fb.group({group:'category',code:['',[Validators.required,Validators.pattern(/^[a-z][a-z0-9_-]{0,63}$/)]],label:['',[Validators.required,Validators.minLength(2),Validators.maxLength(1000)]],active:true,position:0,reason:['',[Validators.required,Validators.minLength(5),Validators.maxLength(1000)]]});
  readonly accountForm=this.fb.group({state:'active',roles:this.fb.control<string[]>([],Validators.required),reason:['',[Validators.required,Validators.minLength(5),Validators.maxLength(1000)]]});
  constructor(){void this.catalogs.load().catch(()=>undefined);void this.load();}
  async switchTab(tab:Tab){this.tab.set(tab);this.page.set(1);this.success.set('');await this.load();}
  async load(page=this.page()){
    this.loading.set(true);this.error.set(null);this.page.set(page);
    try{switch(this.tab()){
      case'reports':this.reports.set((await this.moderation.list(page)).items);break;
      case'catalogs':this.entries.set((await this.admin.catalogs()).entries);break;
      case'accounts':this.accounts.set((await this.admin.accounts(this.search.controls.query.value)).items);break;
      case'audit':this.audit.set((await this.admin.audit(page)).items);break;
    }}catch(e){this.error.set(uiError(e));}finally{this.loading.set(false);}
  }
  review(report:Report){this.selectedReport.set(report);this.decision.reset({decision:'dismiss',reason:''});this.error.set(null);this.modal.set('decision');}
  editCatalog(entry?:CatalogEntry){this.existingCatalog.set(!!entry);this.catalogForm.reset(entry?{...entry,reason:''}:{group:'category',code:'',label:'',active:true,position:0,reason:''});this.catalogForm.controls.group.enable();if(entry)this.catalogForm.controls.group.disable();this.error.set(null);this.modal.set('catalog');}
  editAccount(account:ManagedAccount){this.selectedAccount.set(account);this.accountForm.reset({state:account.state,roles:account.roles,reason:''});this.error.set(null);this.modal.set('account');}
  toggleRole(code:string,checked:boolean){const roles=this.accountForm.controls.roles;roles.setValue(checked?[...roles.value,code]:roles.value.filter(r=>r!==code));roles.markAsTouched();}
  async save(){const modal=this.modal();const form=modal==='decision'?this.decision:modal==='catalog'?this.catalogForm:this.accountForm;
    if(form.invalid){form.markAllAsTouched();return;}this.busy.set(true);this.error.set(null);
    try{
      if(modal==='decision'){const v=this.decision.getRawValue();await this.moderation.decide(this.selectedReport()!,v.decision,v.reason);}
      if(modal==='catalog'){const {reason,...entry}=this.catalogForm.getRawValue();await this.admin.saveCatalog(entry,reason);await this.catalogs.load();}
      if(modal==='account'){const v=this.accountForm.getRawValue();await this.admin.updateAccount({...this.selectedAccount()!,state:v.state,roles:v.roles},v.reason);}
      this.modal.set(null);this.success.set('Cambio aplicado y registrado en auditoría.');await this.load();
    }catch(e){this.error.set(uiError(e));}finally{this.busy.set(false);}
  }
  targetLabel(type:string){return ({publication:'Publicación',profile:'Responsable',contribution:'Contribución'} as Record<string,string>)[type]??type;}
  groupLabel(group:string){return this.groups.find(g=>g.code===group)?.label??group;}
}

