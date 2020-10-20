const express = require("express");

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
  "Secret Rare",
  "Ultra Secret Rare",
  "Secret Ultra Rare",
  "Prismatic Secret Rare",
  "Parallel Rare",
  "Parallel Common",
  "Super Parallel Rare",
  "Ultra Parallel Rare",
  "Starfoil Rare",
  "Ghost Rare",
  "Gold Ultra Rare",
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

const app = express();
const port = process.env.PORT || 3001;
app.get("/", (req, res) => res.send("Hello from Render!"));

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
