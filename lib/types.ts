export type Video = {
  _id: string;
  name: string;
  slug: string;
  youtubeId: string;
  url: string;
  language: string;
  durationSec?: number | null;
  createdAt?: Date;
  updatedAt?: Date;
};

export type TranscriptSegment = {
  _id: string;
  videoId: string;
  order: number;
  startSec: number;
  endSec: number | null;
  text: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export type Language = {
  code: string;
  name: string;
  flag: string;
};

export type VideoWithSegments = Video & {
  segments: TranscriptSegment[];
};

export type TranscriptParseResult = {
  segments: TranscriptSegment[];
  hasMarkers: boolean;
};
