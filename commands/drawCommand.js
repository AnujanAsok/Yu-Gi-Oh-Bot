import axios from "axios";
import { MessageAttachment } from "discord.js";
import db from "../db.js";

export const RARITIES = [
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

const drawCommand = (message) => {
  const ref = db.ref("users");
  ref.once("value", (snapshot) => {
    const userData = snapshot.val();
    const userID = message.author.id;
    const user = userData[userID];
    const userDoesNotExist = !user;
    let timeDifference;
    if (user) {
      const lastBotUse = user.lastDrawTime;
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

    // 1800000 is 30 minutes in milliseconds
    if (userDoesNotExist || timeDifference > 60000) {
      axios
        .get("https://db.ygoprodeck.com/api/v7/randomcard.php")
        .then((response) => {
          let highestRarityIndex = 0;
          const card = response.data.card_sets;

          card.forEach((element) => {
            const cardSetRarity = element.set_rarity;
            const cardSetRarityIndex = RARITIES.indexOf(cardSetRarity);
            if (highestRarityIndex < cardSetRarityIndex) {
              highestRarityIndex = cardSetRarityIndex;
            }
          });

          message.reply(
            `You just drew ${response.data.name}, a ${RARITIES[highestRarityIndex]} card`
          );
          const attachment = new MessageAttachment(
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
            when the same user draws a second card, store the name of the second card under
             the previous draw within cardName
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
      const timeDifferenceInMs = 60000 - timeDifference; // 60000 is 1 minute
      const timeDifferenceInSeconds = Math.round(timeDifferenceInMs / 1000);
      message.reply(
        `You must wait ${timeDifferenceInSeconds} seconds before you can draw again.`
      );
    }

    console.log(JSON.stringify(message));
    console.log(JSON.stringify(message.author));
  });
};

export default drawCommand;
