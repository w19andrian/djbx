var express = require('express');
var Router = express.Router;

let index = Router();

/* GET home page. */
index.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = index;
