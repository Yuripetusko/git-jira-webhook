const express = require('express');
const path = require('path');
const githubMiddleware = require('github-webhook-middleware')({
  secret: 'bbsecret',
  limit: '1mb', // <-- optionally include the webhook json payload size limit, useful if you have large merge commits.  Default is '100kb'
});

const JiraClient = require('jira-connector');

const jira = new JiraClient({
  host: 'jenjinstudios.atlassian.net',
  basic_auth: {
    username: 'github-jira-bot@bridebook.co.uk',
    password: 'Ce4vNoFJzY4a',
  },
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

  const pullRequest = payload.pull_request;
  const action = payload.action;

  if (!pullRequest || action !== 'labeled') return res.status(200).end();

  const label = payload.label;
  const title = pullRequest.title;
  const issueNumber = getIssueTagFromTitle(pullRequest.title);
  console.log(issueNumber, label);
  if (!issueNumber || !label) {
    return res.status(200).end();
  }

  if (label.name === 'testing') {
    jira.issue.transitionIssue(
      {
        issueKey: issueNumber,
        transition: { id: 911 },
      },
      error => {
        if (error) {
          console.log(error);
        }

        return res.status(200).end();
      }
    );
  } else {
    return res.status(200).end();
  }
});

app
  .set('view engine', 'ejs')
  .listen(PORT, () => console.log(`Listening on ${PORT}`));
