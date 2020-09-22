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
    const bot = this.bot;
    const msg = await message.channel.send(
      '<a:discord_loading:756866921370222634> Chargement...'
    );
    await bot.channels.cache.get('751855074657042594').send('lol');

    wiki.checkBlogsPosted().then(async (blog) => {
      if (blog !== undefined && blog !== null) {
        delete blog.footer;
        return msg.edit('', blog);
      } else {
        return msg.edit('Aucun billet de blog récent trouvé');
      }
    });
  }
}

module.exports = LastBlog;
