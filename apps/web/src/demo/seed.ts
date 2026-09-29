import type {
  Level,
  Application,
  IngestRun,
  Posting,
  RemoteType,
  Reminder,
  Source,
  Stage,
  StageEvent,
  WatchedBoard,
} from '../lib/types';
import { SOURCES } from '../lib/sources';
import { findRegionTerms, regionBasis } from './regions';
import { detectLevel } from './level';
import { score, MATCH_THRESHOLD } from './scoring';
import type { DemoState, StoredMatch } from './store';

const DAY = 86_400_000;
const HOUR = 3_600_000;
const SOURCE_KIND_BOARD = new Set<Source>([
  'GREENHOUSE',
  'LEVER',
  'ASHBY',
  'WORKABLE',
  'SMARTRECRUITERS',
]);

type PostingSeed = {
  source: Source;
  boardId: string;
  company: string;
  role: string;
  location: string;
  remote: RemoteType;
  salary?: [number, number] | string;
  stack: string[];
  daysAgo: number;
  blurb: string;
  host: string;
};

const STACK_LINE: Record<string, string> = {
  typescript: 'TypeScript everywhere',
  node: 'Node services',
  react: 'a React front end',
  'next.js': 'Next.js',
  nestjs: 'NestJS',
  postgres: 'Postgres',
  aws: 'AWS',
  gcp: 'GCP',
  go: 'Go services',
  python: 'Python',
  django: 'Django',
  rust: 'Rust',
  kubernetes: 'Kubernetes',
  terraform: 'Terraform',
  redis: 'Redis',
  kafka: 'Kafka',
  graphql: 'GraphQL',
  java: 'Java',
  kotlin: 'Kotlin',
  ruby: 'Ruby',
  rails: 'Rails',
  php: 'PHP',
  wordpress: 'WordPress',
  vue: 'Vue',
  'react native': 'React Native',
  swift: 'Swift',
  elixir: 'Elixir',
  'c#': 'C#',
  '.net': '.NET',
  docker: 'Docker',
  mongodb: 'MongoDB',
  flutter: 'Flutter',
  angular: 'Angular',
  svelte: 'Svelte',
  llm: 'LLM tooling',
  pytorch: 'PyTorch',
};

