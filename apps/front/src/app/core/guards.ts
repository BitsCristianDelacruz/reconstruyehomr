import { inject } from '@angular/core';
import { Router,type CanActivateFn } from '@angular/router';
import { AuthStore } from './services';
export const authenticated:CanActivateFn=async(_route,state)=>{
  const auth=inject(AuthStore),router=inject(Router);await auth.ready.catch(()=>undefined);
  return auth.profile()?true:router.createUrlTree(['/cuenta'],{queryParams:{returnUrl:state.url}});
};
export const moderationAccess:CanActivateFn=async()=>{
  const auth=inject(AuthStore),router=inject(Router);await auth.ready.catch(()=>undefined);
  return auth.hasRole('admin','moderator')?true:router.createUrlTree(['/cuenta']);
};

