require('dotenv').load();
const express = require('express');
const jwt = require('express-jwt');
const jwksRsa = require('jwks-rsa');
const { join } = require('path');
const app = express();
const authConfig = require('./auth_config.json');
const Cumulio = require('cumulio');

const checkJwt = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${authConfig.domain}/.well-known/jwks.json`
  }),

  audience: authConfig.audience,
  issuer: `https://${authConfig.domain}/`,
  algorithms: ['RS256']
});

const client = new Cumulio({
  api_key: process.env.CUMULIO_API_KEY,
  api_token: process.env.CUMULIO_API_TOKEN
});

// Get temporary token based on parameters of user known at auth0
app.get('/authorization', checkJwt, (req, res) => {
  const authNamespace = 'https://myexampleapp/';
  // Fill general authorization options, dashboard_id based on request

  // Fill parameters based on parameters of user known at auth0

  // Fill user metadata of user known at auth0

  // Create the temporary authorization

  return res.status(200).json({});
});

// retrieve list of dashboards from Cumul.io with the tag "auth0"
app.get('/dashboards', checkJwt, (req, res) => {
  // retrieve all dashboards with certain tag from Cumul.io

  return res.status(200).json({});
});

// Serve static assets from the /public folder
app.use(express.static(join(__dirname, 'public')));

// Endpoint to serve the configuration file
app.get('/auth_config.json', (req, res) => {
  res.sendFile(join(__dirname, 'auth_config.json'));
});

app.use(function (err, req, res, next) {
  if (err) console.log(err)
  if (err.name === 'UnauthorizedError') {
    return res.status(401).send({ msg: 'Invalid token' });
  }
  next(err, req, res);
});

// Serve the index page for all other requests
app.get('/*', (req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});

// Listen on port 3000
app.listen(3000, () => console.log('Application running on port 3000'));