const POSTINGS: PostingSeed[] = [
  {
    source: 'HN',
    boardId: '49501234',
    company: 'Northwind Labs',
    role: 'Senior Full Stack Engineer',
    location: 'Remote (US, Canada)',
    remote: 'REMOTE',
    salary: [165_000, 195_000],
    stack: ['typescript', 'node', 'react', 'postgres', 'aws'],
    daysAgo: 2,
    blurb:
      'We build logistics software for regional freight carriers — the tools dispatchers use every hour of every shift. Small team, shipped weekly, no product managers between you and the people who use it.',
    host: 'northwindlabs.com',
  },
  {
    source: 'HN',
    boardId: '49501234',
    company: 'Tidewater Analytics',
    role: 'Software Engineer, Backend',
    location: 'Remote (worldwide)',
    remote: 'REMOTE',
    salary: [130_000, 160_000],
    stack: ['typescript', 'nestjs', 'postgres', 'redis', 'kubernetes'],
    daysAgo: 3,
    blurb:
      'Tidewater turns tide-gauge and buoy data into forecasts for ports. You would own the ingestion pipeline and the public API. We run one Postgres and are proud of it.',
    host: 'tidewater.io',
  },
  {
    source: 'HN',
    boardId: '49501234',
    company: 'Marrow',
    role: 'Full-stack Engineer (Product)',
    location: 'Remote (EU time zones)',
    remote: 'REMOTE',
    salary: [110_000, 140_000],
    stack: ['typescript', 'next.js', 'react', 'postgres'],
    daysAgo: 4,
    blurb:
      'Marrow is a scheduling tool for small clinics. Three engineers, one designer, a thousand paying clinics. We pair for anything hairy and write down every decision.',
    host: 'marrow.health',
  },
  {
    source: 'HN',
    boardId: '49501234',
    company: 'Corvid Systems',
    role: 'Platform Engineer',
    location: 'Berlin | Hybrid',
    remote: 'HYBRID',
    salary: '€95k–€120k',
    stack: ['go', 'kubernetes', 'terraform', 'aws'],
    daysAgo: 5,
    blurb:
      'Corvid runs managed Kafka for European fintechs. You would keep three regions healthy and make our upgrade story boring. Two days a week in Kreuzberg.',
    host: 'corvid.systems',
  },
  {
    source: 'HN',
    boardId: '49501234',
    company: 'Halyard',
    role: 'Founding Engineer',
    location: 'Remote (US)',
    remote: 'REMOTE',
    salary: [170_000, 210_000],
    stack: ['typescript', 'react', 'node', 'postgres', 'llm'],
    daysAgo: 6,
    blurb:
      'Halyard drafts insurance claims letters from adjuster notes. Seed funded, two founders who both still write code, first hire in engineering. Equity is real and explained on the call.',
    host: 'halyard.co',
  },
  {
    source: 'HN',
    boardId: '49501234',
    company: 'Pinewood Software',
    role: 'Senior Software Engineer',
    location: 'Remote (Philippines, Singapore, Australia)',
    remote: 'REMOTE',
    salary: [90_000, 120_000],
    stack: ['typescript', 'node', 'react', 'aws', 'graphql'],
    daysAgo: 7,
    blurb:
      'Pinewood makes point-of-sale software for hardware stores across Southeast Asia and Australia. APAC-first hours, async by default, a team that has worked together for years.',
    host: 'pinewood.software',
  },
  {
    source: 'HN',
    boardId: '49501234',
    company: 'Oxbow',
    role: 'Staff Engineer, Infrastructure',
    location: 'Remote (US)',
    remote: 'REMOTE',
    salary: [210_000, 250_000],
    stack: ['go', 'rust', 'kubernetes', 'aws'],
    daysAgo: 8,
    blurb:
      'Oxbow builds the storage layer under three well-known analytics products. Deep systems work, small blast radius, long tenure.',
    host: 'oxbow.dev',
  },
  {
    source: 'HN',
    boardId: '49501234',
    company: 'Lanternfish',
    role: 'Full Stack Developer',
    location: 'Onsite | Austin, TX',
    remote: 'ONSITE',
    salary: [140_000, 170_000],
    stack: ['typescript', 'react', 'node', 'postgres'],
    daysAgo: 9,
    blurb:
      'Lanternfish is a hardware-plus-software company making warehouse scanners. The software team sits with the hardware team on purpose; this one is in the office.',
    host: 'lanternfish.co',
  },
  {
    source: 'HN',
    boardId: '49501234',
    company: 'Quillon',
    role: 'Backend Engineer (Ruby)',
    location: 'Remote (Americas)',
    remote: 'REMOTE',
    salary: [120_000, 150_000],
    stack: ['ruby', 'rails', 'postgres', 'redis'],
    daysAgo: 10,
    blurb:
      'Quillon is payroll for creative agencies. Rails monolith, well tested, boring in the good way. You would own the payments integrations.',
    host: 'quillon.com',
  },
  {
    source: 'HN',
    boardId: '49501234',
    company: 'Fable & Forge',
    role: 'WordPress Developer',
    location: 'Remote',
    remote: 'REMOTE',
    salary: [60_000, 80_000],
    stack: ['php', 'wordpress', 'mysql'],
    daysAgo: 11,
    blurb: 'Agency work for publishing clients, mostly WordPress and WooCommerce. Flexible hours.',
    host: 'fableandforge.agency',
  },
  {
    source: 'HN',
    boardId: '49501234',
    company: 'Saltmarsh',
    role: 'Software Engineer',
    location: 'Remote (UK/EU)',
    remote: 'REMOTE',
    salary: '£75k–£95k',
    stack: ['typescript', 'node', 'react', 'postgres', 'gcp'],
    daysAgo: 12,
    blurb:
      'Saltmarsh is carbon accounting for food producers. Small product team, direct customer contact, GCP and Postgres.',
    host: 'saltmarsh.earth',
  },
  {
    source: 'HN',
    boardId: '49501234',
    company: 'Brightline Robotics',
    role: 'Senior Software Engineer, Fleet Tools',
    location: 'Remote (US) or Boston',
    remote: 'REMOTE',
    salary: [160_000, 190_000],
    stack: ['typescript', 'react', 'python', 'postgres', 'kafka'],
    daysAgo: 13,
    blurb:
      'We operate a fleet of inventory robots in grocery stores. This role owns the tools our field team uses to monitor and fix them.',
    host: 'brightline.bot',
  },
  {
    source: 'HN',
    boardId: '49501234',
    company: 'Aster Health',
    role: 'Principal Engineer',
    location: 'Remote (US)',
    remote: 'REMOTE',
    salary: [230_000, 270_000],
    stack: ['java', 'kotlin', 'postgres', 'aws'],
    daysAgo: 14,
    blurb: 'Aster is a telehealth platform. This is a technical leadership role across four teams.',
    host: 'asterhealth.com',
  },
  {
    source: 'HN',
    boardId: '49501234',
    company: 'Cinder',
    role: 'Full Stack Engineer',
    location: 'Remote (worldwide)',
    remote: 'REMOTE',
    stack: ['typescript', 'svelte', 'node', 'postgres'],
    daysAgo: 15,
    blurb:
      'Cinder is an open-source incident timeline tool with a hosted version. You would split time between the open-source repo and the cloud product.',
    host: 'cinder.run',
  },
  {
    source: 'HN',
    boardId: '49501234',
    company: 'Greywater',
    role: 'Data Engineer',
    location: 'Remote (US)',
    remote: 'REMOTE',
    salary: [150_000, 180_000],
    stack: ['python', 'postgres', 'kafka', 'aws'],
    daysAgo: 16,
    blurb:
      'Greywater builds water-usage analytics for municipal utilities. Pipelines, warehouses, and a small API layer.',
    host: 'greywater.io',
  },
  {
    source: 'HN',
    boardId: '49501234',
    company: 'Kestrel Labs',
    role: 'Software Engineer II (Full Stack)',
    location: 'Remote (US, Canada, Mexico)',
    remote: 'REMOTE',
    salary: [135_000, 165_000],
    stack: ['typescript', 'react', 'nestjs', 'postgres', 'aws'],
    daysAgo: 18,
    blurb:
      'Kestrel is a field-service app for HVAC companies. Mobile-first product, NestJS API, weekly releases, on-call that is genuinely quiet.',
    host: 'kestrel-labs.com',
  },
  {
    source: 'HN',
    boardId: '49501234',
    company: 'Moss & Meadow',
    role: 'Frontend Engineer',
    location: 'Remote (EU)',
    remote: 'REMOTE',
    salary: '€70k–€90k',
    stack: ['typescript', 'react', 'next.js', 'graphql'],
    daysAgo: 20,
    blurb:
      'A B2B marketplace for landscaping supplies. You would own the storefront and design system.',
    host: 'mossandmeadow.eu',
  },
  {
    source: 'HN',
    boardId: '49501234',
    company: 'Two Rivers',
    role: 'Senior Backend Engineer (Go)',
    location: 'Remote (US)',
    remote: 'REMOTE',
    salary: [175_000, 205_000],
    stack: ['go', 'postgres', 'kubernetes', 'gcp'],
    daysAgo: 22,
    blurb:
      'Two Rivers is a payments orchestration layer for marketplaces. Go services, strict SLOs, good on-call compensation.',
    host: 'tworivers.dev',
  },
  {
    source: 'REMOTIVE',
    boardId: 'software-dev',
    company: 'Waypoint Learning',
    role: 'Full Stack Engineer',
    location: 'Worldwide',
    remote: 'REMOTE',
    salary: [95_000, 125_000],
    stack: ['typescript', 'react', 'node', 'postgres'],
    daysAgo: 1,
    blurb:
      'Waypoint builds course tooling for vocational schools. Fully remote since 2019, four-day weeks in summer.',
    host: 'remotive.com',
  },
  {
    source: 'REMOTIVE',
    boardId: 'software-dev',
    company: 'Sable Finance',
    role: 'Backend Engineer (Node.js)',
    location: 'USA, Canada',
    remote: 'REMOTE',
    salary: [140_000, 170_000],
    stack: ['typescript', 'node', 'postgres', 'redis', 'aws'],
    daysAgo: 2,
    blurb:
      'Sable is a treasury product for mid-sized companies. Event-sourced ledger, strong typing, quarterly audits we pass without drama.',
    host: 'remotive.com',
  },
  {
    source: 'REMOTIVE',
    boardId: 'software-dev',
    company: 'Orchard Commerce',
    role: 'Senior Software Engineer',
    location: 'Europe',
    remote: 'REMOTE',
    salary: '€80k–€110k',
    stack: ['typescript', 'next.js', 'react', 'postgres', 'gcp'],
    daysAgo: 4,
    blurb: 'Orchard is headless commerce for grocers. Storefront performance is the whole game.',
    host: 'remotive.com',
  },
  {
    source: 'REMOTIVE',
    boardId: 'software-dev',
    company: 'Redwood Systems',
    role: 'DevOps Engineer',
    location: 'Worldwide',
    remote: 'REMOTE',
    stack: ['kubernetes', 'terraform', 'aws', 'go'],
    daysAgo: 6,
    blurb: 'Platform team for a 200-person SaaS. You would own CI and the Kubernetes clusters.',
    host: 'remotive.com',
  },
  {
    source: 'REMOTIVE',
    boardId: 'software-dev',
    company: 'Hollowell',
    role: 'Software Engineer, Integrations',
    location: 'USA',
    remote: 'REMOTE',
    salary: [120_000, 145_000],
    stack: ['python', 'django', 'postgres', 'aws'],
    daysAgo: 9,
    blurb:
      'Hollowell connects property managers to accounting systems. Lots of third-party APIs, lots of edge cases, well-paid patience.',
    host: 'remotive.com',
  },
  {
    source: 'REMOTIVE',
    boardId: 'software-dev',
    company: 'Meridian Maps',
    role: 'Full Stack Developer (React/Node)',
    location: 'Latin America',
    remote: 'REMOTE',
    salary: [60_000, 85_000],
    stack: ['typescript', 'react', 'node', 'mongodb'],
    daysAgo: 12,
    blurb: 'Mapping tools for delivery fleets in LATAM. Spanish or Portuguese a plus.',
    host: 'remotive.com',
  },
  {
    source: 'REMOTEOK',
    boardId: 'all',
    company: 'Larkspur',
    role: 'Senior Full Stack Engineer',
    location: 'Worldwide',
    remote: 'REMOTE',
    salary: [130_000, 180_000],
    stack: ['typescript', 'react', 'node', 'postgres', 'aws'],
    daysAgo: 1,
    blurb:
      'Larkspur is a customer-support inbox for indie software companies. Profitable, twelve people, no investors.',
    host: 'remoteok.com',
  },
  {
    source: 'REMOTEOK',
    boardId: 'all',
    company: 'Foundry Nine',
    role: 'Backend Developer',
    location: 'Worldwide',
    remote: 'REMOTE',
    salary: [90_000, 130_000],
    stack: ['go', 'postgres', 'redis', 'docker'],
    daysAgo: 3,
    blurb: 'Foundry Nine sells a self-hosted CI runner. Go, Postgres, and a very opinionated CLI.',
    host: 'remoteok.com',
  },
  {
    source: 'REMOTEOK',
    boardId: 'all',
    company: 'Glassbridge',
    role: 'Software Engineer (React Native)',
    location: 'Worldwide',
    remote: 'REMOTE',
    salary: [100_000, 140_000],
    stack: ['typescript', 'react native', 'node', 'graphql'],
    daysAgo: 5,
    blurb: 'Glassbridge is a mobile banking app for freelancers in emerging markets.',
    host: 'remoteok.com',
  },
  {
    source: 'REMOTEOK',
    boardId: 'all',
    company: 'Pemberton',
    role: 'Full Stack Engineer',
    location: 'Worldwide',
    remote: 'REMOTE',
    salary: [80_000, 120_000],
    stack: ['typescript', 'vue', 'node', 'postgres'],
    daysAgo: 8,
    blurb:
      'Pemberton is inventory software for independent bookshops. Vue front end, Node API, kind customers.',
    host: 'remoteok.com',
  },
  {
    source: 'REMOTEOK',
    boardId: 'all',
    company: 'Signal Hill',
    role: 'Machine Learning Engineer',
    location: 'Worldwide',
    remote: 'REMOTE',
    salary: [150_000, 200_000],
    stack: ['python', 'pytorch', 'llm', 'aws'],
    daysAgo: 11,
    blurb:
      'Signal Hill builds speech models for call centres. Research-adjacent, production-focused.',
    host: 'remoteok.com',
  },
  {
    source: 'REMOTEOK',
    boardId: 'all',
    company: 'Ivywell',
    role: 'Senior Software Engineer (Elixir)',
    location: 'Worldwide',
    remote: 'REMOTE',
    salary: [140_000, 175_000],
    stack: ['elixir', 'postgres', 'react'],
    daysAgo: 14,
    blurb: 'Ivywell is a chat product for schools. Elixir back end, small React front end.',
    host: 'remoteok.com',
  },
  {
    source: 'ARBEITNOW',
    boardId: 'all',
    company: 'Weber Logistik GmbH',
    role: 'Senior Software Engineer (TypeScript)',
    location: 'Remote (Germany)',
    remote: 'REMOTE',
    stack: ['typescript', 'node', 'react', 'postgres'],
    daysAgo: 2,
    blurb:
      'Logistics planning software for mid-sized German carriers. German working hours, English-speaking team.',
    host: 'arbeitnow.com',
  },
  {
    source: 'ARBEITNOW',
    boardId: 'all',
    company: 'Nordlicht Energie',
    role: 'Fullstack Developer (m/w/d)',
    location: 'Hamburg',
    remote: 'UNKNOWN',
    stack: ['typescript', 'angular', 'java', 'postgres'],
    daysAgo: 4,
    blurb: 'Energy-trading dashboards for a Hamburg utility. Angular front end, Java services.',
    host: 'arbeitnow.com',
  },
  {
    source: 'ARBEITNOW',
    boardId: 'all',
    company: 'Brückenbauer Digital',
    role: 'Backend Engineer (Python)',
    location: 'Remote (EU)',
    remote: 'REMOTE',
    stack: ['python', 'django', 'postgres', 'docker'],
    daysAgo: 7,
    blurb: 'Public-sector forms and workflows. Django, Postgres, accessibility taken seriously.',
    host: 'arbeitnow.com',
  },
  {
    source: 'ARBEITNOW',
    boardId: 'all',
    company: 'Kiel Robotics',
    role: 'Software Engineer, Simulation',
    location: 'Kiel',
    remote: 'ONSITE',
    stack: ['rust', 'python', 'kubernetes'],
    daysAgo: 10,
    blurb: 'Simulation tooling for maritime robots. Onsite in Kiel, relocation supported.',
    host: 'arbeitnow.com',
  },
  {
    source: 'HIMALAYAS',
    boardId: 'all',
    company: 'Cloudmoor',
    role: 'Full Stack Engineer',
    location: 'United States, Canada',
    remote: 'REMOTE',
    salary: [130_000, 165_000],
    stack: ['typescript', 'react', 'nestjs', 'postgres', 'aws'],
    daysAgo: 1,
    blurb:
      'Cloudmoor is a rental-property operations platform. NestJS API, React app, a data model that has survived five years.',
    host: 'himalayas.app',
  },
  {
    source: 'HIMALAYAS',
    boardId: 'all',
    company: 'Verdant',
    role: 'Software Engineer, Growth',
    location: 'Worldwide',
    remote: 'REMOTE',
    salary: [110_000, 140_000],
    stack: ['typescript', 'next.js', 'react', 'postgres'],
    daysAgo: 5,
    blurb:
      'Verdant is a plant-care subscription. This role owns onboarding, referrals and experiments.',
    host: 'himalayas.app',
  },
  {
    source: 'HIMALAYAS',
    boardId: 'all',
    company: 'Anchorline',
    role: 'Backend Engineer',
    location: 'United Kingdom, Ireland',
    remote: 'REMOTE',
    salary: '£70k–£90k',
    stack: ['go', 'postgres', 'kafka', 'gcp'],
    daysAgo: 9,
    blurb:
      'Anchorline is marine insurance software. Go services, event streams, a codebase with tests you can trust.',
    host: 'himalayas.app',
  },
  {
    source: 'HIMALAYAS',
    boardId: 'all',
    company: 'Sundial',
    role: 'iOS Engineer',
    location: 'Worldwide',
    remote: 'REMOTE',
    salary: [120_000, 150_000],
    stack: ['swift', 'ios', 'graphql'],
    daysAgo: 13,
    blurb: 'Sundial is a sleep-tracking app with two million users. Small mobile team, high bar.',
    host: 'himalayas.app',
  },
  {
    source: 'JOBICY',
    boardId: 'developer',
    company: 'Ridgeline Software',
    role: 'Senior Full Stack Developer',
    location: 'USA',
    remote: 'REMOTE',
    salary: [150_000, 185_000],
    stack: ['typescript', 'react', 'node', 'postgres', 'aws'],
    daysAgo: 1,
    blurb:
      'Ridgeline builds permitting software for city governments. Long sales cycles, long customer relationships, no growth-at-all-costs.',
    host: 'jobicy.com',
  },
  {
    source: 'JOBICY',
    boardId: 'developer',
    company: 'Tallgrass',
    role: 'Software Engineer',
    location: 'Canada',
    remote: 'REMOTE',
    salary: [110_000, 135_000],
    stack: ['typescript', 'react', 'node', 'postgres'],
    daysAgo: 3,
    blurb:
      'Tallgrass is farm-management software for prairie grain growers. A team of nine in three time zones.',
    host: 'jobicy.com',
  },
  {
    source: 'JOBICY',
    boardId: 'developer',
    company: 'Bluewing',
    role: 'Backend Engineer (Java)',
    location: 'Europe',
    remote: 'REMOTE',
    salary: '€75k–€95k',
    stack: ['java', 'kotlin', 'postgres', 'kafka'],
    daysAgo: 6,
    blurb:
      'Airline crew-scheduling software. Java and Kotlin services, hard constraints, satisfying puzzles.',
    host: 'jobicy.com',
  },
  {
    source: 'JOBICY',
    boardId: 'developer',
    company: 'Copperfield',
    role: 'Developer Advocate',
    location: 'USA',
    remote: 'REMOTE',
    salary: [140_000, 170_000],
    stack: ['typescript', 'node', 'docker'],
    daysAgo: 8,
    blurb:
      'Copperfield is a developer-tools company. This role writes, speaks, and builds sample apps.',
    host: 'jobicy.com',
  },
  {
    source: 'JOBICY',
    boardId: 'developer',
    company: 'Hearthstone Health',
    role: 'Full Stack Engineer (Next.js)',
    location: 'USA',
    remote: 'REMOTE',
    salary: [125_000, 155_000],
    stack: ['typescript', 'next.js', 'react', 'postgres', 'aws'],
    daysAgo: 15,
    blurb:
      'Hearthstone runs a network of home-care agencies and builds its own scheduling software.',
    host: 'jobicy.com',
  },
  {
    source: 'WEWORKREMOTELY',
    boardId: 'remote-programming-jobs',
    company: 'Ferrybank',
    role: 'Senior Full-Stack Developer',
    location: 'Anywhere in the World',
    remote: 'REMOTE',
    stack: ['typescript', 'react', 'node', 'postgres', 'aws'],
    daysAgo: 2,
    blurb:
      'Ferrybank is bookkeeping for ferry and charter operators. Twenty years old, fully remote for ten.',
    host: 'weworkremotely.com',
  },
  {
    source: 'WEWORKREMOTELY',
    boardId: 'remote-programming-jobs',
    company: 'Stonefruit',
    role: 'Rails Engineer',
    location: 'Anywhere in the World',
    remote: 'REMOTE',
    stack: ['ruby', 'rails', 'postgres', 'redis'],
    daysAgo: 6,
    blurb:
      'Stonefruit is an email newsletter platform. Rails, Postgres, and a deliverability team you will love.',
    host: 'weworkremotely.com',
  },
  {
    source: 'WEWORKREMOTELY',
    boardId: 'remote-programming-jobs',
    company: 'Driftwood Games',
    role: 'Backend Engineer (C#/.NET)',
    location: 'Europe only',
    remote: 'REMOTE',
    stack: ['c#', '.net', 'postgres', 'redis'],
    daysAgo: 9,
    blurb:
      'Multiplayer services for a studio of forty. .NET, Postgres, Redis, and real-time fan-out at scale.',
    host: 'weworkremotely.com',
  },
  {
    source: 'WEWORKREMOTELY',
    boardId: 'remote-programming-jobs',
    company: 'Quarry',
    role: 'Full Stack Engineer',
    location: 'Anywhere in the World',
    remote: 'REMOTE',
    stack: ['typescript', 'react', 'node', 'postgres'],
    daysAgo: 12,
    blurb: 'Quarry is a CMS for documentation sites. Open core, remote since day one.',
    host: 'weworkremotely.com',
  },
  {
    source: 'GREENHOUSE',
    boardId: 'northwindlabs',
    company: 'Northwind Labs',
    role: 'Software Engineer, Dispatch',
    location: 'Remote from the US',
    remote: 'REMOTE',
    stack: ['typescript', 'react', 'node', 'postgres', 'aws'],
    daysAgo: 4,
    blurb:
      'The dispatch team owns the live map every carrier stares at all day. Real-time updates, careful UX, boring infrastructure.',
    host: 'northwindlabs.com',
  },
  {
    source: 'GREENHOUSE',
    boardId: 'northwindlabs',
    company: 'Northwind Labs',
    role: 'Engineering Manager, Platform',
    location: 'Remote from the US',
    remote: 'REMOTE',
    stack: ['aws', 'kubernetes', 'terraform'],
    daysAgo: 6,
    blurb: 'Lead the platform group of six. Hands-on expected, people-first.',
    host: 'northwindlabs.com',
  },
  {
    source: 'GREENHOUSE',
    boardId: 'northwindlabs',
    company: 'Northwind Labs',
    role: 'Data Analyst',
    location: 'Chicago',
    remote: 'ONSITE',
    stack: ['python', 'postgres'],
    daysAgo: 8,
    blurb: 'Reporting and analysis for the operations team, onsite in Chicago.',
    host: 'northwindlabs.com',
  },
  {
    source: 'LEVER',
    boardId: 'umbrellarobotics',
    company: 'Umbrella Robotics',
    role: 'Senior Software Engineer',
    location: 'Remote — EU',
    remote: 'REMOTE',
    salary: '€95k–€125k',
    stack: ['typescript', 'react', 'node', 'postgres', 'kubernetes'],
    daysAgo: 3,
    blurb:
      'Umbrella makes inspection drones for wind farms. This team owns the mission-planning web app.',
    host: 'umbrellarobotics.eu',
  },
  {
    source: 'LEVER',
    boardId: 'umbrellarobotics',
    company: 'Umbrella Robotics',
    role: 'Embedded Software Engineer',
    location: 'Aarhus',
    remote: 'HYBRID',
    stack: ['rust', 'python'],
    daysAgo: 10,
    blurb: 'Flight-controller firmware and telemetry. Hybrid in Aarhus.',
    host: 'umbrellarobotics.eu',
  },
  {
    source: 'ASHBY',
    boardId: 'vandelay',
    company: 'Vandelay Systems',
    role: 'Staff Engineer, Developer Platform',
    location: 'Remote - United States',
    remote: 'REMOTE',
    salary: [220_000, 260_000],
    stack: ['go', 'typescript', 'kubernetes', 'aws'],
    daysAgo: 2,
    blurb:
      'Vandelay sells import/export compliance software. The developer platform team keeps two hundred engineers productive.',
    host: 'vandelay.systems',
  },
  {
    source: 'ASHBY',
    boardId: 'vandelay',
    company: 'Vandelay Systems',
    role: 'Software Engineer II, Web',
    location: 'Remote - United States',
    remote: 'REMOTE',
    salary: [150_000, 180_000],
    stack: ['typescript', 'react', 'next.js', 'graphql', 'postgres'],
    daysAgo: 5,
    blurb:
      'Customer-facing web app for compliance filings. Next.js, GraphQL, a mature design system.',
    host: 'vandelay.systems',
  },
  {
    source: 'HIRINGCAFE',
    boardId: 'software-engineer',
    company: 'Ohr',
    role: 'Software Engineer',
    location: 'Worldwide',
    remote: 'REMOTE',
    salary: [120_000, 160_000],
    stack: ['typescript', 'node', 'react', 'postgres', 'aws'],
    daysAgo: 1,
    blurb:
      '4+ years building full stack products with TypeScript, Node and React; comfortable owning features end to end. Tools: TypeScript, Node.js, React, PostgreSQL, AWS. Visa sponsorship offered.',
    host: 'jobs.ashbyhq.com',
  },
  {
    source: 'HIRINGCAFE',
    boardId: 'backend-engineer',
    company: 'Patsnap',
    role: 'Backend Engineer / Senior Backend Engineer',
    location: 'Singapore',
    remote: 'REMOTE',
    stack: ['java', 'docker', 'kubernetes'],
    daysAgo: 2,
    blurb:
      '3+ years of Java backend development; Spring, RESTful APIs, microservices, databases, CI/CD and containers. Tools: Java, Spring Boot, SQL, Docker, Kubernetes. Seniority: Mid Level.',
    host: 'patsnap.recruitee.com',
  },
  {
    source: 'HIRINGCAFE',
    boardId: 'full-stack-engineer',
    company: 'Coastline Health',
    role: 'Full Stack Engineer',
    location: 'Philippines, Vietnam, Indonesia',
    remote: 'REMOTE',
    salary: [70_000, 95_000],
    stack: ['typescript', 'react', 'node', 'graphql', 'gcp'],
    daysAgo: 3,
    blurb:
      'Telehealth for clinics across Southeast Asia. Build the scheduling and records product with TypeScript on both ends. Tools: TypeScript, React, Node.js, GraphQL, GCP. Commitment: Full Time.',
    host: 'boards.greenhouse.io',
  },
  {
    source: 'WELLFOUND',
    boardId: 'software-engineer',
    company: 'Confident LIMS',
    role: 'Senior Software Engineer',
    location: 'Canada, South America, United States, Latin America',
    remote: 'REMOTE',
    salary: '$100k – $180k',
    stack: ['typescript', 'node', 'react', 'postgres'],
    daysAgo: 4,
    blurb:
      'The easiest way to test. Confident powers analytical testing labs. Own the TypeScript services behind our LIMS; Postgres, Node and React every day. 5+ years of experience.',
    host: 'wellfound.com',
  },
  {
    source: 'WELLFOUND',
    boardId: 'backend-engineer',
    company: 'Speak',
    role: 'Backend Engineer',
    location: 'San Francisco (remote: United States)',
    remote: 'HYBRID',
    salary: '$150k – $280k',
    stack: ['go', 'python', 'gcp'],
    daysAgo: 6,
    blurb:
      'AI language tutor that helps you speak. Our mission is to reinvent the way people learn, starting with language. You will build Go and Python services on GCP.',
    host: 'wellfound.com',
  },
  {
    source: 'JOBSTREET',
    boardId: 'software-engineer',
    company: 'Outsourced Quality Assured Services',
    role: 'Senior Full-Stack Web & Mobile Developer (.NET/Angular) - Homebased',
    location: 'Quezon City, Metro Manila',
    remote: 'REMOTE',
    salary: 'PHP 180,000 - 220,000 per month',
    stack: ['c#', '.net', 'angular', 'typescript'],
    daysAgo: 1,
    blurb:
      'Build and maintain web and mobile products for Australian clients from home. Full time, Philippine hours, ISO-certified employer of record.',
    host: 'ph.jobstreet.com',
  },
  {
    source: 'JOBSTREET',
    boardId: 'backend-developer',
    company: 'QBE Insurance',
    role: 'Software Engineering Analyst (AI Prompt Engineer) - Manila/Cebu',
    location: 'Manila City, Metro Manila',
    remote: 'HYBRID',
    stack: ['python', 'llm'],
    daysAgo: 2,
    blurb:
      'AI engineer who designs and deploys GenAI solutions for the group shared services. Hybrid, Manila or Cebu.',
    host: 'ph.jobstreet.com',
  },
  {
    source: 'KALIBRR',
    boardId: 'it-and-software',
    company: 'Nova Virtual Solutions',
    role: 'Senior QA Lead Automation Engineer',
    location: 'Mandaluyong, Metro Manila, Philippines',
    remote: 'REMOTE',
    stack: ['typescript', 'node', 'docker'],
    daysAgo: 5,
    blurb:
      'Lead the quality engineering initiatives and move the team from manual to automated testing. Work from home, full time.',
    host: 'www.kalibrr.com',
  },
  {
    source: 'WELLFOUND',
    boardId: 'devops-engineer',
    company: 'Harborline',
    role: 'DevOps Engineer',
    location: 'Worldwide',
    remote: 'REMOTE',
    salary: '$80k – $120k',
    stack: ['kubernetes', 'terraform', 'aws', 'go'],
    daysAgo: 8,
    blurb:
      'Fleet telemetry for shipping lines. Keep a global Kubernetes footprint boring with Terraform and Go tooling. 4+ years of experience.',
    host: 'wellfound.com',
  },
];

