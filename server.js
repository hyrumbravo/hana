const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();

app.use(express.static(__dirname + '/dist/adminlte'));

// Proxy middleware for /api requests
app.use('/database', createProxyMiddleware({ target: 'http://localhost:5984', changeOrigin: false }));

app.get('/script.js', function(req, res) {
  res.sendFile(path.join(__dirname, 'script.js'));
});

app.listen(8080, function() {
  console.log('Server is running on port 8080');
});
