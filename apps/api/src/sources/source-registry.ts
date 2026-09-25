import { Injectable } from '@nestjs/common';
import { ArbeitnowAdapter } from './adapters/arbeitnow.adapter.js';
import { AshbyAdapter } from './adapters/ashby.adapter.js';
import { GreenhouseAdapter } from './adapters/greenhouse.adapter.js';
import { HimalayasAdapter } from './adapters/himalayas.adapter.js';
import { HnAdapter } from './adapters/hn.adapter.js';
import { JobicyAdapter } from './adapters/jobicy.adapter.js';
import { LeverAdapter } from './adapters/lever.adapter.js';
import { RemoteOkAdapter } from './adapters/remoteok.adapter.js';
import { RemotiveAdapter } from './adapters/remotive.adapter.js';
import { WeWorkRemotelyAdapter } from './adapters/weworkremotely.adapter.js';
import { WorkingNomadsAdapter } from './adapters/workingnomads.adapter.js';
import { LandingJobsAdapter } from './adapters/landingjobs.adapter.js';
import { TheMuseAdapter } from './adapters/themuse.adapter.js';
import { JobspressoAdapter } from './adapters/jobspresso.adapter.js';
import { WorkableAdapter } from './adapters/workable.adapter.js';
import { SmartRecruitersAdapter } from './adapters/smartrecruiters.adapter.js';
import type {
  BoardAdapter,
  BoardProvider,
  Source,
  SourceAdapter,
} from './source.types.js';

export const ADAPTERS = [
  HnAdapter,
  RemotiveAdapter,
  RemoteOkAdapter,
  ArbeitnowAdapter,
  HimalayasAdapter,
  JobicyAdapter,
  WeWorkRemotelyAdapter,
  GreenhouseAdapter,
  LeverAdapter,
  AshbyAdapter,
  WorkingNomadsAdapter,
  LandingJobsAdapter,
  TheMuseAdapter,
  JobspressoAdapter,
  WorkableAdapter,
  SmartRecruitersAdapter,
];

@Injectable()
export class SourceRegistry {
  private readonly adapters: Map<Source, SourceAdapter>;

  constructor(
    hn: HnAdapter,
    remotive: RemotiveAdapter,
    remoteOk: RemoteOkAdapter,
    arbeitnow: ArbeitnowAdapter,
    himalayas: HimalayasAdapter,
    jobicy: JobicyAdapter,
    weWorkRemotely: WeWorkRemotelyAdapter,
    greenhouse: GreenhouseAdapter,
    lever: LeverAdapter,
    ashby: AshbyAdapter,
    workingNomads: WorkingNomadsAdapter,
    landingJobs: LandingJobsAdapter,
    theMuse: TheMuseAdapter,
    jobspresso: JobspressoAdapter,
    workable: WorkableAdapter,
    smartRecruiters: SmartRecruitersAdapter,
  ) {
    const all: SourceAdapter[] = [
      hn,
      remotive,
      remoteOk,
      arbeitnow,
      himalayas,
      jobicy,
      weWorkRemotely,
      greenhouse,
      lever,
      ashby,
      workingNomads,
      landingJobs,
      theMuse,
      jobspresso,
      workable,
      smartRecruiters,
    ];
    this.adapters = new Map(all.map((adapter) => [adapter.source, adapter]));
  }

  get(source: Source): SourceAdapter {
    const adapter = this.adapters.get(source);
    if (!adapter) {
      throw new Error(`No adapter registered for source ${source}`);
    }
    return adapter;
  }

  board(provider: BoardProvider): BoardAdapter {
    return this.get(provider) as BoardAdapter;
  }
}
