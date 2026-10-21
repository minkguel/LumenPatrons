import { MAILPIT_URL } from "./env";

type LinkKind = "signup" | "recovery";

type SearchResult = { messages?: { ID: string }[] };
type Message = { HTML?: string; Text?: string };

const TIMEOUT_MS = 10_000;
const INTERVAL_MS = 250;

function decodeHtmlEntities(value: string): string {
  return value.replace(/&amp;/g, "&").replace(/&#43;/g, "+").replace(/&#x2B;/gi, "+");
}

function findLink(message: Message, kind: LinkKind): string | null {
  const body = `${message.HTML ?? ""}\n${message.Text ?? ""}`;
  for (const match of body.matchAll(/https?:\/\/[^\s"'<>]+/g)) {
    const candidate = decodeHtmlEntities(match[0]);
    try {
      const url = new URL(candidate);
      if (url.pathname === "/auth/confirm" && url.searchParams.get("type") === kind) {
        return candidate;
      }
    } catch {
      // Not a URL; keep scanning.
    }
  }
  return null;
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${MAILPIT_URL}${path}`);
  if (!response.ok) throw new Error(`Mailpit ${path} returned ${response.status}`);
  return (await response.json()) as T;
}

/**
 * Polls the local stack's Mailpit for up to 10 s and returns the first
 * `/auth/confirm?...type=<kind>` link in the newest message sent to `email`.
 */
export async function latestLinkFor(email: string, kind: LinkKind): Promise<string> {
  const deadline = Date.now() + TIMEOUT_MS;
  const query = encodeURIComponent(`to:${email}`);

  while (Date.now() < deadline) {
    const { messages = [] } = await getJson<SearchResult>(`/api/v1/search?query=${query}`);
    const newest = messages[0];
    if (newest) {
      const link = findLink(await getJson<Message>(`/api/v1/message/${newest.ID}`), kind);
      if (link) return link;
    }
    await new Promise((resolve) => setTimeout(resolve, INTERVAL_MS));
  }

  throw new Error(`No ${kind} link for ${email} within ${TIMEOUT_MS / 1000} s`);
}
