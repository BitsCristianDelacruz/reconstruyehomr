import { Injectable,inject } from '@angular/core';
import { HttpClient,HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom,timeout } from 'rxjs';
declare global {interface Window {__APP_CONFIG__?:{apiBaseUrl?:string}}}
export class UiError extends Error {constructor(message:string,public readonly fields:Record<string,string[]>={},public readonly status=0){super(message);}}
export function uiError(error:unknown):UiError{
  if(error instanceof UiError)return error;
  if(error instanceof HttpErrorResponse)return new UiError(error.error?.message??'No se pudo completar la operación. Conservamos tus datos; vuelve a intentar.',error.error?.fields??{},error.status);
  return new UiError('No se pudo completar la operación. Revisa la conexión y vuelve a intentar.');
}
@Injectable({providedIn:'root'})
export class ApiClient {
  private readonly http=inject(HttpClient);
  private readonly base=(window.__APP_CONFIG__?.apiBaseUrl??'/api').replace(/\/$/,'');
  async request<T>(method:string,path:string,body?:unknown,headers:Record<string,string>={}):Promise<T>{
    try{return await firstValueFrom(this.http.request<T>(method,this.base+path,{body,withCredentials:true,headers:{'X-Requested-With':'ReconstruyeHome',...headers}}).pipe(timeout(15000)));}
    catch(error){throw uiError(error);}
  }
}

