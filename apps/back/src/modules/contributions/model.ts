export type ContributionState='declared'|'coordinated'|'received'|'cancelled'|'reported';
export interface Contribution {
  id:string;publicationId:string;contributorId:string;type:string;note:string;
  state:ContributionState;version:number;idempotencyKey:string;fingerprint:string;createdAt:Date;updatedAt:Date;
  hidden?:boolean;
}
export interface ContributionEvent {action:string;state:string;createdAt:Date}
export interface ContributionRepository {
  find(id:string):Promise<Contribution|undefined>;
  findByKey(actorId:string,key:string):Promise<Contribution|undefined>;
  create(contribution:Contribution):Promise<{value:Contribution;replayed:boolean}>;
  update(contribution:Contribution,expectedVersion:number,actorId:string,action:string):Promise<boolean>;
  list(publicationId:string):Promise<Contribution[]>;
  mine(actorId:string):Promise<Contribution[]>;
  history(id:string):Promise<ContributionEvent[]>;
}
