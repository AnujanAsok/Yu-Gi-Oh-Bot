import db from "../db.js";

const removeCardCommand = async (message) => {
  const cardToRemove = message.content.split(" ").slice(1).join(" ");
  const ref = db.ref("users");
  const snapshot = await ref.once("value");
  const userData = snapshot.val();
  const userID = message.author.id;
  const userInventory = userData[userID].inventory;

  const cardIDToRemove = Object.keys(userInventory).find(
    (key) =>
      userInventory[key].name.toLowerCase() === cardToRemove.toLowerCase()
  );

  if (cardIDToRemove) {
    const deletedCardObject = userInventory[cardIDToRemove];
    const deletedCardName = deletedCardObject.name;
    const deletedCardPrice = deletedCardObject.price;
    const inventoryRef = ref.child(userID).child("inventory");

    const saleMessage = await message.reply(
      `Do you want to sell ${deletedCardName} for $${deletedCardPrice}?`
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
      console.log("check box selected");
      const oldCurrency = userData[userID].currency || 0;
      const newCurrency = parseFloat(deletedCardObject.price) + oldCurrency;
      console.log(newCurrency);
      const ref = db.ref("users");
      const userRef = ref.child(message.author.id);
      userRef.update({
        currency: newCurrency,
      });
      try {
        await inventoryRef.child(cardIDToRemove).remove();
        await saleMessage.edit(
          `you have successfully removed ${deletedCardName} from your deck.`
        );
        await saleMessage.reactions
          .removeAll()
          .catch((error) =>
            console.error("failed to remove reactions: ", error)
          );
      } catch (error) {
        console.log(`Remove failed${error.message}`);
      }
    } else if (reaction.emoji.name === "🚫") {
      await saleMessage.edit(`${deletedCardName} was not sold`);
      await saleMessage.reactions
        .removeAll()
        .catch((error) => console.error("failed to remove reactions: ", error));
    }
  } else {
    message.reply("that card is not in your deck.");
  }
};

export default removeCardCommand;
