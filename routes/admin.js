const express = require('express');
const Router = express.Router;

const appConfig = require ('../config/app')

let admin = Router();

var hostname = appConfig.HOST + ':' + appConfig.PORT
/* GET home page. */
admin.get('/', function(req, res, next) {
  res.render('admin', { title: 'DJBX - Admin', hostname: hostname });
});

module.exports = admin;
