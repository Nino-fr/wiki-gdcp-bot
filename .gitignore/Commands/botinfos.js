const Command = require('../Base/Command.js'),
  { version, Message, MessageEmbed } = require('discord.js'),
  { convertMS } = require('../fonctions');

class Stats extends Command {
  constructor() {
    super({
      name: 'botInfos',
      description: 'Donne plusieurs informations sur le bot',
      usage: 'botInfos',
      aliases: ['botinfo', 'clientinfo', 'binfos', 'bi', 'stats', 'botStats'],
    });
  }
  /**
   *
   * @param {Message} message Le message
   */
  async run(message) {
    const objDur = convertMS(this.bot.uptime);
    const duration = `${objDur.d} jours, ${objDur.h} heures, ${objDur.m} minutes et ${objDur.s} secondes`;
    const embed = new MessageEmbed()
      .setTitle('Informations à mon propos')
      .setColor('DARK_GOLD')
      .setDescription(
        `**${this.bot.user.username}** est un bot Discord créé par <@428582719044452352> pour le wiki ${this.bot.wiki.name} sur fandom.\nLe bot est développé en JavaScript via NodeJS et le module \`discord.js\`.`
      )
      .addField('Version du bot', this.bot.config.version, true)
      .addField('Langage de programmation', 'JavaScript', true)
      .addField(
        'Bibliothèque',
        `[discord.js](https://discord.js.org/#/docs/main/stable/general/welcome)`,
        true
      )
      .addField(
        'Utilisation de la RAM',
        (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2),
        true
      )
      .addField('Temps en ligne', duration, true)
      .addField('Utilisateurs', this.bot.users.cache.size, true)
      .addField('Version de NodeJS', version, true)
      .addField('Développeur', '<@428582719044452352>', true)
      .addField(
        'Administrateurs du bot',
        this.bot.config.admins.map((admin) => `<@${admin}>`).join('\n'),
        true
      );
    return message.channel.send(embed);
  }
}

module.exports = Stats;
