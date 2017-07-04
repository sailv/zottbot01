"use strict";

//____________________________________________________________________________________
//
// LUIS Integration config
//
// Option1: integration using LUIS API --- not used in this architecture ---
// var LUIS_MODEL = process.env.LUIS_MODEL_URL || "https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/efdd2c27-1c47-4e2a-ac9c-2d08fb75af0d?subscription-key=36f7ff60b9fa42b98efd22737fda7dde&verbose=true&timezoneOffset=330";
//
// Option2: integration via Nodejs SDK - to mainly use this JS file as a pass-thru
// i.e. get the top scoring intent and pass-on to XLApp engine; the logic for intents is to be done in Launcher xlapp (for flexibility)
// Else if we use LUIS APIs - it directly triggers the matching dialog without passing the intent
// The SDK is at https://github.com/Microsoft/Cognitive-LUIS-Node.js
//____________________________________________________________________________________
//
const LUISClient = require("./luis_sdk");
const LUIS_APPID = "efdd2c27-1c47-4e2a-ac9c-2d08fb75af0d";
const LUIS_APPKEY = "8ed2f5edc2214e8c98ec5cc9c5ea7655";
var LUISclient = LUISClient({ appId: LUIS_APPID, appKey: LUIS_APPKEY, verbose: true });
var LUISReply = {"topScoringIntent": "", "entities" : [] };

//____________________________________________________________________________________
//
// XLBot Integration config
//____________________________________________________________________________________
//
var XLAPP_NUMBER = 23103;

//____________________________________________________________________________________
//
// Bot Framework config
//____________________________________________________________________________________
//
var builder = require("botbuilder");
//var _ = require('underscore')._; //utility for string/data manipulations
var botbuilder_azure = require("botbuilder-azure");
var path = require('path');

var useEmulator = (process.env.NODE_ENV == 'development');

var connector = useEmulator ? new builder.ChatConnector() : new botbuilder_azure.BotServiceConnector({
    appId: process.env['MicrosoftAppId'],
    appPassword: process.env['MicrosoftAppPassword'],
    stateEndpoint: process.env['BotStateEndpoint'],
    openIdMetadata: process.env['BotOpenIdMetadata']
});


var bot = new builder.UniversalBot(connector);
bot.localePath(path.join(__dirname, './locale'));

//For Dev mode, use Bot Framework Emulator 
if (useEmulator) {
    var restify = require('restify');
    var server = restify.createServer();
    server.listen(3978, function() {
        console.log('test bot endpont at http://localhost:3978/api/messages');
    });
    server.post('/api/messages', connector.listen());    
} else {
    module.exports = { default: connector.listen() }
}

//____________________________________________________________________________________
//
// LUIS Functions 
//____________________________________________________________________________________
//
function getIntentsAndEntities(response) {
	//var getIntentsAndEntities = function (response) {
	console.log("::: Response from LUIS ::: ", JSON.stringify(response));
	
	LUISReply.topScoringIntent = response.topScoringIntent.intent; 

	for (var i = 1; i <= response.entities.length; i++) {
		LUISReply.entities[i-1] = { 'entity': response.entities[i-1].entity, 'type': response.entities[i-1].type};
	}
	//console.log("::: LUISReply :::", LUISReply);
	
	/*if (typeof response.dialog !== "undefined" && response.dialog !== null) {
		console.log("Dialog Status: " + response.dialog.status);
    if(!response.dialog.isFinished()) {
		console.log("Dialog Parameter Name: " + response.dialog.parameterName);
		console.log("Dialog Prompt: " + response.dialog.prompt);
    }*/
};