const RESERVE: PostingSeed[] = [
  {
    source: 'HIRINGCAFE',
    boardId: 'software-engineer',
    company: 'Kestrel Payments',
    role: 'Backend Engineer',
    location: 'Worldwide',
    remote: 'REMOTE',
    salary: [120_000, 150_000],
    stack: ['typescript', 'nestjs', 'postgres', 'redis', 'aws'],
    daysAgo: 0,
    blurb:
      'Payment rails for marketplaces in Southeast Asia. You would own the ledger service and its public API. Tools: TypeScript, NestJS, Postgres, Redis, AWS. Seniority: Mid Level.',
    host: 'jobs.ashbyhq.com',
  },
  {
    source: 'WELLFOUND',
    boardId: 'software-engineer',
    company: 'Lanternfish',
    role: 'Full Stack Engineer',
    location: 'Asia, Europe',
    remote: 'REMOTE',
    salary: '$90k – $130k',
    stack: ['typescript', 'react', 'next.js', 'node', 'postgres'],
    daysAgo: 0,
    blurb:
      'Search for scientific literature that reads the papers for you. Small team, async by default, hiring across Asia and Europe. 3+ years of experience.',
    host: 'wellfound.com',
  },
  {
    source: 'HN',
    boardId: '49501234',
    company: 'Bellwether',
    role: 'Senior Full Stack Engineer',
    location: 'Remote (US, Canada)',
    remote: 'REMOTE',
    salary: [160_000, 190_000],
    stack: ['typescript', 'react', 'nestjs', 'postgres', 'aws'],
    daysAgo: 0,
    blurb:
      'Bellwether is forecasting software for restaurant groups. NestJS and React, a team that reviews carefully and ships daily.',
    host: 'bellwether.app',
  },
  {
    source: 'HN',
    boardId: '49501234',
    company: 'Willowbrook',
    role: 'Software Engineer',
    location: 'Remote (worldwide)',
    remote: 'REMOTE',
    salary: [120_000, 150_000],
    stack: ['typescript', 'node', 'react', 'postgres'],
    daysAgo: 0,
    blurb:
      'Willowbrook is a donor-management tool for small nonprofits. Calm company, calm codebase.',
    host: 'willowbrook.org',
  },
  {
    source: 'REMOTIVE',
    boardId: 'software-dev',
    company: 'Amberwave',
    role: 'Full Stack Engineer',
    location: 'Worldwide',
    remote: 'REMOTE',
    salary: [100_000, 135_000],
    stack: ['typescript', 'next.js', 'node', 'postgres', 'aws'],
    daysAgo: 0,
    blurb: 'Amberwave builds tide-table and marina booking software. Small team, direct customers.',
    host: 'remotive.com',
  },
  {
    source: 'REMOTEOK',
    boardId: 'all',
    company: 'Coppertail',
    role: 'Backend Engineer (TypeScript)',
    location: 'Worldwide',
    remote: 'REMOTE',
    salary: [110_000, 150_000],
    stack: ['typescript', 'nestjs', 'postgres', 'redis'],
    daysAgo: 0,
    blurb:
      'Coppertail is a subscriptions billing API. NestJS, Postgres, and idempotency keys everywhere.',
    host: 'remoteok.com',
  },
  {
    source: 'ARBEITNOW',
    boardId: 'all',
    company: 'Lindqvist Software',
    role: 'Senior Fullstack Engineer',
    location: 'Remote (EU)',
    remote: 'REMOTE',
    stack: ['typescript', 'react', 'node', 'postgres'],
    daysAgo: 0,
    blurb: 'Fleet telematics for Scandinavian bus operators. Remote across the EU.',
    host: 'arbeitnow.com',
  },
  {
    source: 'HIMALAYAS',
    boardId: 'all',
    company: 'Silverpine',
    role: 'Software Engineer, Backend',
    location: 'Worldwide',
    remote: 'REMOTE',
    salary: [115_000, 145_000],
    stack: ['typescript', 'node', 'postgres', 'aws'],
    daysAgo: 0,
    blurb:
      'Silverpine is a booking engine for guided tours. Node services, Postgres, sane on-call.',
    host: 'himalayas.app',
  },
  {
    source: 'JOBICY',
    boardId: 'developer',
    company: 'Harrowgate',
    role: 'Full Stack Developer',
    location: 'USA',
    remote: 'REMOTE',
    salary: [120_000, 150_000],
    stack: ['typescript', 'react', 'node', 'postgres'],
    daysAgo: 0,
    blurb: 'Harrowgate builds compliance training software. Steady, profitable, remote-first.',
    host: 'jobicy.com',
  },
  {
    source: 'WEWORKREMOTELY',
    boardId: 'remote-programming-jobs',
    company: 'Ashgrove',
    role: 'Senior Software Engineer',
    location: 'Anywhere in the World',
    remote: 'REMOTE',
    stack: ['typescript', 'react', 'node', 'postgres', 'gcp'],
    daysAgo: 0,
    blurb: 'Ashgrove is scheduling software for community theatres. Tiny team, loyal customers.',
    host: 'weworkremotely.com',
  },
  {
    source: 'GREENHOUSE',
    boardId: 'northwindlabs',
    company: 'Northwind Labs',
    role: 'Full Stack Engineer, Billing',
    location: 'Remote from the US',
    remote: 'REMOTE',
    stack: ['typescript', 'node', 'react', 'postgres'],
    daysAgo: 0,
    blurb: 'The billing team owns invoicing for every carrier on the platform.',
    host: 'northwindlabs.com',
  },
  {
    source: 'ASHBY',
    boardId: 'vandelay',
    company: 'Vandelay Systems',
    role: 'Software Engineer, Integrations',
    location: 'Remote - United States',
    remote: 'REMOTE',
    salary: [145_000, 175_000],
    stack: ['typescript', 'node', 'postgres', 'aws'],
    daysAgo: 0,
    blurb: 'Customs-broker integrations. Lots of file formats, lots of patience, well compensated.',
    host: 'vandelay.systems',
  },
];

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function usd(value: number): string {
  return `$${Math.round(value / 1000)}k`;
}

