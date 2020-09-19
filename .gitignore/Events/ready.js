// Cet événement a lieu quand le bot est lancé.

const bot = require('../setup.js');

module.exports = class {
  async run() {
    // Attendons un peu avant d'exécuter le code pour laisser au bot le temps de se lancer complètement
    await bot.wait(1000);

    // This loop ensures that bot.appInfo always contains up to date data
    // about the app's status. This includes whether the bot is public or not,
    // its description, owner, etc. Used for the dashboard amongs other things.
    bot.appInfo = await bot.fetchApplication();
    setInterval(async () => {
      bot.appInfo = await bot.fetchApplication();
    }, 60000);

    bot.settings.set('settings', bot.config.settings);

    // Initialisons le statut du bot
    await bot.user.setActivity(
      `${bot.settings.get('settings').prefix}help | ${
        bot.users.cache.size
      } utilisateurs`
    );
    bot.logger.log(`${bot.commands.size} commandes`, 'log');

    // Mettre un message en console qui indique que le bot est prêt.
    bot.logger.log(
      `${bot.user.tag}, prêt à servir ${bot.users.cache.size} utilisateurs dans ${bot.guilds.cache.size} serveurs.`,
      'ready'
    );
  }
};