//____________________________________________________________________________________
//
// XLBot related functions
//____________________________________________________________________________________
//Step1: Send user message to XLBot and get the response
//msg :: is the JSON msg to be sent, if not sent, the session.message.text would be used
//q = 1 :: tells XLBot NOT to parse the response via contextual processing (like converting 1 lac to 100000, etc)
function SendToXLBot(session, msg, q){
	var _http = require('http');
	var res = '';
	msg = msg || session.message.text;
	var url = '/voiceui/setup/msbot.php?a='+XLAPP_NUMBER+'&u='+session.message.user.id+'&m='+encodeURI(msg)
	
	if (q) { url += '&q=1'; }
	//console.log("::: Send to XLBot :::", session.message.text,url);
	
	var options = { host: 'xlapp.cloware.com', path: url };

    _http.request(options, function(response) {

		//another chunk of data has been recieved, so append it to `res`
		response.on('data', function (chunk) {	res += chunk;	});

		//the whole response has been recieved, so parse the JSON for message
		response.on('end', function () { ParseXLResponse(res, session); } );
		
	}).end();
};

//....................................................................................
//Step 2: Parse the response from XLBot and get the individual JSON message objects
//then respond to user
function ParseXLResponse(XLBotResponse, session){
	try {
		var _jsonAll = JSON.parse(XLBotResponse);
		//console.log("::: From XLBot :::", _jsonAll);
		var _json=_jsonAll.MSBot;
			
		for(var i=0;i<_json.length;i++)	{ //For each response message from XLBot send as seperate msg bubbles
			var prompt = _json[i].message.prompt; 
			var quick_replies = _json[i].message.quick_replies; 
			//console.log("::: From XLBot prompt :::", prompt);
			
			if (prompt.Type=="Text") { //Response type : Text
				session.send(prompt.Text);
			} 
			else if (quick_replies.length>0) { //Response type : Choices (i.e. XLBot response contains "quick_replies")
				session.beginDialog('/choice', _json[i]);
			}
			else if (prompt.Type=="ButtonList") { //Response type : Buttonlist
				session.beginDialog('/btnlist', _json[i]);
			}
		}
	}
	catch(err) {
		console.log("Error " + err.message + "$ "+XLBotResponse+" $");
		//session.send("Error " + err.message + "$ "+XLBotResponse+" $");
	}	
};

//____________________________________________________________________________________
//
// Bot Framework interactions - dialog '/' is the starting point of Conversations (like void main()!)
//____________________________________________________________________________________
bot.dialog('/', function (session) 
{
    //Directly Hook to XLBot as it maintains state and sessions
	//session.beginDialog('/showShirts');
	//session.beginDialog('/demoSuggestedActions');
	//session.beginDialog('/demoImageCarousel');
	
	//Evaluate with LUIS API - to get Intents and Entities | Asynchronous call
	LUISclient.predict(session.message.text, {
		onSuccess: function (response) { //On success of prediction
			getIntentsAndEntities(response); 
			//LUISReply
			SendToXLBot(session); //Once LUIS Async call complets, send session + LUISReply to Xlapp
		}, 
		onFailure: function (err) { console.error(err); } //On failure of prediction
	});
	
	
});

//....................................................................................
bot.dialog('/choice', [
    function (session, obj, next) {
		//EXAMPLE value in qr == [{"content_type":"text","title":"yes","payload":"yes"},{"content_type":"text","title":"no","payload":"no"}]
		var prompt = obj.message.prompt; 
		var qr = obj.message.quick_replies; 
		
		
		var choices={} , tempObj;
		
		for(var i=0; i<qr.length; i++) {
			tempObj = qr[i];
			choices[tempObj.title] = tempObj.payload;
			
			//console.log("Choices " ,tempObj);
		}
		//use Azure Bot's "builder.Prompts.choice" instead of "session.send"
		//builder.Prompts.choice(session, obj.message[obj.message.length-1].text , choices , {listStyle: builder.ListStyle.button });
		builder.Prompts.choice(session, prompt.Text , choices , {listStyle: builder.ListStyle.button });
    },
    function (session, results) { //Choice received, send to XLBot
		var resp  = results.response.entity;
		session.endDialogWithResult(results);
		//q=1 tells XLBot NOT to parse the response via contextual processing (like converting 1 lac to 100000, etc)
		SendToXLBot(session, resp, 1); 
    }
]);