function salaryFields(salary: PostingSeed['salary']) {
  if (!salary) return { salaryText: null, salaryMinUsd: null, salaryMaxUsd: null };
  if (typeof salary === 'string')
    return { salaryText: salary, salaryMinUsd: null, salaryMaxUsd: null };
  return {
    salaryText: `${usd(salary[0])}–${usd(salary[1])}`,
    salaryMinUsd: salary[0],
    salaryMaxUsd: salary[1],
  };
}

function remoteWord(remote: RemoteType): string | null {
  if (remote === 'REMOTE') return 'REMOTE';
  if (remote === 'HYBRID') return 'Hybrid';
  if (remote === 'ONSITE') return 'Onsite';
  return null;
}

function applyHostFor(seed: PostingSeed): string {
  return seed.source === 'HN' || SOURCE_KIND_BOARD.has(seed.source)
    ? seed.host
    : `${slug(seed.company)}.example`;
}

function applyUrlFor(seed: PostingSeed): string {
  return `https://${applyHostFor(seed)}/careers`;
}

function rawTextFor(seed: PostingSeed, headline: string): string {
  const stackWords = seed.stack.map((key) => STACK_LINE[key] ?? key);
  const stackSentence =
    stackWords.length > 1
      ? `Our stack is ${stackWords.slice(0, -1).join(', ')} and ${stackWords.at(-1)}.`
      : `Our stack is ${stackWords[0]}.`;
  return [
    headline,
    seed.blurb,
    `${stackSentence} We care more about clear writing and steady judgement than about any one framework.`,
    `Apply at ${applyUrlFor(seed)} or email jobs@${applyHostFor(seed)} with a few lines about something you built and why.`,
  ].join('\n\n');
}

