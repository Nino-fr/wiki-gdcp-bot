const Command = require('../Base/Command.js'),
  { Message } = require('discord.js'),
  wiki = require('../Wiki/gdcp.js');

/**
 * Voir la liste de toutes les catégories du Wiki
 */
class Categories extends Command {
  constructor() {
    super({
      name: 'catégories',
      description: 'Voir la liste de toutes les catégories du Wiki',
      usage: 'catégories',
      aliases: ['categories', 'category', 'listeCatégories'],
    });
  }

  /**
   *
   * @param {Message} message
   */
  async run(message) {
    return message.repondre(wiki.categories);
  }
}

module.exports = Categories;
