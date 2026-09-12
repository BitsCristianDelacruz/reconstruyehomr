import { Component,inject,signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder,ReactiveFormsModule } from '@angular/forms';
import { CatalogService,PublicationService } from '../../core/services';
import type { Wall } from '../../core/models';
import { UiError,uiError } from '../../core/api';
import { ErrorNotice } from '../../shared/feedback';
@Component({standalone:true,imports:[RouterLink,DatePipe,ReactiveFormsModule,ErrorNotice],templateUrl:'./wall.html'})
export class WallPage {
  readonly catalogs=inject(CatalogService);private readonly publications=inject(PublicationService);
  readonly filters=inject(FormBuilder).nonNullable.group({kind:'',category:'',territory:'',urgency:'',state:'published'});
  readonly wall=signal<Wall|null>(null);readonly error=signal<UiError|null>(null);readonly loading=signal(true);readonly page=signal(1);private requestId=0;
  constructor(){void this.initialize();}
  async initialize(){try{await this.catalogs.load();await this.load();}catch(e){this.error.set(uiError(e));this.loading.set(false);}}
  async load(page=1){
    const requestId=++this.requestId;this.page.set(page);this.error.set(null);this.loading.set(true);
    try{const wall=await this.publications.wall({...this.filters.getRawValue(),page,limit:12});if(requestId===this.requestId)this.wall.set(wall);}
    catch(e){if(requestId===this.requestId)this.error.set(uiError(e));}
    finally{if(requestId===this.requestId)this.loading.set(false);}
  }
  category(code:string){this.filters.controls.category.setValue(code);void this.load();}
  clear(){this.filters.reset({kind:'',category:'',territory:'',urgency:'',state:'published'});void this.load();}
}

