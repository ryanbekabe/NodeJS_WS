const https = require('https');
const fs = require('fs');
const ws = new require('ws');
var options = {
   key: fs.readFileSync('/etc/letsencrypt/live/rek.my.id/privkey.pem'),
   cert: fs.readFileSync('/etc/letsencrypt/live/rek.my.id/fullchain.pem')
};
const wss = new ws.Server({noServer: true});
const clients = new Set();
function accept(req, res) {
  if (req.url == '/ws' && req.headers.upgrade &&
      req.headers.upgrade.toLowerCase() == 'websocket' &&
      // can be Connection: keep-alive, Upgrade
      req.headers.connection.match(/\bupgrade\b/i)) {
    wss.handleUpgrade(req, req.socket, Buffer.alloc(0), onSocketConnect);
  } else if (req.url == '/') { // index.html
    fs.createReadStream('./indexchatwss.html').pipe(res);
  } else { // page not found
    res.writeHead(404);
    res.end();
  }
}
function onSocketConnect(ws) {
  clients.add(ws);
  log(`new connection`);
  ws.on('message', function(message) {
    log(`message received: ${message}`);
    message = message.slice(0, 50); // max message length will be 50
    for(let client of clients) {
      client.send(message);
    }
  });
  ws.on('close', function() {
    log(`connection closed`);
    clients.delete(ws);
  });
}
let log;
if (!module.parent) {
  log = console.log;
  https.createServer(options,accept).listen(8081);
} else {
  // to embed into javascript.info
  log = function() {};
  // log = console.log;
  exports.accept = accept;
}
