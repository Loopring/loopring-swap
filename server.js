// [START app]
const express = require('express');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const path = require('path');

const os = require('os');
const cluster = require('cluster');
const clusterWorkerSize = Math.floor(os.cpus().length / 2);

// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 6999;
let app;

if (clusterWorkerSize > 1) {
  if (cluster.isMaster) {
    for (let i = 0; i < clusterWorkerSize; i++) {
      cluster.fork();
    }

    cluster.on('exit', function (worker) {
      console.log('Worker', worker.id, ' has exitted.');
    });
  } else {
    app = express();
    app.use(
      helmet.contentSecurityPolicy({
        directives: {
          'default-src': [
            "'self'",
            'data:',
            "'unsafe-inline'",
            "'unsafe-eval'",
            'uat.loopring.io',
            'wss://ws.uat.loopring.io',
            'api.loopring.io',
            'wss://ws.loopring.io',
            'wss://bridge.walletconnect.org',
            'wss://mainnet.infura.io',
            '*.infura.io',
            '*.bandchain.org',
            '*.authereum.com',
            'wss://connect.mewapi.io',
            'wss://connect2.mewapi.io',
            'fonts.googleapis.com',
            'fonts.gstatic.com',
            'blob:',
          ],
          'img-src': ["'self'", 'data:', 'cnzz.mmstat.com', '*.cnzz.com', 'loopring.io'],
          'script-src': [
            "'self'",
            "'unsafe-inline'",
            "'unsafe-eval'",
            '*.cnzz.com',
            'uat.loopring.io',
            'ws.uat.loopring.io',
            'api.loopring.io',
            'ws.loopring.io',
            'connect.mewapi.io',
            'blob:',
          ],
        },
      })
    );
    app.use(helmet.dnsPrefetchControl());
    app.use(helmet.expectCt());
    app.use(helmet.frameguard());
    app.use(helmet.hidePoweredBy());
    app.use(helmet.hsts());
    app.use(helmet.ieNoOpen());
    app.use(helmet.noSniff());
    app.use(helmet.permittedCrossDomainPolicies());
    app.use(helmet.referrerPolicy());
    app.use(helmet.xssFilter());

    // One day: 86400
    // One hour: 3600
    const CACHE_CONTROL = 'public, max-age=3600, s-maxage=3600';
    var DIST_DIR = path.join(__dirname, 'build');

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));

    app.get('/', (req, res) => {
      res.set('Cache-Control', CACHE_CONTROL);
      res.sendFile(path.join(DIST_DIR, '/index.html'));
    });

    app.get('/manifest.json', (req, res) => {
      res.sendFile(path.join(DIST_DIR, '/manifest.json'));
    });

    app.get('/favicon.png', (req, res) => {
      res.sendFile(path.join(DIST_DIR, '/favicon.png'));
    });

    app.get('/favicon.svg', (req, res) => {
      res.sendFile(path.join(DIST_DIR, '/favicon.svg'));
    });

    app.use('/', express.static(DIST_DIR, { maxAge: '1d' }));

    app.get('*', (req, res) => {
      res.set('Cache-Control', CACHE_CONTROL);
      res.sendFile(path.join(DIST_DIR, '/index.html'));
    });

    app.listen(PORT, function () {
      console.log(
        `Express server listening on port ${PORT} and worker ${process.pid}`
      );
    });
  }
}

// [END app]

module.exports = app;
