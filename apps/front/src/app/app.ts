import { Component,inject } from '@angular/core';
import { RouterLink,RouterLinkActive,RouterOutlet } from '@angular/router';
import { AuthStore } from './core/services';
@Component({selector:'app-root',standalone:true,imports:[RouterLink,RouterLinkActive,RouterOutlet],templateUrl:'./app.html'})
export class App {
  readonly auth=inject(AuthStore);
  constructor(){void this.auth.ready.catch(()=>undefined);}
}
