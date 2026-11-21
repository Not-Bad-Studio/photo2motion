# photo2motion.studio

The website for Photo2Motion, a Not Bad Studio service that turns a business's existing professional photos into
short films. Netlify publishes this repo as it is (no build step) whenever `main` changes: Netlify project
`photo2motion` (https://photo2motion.netlify.app), with team login on previews only, like the studio's other sites.
Each production deploy uses 15 Netlify credits, so batch changes into one push. Netlify's GitHub app sees only the
repos picked for it (github.com/organizations/Not-Bad-Studio/settings/installations, Netlify, Configure); this one was
added on 21 Nov 2026. A new repo has to be added there too, or its pushes won't publish.

| Page | File |
|---|---|
| https://photo2motion.studio/ | `index.html` |
| /hospitality, /property, /marine | `hospitality.html`, `property.html`, `marine.html` |
| /thanks (after a Stripe payment, noindex) | `thanks.html` |
| /jobs (the studio's job board, passphrase, noindex) | `jobs.html` |
| Page not found | `404.html` |
| Holding page, not linked (swap it in for `index.html` to put it back up) | `holding.html` |
| /for/&lt;page&gt;/ (private client pages) | served from the Netlify project `nbs-motion-demos` (see `_redirects`) |

## Don't edit the pages by hand

The pages are generated on the studio's Mac from `~/Sites/motion-demos` (not in this repo: it holds clients' photos):

```bash
cd ~/Sites/motion-demos
python3 tools/build_p2m_sectors.py   # builds the home page, then the three sector pages
python3 tools/sync_p2m_site.py       # copies them, and only the files they use, into this repo
```

`images/`, `videos/` and `fonts/` hold exactly the files the pages use; the sync removes anything else. `robots.txt`
and `sitemap.xml` come from the build too. `_redirects`, `_headers`, `netlify.toml` and this README are edited here.

## Moving out of the Not Bad Studio site

Until 21 November 2026 these pages lived in the `notbadstudio` repo and Netlify project, with photo2motion.studio as a
second address on it. The move happens in stages so payments and the free clip never stop working:

1. **This repo and its Netlify project run alongside** on the project's netlify.app address. photo2motion.studio is
   still served by the `notbadstudio` project, and `sync_p2m_site.py` copies each build across.
2. **photo2motion.studio moves here**: the domain moves to this Netlify project, GoDaddy's `www` CNAME points at it,
   the builders write straight into this repo, and the Photo2Motion pages leave the `notbadstudio` repo. The hidden
   forms `motion-clip`, `p2m-order` and `p2m-paid` must stay registered on the `notbadstudio` project, because the
   functions there post each free clip and order to them.
3. **Later, the functions**: checkout, free clip, Stripe webhook and jobs board move here with their keys
   (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `JOBS_BOARD_KEY`, set in Netlify by the account owner), and Stripe's webhook
   points at photo2motion.studio. Until then `_redirects` forwards `/api/*` to www.notbadstudio.com.

The repo is public on purpose: Netlify's Personal and Free plans can't deploy private repos owned by a GitHub
organisation. Nothing secret goes in it.
