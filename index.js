const express = require("express"); //Import the express dependency
const request = require("request");
const { Telegraf } = require("telegraf");
const factful = require("factful.js");
const axios = require("axios");

const app = express(); //Instantiate an express app, the main work horse of this server
const port = 5000; //Save the port number where your server will be listening

//const bot = new Telegraf("2128386396:AAGhQpUUecd9D54Z3zd3UlqkM_jeB1WTAK4");
const bot = new Telegraf("2121704253:AAEXm7sz_JrRd-3kJ-oQSI6L49g_t7jnMmU");

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
  let url =
    `https://newsapi.org/v2/everything?q=india&language=en&from=${date}&sortBy=publishedAt&apiKey=2252dc0a9ae241cc9f8902c580e10270`;
  request(url, { json: true }, async (err, res, body) => {
    if (err) {
      return console.log(err);
    }
    const resultData = `${body.articles[0].title}\n\n${body.articles[0].description}`;
    const resultURL = `${body.articles[0].url}`;

    bot.telegram.sendMessage(data.from.id, resultData, {});
    bot.telegram.sendMessage(data.from.id, resultURL, {});
  });
});

bot.command("music", async (ctx) => {
  const data = ctx.update.message;
  let text = data.text;
  text = text.split(" ");
  const musicTag = text[1];
  let url = `http://musicovery.com/api/V6/playlist.php?&fct=getfromtag&tag=${musicTag}%20baroque&popularitymin=0&popularitymax=50`;
  request(url, { json: true }, async (err, res, body) => {
    if (err) {
      return console.log(err);
    }
    bot.telegram.sendMessage(data.from.id, "Wait till i fetch the music for you!!", {});
    if (body.tracks.track == undefined) {
      bot.telegram.sendMessage(data.from.id, "No music to recommend in this genre", {});
      return 0; 
    }
    let musicData = String();
    for(let element of body.tracks.track) {
      musicData += `-> ${element.title} - ${element.artist_display_name}\n\n`;
    }
    bot.telegram.sendMessage(data.from.id, musicData, {});
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
    let url =
      "https://cricket.sportmonks.com/api/v2.0/team-rankings?api_token=YHOUIAmP7LRABmIjYn9MX4PrF1YTkZbnS3z2otMuxQ4n4mzfMw3X0KgHuTMs";
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
    var options = {
      method: "GET",
      url: "https://livescore6.p.rapidapi.com/matches/v2/list-live",
      params: { Category: "cricket" },
      headers: {
        "x-rapidapi-host": "livescore6.p.rapidapi.com",
        "x-rapidapi-key": "0d665c4141msh8508c8be1432c2dp1968adjsne568471f7f06",
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
bot.hears([/not so good/, /unwell/, /not fine/], (ctx) => ctx.reply("I am sorry to hear that!!"));
bot.hears(/how are you/, (ctx) => ctx.reply("I am good, wbu?"));
bot.hears([/what are you doing/, /what's up/], (ctx) => ctx.reply("Nothing much,just waiting for your command"));
bot.hears([/who are you/, /what's your name/, /what is your name/], (ctx) => ctx.reply("I am a telegram bot and my name is AstroBot"));

bot.hears([/bye/, /see you/], (ctx) => {
  ctx.replyWithPhoto(
    {
      url: "https://indianmemetemplates.com/wp-content/uploads/2019/03/tussi-jaa-rahe-ho-tussi-naa-jao.jpg",
    },
    { caption: "Alexa please play 'Let me down slowly'" }
  );
});

bot.hears([/dance for me/, /sing for me/, /do something for me/, /tell me a joke/], (ctx) => {
  ctx.replyWithPhoto(
    {
      url: "https://indianmemetemplates.com/wp-content/uploads/mai-tumhara-baap-ka-naukar-nahi-hu.jpg",
    },
    { caption: "LOL!! Sorry i can't do these kind of things" }
  );
});

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
    const randomNumber = Math.floor(Math.random());
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
