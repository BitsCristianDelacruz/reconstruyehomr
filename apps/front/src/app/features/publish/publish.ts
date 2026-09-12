import { Component,inject,signal } from '@angular/core';
import { FormBuilder,ReactiveFormsModule,Validators } from '@angular/forms';
import { ActivatedRoute,Router,RouterLink } from '@angular/router';
import { AuthStore,CatalogService,PublicationService } from '../../core/services';
import type { Publication,PublicationInput } from '../../core/models';
import { UiError,uiError } from '../../core/api';
import { ErrorNotice,FieldError } from '../../shared/feedback';
@Component({standalone:true,imports:[ReactiveFormsModule,RouterLink,ErrorNotice,FieldError],templateUrl:'./publish.html'})
export class PublishPage{
  readonly catalogs=inject(CatalogService);readonly auth=inject(AuthStore);private readonly api=inject(PublicationService);private readonly route=inject(ActivatedRoute);private readonly router=inject(Router);
  private readonly fb=inject(FormBuilder).nonNullable;
  readonly form=this.fb.group({kind:this.fb.control<'need'|'offer'>('need'),title:['',[Validators.required,Validators.minLength(2),Validators.maxLength(120)]],
    description:['',[Validators.required,Validators.minLength(2),Validators.maxLength(3000)]],category:['',Validators.required],territory:['',Validators.required],
    zone:['',[Validators.required,Validators.minLength(2),Validators.maxLength(120)]],urgency:[''],damage:['',Validators.maxLength(500)],
    availability:['',Validators.maxLength(500)],conditions:['',Validators.maxLength(1000)],contactEnabled:false,safetyAccepted:[false,Validators.requiredTrue]});
  readonly step=signal(1);readonly existing=signal<Publication|null>(null);readonly loading=signal(true);readonly busy=signal(false);readonly error=signal<UiError|null>(null);readonly success=signal('');
  constructor(){void this.initialize();}
  async initialize(){try{await this.catalogs.load();const id=this.route.snapshot.paramMap.get('id');if(id){const p=await this.api.own(id);this.existing.set(p);this.form.patchValue({...p,urgency:p.urgency??''});this.form.controls.kind.disable();if(p.hidden)throw new UiError('La publicación está restringida. No admite cambios mientras esté oculta.');this.step.set(2);}}
    catch(e){this.error.set(uiError(e));}finally{this.loading.set(false);}}
  private validateDetails(){
    const need=this.form.controls.kind.value==='need';
    this.form.controls.urgency.setValidators(need?[Validators.required]:[]);
    this.form.controls.damage.setValidators(need?[Validators.required,Validators.minLength(2),Validators.maxLength(500)]:[Validators.maxLength(500)]);
    this.form.controls.availability.setValidators(need?[Validators.maxLength(500)]:[Validators.required,Validators.minLength(2),Validators.maxLength(500)]);
    this.form.controls.conditions.setValidators(need?[Validators.maxLength(1000)]:[Validators.required,Validators.minLength(2),Validators.maxLength(1000)]);
    for(const key of ['urgency','damage','availability','conditions'] as const)this.form.controls[key].updateValueAndValidity();
    const keys=['title','description','category','territory','zone','urgency','damage','availability','conditions'] as const;
    for(const key of keys)this.form.controls[key].markAsTouched();
    return keys.every(key=>this.form.controls[key].valid);
  }
  next(){this.error.set(null);if(this.step()===1){this.step.set(2);return;}if(this.validateDetails())this.step.set(3);}
  private values():PublicationInput{const {kind,...v}=this.form.getRawValue();return {...v,urgency:kind==='need'?(v.urgency||null):null,damage:kind==='need'?v.damage:'',availability:kind==='offer'?v.availability:'',conditions:kind==='offer'?v.conditions:''};}
  async save(draft=false){
    if(!draft&&this.step()<3){this.next();return;}
    if(!draft&&(!this.validateDetails()||!this.form.controls.safetyAccepted.value)){this.form.markAllAsTouched();this.error.set(new UiError('Completa los campos y acepta las recomendaciones para publicar.'));return;}
    this.busy.set(true);this.error.set(null);this.success.set('');
    try{
      const existing=this.existing();let publication:Publication;
      if(existing){publication=await this.api.edit(existing.id,existing.version,this.values());this.existing.set(publication);if(!draft&&publication.state==='draft')publication=await this.api.transition(publication,'publish');}
      else publication=await this.api.create(this.form.controls.kind.value,this.values(),draft?'draft':'published');
      this.existing.set(publication);
      this.form.controls.kind.disable();
      if(draft){this.success.set('Borrador guardado en tu cuenta. Puedes continuar desde Mis publicaciones.');}
      else{await this.router.navigate(publication.state==='published'?['/publicacion',publication.id]:['/mis-publicaciones']);}
    }catch(e){this.error.set(uiError(e));}finally{this.busy.set(false);}
  }
}
