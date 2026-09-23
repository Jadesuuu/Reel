import he from 'he';

export type RssItem = {
  title: string | null;
  link: string | null;
  guid: string | null;
  pubDate: string | null;
  description: string | null;
  fields: Record<string, string>;
};

const ITEM_REGEX = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;
const CHILD_REGEX = /<([a-zA-Z][\w:-]*)(?:\s[^>]*)?>([\s\S]*?)<\/\1>/g;
const CDATA_REGEX = /^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/;

function unwrap(value: string): string {
  const cdata = CDATA_REGEX.exec(value);
  const inner = cdata ? (cdata[1] ?? '') : he.decode(value);
  return inner.trim();
}

export function parseRssItems(xml: string): RssItem[] {
  const items: RssItem[] = [];

  for (const match of xml.matchAll(ITEM_REGEX)) {
    const body = match[1] ?? '';
    const fields: Record<string, string> = {};

    for (const child of body.matchAll(CHILD_REGEX)) {
      const name = (child[1] ?? '').toLowerCase();
      const value = unwrap(child[2] ?? '');
      if (name.length > 0 && !(name in fields)) {
        fields[name] = value;
      }
    }

    items.push({
      title: fields.title ?? null,
      link: fields.link ?? null,
      guid: fields.guid ?? null,
      pubDate: fields.pubdate ?? null,
      description: fields.description ?? null,
      fields,
    });
  }

  return items;
}
