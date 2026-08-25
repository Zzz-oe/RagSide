import { env } from '../config/env.js';
import type { ParsedPage } from './parser.service.js';

export interface TextChunk {
  content: string;
  pageNumber: number;
  chunkIndex: number;
  charStart: number;
  charEnd: number;
}

function trimChunk(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export function chunkPages(
  pages: ParsedPage[],
  chunkSize = env.CHUNK_SIZE,
  overlap = env.CHUNK_OVERLAP
): TextChunk[] {
  const normalizedOverlap = Math.min(overlap, chunkSize - 1);
  const chunks: TextChunk[] = [];

  for (const page of pages) {
    const characters = Array.from(page.text);
    let start = 0;

    while (start < characters.length) {
      const end = Math.min(start + chunkSize, characters.length);
      const content = trimChunk(characters.slice(start, end).join(''));

      if (content.length > 0) {
        chunks.push({
          content,
          pageNumber: page.pageNumber,
          chunkIndex: chunks.length,
          charStart: start,
          charEnd: end
        });
      }

      if (end >= characters.length) {
        break;
      }

      start = end - normalizedOverlap;
    }
  }

  return chunks;
}

