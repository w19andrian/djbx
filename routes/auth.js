const express = require('express');
const querystring = require('querystring');
const request = require('request');
const axios = require('axios').default ;
const qs = require('qs');

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
});

const tokenInstance = axios.create({
  baseURL: 'https://accounts.spotify.com'
});

/* Add access token to axios instance */

let setAuth = (clientId, clientSecret) => {
  if(clientId && clientSecret) {
    tokenInstance.defaults.headers.common['Authorization'] = 'Basic ' + (Buffer.from(clientId + ':' + clientSecret).toString('base64'));
    tokenInstance.defaults.headers.common['Content-Type'] = 'application/x-www-form-urlencoded';

  } else {
    delete tokenInstance.defaults.headers.common['Authorization'] ;
    delete tokenInstance.defaults.headers.post['Content-Type'];
  }
}

let setToken = accessToken => {
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

auth.get('/callback', async function(req, res) {
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

    await setAuth(clientId, clientSecret);

    try {
      let data = {
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri
      }

      let response = await tokenInstance.post('/api/token', qs.stringify(data));

      if (response.status === 200) {
      /* store tokens globally...for now */
        
        accessToken = response.data.access_token, expiresIn = response.data.expires_in;
        refreshToken = response.data.refresh_token ;
        
        /* Get device ID and store it globally...for now */
       
        deviceId = await getDeviceId(deviceName, accessToken);
        
        res.render('pages/callback',{access_token: accessToken, refresh_token: refreshToken, expires_in: expiresIn})
      } else {
        res.render('pages/callback');
      }
    }
    catch (error) {
      console.log(error);
    }
  }
});

auth.post('/token', async function(req, res) {
  // request access token using provided refresh token

  res.setHeader('Access-Control-Allow-origin', '*');
  var refreshToken = req.body ? req.body.refresh_token : null;

  if (refreshToken) {
    try {
      await setAuth(clientId, clientSecret);

      let data = {
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      };

      let response = await tokenInstance.post('/api/token', qs.stringify(data));

      if (response.status === 200) {
        var accessToken = response.data.access_token, expiresIn = response.data.expires_in;

        res.header('Content-Type', 'application/json');
        res.send(JSON.stringify({
          access_token: accessToken,
          expires_in: expiresIn
        }));
      } else {
        res.header('Content-Type', 'application/json');
        res.send(JSON.stringify({
          access_token: '',
          expires_in: ''
        }));
      }   
    }
    catch (error) {
      console.log(error);
    }
  } else {
      res.header('Content-Type', 'application/json')
      res.send(JSON.stringify({
        access_token: '',
        expires_in: ''
      }))
  }
});

module.exports = auth;