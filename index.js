const express = require("express"); //Import the express dependency
const request = require("request");
const { Telegraf } = require("telegraf");
const factful = require("factful.js");
const axios = require("axios");

require('dotenv').config();

const app = express(); //Instantiate an express app, the main work horse of this server
const port = 5000; //Save the port number where your server will be listening

const botToken = process.env.BOT_TOKEN
const bot = new Telegraf(botToken);

//command start the bot
bot.command("start", (ctx) => {
  bot.telegram.sendMessage(
    ctx.chat.id,
    `Hello there! Welcome to my new telegram bot\nType /help to check commands`,
    {}
  );
});

//command to get help
bot.command("help", async (ctx) => {
  const data = ctx.update.message;
  const commands = `/start - To start the bot\n/cricket <any argument? - To call various cricket methods like 'cricket live'\n/news - To get a latest news article\n/fact number x - To get a random fact about any number\n/music <genre> - To get music recomendations\nAlso it can reply to your basic texts like hi, hello`;
  bot.telegram.sendMessage(
    data.from.id,
    `YOUR CUSTOM GREETING WAS : \n${commands}`,
    {}
  );
});

//command to get news
bot.command("news", async (ctx) => {
  const data = ctx.update.message;
  const date = new Date().toISOString().slice(0, 10);
  let url = `https://newsapi.org/v2/everything?q=india&language=en&from=${date}&sortBy=publishedAt&apiKey=2252dc0a9ae241cc9f8902c580e10270`;
  request(url, { json: true }, async (err, res, body) => {
    if (err) {
      return console.log(err);
    }
    const randomNumber = Math.floor(Math.random() * 100) % (body.articles.length-1);
    const resultData = `${body.articles[randomNumber].title}\n\n${body.articles[randomNumber].description}`;
    const resultURL = `${body.articles[randomNumber].url}`;

    bot.telegram.sendMessage(data.from.id, resultData, {});
    bot.telegram.sendMessage(data.from.id, resultURL, {});
  });
});

bot.command("music", async (ctx) => {
  const data = ctx.update.message;
  let text = data.text;
  text = text.split(" ");
  if(text[2]) {
    text[1] = text[1]+text[2];
  }
  bot.telegram.sendMessage(data.from.id, "FETCHING SOME MUSIC AS PER YOUR REQUEST....", {});
  const accessToken = process.env.GENIUS_API_ACCESS_TOKEN;
  let url = `https://api.genius.com/search?q=${text[1]}&access_token=${accessToken}`;
  request(url, { json: true }, async (err, res, body) => {
    if (err) {
      return console.log(err);
    }
    let songData = String();
    if(body.response.hits.length == 0) {
      bot.telegram.sendMessage(data.from.id, "SORRY WE COULD NOT FIND ANY GOOD MUSIC AS PER YOUR QUERY", {});
    }
    for(let element of body.response.hits) {
      songData = `${element.result.title} BY ${element.result.artists_names}\nREAD LYRICS HERE : ${element.result.url}`;
      ctx.replyWithPhoto(
        {
          url: element.result.header_image_url
        },
        { caption: songData }
      );
    }
    //bot.telegram.sendMessage(data.from.id, resultData, {});
    //bot.telegram.sendMessage(data.from.id, resultURL, {});
  });
});

//command to get facts
bot.command("fact", async (ctx) => {
  const data = ctx.update.message;
  let text = data.text;
  text = text.split(" ");
  if (!text[1]) {
    let factData = factful.fact();
    factData = factData.all;
    bot.telegram.sendMessage(data.from.id, factData, {});
  }
  if (text[1] == "number") {
    let url = `http://numbersapi.com/${text[2]}`;
    request(url, { json: true }, async (err, res, body) => {
      if (err) {
        return console.log(err);
      }

      if (
        body.includes("we're missing a fact") ||
        body.includes("is a boring") ||
        body.includes("is an uninteresting")
      ) {
        ctx.replyWithPhoto(
          {
            url: "https://i.imgflip.com/40noj6.jpg",
          },
          { caption: "I DON'T KNOW BRO" }
        );
        return 0;
      }

      bot.telegram.sendMessage(
        data.from.id,
        `A RANDOM FACT ABOUT YOUR NUMBER : ${body}`,
        {}
      );
    });
  }
});

