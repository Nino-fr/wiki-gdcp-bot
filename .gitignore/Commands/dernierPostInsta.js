const Command = require('../Base/Command.js'),
  { Message } = require('discord.js'),
  wiki = require('../Wiki/gdcp.js');

/**
 * Voir la dernière publication postée dans la partie communauté du wiki
 */
class newsInsta extends Command {
  constructor() {
    super({
      name: 'dernierPostInstagram',
      description:
        'Voir la dernière publication postée par Shannon Messenger sur Instagram (@sw_messenger)',
      usage: 'dernierPostInsta',
      aliases: [
        'dernierPostInsta',
        'newsInsta',
        'postInsta',
        'postInstagram',
        'publication',
        'dernierePublication',
        'dernièrePublication',
      ],
      enabled: true,
    });
  }

  /**
   *
   * @param {Message} message
   */
  async run(message) {
    const msg = await message.channel.send(
      '<a:discord_loading:756866921370222634> Chargement...'
    );

    const post = await wiki.checkInstaPost();
    if (post !== undefined && post !== null) {
      return msg.edit('', post);
    } else {
      return msg.edit('Aucun post récent trouvé');
    }
  }
}

module.exports = newsInsta;
