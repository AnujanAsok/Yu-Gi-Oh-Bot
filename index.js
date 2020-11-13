const express = require("express");
const config = require("./config.js");
const axios = require("axios");
const Discord = require("discord.js");

const admin = require("firebase-admin");
let serviceAccount;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
  serviceAccount = require("./yu-gi-oh-inventory-firebase-adminsdk-z8h62-7925253eaa.json");
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://yu-gi-oh-inventory.firebaseio.com",
});

const db = admin.database();

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
  } else if (message.content.startsWith("!inventory")) {
    inventoryCommand(message);
  } else if (message.content.startsWith("!lookup")) {
    lookUpCommand(message);
  } else if (message.content.startsWith("!remove")) {
    removeCardCommand(message);
  }
});

const drawCommand = (message) => {
  const ref = db.ref("users");
  ref.once("value", function (snapshot) {
    const userData = snapshot.val();
    const userID = message.author.id;
    const user = userData[userID];
    const userDoesNotExist = !user;
    let timeDifference;
    if (user) {
      let lastBotUse = user.lastDrawTime;
      timeDifference = Date.now() - lastBotUse;
      const userInventory = userData[userID].inventory;
      const inventorySize = Object.keys(userInventory).length;
      const DECK_SIZE = 60;
      if (inventorySize >= DECK_SIZE) {
        const numOfCardsExceeded = inventorySize - (DECK_SIZE - 1);
        message.reply(
          `you have exceeded the deck limit. You must remove ${numOfCardsExceeded} card${
            numOfCardsExceeded > 1 ? "s" : ""
          } before you can draw again.`
        );
        return;
      }
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

          message.channel.send(attachment);

          const ref = db.ref("users");
          const userRef = ref.child(message.author.id);
          userRef.update({
            lastDrawTime: Date.now(),
            name: message.author.username,
          });

          /* 
          if user draws a card
          store name of card to firebase under the key cardName
          when the same user draws a second card, store the name of the second card under the previous draw within cardName
          continue to do this to all additional cards
          
          user{
            userID{
              lastDrawTime: xxxx
              username: ""
              cardName: "Blue Eyes White Dragon", "Red Eyes Black Dragon"
            }
          }
          */

          const inventoryRef = userRef.child("inventory");
          inventoryRef.update({
            [response.data.id]: {
              name: response.data.name,
              image: response.data.card_images[0].image_url,
              price: response.data.card_prices[0].tcgplayer_price,
              type: response.data.type,
              rarity: RARITIES[highestRarityIndex],
            },
          });
        });
    } else {
      const timeDifferenceInMs = 60000 - timeDifference; //60000 is 1 minute
      const timeDifferenceInSeconds = Math.round(timeDifferenceInMs / 1000);
      message.reply(
        "You must wait " +
          timeDifferenceInSeconds +
          " seconds before you can draw again."
      );
    }

    console.log(JSON.stringify(message));
    console.log(JSON.stringify(message.author));
  });
};

const inventoryCommand = (message) => {
  const ref = db.ref("users");
  ref.once("value", function (snapshot) {
    const userData = snapshot.val();
    const userID = message.author.id;
    const userInventory = userData[userID].inventory;
    const inventorySize = Object.keys(userInventory).length;
    console.log(inventorySize);
    const inventoryList = Object.values(userInventory).map(
      (item) => "•  " + item.name
    );

    message.reply(
      "your inventory: \n" +
        inventoryList.join("\n") +
        "\n                                                                                                      Total cards:  " +
        inventorySize +
        " / 60"
    ); //The large spacing is to imitate text align right on discord
  });
};

const lookUpCommand = (message) => {
  const fuzzySearchKey = message.content.split(" ").slice(1).join(" ");
  const fuzzySearchUrl =
    "https://db.ygoprodeck.com/api/v7/cardinfo.php?&fname=" + fuzzySearchKey;

  console.log(fuzzySearchUrl);

  axios
    .get(fuzzySearchUrl)
    .then((cardSearchResults) => {
      const cardDataObjects = cardSearchResults.data.data;
      const exactMatchCard = cardDataObjects.find(
        (element) => element.name.toLowerCase() === fuzzySearchKey.toLowerCase()
      );

      const closestMatchCard = cardDataObjects.find((element) =>
        element.name.toLowerCase().startsWith(fuzzySearchKey.toLowerCase())
      );

      const bestCardResult =
        exactMatchCard || closestMatchCard || cardDataObjects[0];

      const attachment = new Discord.MessageAttachment(
        bestCardResult.card_images[0].image_url
      );
      message.reply(
        "the top result for your search is: " + bestCardResult.name
      );
      message.channel.send(attachment);

      if (cardDataObjects.length > 1) {
        setTimeout(() => {
          const suggestedSearches = cardDataObjects
            .filter((item) => item.id != bestCardResult.id)
            .slice(0, 6)
            .map((item) => "•  " + item.name);
          //To delay the suggested searches till after the initial card image is sent
          message.reply(
            "other potential cards that match your search are: \n" +
              suggestedSearches.join("\n")
          );
        }, 1500);
      }
    })
    .catch(function (error) {
      console.error(error);
      message.reply("sorry, the search returned no results.");
    });
};

/*

  const topFiveCommand = (message) => {};
    The user uses this command to select up to 5 cards  from their inventory to display
    any user can use the lookup command to look at another users top 5 cards, but only the owner of cards can select which cards go into their top 5
    
    To input a card to your top 5, the command must be entered as !showcase blue-eyes white dragon 



*/

const removeCardCommand = (message) => {
  const cardToRemove = message.content.split(" ").slice(1).join(" ");
  const ref = db.ref("users");
  ref.once("value", function (snapshot) {
    const userData = snapshot.val();
    const userID = message.author.id;
    const userInventory = userData[userID].inventory;

    const cardIDToRemove = Object.keys(userInventory).find(
      (key) =>
        userInventory[key].name.toLowerCase() === cardToRemove.toLowerCase()
    );

    if (cardIDToRemove) {
      const deletedCardName = userInventory[cardIDToRemove].name;
      const inventoryRef = ref.child(userID).child("inventory");
      inventoryRef
        .child(cardIDToRemove)
        .remove()
        .then(() => {
          message.reply(
            "you have successfully removed " +
              deletedCardName +
              " from your deck."
          );
        })
        .catch((error) => {
          console.log("Remove failed" + error.message);
        });
    } else {
      message.reply("that card is not in your deck.");
    }
  });
};

const app = express();
const port = process.env.PORT || 3001;
app.get("/", (req, res) => res.send("Hello from Render!"));

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