function buildPosting(
  seed: PostingSeed,
  index: number,
  now: Date,
  createdAtOffsetMs: number,
): Posting {
  const s = salaryFields(seed.salary);
  const headline =
    seed.source === 'HN'
      ? [seed.company, seed.role, seed.location, remoteWord(seed.remote), s.salaryText]
          .filter(Boolean)
          .join(' | ')
      : [
          seed.company,
          seed.role,
          seed.location,
          seed.remote === 'REMOTE' ? 'Remote' : seed.remote === 'HYBRID' ? 'Hybrid' : null,
          s.salaryText,
        ]
          .filter(Boolean)
          .join(' | ');
  const postedAt = new Date(now.getTime() - seed.daysAgo * DAY - ((index * 7919) % 20) * HOUR);
  const externalId = `${slug(seed.company)}-${slug(seed.role)}-${index}`;
  const url =
    seed.source === 'HN'
      ? `https://news.ycombinator.com/item?id=${49510000 + index}`
      : `https://${seed.host}/jobs/${slug(seed.role)}-${index}`;
  return {
    id: `p_${externalId}`,
    source: seed.source,
    externalId,
    boardId: seed.boardId,
    author: seed.source === 'HN' ? `${slug(seed.company).replace(/-/g, '')}_hiring` : seed.company,
    postedAt: postedAt.toISOString(),
    url,
    applyUrl: applyUrlFor(seed),
    company: seed.company,
    role: seed.role,
    location: seed.location,
    remote: seed.remote,
    ...s,
    stackKeywords: seed.stack,
    regionTerms: findRegionTerms(regionBasis(headline, seed.location)),
    level: detectLevel(headline, seed.role),
    headline,
    fingerprint: `${slug(seed.company)}|${slug(seed.role)}`,
    createdAt: new Date(postedAt.getTime() + createdAtOffsetMs).toISOString(),
    updatedAt: new Date(now.getTime() - 2 * HOUR).toISOString(),
    rawText: rawTextFor(seed, headline),
  };
}

