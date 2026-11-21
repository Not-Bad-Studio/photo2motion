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

The pages are generated on the studio's Mac by the tools in `~/Sites/motion-demos` (the private repo
Not-Bad-Studio/photo2motion-tools; the clients' photos stay on the Mac), which write straight into this folder:

```bash
cd ~/Sites/motion-demos
python3 tools/build_p2m_sectors.py   # builds the home page, the three sector pages, thanks.html and 404.html
```

Then commit and push this repo to publish. The build also writes `sitemap.xml`, the icons and the films, posters and
photos in `images/` and `videos/`. `jobs.html`, `holding.html`, `robots.txt`, `_redirects`, `_headers`, `netlify.toml`
and this README are edited here by hand.

## Moving out of the Not Bad Studio site

Until 21 November 2026 these pages lived in the `notbadstudio` repo and Netlify project, with photo2motion.studio as a
second address on it. The move happens in stages so payments and the free clip never stop working:

1. **Done:** this repo and its Netlify project ran alongside on the project's netlify.app address.
2. **Done 21 Nov 2026:** photo2motion.studio moved to this Netlify project, the builders write straight into this
   repo, and the Photo2Motion pages left the `notbadstudio` repo. Its `p2m-forms.html` keeps the hidden forms
   `motion-clip`, `p2m-order` and `p2m-paid` registered there, because the functions there post each free clip and
   order to them. Still to tidy: GoDaddy's `www` CNAME points at notbadstudio.netlify.app (it works, as Netlify routes
   by address); point it at photo2motion.netlify.app.
3. **Later, the functions**: checkout, free clip, Stripe webhook and jobs board move here with their keys
   (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `JOBS_BOARD_KEY`, set in Netlify by the account owner), and Stripe's webhook
   points at photo2motion.studio. Until then `_redirects` forwards `/api/*` to www.notbadstudio.com.

The repo is public on purpose: Netlify's Personal and Free plans can't deploy private repos owned by a GitHub
organisation. Nothing secret goes in it.
