import { requireThat } from '../../shared/errors.js';
import type { Actor, Runtime } from '../../shared/ports.js';
export interface ContactTarget { phone: string; available: boolean }
export interface ContactRepository {
  target(id:string):Promise<ContactTarget|undefined>;
  grant(actorId:string,publicationId:string,phone:string,at:Date):Promise<boolean>;
}
export class ContactService {
  constructor(private readonly repository:ContactRepository,private readonly runtime:Runtime){}
  async request(actor:Actor,id:string,confirmed:boolean) {
    requireThat(confirmed,400,'Confirma que leíste las recomendaciones antes de abrir WhatsApp');
    const target=await this.repository.target(id);
    requireThat(target?.available&&/^\+[1-9]\d{7,14}$/.test(target.phone),404,'Esta publicación no tiene contacto disponible');
    requireThat(await this.repository.grant(actor.id,id,target.phone,this.runtime.now()),409,'El contacto cambió. Actualiza la publicación');
    return {url:'https://wa.me/'+target.phone.slice(1)+'?text='+encodeURIComponent('Hola. Te contacto por la publicación '+id+' en ReconstruyeHome. Quisiera coordinar una ayuda en especie.'),message:'Se abrirá WhatsApp. Puedes editar el mensaje antes de enviarlo.'};
  }
}
