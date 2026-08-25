import { promises as fs } from 'node:fs';
import path from 'node:path';
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';

export interface ParsedPage {
  pageNumber: number;
  text: string;
}

export interface ParsedDocument {
  pages: ParsedPage[];
  pageCount: number;
}

const textExtensions = new Set(['.txt', '.md', '.csv']);
const wordExtensions = new Set(['.docx']);

function cleanText(value: string): string {
  return value
    .replace(/\u0000/g, '')
    .replace(/[\t\f\v]+/g, ' ')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function parsePdf(filePath: string): Promise<ParsedDocument> {
  const buffer = await fs.readFile(filePath);
  const pages: ParsedPage[] = [];

  const data = await pdfParse(buffer, {
    pagerender: async (pageData: {
      getTextContent: (options?: { normalizeWhitespace?: boolean; disableCombineTextItems?: boolean }) => Promise<{
        items: Array<{ str?: string }>;
      }>;
    }) => {
      const textContent = await pageData.getTextContent({
        normalizeWhitespace: true,
        disableCombineTextItems: false
      });
      const text = cleanText(textContent.items.map((item) => item.str ?? '').join(' '));
      pages.push({ pageNumber: pages.length + 1, text });
      return text;
    }
  } as Parameters<typeof pdfParse>[1]);

  const fallbackText = cleanText(data.text ?? '');
  const parsedPages = pages.length > 0 ? pages : [{ pageNumber: 1, text: fallbackText }];
  return {
    pages: parsedPages.filter((page) => page.text.length > 0),
    pageCount: Math.max(data.numpages ?? parsedPages.length, parsedPages.length)
  };
}

async function parseWord(filePath: string): Promise<ParsedDocument> {
  const result = await mammoth.extractRawText({ path: filePath });
  return {
    pages: [{ pageNumber: 1, text: cleanText(result.value) }].filter((page) => page.text.length > 0),
    pageCount: 1
  };
}

async function parseText(filePath: string): Promise<ParsedDocument> {
  const value = await fs.readFile(filePath, 'utf8');
  return {
    pages: [{ pageNumber: 1, text: cleanText(value) }].filter((page) => page.text.length > 0),
    pageCount: 1
  };
}

export async function parseDocument(filePath: string, mimeType: string): Promise<ParsedDocument> {
  const extension = path.extname(filePath).toLowerCase();

  if (mimeType === 'application/pdf' || extension === '.pdf') {
    return parsePdf(filePath);
  }

  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    wordExtensions.has(extension)
  ) {
    return parseWord(filePath);
  }

  if (mimeType.startsWith('text/') || textExtensions.has(extension)) {
    return parseText(filePath);
  }

  throw new Error('仅支持 PDF、Word .docx 和文本文件');
}

