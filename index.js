import { BOT_TOKEN } from "./config.js";
import express from "express";
import Discord from "discord.js";
import drawCommand from "./drawCommand.js";
import inventoryCommand from "./inventoryCommand.js";
import lookUpCommand from "./lookupCommand.js";
import removeCardCommand from "./removeCardCommand.js";
import helpCommand from "./helpCommand.js";

const client = new Discord.Client();
client.login(BOT_TOKEN);

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
  } else if (message.content.startsWith("!help")) {
    helpCommand(message);
  }
});

const app = express();
const port = process.env.PORT || 3001;
app.get("/", (req, res) => res.send("Hello from Render!"));

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
