export const catalogGroups = ['category', 'territory', 'urgency', 'reportCategory', 'needState', 'offerState', 'safety'] as const;
export interface CatalogEntry { group: string; code: string; label: string; active: boolean; position: number }
export interface CatalogRepository { list(): Promise<CatalogEntry[]> }
export const features = Object.freeze({ evidence: false, allyValidation: false, exports: false, payments: false });
export class CatalogService {
  constructor(private readonly repository: CatalogRepository) {}
  async all(includeInactive = false) {
    const entries = await this.repository.list();
    return { entries: entries.filter(entry => includeInactive || entry.active), features };
  }
  async isActive(group: string, code: string) {
    return (await this.repository.list()).some(entry => entry.group === group && entry.code === code && entry.active);
  }
}
