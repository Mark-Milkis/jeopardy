
/**
 * Module dependencies
 */

var express = require('express'),
  routes = require('./routes'),
  api = require('./routes/api'),
  http = require('http'),
  path = require('path');

var logger = require('morgan');
var methodOverride = require('method-override');
var bodyParser = require('body-parser');
var errorHandler = require('errorhandler');

var app = module.exports = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:3001", "http://localhost:3002", "http://localhost:3003", "http://127.0.0.1:5173", "http://127.0.0.1:3001", "http://127.0.0.1:3002", "http://127.0.0.1:3003"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

/**
 * Configuration
 */

// all environments
app.set('port', process.env.PORT || 3000);
// Views archived - legacy Jade templates in /legacy-angular/views/
// app.set('views', __dirname + '/views');
// app.set('view engine', 'jade');
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(methodOverride());
app.use(express.static(path.join(__dirname, '../public')));

// development only
if (app.get('env') === 'development') {
  app.use(errorHandler());
}

// production only
if (app.get('env') === 'production') {
  // Production configuration
  app.use(require('compression')());
  app.set('trust proxy', 1);
}


/**
 * Routes
 */

// Version endpoint
app.get('/api/version', function(req, res) {
  try {
    const versionInfo = require('./version');
    res.json(versionInfo);
  } catch (error) {
    res.json({
      version: require('../package.json').version,
      buildMetadata: '',
      fullVersion: require('../package.json').version,
      buildDate: new Date().toISOString(),
      gitSha: 'unknown',
      gitBranch: 'unknown'
    });
  }
});

// Health check endpoint
app.get('/health', function(req, res) {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// JSON API (active)
app.get('/api/seasons', api.seasons);
app.get('/api/seasons/:id', api.season);
app.get('/api/games/:id', api.game);
app.post('/api/games', api.saveGame);
app.delete('/api/games/:id', api.deleteGame);

// J-Archive proxy
app.get('/media/*', require('./routes/proxy'));

// Legacy AngularJS routes (archived - see /legacy-angular/README.md)
// Kept for reference only, recommend using React frontend at /client/src
app.get('/', routes.index);
app.get('/partials/:name', routes.partials);
app.get('*', routes.index);

// Socket.io Communication - v2 React Frontend
require('./sockets/gameSocket')(io);

// Legacy Socket.io handler (deprecated, kept for backwards compatibility)
// io.sockets.on('connection', require('./routes/socket')(io));

/**
 * Start Server
 */

server.listen(app.get('port'), function () {
  console.log('Express server listening on port ' + app.get('port'));
});
