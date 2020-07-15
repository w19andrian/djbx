const express = require('express');
const Router = express.Router;
const querystring = require('querystring');
const request = require('request');

const appConfig = require('../config/app');

let api = Router();
const hostname = appConfig.HOST + ':' + appConfig.PORT ;

/* GET search by given input. */
api.get('/search', function(req, res) {
  var q = req.query.q;
  var limit = req.query.limit || 10 ;

/*   var tokenOpts = {
    url: hostname + '/auth/token?' +
    querystring.stringify({
        refresh_token: refresh_token }),
    json: true
  }

  request.post(tokenOpts, function(error,response,body) {
    if(!error && response.statusCode == 200 ){
    var access_token = body.access_token;
    } else {
      res.send('Error POST to /auth/token')
    }    
  return access_token;
  }); */
  
  var trackSearch = {
    url: 'https://api.spotify.com/v1/search?'+ 
    querystring.stringify({
      q: q,
      type: 'track',
      market: 'ID',
      limit: limit
    }),
    headers: {
      'Authorization': 'Bearer ' + access_token},
    json: true
  };

  request.get(trackSearch, function(error,response,body) {
    if (!error && response.statusCode === 200) {
      var result = body.tracks.items

      var resData = {};
      var key = 'results';
      resData[key] = resData[key] || []

      for ( var i = 0 ; i < result.length ; i++ ) {

        // get artists' name
        var artistName = [];
        var a = result[i].artists
        for (let n = 0 ; n < a.length ; n++) {
          artistName.push({name: a[n].name})
        }

        // get album's cover art size 300 x 300 px
        var img = result[i].album.images
        for ( let j = 0 ; j < img.length ; j++) {
          if( img[j].height == 300 && img[j].width == 300){
            var cover_art = img[j].url
          }
        }
        var album = result[i].album.name
        var album_type = result[i].album.album_type
        var track = result[i].name
        var uri = result[i].uri
        
        resData[key].push({
          album: album, 
          track: track, 
          cover_art: cover_art, 
          type: album_type, 
          uri: uri,
          artist: artistName
        })
      }
      res.header('Content-Type', 'application/json')
      res.send(JSON.stringify(resData))
    }
  });


});

module.exports = api