type AppSeed = {
  company: string;
  role: string;
  postingCompany?: string;
  via?: string;
  url?: string;
  location?: string;
  salaryText?: string;
  path: Array<[Stage, number, string?]>;
  notes?: string;
  logs?: Array<[number, string]>;
  nextStepInDays?: number;
  contactName?: string;
  contactEmail?: string;
  followUpInDays?: number;
  staleSent?: boolean;
};

const APPLICATIONS: AppSeed[] = [
  {
    company: 'Northwind Labs',
    role: 'Senior Full Stack Engineer',
    postingCompany: 'Northwind Labs',
    path: [
      ['SAVED', 16],
      ['APPLIED', 14, 'Sent via careers page with the dispatch write-up'],
      ['INTERVIEWING', 6, 'Recruiter screen with Priya'],
    ],
    notes:
      'Their dispatch product is the closest thing to what I built at my last job. Ask about on-call and how they handle the freight-rate data feed.',
    logs: [
      [
        5,
        'Recruiter screen went well. Technical round is a two-hour pairing session on a real bug, not leetcode.',
      ],
      [
        2,
        'Sent the pairing-session availability. Asked for the team structure doc; Priya said she would send it Monday.',
      ],
    ],
    nextStepInDays: 2,
    contactName: 'Priya Natarajan',
    contactEmail: 'priya@northwindlabs.com',
  },
  {
    company: 'Sable Finance',
    role: 'Backend Engineer (Node.js)',
    postingCompany: 'Sable Finance',
    path: [
      ['SAVED', 9],
      ['APPLIED', 8],
    ],
    notes:
      'Event-sourced ledger. Mention the idempotent reminder design from Reel — same shape of problem.',
    followUpInDays: 3,
  },
  {
    company: 'Umbrella Robotics',
    role: 'Senior Software Engineer',
    postingCompany: 'Umbrella Robotics',
    path: [
      ['SAVED', 30],
      ['APPLIED', 28],
      ['INTERVIEWING', 19, 'Take-home returned; call with the lead'],
      ['OFFER', 1, 'Verbal offer, written one due Friday'],
    ],
    notes:
      'Offer: €112k, 30 days leave, hardware budget. Ask about the EU contractor setup for the Philippines.',
    logs: [
      [17, 'Take-home feedback: they liked the tests and the README. Two nits on error handling.'],
      [
        9,
        'Team call with three engineers. Very calm, very honest about the drone firmware being the hard part.',
      ],
    ],
    nextStepInDays: 3,
    contactName: 'Mads Kristensen',
    contactEmail: 'mads@umbrellarobotics.eu',
  },
  {
    company: 'Cloudmoor',
    role: 'Full Stack Engineer',
    postingCompany: 'Cloudmoor',
    path: [['SAVED', 1]],
    notes:
      'NestJS and React, US/Canada only — check whether they consider APAC contractors before applying.',
  },
  {
    company: 'Larkspur',
    role: 'Senior Full Stack Engineer',
    postingCompany: 'Larkspur',
    path: [['SAVED', 1]],
  },
  {
    company: 'Ridgeline Software',
    role: 'Senior Full Stack Developer',
    postingCompany: 'Ridgeline Software',
    path: [
      ['SAVED', 12],
      ['APPLIED', 11],
    ],
    staleSent: true,
    notes:
      'No reply after eleven days. The stale reminder went out; follow up once more, then withdraw.',
  },
  {
    company: 'Kestrel Labs',
    role: 'Software Engineer II (Full Stack)',
    postingCompany: 'Kestrel Labs',
    path: [
      ['SAVED', 20],
      ['APPLIED', 18],
      ['REJECTED', 7, 'Went with someone in their time zone'],
    ],
  },
  {
    company: 'Halyard',
    role: 'Founding Engineer',
    postingCompany: 'Halyard',
    path: [
      ['SAVED', 6],
      ['APPLIED', 5, 'Emailed both founders directly'],
    ],
    logs: [[4, 'Founder replied within an hour; intro call booked.']],
    nextStepInDays: 1,
    contactName: 'Dana Whitfield',
  },
  {
    company: 'Brightline Robotics',
    role: 'Senior Software Engineer, Fleet Tools',
    postingCompany: 'Brightline Robotics',
    path: [
      ['SAVED', 13],
      ['APPLIED', 12],
      ['INTERVIEWING', 4, 'Hiring-manager call'],
    ],
    logs: [
      [3, 'Hiring manager wants a systems-design round next. Prepare the ingest fan-out story.'],
    ],
    nextStepInDays: 6,
    contactName: 'Tom Adeyemi',
  },
  {
    company: 'Meridian Ventures',
    role: 'Software Engineer (Portfolio Company)',
    via: 'Referral',
    url: 'https://meridian.vc/talent',
    location: 'Remote (APAC)',
    path: [
      ['SAVED', 4],
      ['APPLIED', 3, 'Referred by Ana from the Manila meetup'],
    ],
    notes:
      'Ana says the portfolio company is a fintech in Singapore, still stealth. Ask which one on the intro call.',
    contactName: 'Ana Reyes',
    contactEmail: 'ana@meridian.vc',
  },
  {
    company: 'Ledgerline',
    role: 'Full Stack Engineer',
    via: 'LinkedIn',
    url: 'https://www.linkedin.com/jobs/view/ledgerline-full-stack',
    location: 'Remote (Asia)',
    salaryText: 'SGD 110k–140k',
    path: [
      ['SAVED', 25],
      ['APPLIED', 24],
      ['WITHDRAWN', 15, 'Salary band confirmed below target'],
    ],
  },
  {
    company: 'Orchard Commerce',
    role: 'Senior Software Engineer',
    postingCompany: 'Orchard Commerce',
    path: [['SAVED', 3]],
    notes: 'EU only per the posting; worth asking anyway given the async setup.',
  },
  {
    company: 'Pinewood Software',
    role: 'Senior Software Engineer',
    postingCompany: 'Pinewood Software',
    path: [
      ['SAVED', 7],
      ['APPLIED', 6],
    ],
    notes: 'APAC-first hours — the best time-zone fit on the board.',
    followUpInDays: 5,
  },
  {
    company: 'Saltmarsh',
    role: 'Software Engineer',
    postingCompany: 'Saltmarsh',
    path: [
      ['SAVED', 22],
      ['APPLIED', 21],
      ['REJECTED', 12, 'Role filled internally'],
    ],
  },
];

