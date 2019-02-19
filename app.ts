import * as express from 'express';
import * as builder from 'botbuilder';
import * as handoff from 'botbuilder-handoff';
import * as botbuilder_azure from 'botbuilder-azure';


//=========================================================
// Normal Bot Setup
//=========================================================

const app = express();

// Setup Express Server
app.listen(process.env.port || process.env.PORT || 3978, '::', () => {
    console.log('Server Up');
});

// Create chat bot
const connector = new builder.ChatConnector({
    appId: "baa39aa4-4c6a-46e6-9520-a9176726b1fb",
    appPassword: "-kwmxspV_wzJe7EjWOZA./yK"
});

var tableName = 'botdata';
var azureTableClient = new botbuilder_azure.AzureTableClient(tableName, process.env['AzureWebJobsStorage']);
var tableStorage = new botbuilder_azure.AzureBotStorage({ gzipData: false }, azureTableClient);


app.post('/api/messages', connector.listen());

const bot = new builder.UniversalBot(connector, [
    function (session, args, next) {
        session.endConversation('Echo ' + session.message.text);
    }
]);

bot.set('storage', tableStorage);
//=========================================================
// Hand Off Setup
//=========================================================

// Replace this function with custom login/verification for agents
const isAgent = (session: builder.Session) => session.message.user.name.startsWith("Agent");

/**
    bot: builder.UniversalBot
    app: express ( e.g. const app = express(); )
    isAgent: function to determine when agent is talking to the bot
    options: { }
**/
handoff.setup(bot, app, isAgent, {
    mongodbProvider: process.env.MONGODB_PROVIDER,
    directlineSecret: "HCReV1ZWsA8.IM2DzZ4MjJG2UqCD8rqaiOIfXDT8weH6XM0QYsHiX0Y",
    textAnalyticsKey: process.env.CG_SENTIMENT_KEY,
    appInsightsInstrumentationKey: process.env.APPINSIGHTS_INSTRUMENTATIONKEY,
    retainData: process.env.RETAIN_DATA,
    customerStartHandoffCommand: process.env.CUSTOMER_START_HANDOFF_COMMAND
});

//triggerHandoff manually
bot.dialog('/connectToHuman', (session)=>{
    session.send("Hold on, buddy! Connecting you to the next available agent!");
    handoff.triggerHandoff(session);
}).triggerAction({
    matches:  /^agent/i,
});
