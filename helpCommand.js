const helpCommand = (message) => {
  message.reply(
    "commands for the Yu-Gi-Oh bot: \n !draw => allows user to draw a random Yu-Gi-Oh card \n !inventory => allows user to view the cards that are stored in their inventory. The number of cards in your deck out of the maximum deck size is also displayed. \n !lookup => type this command followed by a card name to search for a card \n !remove => type this command followed by a card name from your inventory to remove that card from your deck"
  );
};

export default helpCommand;
