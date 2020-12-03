import express from "express";
import Discord from "discord.js";
import BOT_TOKEN from "./config.js";
import drawCommand from "./commands/drawCommand.js";
import inventoryCommand from "./commands/inventoryCommand.js";
import lookUpCommand from "./commands/lookupCommand.js";
import sellCardCommand from "./commands/sellCardCommand.js";
import helpCommand from "./commands/helpCommand.js";

const client = new Discord.Client();
client.login(BOT_TOKEN);

client.on("message", (message) => {
  if (message.author.bot) return;

  if (message.content.startsWith("!draw")) {
    drawCommand(message);
  } else if (message.content.startsWith("!inventory")) {
    inventoryCommand(message);
  } else if (message.content.startsWith("!lookup")) {
    lookUpCommand(message);
  } else if (message.content.startsWith("!sell")) {
    sellCardCommand(message);
  } else if (message.content.startsWith("!help")) {
    helpCommand(message);
  } else if (message.content.startsWith("!remove")) {
    message.reply("!remove is not a command anymore, did you mean !sell?"); // I added this as a temporary measure to help beta testers get used to the change in command from !remove to !sell, will remove this in a few days
  }
});

const app = express();
const port = process.env.PORT || 3001;
app.get("/", (req, res) => res.send("Hello from Render!"));

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
