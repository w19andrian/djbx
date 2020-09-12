const express = require('express');
const Router = express.Router;
const querystring = require('querystring');
const request = require('request');

const appConfig = require('../config/app');
const { response } = require('express');

let api = Router();

const hostname = appConfig.HOST + ':' + appConfig.PORT ;

const spotify_prefix = 'https://api.spotify.com/v1' ;


function refreshToken(refresh_token) {
  var refresh_token = refresh_token || null;

  var tokenOpts = {
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
    return access_token
  })
}

/* GET search by given input. */
api.get('/search', async function(req, res) {

  var q = req.query ? req.query.q : null ;
  var limit = (req.query && req.query.limit) ? req.query.limit : 10 ;

  await refreshToken(refresh_token);

  if(q) {
    var trackSearch = {
      url: 'https://api.spotify.com/v1/search?'+ 
      querystring.stringify({
        q: q,
        type: 'track',
        market: 'ID',
        limit: limit
      }),
      headers: {
        'Authorization': 'Bearer ' + access_token
      },
      json: true
    }

    request.get(trackSearch, function(error,response,body) {
      if (!error && response.statusCode === 200) {
        var result = body.tracks.items

        var resData = {};
        var key = 'results';
        resData[key] = resData[key] || []

        for ( var i = 0 ; i < result.length ; i++ ) {

          // get artists' name
          var artistName = [];
          for (let n in result[i].artists) {
            artistName.push({name: result[i].artists[n].name})
          }

          // get album's cover art size 300 x 300 px
          images = [];
          for ( let j in result[i].album.images) {
            images.push({
              url: result[i].album.images[j].url,
              height: result[i].album.images[j].height,
              width: result[i].album.images[j].width
            });
          }

          resData[key].push({
            id: result[i].id,
            album: {
              name: result[i].album.name,
              type: result[i].album.album_type,
              release_date: result[i].album.release_date
            },
            track: result[i].name, 
            img: images,  
            uri: result[i].uri,
            artist: artistName
          })
        }
        console.log(resData);
        res.header('Content-Type', 'application/json');
        res.send(JSON.stringify(resData));
      } else {
        res.header('Content-Type', 'application/json');
        res.send({message: response.statusMessage, status_code: response.statusCode});
      }
    });
  } else {
      res.header('Content-Type', 'application/json');
      res.send({message: 'cannot process your request'});
  }

});

/* Add queue based on selected search result */

api.get('/queue', async function(req, res) {
  var id = req.query ? req.query.id : null ;

  await refreshToken(refresh_token);

  if(id) {

    var addQueue = {
      url: spotify_prefix + '/me/player/queue?'+ 
      querystring.stringify({
        uri: 'spotify:track:' + id,
        device_id: dev_id
      }),
      headers:{
        'Authorization': 'Bearer ' + access_token
      },
      json: true
    }

    request.post(addQueue, function(error, response, body) {
      if (!error && response.statusCode == 204) {
        res.header('Content-Type: application/json');
        res.send({message: 'Track suscessfully added to queue'});
      } else {
        res.header('Content-Type: application/json');
        res.send({message: response.statusMessage, code: response.statusCode})
      }
    })
  } else {
    res.header('Content-Type: application/json');
    res.send({message: '', error: ''})
  }
})

/* Play user's current playback on the device specified in the config file */

api.put('/player/play', async function(req, res) {
  await refreshToken(refresh_token);

  var playQueue = {
    url: spotify_prefix + '/me/player/play?' +
      querystring.stringify({
        device_id: dev_id
      }),
    headers: {
      'Authorization': 'Bearer ' + access_token
    },
    json: true
  }

  request.put(playQueue, function(error, response, body) {
    if (!error && response.statusCode == 204) {
      res.header('Content-Type: application/json');
      res.send({message: 'Track suscessfully added to queue'});
    } else {
      res.header('Content-Type: application/json');
      res.send({message: response.statusMessage, code: response.statusCode})
    }
  })
})

/* Pause user's current playback on the device specified in the config file */

api.put('/player/pause', async function(req, res) {
  await refreshToken(refresh_token);

  var pauseQueue = {
    url: spotify_prefix + '/me/player/pause?' +
      querystring.stringify({
        device_id: dev_id
      }),
    headers: {
      'Authorization': 'Bearer ' + access_token
    },
    json: true
  }

  request.put(pauseQueue, function(error, response, body) {
    if (!error && response.statusCode == 204) {
      res.header('Content-Type: application/json');
      res.send({message: 'Track suscessfully added to queue'});
    } else {
      res.header('Content-Type: application/json');
      res.send({message: response.statusMessage, code: response.statusCode})
    }
  })
})

/* Play user's next queue
on the device specified in the config file */

api.post('/player/next', async function(req, res) {
  await refreshToken(refresh_token);

  var nextQueue = {
    url: spotify_prefix + '/me/player/next?' +
      querystring.stringify({
        device_id: dev_id
      }),
    headers: {
      'Authorization': 'Bearer ' + access_token
    },
    json: true
  }

  request.post(nextQueue, function(error, response, body) {
    if (!error && response.statusCode == 204) {
      res.header('Content-Type: application/json');
      res.send({message: 'Track suscessfully added to queue'});
    } else {
      res.header('Content-Type: application/json');
      res.send({message: response.statusMessage, code: response.statusCode})
    }
  })
})
module.exports = api