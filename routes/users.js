var express = require('express');
var router = express.Router();
var request = require('request');
var querystring = require('querystring');
var path = require('path');
var fs = require('fs')

let base64_key;

let userFileLocation;

let username;
let bearer_token;
let tweets;
let lastAccessDate;

/* GET users listing. */
router.get('/:username', function(req, res, next) {
  username = req.params.username;
  getKeys();
  res.render('user', { title: username });
});

function getKeys() {

  fileLocation = path.join(__dirname, '../local/keys.json');
  fs.stat(fileLocation, (err, data) => {
    if (err == null) {
      // file exists
      fs.readFile(fileLocation, 'utf8', (err, data) => {
        if (err) {
          console.error(err)
        } else {
          keys = JSON.parse(data)
          let combined_key = encodeURIComponent(keys.consumer_key) + ':' + encodeURIComponent(keys.consumer_secret);
          base64_key = (new Buffer(combined_key).toString('base64'));
          twitterAuth(base64_key);
        }
      })
    } else if (err.code = 'ENOENT') {
      // file doesn't exist
      console.error(err);
    } else {
      console.error(err);
    }
  })
}

function twitterAuth(key) {
  const options = {
    url: 'https://api.twitter.com/oauth2/token',
    method: 'POST',
    headers: {
      "Authorization": "Basic " + base64_key,
      "Content-Type":"application/x-www-form-urlencoded;charset=UTF-8"
    },
    body: "grant_type=client_credentials"
  };

  request(options, function(error, response, body){
    if(error) {
      console.error(error);
      console.log('body: ' + body);
    } else {
      console.log(response.statusCode, body);
      bearer_token = JSON.parse(body).access_token;
      getTweets();
    }
  });
}

function getTweets() {
  userFileLocation = path.join(__dirname, `../data/${username}.json`);
  const options = {
    url: 'https://api.twitter.com/1.1/statuses/user_timeline.json?screen_name=' + username + '&count=10',
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + bearer_token
    }
  }

  let d = new Date()

  requestTweets(options)
  // if (d.value > (lastAccessDate + 900000)) {
  //   lastAccessDate = d.value

  // } else {
  //   console.log('cache tweets somehow and pull them from here!!!!')
  //   console.log(userFileLocation)
  //   fs.stat(userFileLocation, (err, data) => {
  //     if (err == null) {
  //       // file exists
  //       fs.readFile(userFileLocation, 'utf8', (err, data) => {
  //         if (err) {
  //           console.error(err)
  //         } else {
  //           tweets = JSON.parse(data)
  //           requestTweets(options)
  //         }
  //       })
  //     } else if (err.code = 'ENOENT') {
  //       // file doesn't exist
  //     } else {
  //       console.error(err);
  //     }
  //   })
  // }

  console.log(tweets);
}

function requestTweets(options) {
  request(options, function(error, response, body) {
    if (error) {
      console.error('error: ' + error)
    } else {
      tweets = JSON.parse(body)
      console.log("tweets: " + tweets);
      fs.writeFile(userFileLocation, tweets, 'utf8', (err) => {
        if (err) throw err
      })

      calculateTweetsPerDay()
    }
  })

}

function calculateTweetsPerDay() {
  console.log("number of tweets:" + tweets.length)
  console.log("first tweet date: " + tweets[0].created_at)
  console.log("last tweet date: " + tweets[tweets.length - 1].created_at)
}

module.exports = router;
