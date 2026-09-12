import type { Actor } from '../../shared/ports.js';
export type ReportTarget='publication'|'profile'|'contribution';
export type Decision='hide'|'restore'|'dismiss'|'escalate';
export interface ReportInput {targetType:ReportTarget;targetId:string;category:string;detail:string}
export interface Report extends ReportInput {
  id:string;reporterId:string;publicationId:string;contributionId:string|null;accountId:string;
  status:'pending'|'resolved'|'escalated';version:number;createdAt:Date;summary?:string;content?:string;
}
export interface ReportRepository {
  resolve(type:ReportTarget,id:string):Promise<{publicationId:string;contributionId:string|null;accountId:string}|undefined>;
  create(report:Report):Promise<void>;
  list(page:number):Promise<Report[]>;
  find(id:string):Promise<Report|undefined>;
  decide(actor:Actor,report:Report,version:number,decision:Decision,reason:string):Promise<boolean>;
}

