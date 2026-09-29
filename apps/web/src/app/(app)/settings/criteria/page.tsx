'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { TagInput } from '../../../../components/tag-input';
import { Button } from '../../../../components/ui/button';
import { Field, Input } from '../../../../components/ui/input';
import { Switch } from '../../../../components/ui/switch';
import { RowsSkeleton } from '../../../../components/ui/skeleton';
import { ErrorState, Panel, SectionTitle } from '../../../../components/ui/states';
import { cn } from '../../../../lib/cn';
import { useCriteria, useRescore, useSaveCriteria } from '../../../../lib/queries';
import { LEVELS, type Level } from '../../../../lib/types';

const ROLE_SUGGESTIONS = [
  'full stack',
  'fullstack',
  'software engineer',
  'backend',
  'frontend',
  'platform',
];
const STACK_SUGGESTIONS = [
  'typescript',
  'node',
  'react',
  'next.js',
  'nestjs',
  'postgres',
  'aws',
  'go',
  'python',
];
const EXCLUDE_SUGGESTIONS = ['php', 'wordpress', 'unpaid', 'clearance', 'contract'];
const REGION_SUGGESTIONS = [
  'philippines',
  'apac',
  'asia',
  'worldwide',
  'anywhere',
  'emea',
  'eu',
  'us',
];
const NEARBY_SUGGESTIONS = [
  'metro manila',
  'manila',
  'makati',
  'taguig',
  'bgc',
  'pasig',
  'ortigas',
  'quezon city',
  'philippines',
];

const LEVEL_LABEL: Record<Level, string> = {
  intern: 'Intern',
  junior: 'Junior',
  mid: 'Mid',
  senior: 'Senior',
  lead: 'Lead / Staff',
};

const RULES = [
  { points: '+25', rule: 'the posting is remote' },
  { points: '+20', rule: 'not remote, but the location is near you' },
  { points: '+30', rule: 'the first role keyword found in the headline' },
  { points: '+10', rule: 'each include keyword in the stack or headline, up to +40' },
  { points: '+10', rule: 'the posting is explicitly open to one of your regions' },
  { points: '+10', rule: 'a USD salary was parsed' },
  { points: '+5', rule: 'there is an apply link' },
  { points: '+10', rule: 'posted in the last three days, or +5 in the last ten' },
  { points: '0', rule: 'any exclude keyword hits, or the salary ceiling is under your minimum' },
  { points: '0', rule: 'the title reads as a level you did not pick' },
  { points: '0', rule: 'the posting is limited to a region that is not one of yours' },
];

