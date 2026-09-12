import { Component,input } from '@angular/core';
import type { AbstractControl } from '@angular/forms';
import type { UiError } from '../core/api';
@Component({selector:'app-error',standalone:true,template:`@if(error()){<div class="error" role="alert">{{error()!.message}}</div>}`})
export class ErrorNotice{readonly error=input<UiError|null>(null);}
@Component({selector:'app-field-error',standalone:true,template:`@if(message()){<small class="field-error" role="alert">{{message()}}</small>}`})
export class FieldError{
  readonly control=input<AbstractControl|null>(null);readonly name=input('');readonly server=input<UiError|null>(null);
  message(){const server=this.server()?.fields[this.name()];if(server?.length)return server.join('. ');const c=this.control();
    if(!c?.touched||!c.invalid)return '';
    if(c.hasError('required'))return 'Completa este campo.';
    if(c.hasError('email'))return 'Escribe un correo válido.';
    if(c.hasError('minlength'))return 'El contenido es demasiado corto.';
    if(c.hasError('maxlength'))return 'El contenido es demasiado largo.';
    return 'Revisa el formato de este campo.';
  }
}

