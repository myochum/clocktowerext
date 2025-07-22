# clocktowerext
BOTC Twitch Extension


To test locally, run `npm install` then `npm run dev` and navigate to https://localhost:8080/. In chrome, you made need to accept the bypass for https.
Configuration can be tested as is at https://localhost:8080/config.html.
To test the extenion, you will need to use a dummy test config.


To install to Twitch, run `npm run build && cd build && zip -r ../clocktowerext.zip .` and upload to https://dev.twitch.tv/ Extensions.