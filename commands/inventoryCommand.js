import db from "../db.js";

const inventoryCommand = async (message) => {
  const ref = db.ref("users");
  const snapshot = await ref.once("value");
  const userData = snapshot.val();
  const userID = message.author.id;
  const userInventory = userData[userID].inventory;
  const inventorySize = Object.keys(userInventory).length;
  console.log(inventorySize);
  const inventoryList = Object.values(userInventory).map(
    (item) => `•  ${item.name}`
  );

  message.reply(
    `your inventory: \n${inventoryList.join(
      "\n"
    )}\n                                                                                                      Total cards:  ${inventorySize} / 60`
  ); // The large spacing is to imitate text align right on discord
};

export default inventoryCommand;
