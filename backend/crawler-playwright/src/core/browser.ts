import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';

export interface BrowserBundle {
  browser: Browser;
  context: BrowserContext;
  page: Page;
}

const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

export async function createBrowserBundle(headed: boolean): Promise<BrowserBundle> {
  const browser = await chromium.launch({
    headless: !headed,
  });

  const context = await browser.newContext({
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
    userAgent: DEFAULT_USER_AGENT,
    viewport: { width: 1440, height: 1200 },
  });

  const page = await context.newPage();
  return { browser, context, page };
}
