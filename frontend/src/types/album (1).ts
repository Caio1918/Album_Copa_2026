export type StickerType = 'NORMAL' | 'SHINY';

export type StickerStatus = 'PASTED' | 'MISSING';

export type Sticker = {
  id: string;
  number: number;
  code: string;
  name: string;
  type: StickerType;
  imageUrl?: string;
  quantity: number;
  isPasted: boolean;
  pastedAt?: string;
  teamId: string;
  groupId: string;
};

export type Team = {
  id: string;
  name: string;
  code: string;
  flagUrl?: string;
  groupId: string;
};

export type Group = {
  id: string;
  name: string;
  order: number;
};

export type AlbumData = {
  groups: Group[];
  teams: Team[];
  stickers: Sticker[];
};

export type AlbumStats = {
  total: number;
  pasted: number;
  missing: number;
  duplicates: number;
  normalMissing: number;
  shinyMissing: number;
  percentage: number;
};

export type ProgressSummary = {
  total: number;
  pasted: number;
  missing: number;
  duplicates: number;
  percentage: number;
};

export type AddRepeatedStickerPayload = {
  stickerId: string;
  quantity: number;
};

export type UpdateStickerQuantityPayload = {
  stickerId: string;
  quantity: number;
};

export type UpdateStickerPastedPayload = {
  stickerId: string;
  isPasted: boolean;
};
