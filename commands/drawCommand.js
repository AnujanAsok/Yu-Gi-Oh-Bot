import axios from "axios";
import { MessageAttachment } from "discord.js";
import db, { getUser } from "../db.js";

let timeDifference;
const DRAW_WAIT_TIME = 600000; // 600000 is 10 minutes in milliseconds
const DOLLAR_COST_OF_DRAW = 1.5;
const RARITIES = [
  "Common",
  "Short Print",
  "Rare",
  "Holofoil Rare",
  "Super Rare",
  "Ultra Rare",
  "Ultimate Rare",
  "Ghost Rare",
  "Holographic Rare",
  "Platinum Rare",
  "Starlight Rare",
  "Secret Rare",
  "Extra Secret Rare",
  "Ultra Secret Rare",
  "Secret Ultra Rare",
  "10000 Secret Rare",
  "Prismatic Secret Rare",
  "Normal Parallel Rare",
  "Parallel Rare",
  "Parallel Common",
  "Super Parallel Rare",
  "Ultra Parallel Rare",
  "Secret Parallel Rare",
  "Extra Secret Parallel Rare",
  "Starfoil Rare",
  "Mosaic Rare",
  "Shatterfoil Rare",
  "Collector's Rare",
  "Holographic Parallel Rare",
  "Gold Secret Rare",
  "Gold Ultra Rare",
];

const drawAndStoreCard = async (message) => {
  const response = await axios.get(
    "https://db.ygoprodeck.com/api/v7/randomcard.php"
  );
  const card = response.data.card_sets;

  const displayedRarity = card.reduce((highestRarity, currentRarity) => {
    if (
      RARITIES.indexOf(highestRarity.set_rarity) <
      RARITIES.indexOf(currentRarity.set_rarity)
    ) {
      return currentRarity;
    }
    return highestRarity;
  });

  message.reply(
    `You just drew ${response.data.name}, a ${
      RARITIES[RARITIES.indexOf(displayedRarity.set_rarity)]
    } card ($${response.data.card_prices[0].tcgplayer_price})`
  );
  const attachment = new MessageAttachment(
    response.data.card_images[0].image_url
  );

  message.channel.send(attachment);

  const userRef = db.ref(`users/${message.author.id}`);
  userRef.update({
    lastDrawTime: Date.now(),
    name: message.author.username,
  });

  const inventoryRef = userRef.child("inventory");

  if (inventoryRef) {
    inventoryRef.update({
      [response.data.id]: {
        name: response.data.name,
        image: response.data.card_images[0].image_url,
        price: response.data.card_prices[0].tcgplayer_price,
        type: response.data.type,
        rarity: RARITIES[RARITIES.indexOf(displayedRarity.set_rarity)],
      },
    });
  } else {
    userRef.update({
      inventory: {
        [response.data.id]: {
          name: response.data.name,
          image: response.data.card_images[0].image_url,
          price: response.data.card_prices[0].tcgplayer_price,
          type: response.data.type,
          rarity: RARITIES[RARITIES.indexOf(displayedRarity.set_rarity)],
        },
      },
    });
  }
};

const getReadableTimeDifference = (timeDifferenceInMs) => {
  const timeDifferenceInSeconds = Math.round(timeDifferenceInMs / 1000);
  const timeDifferenceInMinutes = Math.round(timeDifferenceInMs / 60000);

  return `You must wait ${
    timeDifferenceInMs >= 60000
      ? `${timeDifferenceInMinutes} minutes`
      : `${timeDifferenceInSeconds} seconds`
  } for your free draw.`;
};

const payForDraw = async (message) => {
  const userData = await getUser(message.author.id);
  const timeDifferenceInMs = DRAW_WAIT_TIME - timeDifference;
  const buyADrawMessage = await message.reply(
    `${getReadableTimeDifference(
      timeDifferenceInMs
    )} You currently have *$${userData.currency.toFixed(
      2
    )}*. You can pay *$1.50* to draw a card instead of waiting for the time limit. Would you like to buy a draw?`
  );
  await buyADrawMessage.react("💵");
  await buyADrawMessage.react("🚫");

  const filter = (reaction, user) =>
    ["💵", "🚫"].includes(reaction.emoji.name) && user.id === message.author.id;

  const collected = await buyADrawMessage.awaitReactions(filter, {
    max: 1,
    time: 60000,
    errors: [],
  });
  const reaction = collected.first();

  if (reaction.emoji.name === "💵") {
    const updatedCurrency = userData.currency - DOLLAR_COST_OF_DRAW;
    db.ref(`users/${message.author.id}`).update({ currency: updatedCurrency });
    buyADrawMessage.delete({ timeout: 1250 });
    return true;
  }
  if (reaction.emoji.name === "🚫") {
    buyADrawMessage.edit(
      `Funds were not deducted from your account. ${getReadableTimeDifference(
        timeDifferenceInMs
      )}`
    );
    buyADrawMessage.reactions.removeAll();
    return false;
  }
  return false;
};

const drawCommand = async (message) => {
  const userData = await getUser(message.author.id);
  const userDoesNotExist = !userData;
  const userInventory = userData.inventory;

  if (userData && userInventory) {
    const lastBotUse = userData.lastDrawTime;
    timeDifference = Date.now() - lastBotUse;

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

  if (userDoesNotExist || !userInventory || timeDifference > DRAW_WAIT_TIME) {
    await drawAndStoreCard(message);
  } else if (userData.currency >= DOLLAR_COST_OF_DRAW) {
    if (await payForDraw(message)) {
      drawAndStoreCard(message);
    }
  } else {
    const timeDifferenceInMs = DRAW_WAIT_TIME - timeDifference;
    message.reply(`${getReadableTimeDifference(timeDifferenceInMs)}`);
  }
};

export default drawCommand;
