export type Paginated<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
};

export function toSkipTake(
  page: number,
  pageSize: number,
): { skip: number; take: number } {
  return { skip: (page - 1) * pageSize, take: pageSize };
}

export function paginate<T>(
  items: T[],
  page: number,
  pageSize: number,
  total: number,
): Paginated<T> {
  return { items, page, pageSize, total };
}
