'use strict'

const express = require('express')
const Slapp = require('slapp')
const ConvoStore = require('slapp-convo-beepboop')
const Context = require('slapp-context-beepboop')
const rp = require('request-promise');

// use `PORT` env var on Beep Boop - default to 3000 locally
var port = process.env.PORT || 3000

var slapp = Slapp({
  // Beep Boop sets the SLACK_VERIFY_TOKEN env var
  verify_token: process.env.SLACK_VERIFY_TOKEN,
  convo_store: ConvoStore(),
  context: Context()
})

//*********************************************
// Helpers
//*********************************************
const BI_DETECTOR = /([A-Za-z]+\-[1-9][0-9]*)/gi; //case insensitive (i) and multiple times (g)
const JIRA_DEEP_LINK = "https://myclient.jira.com/browse/";

var parseBacklogIdentifier = function(message) {
    var matches = [];
    var match = null;
    while ((match = BI_DETECTOR.exec(message)) != null) {
        matches.push(match[0]);
    }
    return matches;

};

var formatLink = function(backlogIdentifier) {
    return "<" + JIRA_DEEP_LINK + backlogIdentifier + "|" + backlogIdentifier + ">";
};

//*********************************************
// Setup different handlers for messages
//*********************************************

// Listen to any letters-dash-numbers
slapp.message(/^.*([A-Za-z]+\-[1-9][0-9]*).*/i, ['ambient'], (msg, text) => {
    var links = "";
    var word = "Issue";
    var backlogItems = parseBacklogIdentifier(text);
    backlogItems.forEach(story => {
        if (links !== "") {
            word = "Issues";
            links = links.concat(", ");
        }
        links = links.concat(formatLink(story));
    });
    msg.say("Let me help you with that :)")
    msg.say("> " + word + ": " + links);
});


//***********************************************

slapp.message('friends', (msg) => {
    msg.say({
        text: '',
        attachments: [{
            text: 'Can we be friends?',
            fallback: 'Yes or No?',
            callback_id: 'friends_callback',
            actions: [{
                name: 'answer',
                text: 'Yes',
                type: 'button',
                value: 'yes'
            }, {
                name: 'answer',
                text: 'No',
                type: 'button',
                value: 'no'
            }]
        }]
    })
});

var amountYes = 0;
var emotionImage = `https://dncache-mauganscorp.netdna-ssl.com/thumbseg/834/834174-bigthumbnail.jpg`;

slapp.action('friends_callback', 'answer', (msg, value) => {
    if (value === 'yes') {
        msg.respond(msg.body.response_url,
            `Thats quite nice! This was answered ${++amountYes} times with yes :yellow_heart:`);
    } else {
        msg.respond(msg.body.response_url, {
            text: 'Look what you did!',
            attachments: [{
                'fallback': 'Alternative Text',
                'image_url': emotionImage,
                'thumb_url': emotionImage
            }]
        });
    }
});

//***********************************************


// provides you help and wisdom in the darkest hours...
slapp.message('help', ['ambient'], (msg) => {

    var options = {
        uri: 'http://api.forismatic.com/api/1.0/?method=getQuote&lang=en&format=json',
        transform: function(body) {
            return JSON.parse(body);
        }
    };

    rp(options)
        .then(function(result) {
            msg.say('> ' + result.quoteText + '- _' + result.quoteAuthor + '_');
        })
        .catch(function(err) {
            msg.say(JSON.stringify(err));
            msg.say('woopsy');
        });
});


//*********************************************
// Boiler plate
//*********************************************

// attach Slapp to express server
var server = slapp.attachToExpress(express())

// start http server
server.listen(port, (err) => {
  if (err) {
    return console.error(err)
  }

  console.log(`Listening on port ${port}`)
})
