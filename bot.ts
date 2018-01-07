var express = require('express');


import * as builder from "botbuilder";
import * as  istorage from "./lib/IStorageClient";
import * as  azure from './lib/AzureBotStorage.js';

import { LineConnector, Sticker, Location } from "./line/LineConnector"
import { CardAction } from "botbuilder";

import * as q_list from "./questions.js"
import { connect } from "tls";
// console.log(q_list)
var server = express();
server.listen(process.env.port || process.env.PORT || 3980, function () {
    console.log("listening to");
});

var docDbClient = new istorage.IStorageClient();
var tableStorage = new azure.AzureBotStorage({
    gzipData: false
}, docDbClient);

var connector = new LineConnector({
    hasPushApi: false, //you need to pay push api >.,<
    // Miss Tarot 塔羅小姐
    // channelId: process.env.channelId || "1487202031",
    // channelSecret: process.env.channelSecret || "64078989ba8249519163b052eca6bc58",
    // channelAccessToken: process.env.channelAccessToken || "QELaTKb+JpKNt+LndfixVD8EA+DGID5wgvZ10skM3F2nPPzvTC7ZpvxQ3onkR+hu06eRv1S+NG6Cfyw3EtfW21K6x6RGBRqf8ehPYUalja77myU10cSBR9GmYA/HDri9jDg5YqDHUVg5JCrkb+nnygdB04t89/1O/w1cDnyilFU="
    // Miss Tarot 知識狼
    channelId: process.env.channelId || "1487296483",
    channelSecret: process.env.channelSecret || "40e21b20df162705bcccc3066fde13ee",
    channelAccessToken: process.env.channelAccessToken || "dVxAd9kcq59UXD8ANh503yB+14sWaWOH6DMLjMa8OPCpwdaeeXFHvzlQ1VH3OC/hm62Kz0w8VgcpOZdWuSGK3bD/Q1zsKXs1WIrkK9o6yACkKUASTy6fu0T6ulRSAOoamCzGDwKHAPH5aM0ohx4f4QdB04t89/1O/w1cDnyilFU="

});
server.post('/line', connector.listen());

// var connector = new builder.ConsoleConnector().listen();
var bot = new builder.UniversalBot(connector).set('storage', tableStorage); //set your storage here

bot.dialog("/", s => {

    s.beginDialog("start")
})

bot.on('conversationUpdate', function (message) {
    switch (message.text) {
        case 'follow':
            break;
        case 'unfollow':
            break;
        case 'join':
            bot.beginDialog(message.address, "start")
            break;
        case 'leave':
            break;
    }
    console.log("conversationUpdate")

});

bot.dialog("start", s => {
    s.send(new builder.Message(s).addAttachment(new Sticker(s, 1, 2)));
    s.send("遊戲開始")
    s.beginDialog("ask");
})
bot.dialog("ask", [
    (s, args) => {
        let q: {
            "q": string,
            "options": Array<string>,
            "a": string
        };
        if (args && args.q) {
            q = args.q

        } else {
            q = q_list[Math.floor(Math.random() * (q_list.length - 1))];

        }
        s.dialogData.q = q;

        builder.Prompts.choice(s, new builder.Message(s)
            .text(q.q)
            .suggestedActions(
            builder.SuggestedActions.create(
                s, q.options.map(o => {
                    return builder.CardAction.imBack(s, o, o)
                })
            )),
            q.options
        );
    },
    (s, r) => {
        s.dialogData.answers = [];
        if (r.response.entity === s.dialogData.q.a) {
            s.send(`${s.message.from.name} 答對了! 加一分！`)
            s.send(new builder.Message(s).addAttachment(new Sticker(s, 1, 2)));
            s.dialogData.q = null
        } else {
            s.send(`${s.message.from.name} 答錯了! 扣一分！`)
            s.send(new builder.Message(s).addAttachment(new Sticker(s, 1, 3)));
        }
        s.replaceDialog("ask", { q: s.dialogData.q })
    }
])

bot.dialog("slice", [
    s => {
        console.log("log")
    }
]).triggerAction({
    matches: /^slice$/i
});

bot.dialog("leave", [
    s => {
        console.log("leave");
        connector.leave();
    }
]).triggerAction({
    matches: /^leave$/i
});