const express = require('express');
const querystring = require('querystring');
const request = require('request');
const axios = require('axios').default ;

const Router = express.Router;
const AppConf = require('../config/app');
const AuthConf = require('../config/auth');
const { resolve } = require('path');
const { get } = require('request');
const { access } = require('fs');

/**
* Spotify auth informations
* get it from https://developer.spotify.com
* Store it in .env file OR export it to environment variable
*/

const client_id = AuthConf.CLIENT_ID;
const client_secret = AuthConf.CLIENT_SECRET;
const hostname = AppConf.HOST + ':' + AppConf.PORT
const redirect_uri = hostname + '/auth/callback';
const dev_name = AppConf.DEVICE_NAME ;

let auth = Router();

const instance = axios.create({
  baseURL: 'https://api.spotify.com/v1'
})

const setToken = accessToken => {
  if (accessToken) {
    instance.defaults.headers.common['Authorization'] = 'Bearer ' + accessToken ;
  } else {
    delete instance.defaults.headers.common['Authorization'] ;
  }
}

var getDeviceId = async function(deviceName, accessToken) {
  try {
    await setToken(accessToken);

    let getDevices = await instance.get('/me/player/devices');
    let results = getDevices.data.devices;

    for (var i = 0 ; i < results.length ; i++) {
      if (results[i].name == deviceName) {
        var deviceId = results[i].id ;

        return deviceId ;

      } else {
        console.log('Device name not found')
      }
    }
  }
  catch (error) {
    console.error(error);
  }
}

var generateRandomString = function(length) {
  var text = '';
  var collection = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890';

  for (var i = 0; i < length; i++) {
      text += collection.charAt(Math.floor(Math.random() * collection.length ));
  }
  return text;
};

var stateKey = 'spotify_auth_state';

auth.get('/login', function(req, res) {

  // generate state to be stored on cookie
  var state = generateRandomString(16);
  res.cookie(stateKey, state)
  
  // compile scopes
  var scopeLength = Object.keys(AuthConf.SCOPE).length;
  var scope = '';
  for(var i = 0; i < scopeLength; i++) {
    scope += AuthConf.SCOPE[i];
    if (i != scopeLength - 1) {
      scope += ' ';
    };
  };
  
  // requests authorization to spotify
  res.redirect(
    'https://accounts.spotify.com/authorize?' +
      querystring.stringify({
        response_type: 'code',
        redirect_uri: redirect_uri,
        state: state,
        scope: scope,
        client_id: client_id
      })
  );
});

auth.get('/callback', function(req, res) {
  // request access and refresh token
  // after checking the auth status

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
  console.log('state mismatch', 'state: ' + state, 'storedState: ' + storedState, 'cookies: ' + req.cookies);
  res.send('state mismatch, please try again');
  } else {
    res.clearCookie(stateKey);
    var authOpts = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: redirect_uri
      },
      headers: {
        Authorization: 'Basic ' + (Buffer.from(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOpts, async function(error, response, body) {
      if (!error && response.statusCode === 200) {
        // store tokens globally...for now

        access_token = body.access_token, expires_in = body.expires_in;
        refresh_token = body.refresh_token ;
        
        dev_id = await getDeviceId(dev_name, access_token);
        
        res.render('pages/callback',{access_token: access_token, refresh_token: refresh_token, expires_in: expires_in})
      } else {
        res.render('pages/callback');
      }
    });
  }
});

auth.post('/token', function(req, res) {
  // request access token using provided refresh token

  res.setHeader('Access-Control-Allow-origin', '*');
  var refreshToken = req.body ? req.body.refresh_token : null;

  if (refreshToken) {
    var authOpts = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      },
      headers: {
        Authorization: 'Basic '+ (Buffer.from(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };
    request.post(authOpts, function(error, response, body){
      if (!error && response.statusCode == 200) {
        var access_token = body.access_token, expires_in = body.expires_in;

        res.header('Content-Type', 'application/json');
        res.send(JSON.stringify({
          access_token: access_token,
          expires_in: expires_in
        }))
      } else {
          res.header('Content-Type', 'application/json');
          res.send(JSON.stringify({
            access_token: '',
            expires_in: ''
          }))
      }
    });
  } else {
      res.header('Content-Type', 'application/json')
      res.send(JSON.stringify({
        access_token: '',
        expires_in: ''
      }))
  }
});

module.exports = auth;