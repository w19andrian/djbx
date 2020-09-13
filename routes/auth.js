const express = require('express');
const querystring = require('querystring');
const request = require('request');
const axios = require('axios').default ;

const Router = express.Router;
const appConf = require('../config/app');
const authConf = require('../config/auth');
const { resolve } = require('path');
const { get } = require('request');
const { access } = require('fs');

/**
* Spotify auth informations
* get it from https://developer.spotify.com
* Store it in .env file OR export it to environment variable
*/

const clientId = authConf.CLIENT_ID;
const clientSecret = authConf.CLIENT_SECRET;
const hostName = appConf.HOST + ':' + appConf.PORT
const redirectUri = hostName + '/auth/callback';
const deviceName = appConf.DEVICE_NAME ;

let auth = Router();

const instance = axios.create({
  baseURL: 'https://api.spotify.com/v1'
})

/* Add access token to axios instance */

const setToken = accessToken => {
  if (accessToken) {
    instance.defaults.headers.common['Authorization'] = 'Bearer ' + accessToken ;
  } else {
    delete instance.defaults.headers.common['Authorization'] ;
  }
}

/* Get device's id of given device's name in config file */

let getDeviceId = async (deviceName, accessToken) => {
  try {
    await setToken(accessToken);

    let getDevices = await instance.get('/me/player/devices');

    for (var i = 0 ; i < getDevices.data.devices.length ; i++) {
      if (getDevices.data.devices[i].name == deviceName) {
        return getDevices.data.devices[i].id ;
      } else {
        console.log('Device not found')
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
  var scopeLength = Object.keys(authConf.SCOPE).length;
  var scope = '';
  for(var i = 0; i < scopeLength; i++) {
    scope += authConf.SCOPE[i];
    if (i != scopeLength - 1) {
      scope += ' ';
    };
  };
  
  // requests authorization to spotify
  res.redirect(
    'https://accounts.spotify.com/authorize?' +
      querystring.stringify({
        response_type: 'code',
        redirect_uri: redirectUri,
        state: state,
        scope: scope,
        client_id: clientId
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
        redirect_uri: redirectUri
      },
      headers: {
        Authorization: 'Basic ' + (Buffer.from(clientId + ':' + clientSecret).toString('base64'))
      },
      json: true
    };

    request.post(authOpts, async function(error, response, body) {
      if (!error && response.statusCode === 200) {
        // store tokens globally...for now

        accessToken = body.access_token, expires_in = body.expires_in;
        refreshToken = body.refresh_token ;
        
        /* Get device ID and store it globally...for now */
       
        dev_id = await getDeviceId(deviceName, accessToken);
        
        res.render('pages/callback',{accessToken: accessToken, refresh_token: refreshToken, expires_in: expiresIn})
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
        Authorization: 'Basic '+ (Buffer.from(clientId + ':' + clientSecret).toString('base64'))
      },
      json: true
    };
    request.post(authOpts, function(error, response, body){
      if (!error && response.statusCode == 200) {
        var accessToken = body.accessToken, expiresIn = body.expiresIn;

        res.header('Content-Type', 'application/json');
        res.send(JSON.stringify({
          access_token: accessToken,
          expires_in: expiresIn
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