const FEED_SOURCES: Source[] = SOURCES.filter((source) => !SOURCE_KIND_BOARD.has(source));

export function buildSeed(now: Date): DemoState {
  const postings = POSTINGS.map((seed, index) => buildPosting(seed, index, now, 3 * HOUR));
  const reserve = RESERVE.map((seed, index) => buildPosting(seed, 1000 + index, now, 0));
  const byCompany = new Map(postings.map((posting) => [posting.company, posting]));

  const criteria = {
    id: 'crit_demo',
    userId: 'user_demo',
    remoteOnly: true,
    roleKeywords: ['full stack', 'fullstack', 'full-stack', 'software engineer', 'backend'],
    includeKeywords: ['typescript', 'node', 'react', 'nestjs', 'next.js', 'postgres', 'aws'],
    excludeKeywords: ['php', 'wordpress', 'principal', 'staff'],
    regionKeywords: ['philippines', 'apac', 'asia', 'worldwide', 'anywhere'],
    nearbyKeywords: ['metro manila', 'makati', 'taguig', 'bgc'],
    levels: [] as Level[],
    minSalaryUsd: null,
  };

  const matches: StoredMatch[] = [];
  for (const posting of postings) {
    const result = score(posting, criteria);
    if (result.score >= MATCH_THRESHOLD) {
      matches.push({
        id: `m_${posting.id}`,
        userId: 'user_demo',
        postingId: posting.id,
        score: result.score,
        reasons: result.reasons,
        dismissed: ['Copperfield', 'Waypoint Learning'].includes(posting.company ?? ''),
        createdAt: posting.createdAt,
      });
    }
  }

  const applications: Application[] = [];
  const events: StageEvent[] = [];
  const reminders: Reminder[] = [];
  let counter = 0;

  APPLICATIONS.forEach((seed, index) => {
    const id = `a_${(index + 1).toString().padStart(2, '0')}`;
    const posting = seed.postingCompany ? byCompany.get(seed.postingCompany) : undefined;
    const [firstStage, firstDays] = seed.path[0]!;
    const createdAt = new Date(now.getTime() - firstDays * DAY - 3 * HOUR);
    let stage: Stage = firstStage;
    let stageChangedAt = createdAt;
    let appliedAt: Date | null = null;

    events.push({
      id: `e_${id}_0`,
      applicationId: id,
      fromStage: null,
      toStage: firstStage,
      kind: 'STAGE_CHANGE',
      note: null,
      createdAt: createdAt.toISOString(),
    });

    seed.path.slice(1).forEach(([to, days, note], step) => {
      const at = new Date(now.getTime() - days * DAY - 2 * HOUR - step * 900_000);
      events.push({
        id: `e_${id}_${step + 1}`,
        applicationId: id,
        fromStage: stage,
        toStage: to,
        kind: 'STAGE_CHANGE',
        note: note ?? null,
        createdAt: at.toISOString(),
      });
      if (to === 'APPLIED' && appliedAt === null) appliedAt = at;
      stage = to;
      stageChangedAt = at;
    });

    (seed.logs ?? []).forEach(([days, note], step) => {
      events.push({
        id: `e_${id}_n${step}`,
        applicationId: id,
        fromStage: stage,
        toStage: stage,
        kind: 'NOTE',
        note,
        createdAt: new Date(now.getTime() - days * DAY - HOUR).toISOString(),
      });
    });

    if (appliedAt !== null) {
      const dueAt = new Date((appliedAt as Date).getTime() + 10 * DAY);
      const laterEvent = seed.path.find(([to]) => to !== 'SAVED' && to !== 'APPLIED');
      const cancelled = laterEvent
        ? new Date(now.getTime() - laterEvent[1] * DAY - 2 * HOUR)
        : null;
      reminders.push({
        id: `r_${id}_stale`,
        applicationId: id,
        kind: 'STALE_APPLICATION',
        dueAt: dueAt.toISOString(),
        sentAt: seed.staleSent ? dueAt.toISOString() : null,
        cancelledAt: cancelled && !seed.staleSent ? cancelled.toISOString() : null,
        jobId: `stale-${id}`,
        createdAt: (appliedAt as Date).toISOString(),
      });
    }
    if (seed.followUpInDays !== undefined) {
      reminders.push({
        id: `r_${id}_followup`,
        applicationId: id,
        kind: 'FOLLOW_UP',
        dueAt: new Date(now.getTime() + seed.followUpInDays * DAY).toISOString(),
        sentAt: null,
        cancelledAt: null,
        jobId: `followup-${id}`,
        createdAt: new Date(now.getTime() - DAY).toISOString(),
      });
    }

    applications.push({
      id,
      userId: 'user_demo',
      postingId: posting?.id ?? null,
      company: seed.company,
      role: seed.role,
      url: seed.url ?? posting?.applyUrl ?? null,
      stage,
      notes: seed.notes ?? null,
      location: seed.location ?? posting?.location ?? null,
      salaryText: seed.salaryText ?? posting?.salaryText ?? null,
      via: seed.via ?? (posting ? sourceLabelFor(posting.source) : null),
      appliedAt: appliedAt ? (appliedAt as Date).toISOString() : null,
      nextStepAt:
        seed.nextStepInDays !== undefined
          ? new Date(now.getTime() + seed.nextStepInDays * DAY).toISOString()
          : null,
      contactName: seed.contactName ?? null,
      contactEmail: seed.contactEmail ?? null,
      stageChangedAt: stageChangedAt.toISOString(),
      createdAt: createdAt.toISOString(),
      updatedAt: stageChangedAt.toISOString(),
    });
    counter += 1;
  });

  const boards: WatchedBoard[] = [
    {
      id: 'b_northwind',
      provider: 'GREENHOUSE',
      slug: 'northwindlabs',
      company: 'Northwind Labs',
      createdAt: new Date(now.getTime() - 12 * DAY).toISOString(),
    },
    {
      id: 'b_umbrella',
      provider: 'LEVER',
      slug: 'umbrellarobotics',
      company: 'Umbrella Robotics',
      createdAt: new Date(now.getTime() - 30 * DAY).toISOString(),
    },
    {
      id: 'b_vandelay',
      provider: 'ASHBY',
      slug: 'vandelay',
      company: 'Vandelay Systems',
      createdAt: new Date(now.getTime() - 5 * DAY).toISOString(),
    },
  ];

  const runs: IngestRun[] = [];
  const cycleStart = new Date(now.getTime() - 2 * HOUR - 11 * 60_000);
  const targets: Array<[Source, string, number]> = [
    ['HN', '49501234', 18],
    ['REMOTIVE', 'software-dev', 6],
    ['REMOTEOK', 'all', 6],
    ['ARBEITNOW', 'all', 4],
    ['HIMALAYAS', 'all', 4],
    ['JOBICY', 'developer', 5],
    ['WEWORKREMOTELY', 'remote-programming-jobs', 4],
    ['GREENHOUSE', 'northwindlabs', 3],
    ['LEVER', 'umbrellarobotics', 2],
    ['ASHBY', 'vandelay', 2],
    ['HIRINGCAFE', 'software-engineer', 120],
    ['WELLFOUND', 'software-engineer', 74],
    ['JOBSTREET', 'software-engineer', 100],
    ['KALIBRR', 'it-and-software', 100],
  ];
  targets.forEach(([source, boardId, seen], index) => {
    const startedAt = new Date(cycleStart.getTime() + index * 9_000);
    runs.push({
      id: `run_${source.toLowerCase()}_${index}`,
      source,
      boardId,
      status: 'SUCCEEDED',
      startedAt: startedAt.toISOString(),
      finishedAt: new Date(startedAt.getTime() + 4_000 + index * 1_500).toISOString(),
      itemsSeen: seen,
      postingsCreated: index === 0 ? 2 : index % 3 === 0 ? 1 : 0,
      postingsUpdated: seen - (index === 0 ? 2 : index % 3 === 0 ? 1 : 0),
      error: null,
    });
  });
  const earlier = new Date(now.getTime() - 8 * HOUR - 11 * 60_000);
  targets.forEach(([source, boardId, seen], index) => {
    const startedAt = new Date(earlier.getTime() + index * 9_000);
    const failed = source === 'JOBICY';
    runs.push({
      id: `run_${source.toLowerCase()}_${index}_prev`,
      source,
      boardId,
      status: failed ? 'FAILED' : 'SUCCEEDED',
      startedAt: startedAt.toISOString(),
      finishedAt: new Date(startedAt.getTime() + (failed ? 15_000 : 5_000)).toISOString(),
      itemsSeen: failed ? 0 : seen,
      postingsCreated: failed ? 0 : index % 2,
      postingsUpdated: failed ? 0 : seen - (index % 2),
      error: failed
        ? 'Request failed 503: https://jobicy.com/api/v2/remote-jobs?count=100&tag=developer'
        : null,
    });
  });
  runs.sort((a, b) => b.startedAt.localeCompare(a.startedAt));

  const sourceSettings = Object.fromEntries(SOURCES.map((source) => [source, true])) as Record<
    Source,
    boolean
  >;

  return {
    version: 1,
    signedIn: false,
    user: {
      id: 'user_demo',
      email: 'you@reel.demo',
      timezone: 'Asia/Manila',
      createdAt: new Date(now.getTime() - 34 * DAY).toISOString(),
    },
    criteria,
    postings,
    reserve,
    matches,
    applications,
    events,
    reminders,
    runs,
    sourceSettings,
    boards,
    browser: { linked: true, createdAt: new Date(now.getTime() - 6 * DAY).toISOString() },
    matchesSeenAt: null,
    clockOffsetMs: 0,
    mail: [],
    counter: counter + 100,
  };
}

