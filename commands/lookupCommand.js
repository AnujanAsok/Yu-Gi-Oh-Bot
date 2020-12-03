import axios from "axios";
import Discord from "discord.js";

const lookUpCommand = async (message) => {
  const fuzzySearchKey = message.content.split(" ").slice(1).join(" ");
  const fuzzySearchUrl = `https://db.ygoprodeck.com/api/v7/cardinfo.php?&fname=${fuzzySearchKey}`;

  let cardSearchResults;
  console.log(fuzzySearchUrl);
  try {
    cardSearchResults = await axios.get(fuzzySearchUrl);
  } catch (error) {
    console.error(error);
    message.reply("sorry, the search returned no results.");
    return;
  }
  const cardDataObjects = cardSearchResults.data.data;
  const exactMatchCard = cardDataObjects.find(
    (element) => element.name.toLowerCase() === fuzzySearchKey.toLowerCase()
  );

  const closestMatchCard = cardDataObjects.find((element) =>
    element.name.toLowerCase().startsWith(fuzzySearchKey.toLowerCase())
  );

  const bestCardResult =
    exactMatchCard || closestMatchCard || cardDataObjects[0];

  const attachment = new Discord.MessageAttachment(
    bestCardResult.card_images[0].image_url
  );
  message.reply(`the top result for your search is: ${bestCardResult.name}`);
  message.channel.send(attachment);

  if (cardDataObjects.length > 1) {
    setTimeout(() => {
      const suggestedSearches = cardDataObjects
        .filter((item) => item.id !== bestCardResult.id)
        .slice(0, 6)
        .map((item) => `•  ${item.name}`);
      // To delay the suggested searches till after the initial card image is sent
      message.reply(
        `other potential cards that match your search are: \n${suggestedSearches.join(
          "\n"
        )}`
      );
    }, 1500);
  }
};

export default lookUpCommand;
