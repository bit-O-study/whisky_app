import { readFile } from 'node:fs/promises';

export interface CliOptions {
  keywords: string[];
  keywordsFile?: string;
  limit?: number;
  headed: boolean;
  trace: boolean;
}

export function parseCliArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    keywords: [],
    headed: false,
    trace: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    const value = argv[index + 1];

    if ((token === '--keyword' || token === '-k') && value) {
      options.keywords.push(value);
      index += 1;
      continue;
    }

    if (token === '--keywords-file' && value) {
      options.keywordsFile = value;
      index += 1;
      continue;
    }

    if (token === '--limit' && value) {
      options.limit = Number.parseInt(value, 10);
      index += 1;
      continue;
    }

    if (token === '--headed') {
      options.headed = true;
      continue;
    }

    if (token === '--trace') {
      options.trace = true;
      continue;
    }

    if (token === '--help' || token === '-h') {
      printHelp();
      process.exit(0);
    }
  }

  return options;
}

export async function resolveKeywords(options: CliOptions): Promise<string[]> {
  const keywords = [...options.keywords];

  if (options.keywordsFile) {
    const content = await readFile(options.keywordsFile, 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const keyword = line.trim();
      if (keyword) {
        keywords.push(keyword);
      }
    }
  }

  if (keywords.length === 0 && process.env.CRAWL_KEYWORDS) {
    for (const token of process.env.CRAWL_KEYWORDS.split(',')) {
      const keyword = token.trim();
      if (keyword) {
        keywords.push(keyword);
      }
    }
  }

  const uniqueKeywords = [...new Set(keywords)];
  const limit = options.limit && options.limit > 0 ? options.limit : uniqueKeywords.length;
  return uniqueKeywords.slice(0, limit);
}

function printHelp(): void {
  console.log(`Usage:
  npm run crawl:emart -- --keyword "산토리 가쿠빈 700ml" [--keyword ...] [--limit N] [--trace] [--headed]
  npm run crawl:emart -- --keywords-file ./keywords.txt [--limit N]`);
}
