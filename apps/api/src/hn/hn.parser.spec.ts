import {
  detectRemote,
  extractApplyUrl,
  extractHeadline,
  extractStackKeywords,
  fingerprintFor,
  htmlToText,
  parseComment,
  parseSalary,
  splitSegments,
} from './hn.parser.js';
import type { HnItem } from './hn.types.js';

describe('htmlToText', () => {
  it('turns <p> into blank lines and <br> into newlines, decoding entities', () => {
    expect(htmlToText('Acme &amp; Co<p>Hiring<br>Remote')).toBe(
      'Acme & Co\n\nHiring\nRemote',
    );
  });
  it('strips anchor tags but keeps their text', () => {
    expect(htmlToText('Email <a href="mailto:x@y.com">x@y.com</a>')).toBe(
      'Email x@y.com',
    );
  });
});

describe('extractHeadline', () => {
  it('takes the first non-empty line, capped at 300 chars', () => {
    expect(extractHeadline('\n  Acme | Backend  \nmore')).toBe(
      'Acme | Backend',
    );
  });
});

describe('splitSegments', () => {
  it('splits on pipes and trims empties', () => {
    expect(splitSegments('Acme |  Backend |  | Remote ')).toEqual([
      'Acme',
      'Backend',
      'Remote',
    ]);
  });
});

describe('detectRemote', () => {
  it('prefers hybrid over remote', () => {
    expect(detectRemote('Backend | Hybrid remote')).toBe('HYBRID');
  });
  it('detects remote', () => {
    expect(detectRemote('Backend | Remote (US)')).toBe('REMOTE');
  });
  it('detects onsite', () => {
    expect(detectRemote('Backend | On-site NYC')).toBe('ONSITE');
  });
  it('returns UNKNOWN when nothing matches', () => {
    expect(detectRemote('Backend Engineer')).toBe('UNKNOWN');
  });
});

describe('parseSalary', () => {
  it('parses a USD range to min and max', () => {
    expect(parseSalary('SWE | $150k-$200k')).toEqual({
      salaryText: '$150k-$200k',
      salaryMinUsd: 150000,
      salaryMaxUsd: 200000,
    });
  });
  it('parses a single USD figure', () => {
    const r = parseSalary('SWE | $120k');
    expect(r.salaryMinUsd).toBe(120000);
    expect(r.salaryMaxUsd).toBeNull();
  });
  it('keeps salaryText but null USD for euro amounts', () => {
    const r = parseSalary('SWE | €90k');
    expect(r.salaryText).toBe('€90k');
    expect(r.salaryMinUsd).toBeNull();
  });
  it('ignores figures below 30 as non-annual', () => {
    expect(parseSalary('SWE | $20k')).toEqual({
      salaryText: '$20k',
      salaryMinUsd: null,
      salaryMaxUsd: null,
    });
  });
  it('returns nulls when there is no salary', () => {
    expect(parseSalary('SWE | Remote')).toEqual({
      salaryText: null,
      salaryMinUsd: null,
      salaryMaxUsd: null,
    });
  });
});

describe('extractStackKeywords', () => {
  it('finds keywords on word boundaries and normalizes aliases', () => {
    expect(extractStackKeywords('We use Node.js, golang and k8s')).toEqual([
      'node',
      'go',
      'kubernetes',
    ]);
  });
  it('does not match substrings', () => {
    expect(extractStackKeywords('javafx and gogo dancers')).toEqual([]);
  });
  it('matches c# and .net with punctuation', () => {
    expect(extractStackKeywords('Stack: C# / .NET')).toEqual(['c#', '.net']);
  });
});

describe('extractApplyUrl', () => {
  it('prefers the first external link', () => {
    expect(extractApplyUrl('<a href="https://acme.com/jobs">jobs</a>')).toBe(
      'https://acme.com/jobs',
    );
  });
  it('falls back to mailto', () => {
    expect(extractApplyUrl('<a href="mailto:jobs@acme.com">apply</a>')).toBe(
      'mailto:jobs@acme.com',
    );
  });
  it('ignores news.ycombinator.com links', () => {
    expect(
      extractApplyUrl('<a href="https://news.ycombinator.com/user?id=x">x</a>'),
    ).toBeNull();
  });
});

describe('fingerprintFor', () => {
  it('is stable across company/role casing and punctuation', () => {
    expect(fingerprintFor('Acme, Inc.', 'Backend Engineer', '1')).toBe(
      fingerprintFor('acme inc', 'backend  engineer', '2'),
    );
  });
  it('falls back to the comment id when company is null', () => {
    expect(fingerprintFor(null, 'Backend', '42')).not.toBe(
      fingerprintFor(null, 'Backend', '43'),
    );
  });
});

describe('parseComment (fixtures)', () => {
  const cases: Array<{
    name: string;
    item: HnItem;
    expect: Record<string, unknown>;
  }> = [
    {
      name: 'canonical pipe format',
      item: {
        id: 1,
        type: 'comment',
        time: 1,
        by: 'acme',
        text: 'Acme | Senior Backend Engineer | San Francisco or Remote | $160k-$210k<p>We run TypeScript, Node and Postgres on AWS.<p>Apply: <a href="https://acme.com/apply">here</a>',
      },
      expect: {
        company: 'Acme',
        role: 'Senior Backend Engineer',
        remote: 'REMOTE',
        salaryMinUsd: 160000,
        salaryMaxUsd: 210000,
        stackKeywords: ['typescript', 'node', 'postgres', 'aws'],
        applyUrl: 'https://acme.com/apply',
      },
    },
    {
      name: 'no pipes, prose only',
      item: {
        id: 2,
        type: 'comment',
        time: 1,
        text: 'We are a small startup looking for a full-stack developer. Remote within EU.<p>React and Rails.',
      },
      expect: {
        company: null,
        remote: 'REMOTE',
        salaryMinUsd: null,
        stackKeywords: ['react', 'rails'],
        applyUrl: null,
      },
    },
    {
      name: 'hybrid with euro salary and mailto',
      item: {
        id: 3,
        type: 'comment',
        time: 1,
        text: 'Globex | Frontend Engineer | Berlin | Hybrid | €80k<p>Vue and TypeScript.<p><a href="mailto:jobs@globex.io">jobs@globex.io</a>',
      },
      expect: {
        company: 'Globex',
        role: 'Frontend Engineer',
        location: 'Berlin',
        remote: 'HYBRID',
        salaryText: '€80k',
        salaryMinUsd: null,
        stackKeywords: ['typescript', 'vue'],
        applyUrl: 'mailto:jobs@globex.io',
      },
    },
  ];

  for (const c of cases) {
    it(c.name, () => {
      expect(parseComment(c.item)).toMatchObject(c.expect);
    });
  }
});
