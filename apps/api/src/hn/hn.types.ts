export type HnItem = {
  id: number;
  by?: string;
  time: number;
  text?: string;
  kids?: number[];
  parent?: number;
  deleted?: boolean;
  dead?: boolean;
  type: 'comment' | 'story' | 'job' | 'poll' | 'pollopt';
};

export type HnSearchHit = {
  objectID: string;
  title: string;
  created_at: string;
};

export type HnSearchResponse = {
  hits: HnSearchHit[];
};
