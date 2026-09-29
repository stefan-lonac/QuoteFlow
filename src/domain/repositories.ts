import type { EntityName, Row } from "./catalog";
export type Snapshot = Record<EntityName, Row[]>;
export interface Repository {
  list(): Promise<Row[]>;
  get(id: string): Promise<Row | null>;
  save(row: Row): Promise<void>;
  remove(id: string): Promise<void>;
}
export interface ClientRepository extends Repository {}
export interface ProjectRepository extends Repository {}
export interface EstimateRepository extends Repository {}
export interface ProposalRepository extends Repository {}
export interface TechnologyRepository extends Repository {}
export interface ServiceRepository extends Repository {}
export interface RevenueRepository extends Repository {}
export interface SettingsRepository extends Repository {}
export interface DataStore {
  repository(entity: EntityName): Repository;
  snapshot(): Promise<Snapshot>;
  restore(snapshot: Snapshot): Promise<void>;
  transaction(work: () => Promise<void>): Promise<void>;
}