//....................................................................................
bot.dialog('/btnlist', [
    function (session, obj, next) {
		//EXAMPLE value in qr == [{"content_type":"text","title":"yes","payload":"yes"},{"content_type":"text","title":"no","payload":"no"}]
		var prompt = obj.message.prompt; 
		var btnlist = obj.message.prompt.Options; 
		
		
		var choices={} , tempObj;
		
		for(var i=0; i<btnlist.length; i++) {
			tempObj = btnlist[i];
			choices[tempObj.Label] = tempObj.Value;
			
			//console.log("btnlist " ,tempObj);
		}
		//use Azure Bot's "builder.Prompts.choice" instead of "session.send"
		//builder.Prompts.choice(session, obj.message[obj.message.length-1].text , choices , {listStyle: builder.ListStyle.button });
		builder.Prompts.choice(session, prompt.Text , choices , {listStyle: builder.ListStyle.button });
    },
    function (session, results) { //Choice received, send to XLBot
		var resp  = results.response.entity;
		//console.log("resp " ,results);
		session.endDialogWithResult(results);
		//q=1 tells XLBot NOT to parse the response via contextual processing (like converting 1 lac to 100000, etc)
		SendToXLBot(session, resp, 1); 
    }
]); 

//....................................................................................
// Dialog to demonstrate "image carousel" using MS Hero Card
/*bot.dialog('/demoImageCarousel', function (session) {
    var msg = new builder.Message(session);
    msg.attachmentLayout(builder.AttachmentLayout.carousel)
    msg.attachments([
        new builder.HeroCard(session)
            .title("Classic White T-Shirt")
            .subtitle("100% Soft and Luxurious Cotton")
            .text("Price is $25 and carried in sizes (S, M, L, and XL)")
            .images([builder.CardImage.create(session, 'https://avatars3.githubusercontent.com/u/6422482?v=3&s=460')])
            .buttons([
                builder.CardAction.imBack(session, "buy classic white t-shirt", "Buy")
            ]),
        new builder.HeroCard(session)
            .title("Classic Gray T-Shirt")
            .subtitle("100% Soft and Luxurious Cotton")
            .text("Price is $25 and carried in sizes (S, M, L, and XL)")
            .images([builder.CardImage.create(session, 'http://www.livemint.com/r/LiveMint/Period1/2011/04/21/Photos/e53743cb-3f31-497f-ac80-f59949a216e4.jpg')])
            .buttons([
                builder.CardAction.imBack(session, "buy classic gray t-shirt", "Buy")
            ])
    ]);
    session.send(msg).endDialog();
}).triggerAction({ matches: /^(show|list)/i }); */

//....................................................................................
// Dialog to demonstrate "suggested action buttons" - quick reply buttons fixed to footer not linked to message text
/*bot.dialog('/demoSuggestedActions', function (session) {
	var msg = new builder.Message(session)
		.text("Thank you for expressing interest in our premium golf shirt! What color of shirt would you like?")
		.suggestedActions(
			builder.SuggestedActions.create(
					session, [
						builder.CardAction.imBack(session, "productId=1&color=green", "Green"),
						builder.CardAction.imBack(session, "productId=1&color=blue", "Blue"),
						builder.CardAction.imBack(session, "productId=1&color=red", "Red")
					]
				));
	session.send(msg);
}); */

//....................................................................................
/*bot.dialog('SearchHotels', function(session, args,next){
	console.log('::: session.message :::\'%s\'', JSON.stringify(session.message));
	session.send('Generic Intent handler. Your message == \'%s\'', session.message.text);
	
}).triggerAction({ 
	matches: /SearchHotels/i ,
	onSelectAction: (session, args, next) => {
        //when a triggerAction executes, the dialog stack is cleared.
		//Hence use onSelectAction to Add this dialog to the dialog stack 
        //(override the default behavior of replacing the stack)
        session.beginDialog(args.action, args);
    }

}); */

//....................................................................................
// Add a global endConversation() action that is bound to the 'Goodbye' intent
bot.endConversationAction('goodbyeAction', "Ok... See you later.", { matches: 'Goodbye' });
