const http = require("http");
const axios = require("axios");
const Discord = require("discord.js");
const client = new Discord.Client();
client.login(process.env.BOT_TOKEN);

const RARITIES = [
  "Common",
  "Rare",
  "Super Rare",
  "Holofoil Rare",
  "Ultra Rare",
  "Ultimate Rare",
];
client.on("message", function (message) {
  if (message.author.bot) return;
  if (!message.content.startsWith("!draw")) {
    return;
  }

  axios
    .get("https://db.ygoprodeck.com/api/v7/randomcard.php")
    .then(function (response) {
      let highestRarityIndex = 0;
      let card = response.data;
      for (let i = 0; i < card.card_sets.length; i++) {
        let cardSetRarity = card.card_sets[i].set_rarity;
        let cardSetRarityIndex = RARITIES.indexOf(cardSetRarity);
        if (highestRarityIndex < cardSetRarityIndex) {
          highestRarityIndex = cardSetRarityIndex;
        }
      }

      message.reply(
        "You just drew " +
          response.data.name +
          ", a " +
          RARITIES[highestRarityIndex] +
          " card"
      );
      const attachment = new Discord.MessageAttachment(
        response.data.card_images[0].image_url
      );
      // Send the attachment in the message channel
      message.channel.send(attachment);
      // message.reply(response.data.name);
      console.log(JSON.stringify(response.data));
    });

  console.log(JSON.stringify(message));
});

const hostname = "127.0.0.1";
const port = process.env.PORT || 3001;

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/plain");
  res.end("Hello World");
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
