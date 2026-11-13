// Minimal test-only surface used by the standalone runtime integration test.
declare module "jsdom" {
  export class JSDOM {
    constructor(html?: string, options?: { runScripts?: "outside-only"; url?: string });
    window: Window & { eval(source: string): unknown };
  }
}
