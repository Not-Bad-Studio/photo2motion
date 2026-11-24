// The 30-day limit on delivery links, photo2motion.studio/get/<token>/ (the films themselves are static files on the
// photo2motion-files project, proxied by _redirects; motion-demos/tools/deliver.py builds and deploys them).
//
// It lives here, on the front door, not on the files project: edge functions run before Netlify's cache, and this site
// caches the proxied /get/ responses (for a year, checked 24 Nov 2026), so a check on the files project never saw a
// cached hit. Netlify's normal build for this repo bundles netlify/edge-functions.
//
// Runs in front of every file under /get/<token>/ (the page, its films, posters and thumbnails). It asks the delivery API
// whether that link has ended (functions/delivery.src.mjs, through photo2motion.studio/api), remembers the answer for a
// minute so a film's many range requests cost one lookup, then either lets the request through to the static files or,
// once the link has ended, answers 410 with the "This link has ended" page (/get/ended/, built by tools/deliver.py).
//
// It fails open: if the API can't be reached or doesn't know the token, the files are served. A glitch should never
// stop a paying customer downloading; the token is what keeps the files private, the date only tidies up.
// DELIVERY_API overrides the API's address (the local tests point it at netlify dev).

const API = "https://photo2motion.studio/api/delivery/";
const TOKEN_PATH = /^\/get\/([a-z0-9_-]{16,64})(?:\/|$)/i;
const REMEMBER_MS = 60 * 1000;
const LOOKUP_TIMEOUT_MS = 4000;
const remembered = new Map();

/**
 * Ask the delivery API about a link, or answer from the last minute's lookups.
 * @param {string} token the link's token
 * @returns {Promise<{ended?: boolean, unknown?: boolean} | null>} null when the API couldn't say (not remembered)
 */
async function lookup(token) {
  const hit = remembered.get(token);
  if (hit && Date.now() - hit.at < REMEMBER_MS) return hit.info;
  const base = Netlify.env.get("DELIVERY_API") || API;
  let info = null;
  try {
    const res = await fetch(base + encodeURIComponent(token), { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(LOOKUP_TIMEOUT_MS) });
    if (res.ok) info = await res.json();
    else if (res.status === 404) info = { unknown: true };
    else console.error(`get-link: lookup answered ${res.status}`); // Deno's console doesn't fill in %s here
  } catch (err) {
    console.error(`get-link: lookup failed: ${err && err.message}`);
  }
  if (info) {
    if (remembered.size > 500) remembered.clear();
    remembered.set(token, { at: Date.now(), info });
  }
  return info;
}

/**
 * The answer once a link has ended: the friendly page for a browser opening the link, plain text for a film or picture.
 * @param {Request} req the request for a file under the ended link
 */
async function ended(req) {
  const headers = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" };
  const wantsPage = req.method === "GET" && (req.headers.get("accept") || "").includes("text/html");
  if (wantsPage) {
    const page = await fetch(new URL("/get/ended/", req.url)).catch(() => null);  // no token, so this function lets it through
    if (page && page.ok) return new Response(page.body, { status: 410, headers: { ...headers, "Content-Type": "text/html; charset=utf-8" } });
  }
  return new Response("This link has ended. Reply to our email and we'll send a fresh one.\n", {
    status: 410, headers: { ...headers, "Content-Type": "text/plain; charset=utf-8" },
  });
}

/**
 * Let a live link through to its files; answer an ended one with the ended page.
 * @param {Request} req any request under /get/
 */
export default async (req) => {
  const match = new URL(req.url).pathname.match(TOKEN_PATH);
  if (!match) return; // not a link (e.g. /get/ itself): the static files answer, usually with the 404 page
  // Netlify serves static paths whatever their case (/GET/AB12... finds /get/ab12.../), so every case of a link is the
  // same link: tokens are lower case (deliver.py), and the lookup uses the lower-case form.
  const info = await lookup(match[1].toLowerCase());
  if (info && info.ended === true) return ended(req);
  // Live, unknown, or the API couldn't say: carry on to the static files.
};

// Every case of /get/, for the same reason as the lower-case token: a "/get/*" path alone would let /GET/... past.
// Eight plain paths rather than a regex "pattern", the form proven on this site.
// "bypass": if this function itself breaks, Netlify serves the files as if it weren't there (fail open, as above).
export const config = { path: ["/get/*", "/geT/*", "/gEt/*", "/gET/*", "/Get/*", "/GeT/*", "/GEt/*", "/GET/*"], onError: "bypass" };