//all cricket commands
bot.command("cricket", async (ctx) => {
  const data = ctx.update.message;
  let text = data.text;
  text = text.split(" ");

  if (text[1] == "rankings") {
    const accessToken = process.env.SPORTMONKS_API_TOKEN;
    let url =
      `https://cricket.sportmonks.com/api/v2.0/team-rankings?api_token=${accessToken}`;
    request(url, { json: true }, async (err, res, body) => {
      if (err) {
        return console.log(err);
      }

      body = body.data;
      body.forEach((format) => {
        if (format.gender == "men") {
          let formatResultData = "";
          let allTeams = format.team;

          for (let i = 0; i < allTeams.length; i++) {
            formatResultData = formatResultData.concat(
              `${allTeams[i].position} ${allTeams[i].name}\n`.toString()
            );
          }

          bot.telegram.sendMessage(
            data.from.id,
            `RANKINGS FOR ${format.type} \n ${formatResultData}`,
            {}
          );
        }
      });
    });
  } else if (text[1] == "live" || text[1] == "livescore") {
    const accessToken = process.env.LIVESCORE_API_TOKEN;
    var options = {
      method: "GET",
      url: "https://livescore6.p.rapidapi.com/matches/v2/list-live",
      params: { Category: "cricket" },
      headers: {
        "x-rapidapi-host": "livescore6.p.rapidapi.com",
        "x-rapidapi-key": accessToken,
      },
    };

    axios
      .request(options)
      .then(function (response) {
        let matchData = String();
        for (let element of response.data.Stages) {
          element.Events = element.Events[0];
          matchData = `${element.Events.Stg.Snm}\n${element.Events.Stg.Cnm}\n${element.Events?.EpsL}\n${element.Events?.ECo}`;
          bot.telegram.sendMessage(data.from.id, matchData, {});
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  } else {
    ctx.replyWithPhoto(
      {
        url: "http://indianmemetemplates.com/wp-content/uploads/Abhishek-Upmanyu-iska-answer-to-aata-hi-nahi-mujhe.jpg",
      },
      { caption: "Kindly ask something relevant" }
    );
  }
});

bot.hears("hi", (ctx) => ctx.reply("Hey there"));
bot.hears([/not so good/, /unwell/, /not fine/], (ctx) =>
  ctx.reply("I am sorry to hear that!!")
);
bot.hears(/how are you/, (ctx) => ctx.reply("I am good, wbu?"));
bot.hears([/what are you doing/, /what's up/], (ctx) =>
  ctx.reply("Nothing much,just waiting for your command")
);
bot.hears([/who are you/, /what's your name/, /what is your name/], (ctx) =>
  ctx.reply("I am a telegram bot and my name is AstroBot")
);

bot.hears([/bye/, /see you/], (ctx) => {
  ctx.replyWithPhoto(
    {
      url: "https://indianmemetemplates.com/wp-content/uploads/2019/03/tussi-jaa-rahe-ho-tussi-naa-jao.jpg",
    },
    { caption: "Alexa please play 'Let me down slowly'" }
  );
});

bot.hears(
  [/dance for me/, /sing for me/, /do something for me/, /tell me a joke/],
  (ctx) => {
    ctx.replyWithPhoto(
      {
        url: "https://indianmemetemplates.com/wp-content/uploads/mai-tumhara-baap-ka-naukar-nahi-hu.jpg",
      },
      { caption: "LOL!! Sorry i can't do these kind of things" }
    );
  }
);

bot.hears([/bad/, /lame/], (ctx) => {
  ctx.replyWithPhoto(
    {
      url: "https://humornama.com/wp-content/uploads/2020/11/Gajab-Bejjati-Hai-Yaar-meme-template-of-Panchayat-series.jpg",
    },
    { caption: "Thanks for the feedback tho" }
  );
});

bot.hears(/meme template/, (ctx) => {
  let url = "https://api.imgflip.com/get_memes";
  request(url, { json: true }, async (err, res, body) => {
    if (err) {
      return console.log(err);
    }
    const randomNumber = Math.floor(Math.random() * 100);
    const meme = body.data.memes[randomNumber % 80];
    ctx.replyWithPhoto(
      {
        url: meme.url,
      },
      { caption: meme.name }
    );
  });
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
