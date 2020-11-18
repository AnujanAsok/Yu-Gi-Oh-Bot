import db from "../db.js";
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

export default removeCardCommand;
