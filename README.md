# clocktowerext
BOTC Twitch Extension


To test locally, run `npm install` then `npm run dev:test` and navigate to https://localhost:8080/. In chrome, you made need to accept the bypass for https.
Configuration can be tested as is at https://localhost:8080/config.html.


## Deploy to Twitch Dev

### Manual package only
Run:

`npm run package:twitch`

This rebuilds and writes `clocktowerext.zip` in the repo root.
`package:twitch` excludes local-only artifacts from the zip (`dev/*`, nested `*/dev/*`, and `test_*`) and runs `package:verify` to fail if any dev/test files are present.
