import { ApiError } from '../lib/api';

export type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export type DemoRequest = {
  method: Method;
  path: string;
  params: Record<string, string>;
  query: URLSearchParams;
  body: Record<string, unknown>;
};

export type Handler = (request: DemoRequest) => unknown | Promise<unknown>;

type Route = { method: Method; pattern: RegExp; keys: string[]; handler: Handler };

const routes: Route[] = [];

export function route(method: Method, template: string, handler: Handler): void {
  const keys: string[] = [];
  const pattern = new RegExp(
    `^${template.replace(/\//g, '\\/').replace(/:([a-zA-Z]+)/g, (_match, key: string) => {
      keys.push(key);
      return '([^/]+)';
    })}$`,
  );
  routes.push({ method, pattern, keys, handler });
}

export async function dispatch(
  method: Method,
  url: string,
  body: Record<string, unknown>,
): Promise<unknown> {
  const [path, search = ''] = url.split('?');
  for (const candidate of routes) {
    if (candidate.method !== method) continue;
    const match = candidate.pattern.exec(path ?? '');
    if (!match) continue;
    const params: Record<string, string> = {};
    candidate.keys.forEach((key, index) => {
      params[key] = decodeURIComponent(match[index + 1] ?? '');
    });
    return candidate.handler({
      method,
      path: path ?? '',
      params,
      query: new URLSearchParams(search),
      body,
    });
  }
  throw new ApiError(404, `Cannot ${method} ${path}`);
}

export function requireSignedIn(signedIn: boolean): void {
  if (!signedIn) throw new ApiError(401, 'Unauthorized');
}

export function paginate<T>(items: T[], query: URLSearchParams) {
  const page = Math.max(1, Number(query.get('page') ?? '1') || 1);
  const pageSize = Math.min(100, Math.max(1, Number(query.get('pageSize') ?? '25') || 25));
  const start = (page - 1) * pageSize;
  return { items: items.slice(start, start + pageSize), page, pageSize, total: items.length };
}

export function bad(message: string): never {
  throw new ApiError(400, message);
}

export function conflict(message: string): never {
  throw new ApiError(409, message);
}

export function notFound(message: string): never {
  throw new ApiError(404, message);
}

export function text(value: unknown, max = 2000): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed.slice(0, max) : null;
}
