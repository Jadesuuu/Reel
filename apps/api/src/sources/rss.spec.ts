import { parseRssItems } from './rss.js';

const FEED = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Feed</title>
    <item>
      <media:content url="https://cdn.example/logo.gif" type="image/png"/>
      <title>Acme: Senior Engineer &amp; Lead</title>
      <region>Anywhere in the World</region>
      <category>Full-Stack Programming</category>
      <description>&lt;p&gt;Hello &amp;amp; welcome&lt;/p&gt;</description>
      <pubDate>Tue, 08 Sep 2026 13:49:13 +0000</pubDate>
      <guid>https://example.com/jobs/1</guid>
      <link>https://example.com/jobs/1</link>
    </item>
    <item>
      <title><![CDATA[Globex: Backend Developer]]></title>
      <description><![CDATA[<p>Raw <b>html</b></p>]]></description>
      <link>https://example.com/jobs/2</link>
    </item>
  </channel>
</rss>`;

describe('parseRssItems', () => {
  it('extracts one record per item with decoded text', () => {
    const items = parseRssItems(FEED);
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({
      title: 'Acme: Senior Engineer & Lead',
      link: 'https://example.com/jobs/1',
      guid: 'https://example.com/jobs/1',
      pubDate: 'Tue, 08 Sep 2026 13:49:13 +0000',
      description: '<p>Hello &amp; welcome</p>',
    });
    expect(items[0]?.fields.region).toBe('Anywhere in the World');
    expect(items[0]?.fields.category).toBe('Full-Stack Programming');
  });

  it('unwraps CDATA without decoding it twice', () => {
    const items = parseRssItems(FEED);
    expect(items[1]).toMatchObject({
      title: 'Globex: Backend Developer',
      description: '<p>Raw <b>html</b></p>',
      guid: null,
      pubDate: null,
    });
  });

  it('returns an empty list for a feed with no items', () => {
    expect(parseRssItems('<rss><channel></channel></rss>')).toEqual([]);
  });
});
