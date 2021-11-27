const express = require("express"); //Import the express dependency
const { Telegraf } = require("telegraf");
const { request } = require("request");

const app = express(); //Instantiate an express app, the main work horse of this server
const port = 5000; //Save the port number where your server will be listening

const bot = new Telegraf("2128386396:AAGhQpUUecd9D54Z3zd3UlqkM_jeB1WTAK4");

//start the bot
bot.command("start", (ctx) => {
  bot.telegram.sendMessage(
    ctx.chat.id,
    `Hello there! Welcome to my new telegram bot\nType /help to check commands`,
    {}
  );
});

bot.command("help", async (ctx) => {
  const data = ctx.update.message;
  const commands = `/start - To start the bot\n/cricket <any argument? - To call various cricket methods like /cricket live\n/news - To get a latest news article\n/fact number x - To get a random fact about any number`;
  bot.telegram.sendMessage(
    data.from.id,
    `YOUR CUSTOM GREETING WAS : \n${commands}`,
    {}
  );
});

bot.launch();

//Idiomatic expression in express to route and respond to a client request
app.get("/", (req, res) => {
  //get requests to the root ("/") will route here
  res.sendFile("index.html", { root: __dirname }); //server responds by sending the index.html file to the client's browser
  //the .sendFile method needs the absolute path to the file, see: https://expressjs.com/en/4x/api.html#res.sendFile
});

app.listen(process.env.PORT || 3000, () => {
  //server starts listening for any attempts from a client to connect at port: {port}
  console.log(`Now listening on port ${port}`);
});
