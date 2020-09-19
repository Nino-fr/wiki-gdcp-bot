const Command = require('../base/Command.js'),
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
      aliases: ['lastBlog', 'blog', 'blogLast'],
    });
  }

  /**
   *
   * @param {Message} message
   */
  async run(message) {
    const bot = require('../setup.js');
    await bot.channels.cache.get('751855074657042594').send('lol');

    wiki.checkBlogsPosted().then(async (blog) => {
      if (blog !== undefined && blog !== null) {
        message.repondre(blog);
      } else {
        message.repondre('Aucun blog récent trouvé');
      }
    });
  }
}

module.exports = LastBlog;
