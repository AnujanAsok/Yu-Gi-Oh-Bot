import axios from "axios";
import { MessageAttachment } from "discord.js";
import db from "../db.js";

let timeDifference;
const DRAW_WAIT_TIME = 600000; // 600000 is 10 minutes in milliseconds
const COST_OF_DRAW = 1.5;
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

const storingDraws = async (message) => {
  const response = await axios.get(
    "https://db.ygoprodeck.com/api/v7/randomcard.php"
  );
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
};

const payForDraw = async (message) => {
  const userRef = db.ref(`users/${message.author.id}`);
  const snapshot = await userRef.once("value");
  const userData = snapshot.val();
  const buyADrawMessage = await message.reply(
    `you can pay $1.50 to draw a card instead of waiting for the time limit. Would you like to buy a draw?`
  );
  await buyADrawMessage.react("💵");
  await buyADrawMessage.react("🚫");

  const filter = (reaction, user) => {
    return (
      ["💵", "🚫"].includes(reaction.emoji.name) &&
      user.id === message.author.id
    );
  };

  const collected = await buyADrawMessage.awaitReactions(filter, {
    max: 1,
    time: 60000,
    errors: [],
  });
  const reaction = collected.first();

  if (reaction.emoji.name === "💵") {
    const updatedCurrency = userData.currency - COST_OF_DRAW;
    userRef.update({ currency: updatedCurrency });
    storingDraws(message);
    await buyADrawMessage.delete({ timeout: 1250 });
  } else if (reaction.emoji.name === "🚫") {
    const timeDifferenceInMs = DRAW_WAIT_TIME - timeDifference;
    const timeDifferenceInSeconds = Math.round(timeDifferenceInMs / 1000);
    const timeDifferenceInMinutes = Math.round(timeDifferenceInMs / 60000);
    buyADrawMessage.edit(
      `Funds were not deducted from your account. You must wait ${
        timeDifferenceInMs >= 60000
          ? `${timeDifferenceInMinutes} minutes`
          : `${timeDifferenceInSeconds} seconds`
      } for your free draw.`
    );
    await buyADrawMessage.reactions.removeAll();
  }
};

const drawCommand = async (message) => {
  const ref = db.ref("users");
  const snapshot = await ref.once("value");
  const userData = snapshot.val();
  const userID = message.author.id;
  const user = userData[userID];
  const userDoesNotExist = !user;

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
  if (userDoesNotExist || timeDifference > DRAW_WAIT_TIME) {
    await storingDraws(message);
  } else if (user.currency >= COST_OF_DRAW) {
    await payForDraw(message);
  } else {
    const timeDifferenceInMs = DRAW_WAIT_TIME - timeDifference;
    const timeDifferenceInSeconds = Math.round(timeDifferenceInMs / 1000);
    const timeDifferenceInMinutes = Math.round(timeDifferenceInMs / 60000);
    message.reply(
      `you must wait ${
        timeDifferenceInMs >= 60000
          ? `${timeDifferenceInMinutes} minutes`
          : `${timeDifferenceInSeconds} seconds`
      } before you can draw again.`
    );
  }
};

export default drawCommand;
