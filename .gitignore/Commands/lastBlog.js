const Command = require('../Base/Command.js'),
  { Message } = require('discord.js'),
  wiki = require('../Wiki/gdcp.js');

/**
 * Voir le dernier billet de blog posté sur le wiki
 */
class LastBlog extends Command {
  constructor() {
    super({
      name: 'dernierBlog',
      description: 'Voir le dernier billet de blog posté sur le wiki',
      usage: 'dernierBlog',
      aliases: ['lastBlog', 'blog', 'blogLast', 'billet', 'dernierBillet'],
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

    wiki.checkBlogsPosted().then(async (blog) => {
      if (blog !== undefined && blog !== null) {
        return msg.edit('', blog);
      } else {
        return msg.edit(
          '<a:check_cross:767021936185442366> Une erreur est survenue, veuillez réessayer.'
        );
      }
    });
  }
}

module.exports = LastBlog;
