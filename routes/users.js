const express = require('express');
const router = express.Router();
const request = require('request');
const querystring = require('querystring');
const path = require('path');
const fs = require('fs')
const util = require('util');
var app = express();

let base64_key;

let userFileLocation;
const accessTimeLocation = path.join(__dirname, '../data/~accesstime.json')
let tweetRate = {
  hourly: -1,
  daily: -1,
  weekly: -1,
  monthly: -1
}

let username;
let bearer_token;
let tweets;

let response;

/* GET users listing. */
router.get('/:username', function(req, res, next) {
  response = res;
  username = req.params.username;
  getKeys();
  // response.render('user', { title: username, tweetRate: tweetRate });
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
      bearer_token = JSON.parse(body).access_token;
      getTweets();
    }
  });
}

function getTweets() {
  let date = new Date()
  let dateMs = date.getTime()
  userFileLocation = path.join(__dirname, `../data/${username}.json`);
  const options = {
    url: 'https://api.twitter.com/1.1/statuses/user_timeline.json?screen_name=' + username + '&count=100',
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + bearer_token
    }
  }

  fs.stat(userFileLocation, (err, data) => {
    if (err == null) {
      // file exists

      let accessDifference = dateMs - util.inspect(data.mtimeMs)

      if (accessDifference > 900000) {
        console.log(`fetching new tweets! ${ accessDifference } since last fetch`)

        requestTweets(options)
      } else {
        console.log(`fetching old tweets! ${ accessDifference } since last fetch`)
        fs.readFile(userFileLocation, 'utf8', (err, data) => {
          if (err) {
            console.error('error: ' + err)
          } else {
            tweets = JSON.parse(data)
            calculateTweetsPerDay()
          }
        })
      }
    } else if (err.code = 'ENOENT') {
      // file doesn't exist
      console.error(`file doesn't exist`)
      requestTweets(options)
    } else {
      console.error('error: ' + err)
    }
  })
}

function requestTweets(options) {
  request(options, function(error, response, body) {
    if (error) {
      console.error('error: ' + error)
    } else {
      fs.writeFile(userFileLocation, body, 'utf8', (err) => {
        if (err) throw err
      })

      tweets = JSON.parse(body)
      calculateTweetsPerDay()
    }
  })

}

function calculateTweetsPerDay() {
  let error;
  if (tweets != undefined) {
    let tweetsAmount = tweets.length
    console.log("number of tweets:" + tweetsAmount)
    let newestDate = Date.parse(tweets[0].created_at)
    let oldestDate = Date.parse(tweets[tweets.length - 1].created_at)
    console.log("first tweet date: " + newestDate)
    console.log("last tweet date: " + oldestDate)
    let secondsDifference = (newestDate - oldestDate) / 1000;
    let minutesDifference = (secondsDifference / 60)
    let hoursDifference = (minutesDifference / 60)
    console.log('hour difference: ' + Math.round(hoursDifference))
    tweetRate.hourly = tweetsAmount / hoursDifference;
    tweetRate.daily = tweetRate.hourly * 24;
    tweetRate.weekly = tweetRate.daily * 7;
    tweetRate.monthly = tweetRate.weekly * 4;
  } else {
    error = 'Hrm! There seems to be a problem, try again later or with a different username';
  }

  response.render('user', { error: error, title: username, tweetRate: tweetRate });
}

module.exports = router;
