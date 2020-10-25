const express = require("express");
const config = require("./config.js");
const axios = require("axios");
const Discord = require("discord.js");

var admin = require("firebase-admin");
var serviceAccount;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
  serviceAccount = require("./yu-gi-oh-inventory-firebase-adminsdk-z8h62-7925253eaa.json");
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://yu-gi-oh-inventory.firebaseio.com",
});

var db = admin.database();

const client = new Discord.Client();
client.login(config.BOT_TOKEN);

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
  if (message.content.startsWith("!draw")) {
    drawCommand(message);
  }
});

const drawCommand = (message) => {
  var ref = db.ref("users");
  ref.once("value", function (snapshot) {
    const userData = snapshot.val();
    let userDraw = message.author.id;
    let user = userData[userDraw];
    const userDoesNotExist = !user;
    let timeDifference;
    if (user) {
      let lastBotUse = user.lastDrawTime;
      timeDifference = Date.now() - lastBotUse;
      console.log(userData);
      console.log(lastBotUse);
      console.log(Date.now());
      console.log(timeDifference);
    }

    //1800000 is 30 minutes in milliseconds

    if (userDoesNotExist || timeDifference > 60000) {
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
          // // message.reply(response.data.name);
          // console.log(JSON.stringify(response.data));

          var ref = db.ref("users");
          ref.update({
            [message.author.id]: {
              lastDrawTime: Date.now(),
              name: message.author.username,
            },
          });
        });
    } else {
      let timeDifferenceInMs = 60000 - timeDifference;
      let timeDifferenceInMinutes = Math.round(timeDifferenceInMs / 1000 / 60);
      message.reply(
        "You must wait " +
          timeDifferenceInMinutes +
          " minutes before you can draw again."
      );
    }
    console.log(JSON.stringify(message));
    console.log(JSON.stringify(message.author));
  });
};

const app = express();
const port = process.env.PORT || 3001;
app.get("/", (req, res) => res.send("Hello from Render!"));

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
