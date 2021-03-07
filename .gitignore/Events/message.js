const { Message } = require('discord.js');
const bot = require('../setup.js');

module.exports = class {
  /**
   *
   * @param {Message} message
   */
  async run(message) {
    if (message.channel.type === 'dm')
      return bot.channels.cache
        .get('800758460001550367')
        .send(
          `<@428582719044452352> **Message de ${message.author.tag} (${message.author.id}) :**\n${message.content}`
        );
    if (message.author.bot) return;

    // Cancel any attempt to execute commands if the bot cannot respond to the user.
    if (message.guild && !message.guild.me.permissions.missing('SEND_MESSAGES'))
      return;

    const set = bot.settings.get('settings') || {};
    const returnObject = {};
    Object.keys(set).forEach((key) => {
      returnObject[key] = set[key] ? set[key] : set[key];
    });
    message.settings = returnObject;

    const prefixMention = new RegExp(`^<@!?${bot.user.id}> ?$`);
    if (message.content.match(prefixMention)) {
      return message.channel.send(
        `Mon prefix est \`${set.prefix}\`\nUtilisez la commande \`${set.prefix}aide\` pour voir ma page d'aide ou la commande \`${set.prefix}présentation\` pour une brêve présentation.`
      );
    }

    if (message.content === ';')
      return message.repondre(
        'Si tu envoies mon préfix sans commande, je ne peux rien pour toi...'
      );

    if (message.content.indexOf(set.prefix) !== 0) return;

    const args = message.content.slice(set.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    const level = bot.permlevel(message);

    const cmd =
      bot.commands.get(command) || bot.commands.get(bot.aliases.get(command));
    if (!cmd) return;

    // Some commands may not be useable in DMs. This check prevents those commands from running
    // and return a friendly error message.
    if (cmd && !message.guild && cmd.conf.guildOnly)
      return message.channel.send("Cette commande n'est pas disponible en mp.");

    if (level < bot.levelCache[cmd.conf.permLevel]) {
      if (set.systemNotice === 'true') {
        return message.channel
          .send(`<a:check_cross:767021936185442366> Vous n'avez pas la permission d'utiliser cette commande. Votre niveau de permission : ${level} (${
          bot.config.permLevels.find((l) => l.level === level).name
        })
Cette commande nécessite le niveau de permission ${
          bot.levelCache[cmd.conf.permLevel]
        } (${cmd.conf.permLevel})`);
      }
    }

    // To simplify message arguments, the author's level is now put on level (not member, so it is supported in DMs)
    // The "level" command module argument will be deprecated in the future.
    message.author.permLevel = level;

    message.flags = [];
    while (args[0] && args[0][0] === '-') {
      message.flags.push(args.shift().slice(1));
    }

    if (!cmd.conf.enabled)
      return message.channel.send(
        'Cette commande est actuellement désactivée et ne peut donc plus être utilisée.'
      );

    // If the command exists, **AND** the user has permission, run it.
    bot.logger.log(
      `${bot.config.permLevels.find((l) => l.level === level).name} ${
        message.author.username
      } (${message.author.id}) a utilisé la commande ${cmd.help.name}`,
      'cmd'
    );

    cmd.run(message, args, level);
  }
};
