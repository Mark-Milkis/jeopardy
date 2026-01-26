/*
 * Active API Routes (v2)
 * These routes serve the J! Archive scraping API and are actively used
 */

// No legacy Jade template routes - archived to legacy-angular/routes-index.js.deprecated
// The React frontend is a SPA that doesn't use server-side routing

// For backwards compatibility, serve a simple message instead of crashing
exports.index = function(req, res){
  res.send('<h1>Jeopardy Pro v2</h1><p>This server provides API endpoints. Use the React frontend at <a href="http://localhost:5173">http://localhost:5173</a> (run <code>cd client/src && npm run dev</code>)</p><p>Test Socket.IO: <a href="/socket-test.html">/socket-test.html</a></p>');
};

exports.partials = function (req, res) {
  res.status(404).send('Legacy partials archived. Use React frontend at http://localhost:5173');
};
