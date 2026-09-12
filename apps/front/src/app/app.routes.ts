import type { Routes } from '@angular/router';
import { authenticated,moderationAccess } from './core/guards';
export const routes:Routes=[
  {path:'',loadComponent:()=>import('./features/wall/wall').then(m=>m.WallPage),title:'Muro · ReconstruyeHome'},
  {path:'publicar',canActivate:[authenticated],loadComponent:()=>import('./features/publish/publish').then(m=>m.PublishPage),title:'Publicar · ReconstruyeHome'},
  {path:'editar/:id',canActivate:[authenticated],loadComponent:()=>import('./features/publish/publish').then(m=>m.PublishPage),title:'Editar · ReconstruyeHome'},
  {path:'publicacion/:id',loadComponent:()=>import('./features/detail/detail').then(m=>m.DetailPage),title:'Publicación · ReconstruyeHome'},
  {path:'mis-publicaciones',canActivate:[authenticated],loadComponent:()=>import('./features/mine/mine').then(m=>m.MinePage),title:'Mis publicaciones · ReconstruyeHome'},
  {path:'cuenta',loadComponent:()=>import('./features/account/account').then(m=>m.AccountPage),title:'Mi cuenta · ReconstruyeHome'},
  {path:'seguridad',loadComponent:()=>import('./features/safety/safety').then(m=>m.SafetyPage),title:'Seguridad · ReconstruyeHome'},
  {path:'administracion',canActivate:[moderationAccess],loadComponent:()=>import('./features/admin/admin').then(m=>m.AdminPage),title:'Administración · ReconstruyeHome'},
  {path:'estado',loadComponent:()=>import('./features/safety/status').then(m=>m.StatusPage),title:'Estado local · ReconstruyeHome'},
  {path:'**',redirectTo:''}
];

