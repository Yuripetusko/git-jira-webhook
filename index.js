const express = require('express');
const path = require('path');
const githubMiddleware = require('github-webhook-middleware')({
  secret: 'bbsecret',
  limit: '1mb', // <-- optionally include the webhook json payload size limit, useful if you have large merge commits.  Default is '100kb'
});

const PORT = process.env.PORT || 5000;

const app = express();

app.post('/hooks/github/', githubMiddleware, (req, res) => {
  // Only respond to github push events
  const eventName = req.headers['x-github-event'];
  if (eventName != 'pull_request') return res.status(200).end();

  const payload = req.body;
  const repo = payload.repository.full_name;
  const branch = payload.ref.split('/').pop();
  console.log(payload);
});

app
  .set('view engine', 'ejs')
  .listen(PORT, () => console.log(`Listening on ${PORT}`));
