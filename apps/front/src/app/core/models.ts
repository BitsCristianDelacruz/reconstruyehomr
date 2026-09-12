export interface CatalogEntry {group:string;code:string;label:string;active:boolean;position:number}
export interface Catalogs {entries:CatalogEntry[];features:Record<string,boolean>}
export interface Profile {id:string;email:string;name:string;territory:string;roles:string[];phone:string|null;contactConsent:boolean;state:string;createdAt:string}
export interface ProfileInput {name:string;territory:string;roles:string[];phone:string|null;contactConsent:boolean}
export interface PublicationInput {title:string;description:string;category:string;territory:string;zone:string;urgency:string|null;damage:string;availability:string;conditions:string;contactEnabled:boolean;safetyAccepted:boolean}
export interface Publication extends PublicationInput {
  id:string;kind:'need'|'offer';state:'draft'|'published'|'paused'|'closed';version:number;
  createdAt:string;updatedAt:string;categoryLabel?:string;territoryLabel?:string;contactAvailable:boolean;
  trust:'declared';isOwner?:boolean;hidden?:boolean;moderationState?:string;timeline?:TimelineEvent[];
}
export interface TimelineEvent {action:string;state:string;createdAt:string;contributionId?:string|null;contributionType?:string|null}
export interface Wall {items:Publication[];total:number;page:number;limit:number}
export interface Contribution {id:string;publicationId:string;type:string;state:string;version:number;createdAt:string;updatedAt:string;isContributor:boolean;isOwner:boolean;note?:string;publicationTitle?:string;history?:TimelineEvent[]}
export interface Report {id:string;targetType:string;targetId:string;publicationId:string;contributionId:string|null;category:string;detail:string;status:string;version:number;createdAt:string;summary?:string;content?:string}
export interface ManagedAccount {id:string;email:string;name:string;state:string;roles:string[]}
export interface AuditEntry {id:string;actorId:string;action:string;targetId:string;reason:string|null;createdAt:string}
export interface Ready {status:string;database:{status:string;name:string;time:string};application:{name:string;initializedAt:string}}
