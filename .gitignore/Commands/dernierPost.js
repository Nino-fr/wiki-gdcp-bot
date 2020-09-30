const Command = require('../Base/Command.js'),
  { Message } = require('discord.js'),
  wiki = require('../Wiki/gdcp.js');

/**
 * Voir la dernière publication postée dans la partie communauté du wiki
 */
class LastPost extends Command {
  constructor() {
    super({
      name: 'dernierPost',
      description:
        'Voir la dernière publication postée dans la partie communauté du wiki',
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
    const bot = this.bot;
    const msg = await message.channel.send(
      '<a:discord_loading:756866921370222634> Chargement...'
    );
    await bot.channels.cache.get('755540919263953036').send('lol');

    const post = await wiki.checkPosts();
    if (post !== undefined && post !== null) {
      return msg.edit('', post);
    } else {
      return msg.edit('Aucun post récent trouvé');
    }
  }
}

module.exports = LastPost;
