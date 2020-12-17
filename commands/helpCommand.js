const helpCommand = (message) => {
  message.reply(
    "**commands for the Yu-Gi-Oh bot:** \n\n **!draw** \t\t\t  ⟹ \tAllows user to draw a random Yu-Gi-Oh card.  \n\n **!inventory** \t ⟹ \tAllows user to view the cards that are stored in their inventory. The number of cards in your deck out of the maximum deck size is also displayed. \n\n **!lookup** \t\t  ⟹ \tType this command followed by a card name to search for a card \n\n **!sell** \t\t ⟹ \tType this command followed by a card name from your inventory to recieve a prompt to sell that card, confirm this sale by using the emojis on the sale message."
  ); // covering a word in ** is how you bold text on discord
};

export default helpCommand;
