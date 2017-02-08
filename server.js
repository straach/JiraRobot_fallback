'use strict'

const express = require('express')
const Slapp = require('slapp')
const ConvoStore = require('slapp-convo-beepboop')
const Context = require('slapp-context-beepboop')

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


// attach Slapp to express server
var server = slapp.attachToExpress(express())

// start http server
server.listen(port, (err) => {
  if (err) {
    return console.error(err)
  }

  console.log(`Listening on port ${port}`)
})
