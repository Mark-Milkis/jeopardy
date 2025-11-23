var httpProxy = require('http-proxy');
var proxy = httpProxy.createProxyServer({
  target: 'http://www.j-archive.com/',
  proxyTimeout: 30000
});

proxy.on('error', function (err, req, res) {
  console.log('Proxy error, redirecting to Wayback Machine:', req.url);
  var waybackUrl = 'https://web.archive.org/web/20250920124038/http://j-archive.com' + req.url;
  res.writeHead(302, {
    'Location': waybackUrl
  });
  res.end();
});

module.exports = function (req, res) {
  delete req.headers.referer;
  proxy.web(req, res);
}
