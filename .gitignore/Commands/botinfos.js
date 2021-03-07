const Command = require('../Base/Command.js'),
  { Message, MessageEmbed } = require('discord.js'),
  { version } = process,
  { convertMS } = require('../fonctions');

class Stats extends Command {
  constructor() {
    super({
      name: 'botInfos',
      description: 'Donne plusieurs informations sur le bot',
      usage: 'botInfos',
      aliases: ['botinfo', 'clientinfo', 'binfos', 'bi', 'stats', 'botStats'],
      category: 'Bot',
    });
  }
  /**
   *
   * @param {Message} message Le message
   */
  async run(message) {
    const objDur = convertMS(this.bot.uptime);
    const duration = `${
      objDur.d !== 0
        ? objDur.d > 1
          ? `${objDur.d} jours, `
          : `${objDur.d} jour, `
        : ''
    }${
      objDur.h !== 0
        ? objDur.h > 1
          ? `${objDur.h} heures, `
          : `${objDur.h} heure, `
        : ''
    }${
      objDur.m !== 0
        ? objDur.m > 1
          ? `${objDur.m} minutes et `
          : `${objDur.m} minute et `
        : ''
    }${objDur.s > 1 ? `${objDur.s} secondes` : `${objDur.s} seconde`}`;
    const embed = new MessageEmbed()
      .setTitle('Informations à mon propos')
      .setColor('DARK_GOLD')
      .setDescription(
        `**${this.bot.user.username}** est un bot Discord créé par <@428582719044452352> pour le wiki ${this.bot.wiki.name} sur [Fandom](https://www.fandom.com).\nLe bot est développé en JavaScript via [NodeJS](https://nodejs.org/en/) et le module [\`discord.js\`](https://discord.js.org/#/).`
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
        (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2) + ' MB',
        true
      )
      .addField('Temps en ligne', duration, true)
      .addField(
        'Utilisateurs',
        this.bot.guilds.cache.get('719085354514251877').memberCount,
        true
      )
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