export default function CriteriaPage() {
  const criteria = useCriteria();
  const save = useSaveCriteria();
  const rescore = useRescore();

  const [remoteOnly, setRemoteOnly] = useState(true);
  const [roleKeywords, setRoleKeywords] = useState<string[]>([]);
  const [includeKeywords, setIncludeKeywords] = useState<string[]>([]);
  const [excludeKeywords, setExcludeKeywords] = useState<string[]>([]);
  const [regionKeywords, setRegionKeywords] = useState<string[]>([]);
  const [nearbyKeywords, setNearbyKeywords] = useState<string[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [minSalary, setMinSalary] = useState('');
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (criteria.data) {
      setRemoteOnly(criteria.data.remoteOnly);
      setRoleKeywords(criteria.data.roleKeywords);
      setIncludeKeywords(criteria.data.includeKeywords);
      setExcludeKeywords(criteria.data.excludeKeywords);
      setRegionKeywords(criteria.data.regionKeywords);
      setNearbyKeywords(criteria.data.nearbyKeywords ?? []);
      setLevels(criteria.data.levels ?? []);
      setMinSalary(criteria.data.minSalaryUsd === null ? '' : String(criteria.data.minSalaryUsd));
      setDirty(false);
    }
  }, [criteria.data]);

  function mark<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value);
      setDirty(true);
    };
  }

  function toggleLevel(level: Level) {
    setLevels((current) =>
      current.includes(level)
        ? current.filter((entry) => entry !== level)
        : LEVELS.filter((entry) => entry === level || current.includes(entry)),
    );
    setDirty(true);
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
      <Panel>
        <SectionTitle
          aside={criteria.data?.id === null ? 'not saved yet — defaults shown' : undefined}
        >
          What counts as a match
        </SectionTitle>

        {criteria.isPending ? <RowsSkeleton rows={4} height="h-11" /> : null}
        {criteria.isError ? (
          <ErrorState message="Could not load your criteria." onRetry={() => criteria.refetch()} />
        ) : null}

        {criteria.data ? (
          <form
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              save.mutate(
                {
                  remoteOnly,
                  roleKeywords,
                  includeKeywords,
                  excludeKeywords,
                  regionKeywords,
                  nearbyKeywords,
                  levels,
                  minSalaryUsd: minSalary.trim() === '' ? null : Number(minSalary),
                },
                {
                  onSuccess: () => {
                    setDirty(false);
                    toast.success('Criteria saved', {
                      description: 'Rescore to apply them to existing postings.',
                      action: {
                        label: 'Rescore',
                        onClick: () =>
                          rescore.mutate(undefined, {
                            onSuccess: (data) =>
                              toast.success(`Rescored — ${data.rescored} matches`),
                          }),
                      },
                    });
                  },
                  onError: () => toast.error('Could not save your criteria'),
                },
              );
            }}
          >
            <label className="flex items-center justify-between gap-4 border-b border-line pb-4">
              <span>
                <span className="block text-body text-fg">Remote only</span>
                <span className="block text-caption text-muted">
                  Anything not marked remote scores zero, unless it is near you.
                </span>
              </span>
              <Switch
                checked={remoteOnly}
                onCheckedChange={mark(setRemoteOnly)}
                ariaLabel="Remote only"
              />
            </label>

            <TagInput
              label="Near you"
              hint="on-site or hybrid postings in these places still count, +20"
              values={nearbyKeywords}
              onChange={mark(setNearbyKeywords)}
              suggestions={NEARBY_SUGGESTIONS}
            />

            <TagInput
              label="Role keywords"
              hint="+30 for the first one found"
              values={roleKeywords}
              onChange={mark(setRoleKeywords)}
              suggestions={ROLE_SUGGESTIONS}
            />
            <TagInput
              label="Include keywords"
              hint="+10 each, capped at +40"
              values={includeKeywords}
              onChange={mark(setIncludeKeywords)}
              suggestions={STACK_SUGGESTIONS}
            />
            <TagInput
              label="Exclude keywords"
              hint="any hit drops the posting to zero"
              values={excludeKeywords}
              onChange={mark(setExcludeKeywords)}
              suggestions={EXCLUDE_SUGGESTIONS}
            />

            <fieldset>
              <legend className="text-body-sm text-fg">Levels you are applying for</legend>
              <p className="mt-0.5 text-caption text-muted">
                a title that reads as another level scores zero; titles with no level pass; pick
                none to ignore
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {LEVELS.map((level) => {
                  const on = levels.includes(level);
                  return (
                    <button
                      key={level}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggleLevel(level)}
                      className={cn(
                        'rounded-md border px-3 py-1.5 text-body-sm transition-colors duration-150',
                        on
                          ? 'border-accent bg-accent-soft text-accent'
                          : 'border-line bg-surface text-muted hover:bg-surface-2 hover:text-fg',
                      )}
                    >
                      {LEVEL_LABEL[level]}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <TagInput
              label="Where you can work"
              hint="a posting naming another region scores zero; blank to ignore"
              values={regionKeywords}
              onChange={mark(setRegionKeywords)}
              suggestions={REGION_SUGGESTIONS}
            />

            <Field
              label="Minimum salary"
              htmlFor="min-salary"
              hint="USD per year, blank for none"
              className="max-w-64"
            >
              <div className="relative">
                <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-body text-faint">
                  $
                </span>
                <Input
                  id="min-salary"
                  inputMode="numeric"
                  className="tabular pl-6"
                  placeholder="120000"
                  value={minSalary}
                  onChange={(event) =>
                    mark(setMinSalary)(event.target.value.replace(/[^0-9]/g, ''))
                  }
                />
              </div>
            </Field>

            <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={!dirty}
                loading={save.isPending}
              >
                Save criteria
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                loading={rescore.isPending}
                onClick={() =>
                  rescore.mutate(undefined, {
                    onSuccess: (data) =>
                      toast.success(`Rescored — ${data.rescored} matches`, {
                        action: {
                          label: 'Open inbox',
                          onClick: () => (window.location.href = '/inbox'),
                        },
                      }),
                    onError: () => toast.error('Could not rescore'),
                  })
                }
              >
                <RefreshCw className="size-4" /> Rescore now
              </Button>
              {dirty ? <span className="text-caption text-warning">Unsaved changes</span> : null}
            </div>
          </form>
        ) : null}
      </Panel>

      <Panel className="self-start">
        <SectionTitle>How the score adds up</SectionTitle>
        <ol className="space-y-2">
          {RULES.map((item) => (
            <li key={item.rule} className="flex gap-3 text-caption">
              <span className="tabular w-8 shrink-0 font-mono text-accent">{item.points}</span>
              <span className="text-muted">{item.rule}</span>
            </li>
          ))}
        </ol>
        <p className="mt-4 border-t border-line pt-3 text-caption text-muted">
          Maximum 130. A posting becomes a match at <span className="font-mono text-fg">40</span> or
          more. The chips in the{' '}
          <Link href="/inbox" className="text-accent hover:underline">
            inbox
          </Link>{' '}
          are these rules, so every number can be traced. Regions are read from the headline, the
          location, and sentences in the description like “must be located in”.
        </p>
      </Panel>
    </div>
  );
}
