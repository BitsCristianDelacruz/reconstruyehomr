import { Component,inject,signal } from '@angular/core';
import { FormBuilder,ReactiveFormsModule,Validators } from '@angular/forms';
import { ActivatedRoute,Router,RouterLink } from '@angular/router';
import { AuthStore,CatalogService } from '../../core/services';
import { UiError,uiError } from '../../core/api';
import { ErrorNotice,FieldError } from '../../shared/feedback';
import { AppDialog } from '../../shared/dialog';
import { roleOptions } from '../../shared/labels';
@Component({standalone:true,imports:[ReactiveFormsModule,RouterLink,ErrorNotice,FieldError,AppDialog],templateUrl:'./account.html'})
export class AccountPage {
  readonly auth=inject(AuthStore);readonly catalogs=inject(CatalogService);private readonly router=inject(Router);private readonly route=inject(ActivatedRoute);
  private readonly fb=inject(FormBuilder).nonNullable;
  readonly loginForm=this.fb.group({email:['',[Validators.required,Validators.email]],password:['',Validators.required]});
  readonly form=this.fb.group({
    email:['',[Validators.required,Validators.email,Validators.maxLength(254)]],password:['',[Validators.required,Validators.minLength(12),Validators.maxLength(128)]],
    name:['',[Validators.required,Validators.minLength(2),Validators.maxLength(80)]],territory:['',Validators.required],roles:this.fb.control<string[]>(['affected'],Validators.required),
    phone:['',Validators.pattern(/^\+[1-9]\d{7,14}$/)],contactConsent:false,privacyConsent:[false,Validators.requiredTrue]
  });
  readonly roles=roleOptions;readonly mode=signal<'login'|'register'>('login');readonly busy=signal(false);readonly loading=signal(true);readonly error=signal<UiError|null>(null);readonly success=signal('');
  readonly deactivationOpen=signal(false);readonly confirmed=signal(false);
  constructor(){void this.initialize();}
  async initialize(){try{await this.auth.ready;await this.catalogs.load();this.fillProfile();}catch(e){this.error.set(uiError(e));}finally{this.loading.set(false);}}
  private fillProfile(){const p=this.auth.profile();if(p){this.form.patchValue({...p,phone:p.phone??'',roles:p.roles.filter(r=>this.roles.some(o=>o.code===r)),privacyConsent:true});this.form.controls.password.clearValidators();this.form.controls.password.updateValueAndValidity();}}
  changeMode(mode:'login'|'register'){this.mode.set(mode);this.error.set(null);this.success.set('');this.form.controls.password.setValidators([Validators.required,Validators.minLength(12),Validators.maxLength(128)]);this.form.controls.password.updateValueAndValidity();}
  toggleRole(code:string,checked:boolean){const roles=this.form.controls.roles;roles.setValue(checked?[...roles.value,code]:roles.value.filter(r=>r!==code));roles.markAsTouched();}
  async login(){if(this.loginForm.invalid){this.loginForm.markAllAsTouched();return;}this.busy.set(true);this.error.set(null);
    try{const v=this.loginForm.getRawValue();await this.auth.login(v.email,v.password);this.loginForm.controls.password.reset();this.fillProfile();const next=this.route.snapshot.queryParamMap.get('returnUrl');await this.router.navigateByUrl(next?.startsWith('/')&&!next.startsWith('//')?next:'/mis-publicaciones');}
    catch(e){this.error.set(uiError(e));}finally{this.busy.set(false);}}
  async save(){
    if(this.form.invalid){this.form.markAllAsTouched();return;}const v=this.form.getRawValue();
    if(v.contactConsent&&!v.phone){this.error.set(new UiError('Indica el teléfono que deseas usar con WhatsApp',{phone:['Escribe el teléfono o desactiva el consentimiento']}));return;}
    this.busy.set(true);this.error.set(null);this.success.set('');
    const input={name:v.name,territory:v.territory,roles:v.roles,phone:v.phone||null,contactConsent:v.contactConsent};
    try{
      if(this.auth.profile()){await this.auth.update(input);this.success.set('Tu perfil quedó actualizado.');}
      else{await this.auth.register({...input,email:v.email,password:v.password,privacyConsent:v.privacyConsent});await this.auth.login(v.email,v.password);this.form.controls.password.reset();await this.router.navigateByUrl('/mis-publicaciones');}
    }catch(e){this.error.set(uiError(e));}finally{this.busy.set(false);}
  }
  async logout(){this.busy.set(true);try{await this.auth.logout();await this.router.navigateByUrl('/');}catch(e){this.error.set(uiError(e));}finally{this.busy.set(false);}}
  async deactivate(){if(!this.confirmed())return;this.busy.set(true);try{await this.auth.deactivate();this.deactivationOpen.set(false);await this.router.navigateByUrl('/');}catch(e){this.error.set(uiError(e));}finally{this.busy.set(false);}}
}

