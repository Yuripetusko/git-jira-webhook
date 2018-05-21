const express = require('express');
const path = require('path');
const githubMiddleware = require('github-webhook-middleware')({
  secret: 'bbsecret',
  limit: '1mb', // <-- optionally include the webhook json payload size limit, useful if you have large merge commits.  Default is '100kb'
});

const PORT = process.env.PORT || 5000;

const app = express();

const jiraTag = 'LIVE';
const tagMatcher = new RegExp(`^${jiraTag}-\\d+`, 'i');

const getIssueTagFromTitle = title => {
  const matched = title.match(tagMatcher);
  return matched && matched[0];
};

app.post('/hooks/github/', githubMiddleware, (req, res) => {
  // Only respond to github push events
  const eventName = req.headers['x-github-event'];
  if (eventName != 'pull_request') return res.status(200).end();

  const payload = req.body;
  const repo = payload.repository.full_name;

  const title = payload.title;
  const issueNumber = getIssueTagFromTitle(payload.title);
  console.log(issueNumber, title);
});

app
  .set('view engine', 'ejs')
  .listen(PORT, () => console.log(`Listening on ${PORT}`));
