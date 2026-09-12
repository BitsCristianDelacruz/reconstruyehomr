import { Component,ElementRef,effect,input,output,viewChild } from '@angular/core';
@Component({selector:'app-dialog',standalone:true,template:`<dialog #native class="dialog" [attr.aria-labelledby]="labelId()" (cancel)="cancel($event)"><ng-content /></dialog>`})
export class AppDialog {
  readonly opened=input(false);readonly labelId=input.required<string>();readonly dismissed=output<void>();
  private readonly element=viewChild<ElementRef<HTMLDialogElement>>('native');
  constructor(){effect(()=>{const dialog=this.element()?.nativeElement;if(!dialog)return;if(this.opened()&&!dialog.open)dialog.showModal();else if(!this.opened()&&dialog.open)dialog.close();});}
  cancel(event:Event){event.preventDefault();this.dismissed.emit();}
}

