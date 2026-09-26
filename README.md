# TradeArk website

Static HTML, CSS and JavaScript source for the TradeArk website.

## Edit and preview

Open this folder in VS Code. Edit `index.html` for the homepage, other root `.html` files for other pages, and `assets/css/styles.css` for styling. Run `python3 preview-server.py` or `npm run dev`, then open `http://localhost:4173`.

## Publish to Sites

The Sites deployment uses `dist/`. Copy changed public pages and assets into the matching paths under `dist/` before asking Codex to publish. Pushing to GitHub alone does not update the live Site.
