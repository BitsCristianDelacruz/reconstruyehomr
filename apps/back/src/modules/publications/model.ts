export type PublicationKind = 'need' | 'offer';
export type PublicationState = 'draft' | 'published' | 'paused' | 'closed';
export interface PublicationInput {
  title: string; description: string; category: string; territory: string; zone: string;
  urgency: string | null; damage: string; availability: string; conditions: string;
  contactEnabled: boolean; safetyAccepted: boolean;
}
export interface Publication extends PublicationInput {
  id: string; authorId: string; kind: PublicationKind; state: PublicationState; hidden: boolean;
  version: number; createdAt: Date; updatedAt: Date; authorActive: boolean;
  categoryLabel?: string; territoryLabel?: string;
  authorContactAllowed?: boolean; reported?: boolean;
}
export interface PublicationFilter { kind?: PublicationKind; category?: string; territory?: string; urgency?: string; state: 'published'|'closed'; page: number; limit: number }
export interface PublicationEvent { action: string; state: string; createdAt: Date; contributionId?:string|null; contributionType?:string|null }
export interface PublicationRepository {
  create(publication: Publication): Promise<void>;
  find(id: string): Promise<Publication | undefined>;
  update(publication: Publication, expectedVersion: number, action: string): Promise<boolean>;
  wall(filter: PublicationFilter): Promise<{items: Publication[]; total: number}>;
  mine(authorId: string): Promise<Publication[]>;
  timeline(id: string): Promise<PublicationEvent[]>;
}
export function isPublic(publication: Publication) {
  return publication.authorActive && !publication.hidden && ['published','closed'].includes(publication.state);
}
export function publicPublication(p: Publication) {
  return {id:p.id,kind:p.kind,title:p.title,description:p.description,category:p.category,categoryLabel:p.categoryLabel,
    territory:p.territory,territoryLabel:p.territoryLabel,zone:p.zone,urgency:p.urgency,damage:p.damage,availability:p.availability,
    conditions:p.conditions,state:p.state,version:p.version,createdAt:p.createdAt,updatedAt:p.updatedAt,
    contactAvailable:p.contactEnabled&&p.authorContactAllowed===true&&p.state==='published',trust:'declared' as const};
}
export function ownedPublication(p: Publication) {
  return {...publicPublication(p),contactEnabled:p.contactEnabled,safetyAccepted:p.safetyAccepted,hidden:p.hidden,moderationState:p.hidden?'hidden':p.reported?'reported':'clear'};
}
