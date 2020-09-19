const Command = require('../Base/Command.js'),
  { Message, MessageEmbed } = require('discord.js'),
  wiki = require('../Wiki/gdcp.js');

/**
 * Donne le lien vers une page au hasard du wiki
 */
class Random extends Command {
  constructor() {
    super({
      name: 'pageAléatoire',
      description: 'Donne le lien vers une page au hasard du wiki',
      usage: 'pageAléatoire',
      aliases: ['pageAleatoire', 'pageAuHasard', 'randomPage', 'random', 'any'],
    });
  }

  /**
   *
   * @param {Message} message
   * @param {string[]} args
   */
  async run(message) {
    const repl = await wiki.random();
    if (repl === undefined || repl === null)
      return message.repondre(
        'Une erreur est survenue, veuillez réessayer. Si cela ne fonctionne toujours pas, veuillez contacter mon créateur.'
      );
    return message.repondre(repl);
  }
}

module.exports = Random;