function sourceLabelFor(source: Source): string {
  switch (source) {
    case 'HN':
      return 'Hacker News';
    case 'REMOTIVE':
      return 'Remotive';
    case 'REMOTEOK':
      return 'Remote OK';
    case 'ARBEITNOW':
      return 'Arbeitnow';
    case 'HIMALAYAS':
      return 'Himalayas';
    case 'JOBICY':
      return 'Jobicy';
    case 'WEWORKREMOTELY':
      return 'We Work Remotely';
    case 'GREENHOUSE':
      return 'Greenhouse';
    case 'LEVER':
      return 'Lever';
    case 'ASHBY':
      return 'Ashby';
    case 'WORKINGNOMADS':
      return 'Working Nomads';
    case 'LANDINGJOBS':
      return 'Landing.jobs';
    case 'THEMUSE':
      return 'The Muse';
    case 'JOBSPRESSO':
      return 'Jobspresso';
    case 'WORKABLE':
      return 'Workable';
    case 'SMARTRECRUITERS':
      return 'SmartRecruiters';
    case 'HIRINGCAFE':
      return 'HiringCafe';
    case 'WELLFOUND':
      return 'Wellfound';
    case 'JOBSTREET':
      return 'JobStreet';
    case 'KALIBRR':
      return 'Kalibrr';
  }
}

export { FEED_SOURCES };
