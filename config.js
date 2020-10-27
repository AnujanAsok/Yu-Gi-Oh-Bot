const localenv = require("./localenv.js");

const BOT_TOKEN = process.env.BOT_TOKEN || localenv.BOT_TOKEN;
exports.BOT_TOKEN = BOT_TOKEN;
