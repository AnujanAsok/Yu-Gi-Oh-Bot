import db from "../db.js";

const removeCardCommand = async (message) => {
  const cardToRemove = message.content.split(" ").slice(1).join(" ").trim();
  const userRef = db.ref(`users/${message.author.id}`);
  const snapshot = await userRef.once("value");
  const userData = snapshot.val();
  const userInventory = userData.inventory;

  const cardIDToRemove = Object.keys(userInventory).find(
    (key) =>
      userInventory[key].name.toLowerCase() === cardToRemove.toLowerCase()
  );

  if (cardIDToRemove) {
    const deletedCard = userInventory[cardIDToRemove];
    const inventoryRef = userRef.child("inventory");

    const saleMessage = await message.reply(
      `Do you want to sell ${deletedCard.name} for $${deletedCard.price}?`
    );

    await saleMessage.react("☑️");
    await saleMessage.react("🚫");

    const filter = (reaction, user) => {
      return (
        ["☑️", "🚫"].includes(reaction.emoji.name) &&
        user.id === message.author.id
      );
    };

    const collected = await saleMessage.awaitReactions(filter, {
      max: 1,
      time: 60000,
      errors: [],
    });
    const reaction = collected.first();

    if (reaction.emoji.name === "☑️") {
      const oldCurrency = userData.currency || 0;
      const newCurrency = parseFloat(deletedCard.price) + oldCurrency;
      userRef.update({
        currency: newCurrency,
      });
      try {
        await inventoryRef.child(cardIDToRemove).remove();
        await saleMessage.edit(
          `You have successfully removed ${deletedCard.name} from your deck.`
        );
        await saleMessage.reactions.removeAll();
      } catch (error) {
        console.log(`Remove failed${error.message}`);
      }
    } else if (reaction.emoji.name === "🚫") {
      try {
        await saleMessage.edit(`${deletedCard.name} was not sold.`);
        await saleMessage.reactions.removeAll();
      } catch (error) {
        console.error("failed to remove reactions: ", error);
      }
    }
  } else {
    message.reply("that card is not in your deck.");
  }
};

export default removeCardCommand;
