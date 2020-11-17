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
    const bot = this.bot,
      msg = await message.channel.send(
        '<a:discord_loading:756866921370222634> Chargement...'
      ),
      post = await wiki.checkPosts();

    if (post !== undefined && post !== null) {
      return msg.edit('', post);
    } else {
      return msg.edit(
        '<a:check_cross:767021936185442366> Une erreur est survenue, veuillez réessayer.'
      );
    }
  }
}

module.exports = LastPost;
