var express = require('express');
var Router = express.Router;

let index = Router();

/* open home page */
index.get('/', function(req, res, next) {

  res.render('pages/index', { title: 'DJBX'});
});

/* open admin page */
index.get('/admin', function(req, res, next) {
  
  res.render('pages/admin', { title: 'DJBX - Admin'});
});

module.exports = index;
