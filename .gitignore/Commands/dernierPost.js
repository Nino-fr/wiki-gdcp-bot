const Command = require('../Base/Command.js'),
  { Message } = require('discord.js'),
  wiki = require('../Wiki/gdcp.js');

/**
 * Voir le dernier billet de post posté sur le wiki
 */
class LastPost extends Command {
  constructor() {
    super({
      name: 'dernierPost',
      description: 'Voir la dernière publication postée sur le wiki',
      usage: 'dernierPost',
      aliases: [
        'lastPost',
        'post',
        'postLast',
        'publication',
        'dernierePublication',
        'dernièrePublication',
      ],
    });
  }

  /**
   *
   * @param {Message} message
   */
  async run(message) {
    const bot = require('../setup.js');
    await bot.channels.cache.get('755540919263953036').send('lol');

    const post = await wiki.checkPosts();
    if (post !== undefined && post !== null) {
      return message.repondre(post);
    } else {
      return message.repondre('Aucun post récent trouvé');
    }
  }
}

module.exports = LastPost;
