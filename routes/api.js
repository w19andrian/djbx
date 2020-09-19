const express = require('express');
const Router = express.Router;
const axios = require('axios').default;

const appConf = require('../config/app');
const { response } = require('express');

const api = Router();

const hostname = appConf.HOST + ':' + appConf.PORT ;

const instance = axios.create({
  baseURL: 'https://api.spotify.com/v1'
})

let getNewToken = async refreshToken => {
  try {
    var refreshToken = refreshToken || null;

    let response = await axios.post(hostname + '/auth/token', {
      refresh_token: refreshToken
    })

    if (response.data.access_token) {
      instance.defaults.headers.common['Authorization'] = 'Bearer ' + response.data.access_token ;
    } else {
      console.log('NO TOKEN');
      delete instance.defaults.headers.common['Authorization'];
    }
  }
  catch (error) {
    console.error(error);
  }
}

/* GET search by given input. */
api.get('/search', async function(req, res) {

  let q = req.query ? req.query.q : null ;
  let limit = (req.query && req.query.limit) ? req.query.limit : 10 ;

  await getNewToken(refreshToken);

  if(q) {
    try {
      let response = await instance.get('/search', {
        params: {
          q: q,
          type: 'track',
          market: 'ID',
          limit: limit
        }
      })

      if(response.status === 200) {
        let result = response.data.tracks.items;

        let resData = {};
        let key = 'results';
        resData[key] = resData[key] || []

          for ( let i = 0 ; i < result.length ; i++ ) {

            // get artists' name
            let artistName = [];
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
      }
    }
    catch (error) {
      res.header('Content-Type: application/json');
      res.send({code: response.status, message: response.statusText});
      console.error(error);
    }    
  } else {
      res.header('Content-Type', 'application/json');
      res.send({message: 'cannot process your request'});
  }

});

/* Add queue based on selected search result */

api.get('/queue', async function(req, res) {
  let id = req.query ? req.query.id : null ;

  await getNewToken(refreshToken);

  if(id && deviceId) {
    try {

      let response = await instance.post('/me/player/queue', null, {
        params: {
          uri: 'spotify:track:' + id,
          device_id: deviceId
        }
      });

      if (response.status === 204) {
        res.header('Content-Type: application/json');
        res.send({message: 'Track suscessfully added to queue'});
      } else {
        res.header('Content-Type: application/json');
        res.send({message: response.statusText, code: response.status});
      }
    }
    catch (error) {
      res.header('Content-Type: application/json');
      res.send({message: response.statusText, code: response.status});
      console.error(error);
    }
  } else {
    res.header('Content-Type: application/json');
    res.send({message: '', error: ''})
  }
})

/* Play user's current playback on the device specified in the config file */

api.put('/player/play', async function(req, res) {
  await getNewToken(refreshToken);

  if (deviceId) {
    try {
      let response = await instance.put('/me/player/play', null, {
        params: {
          device_id: deviceId
        }
      });
      if (response.status === 204) {
        res.header('Content-Type: application/json');
        res.send({message: 'Playback resumed'});
      } else {
        res.header('Content-Type: application/json');
        res.send({code: response.status, message: response.statusText});
      }
    }
    catch (error){
      res.header('Content-Type: application/json');
      res.send({code: response.status, message: response.statusText});
      console.error(error);
    }
  } else {
    console.log('Device ID not found');
  }
})

/* Pause user's current playback on the device specified in the config file */

api.put('/player/pause', async function(req, res) {
  await getNewToken(refreshToken);

  if (deviceId){
    try {
      let response = await instance.put('/me/player/pause', null, {
        params: {
          device_id: deviceId
        }
      });

      if (response.status === 204) {
        res.header('Content-Type: application/json');
        res.send({message: 'Playback paused'});
      } else {
        res.header('Content-Type: application/json');
        res.send({
          code: response.status, 
          message: response.statusText
        });
      }
    }
    catch (error) {
      res.header('Content-Type: application/json');
      res.send({code: response.status, message: response.statusText});
      console.error(error);
    }
  } else {
    console.log('Device ID not found');
  }
})

/* Play user's next queue
on the device specified in the config file */

api.post('/player/next', async function(req, res) {
  await getNewToken(refreshToken);

  if (deviceId) {
    try {
      let response = await instance.post('/me/player/next', null, {
        params: {
          device_id: deviceId
        }
      });

      if (response.status === 204) {
        res.header('Content-Type: application/json');
        res.send({message: 'Playback skipped to the next track'});
      } else {
        res.header('Content-Type: application/json');
        res.send({
          code: response.status, 
          message: response.statusText
        });
      }
    }
    catch (error) {
      res.header('Content-Type: application/json');
      res.send({code: response.status, message: response.statusText});
      console.error(error);
    }
  } else {
    console.log('Device ID not found');
  }
});

module.exports = api