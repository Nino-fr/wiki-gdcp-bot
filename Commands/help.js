const Command = require('../Base/Command.js');
const { blue_dark } = require('../colours.json');
const { MessageEmbed, Message } = require('discord.js');

class Help extends Command {
  constructor() {
    super({
      name: 'aide',
      description: 'Donne la liste des commandes que vous pouvez utiliser',
      category: 'Bot',
      usage: 'aide [commande]',
      aliases: ['h', 'halp', 'help', 'commands'],
    });
  }
  /**
   *
   * @param { Message } message La commande
   * @param { String[] } args Les args passés après la commande
   * @param { Number | String } level Le niveau de permission de l'utilisateur
   */
  async run(message, args, level) {
    if (args[0]) {
      if (
        !this.bot.commands.get(args[0].toLowerCase()) &&
        !this.bot.aliases.get(args[0].toLowerCase())
      ) {
        return message.channel.send('Aucune commande portant ce nom trouvée');
      }
    }

    const embed = new MessageEmbed()
      .setColor(blue_dark)
      .setAuthor(
        `Page d'aide`,
        this.bot.user.displayAvatarURL({ format: 'png' })
      );
    if (!args[0]) {
      embed.setThumbnail(
        'https://static.wikia.nocookie.net/gardiens-des-cites-perdue/images/e/e2/Bienvenue.png/revision/latest/scale-to-width-down/560?cb=20180317150931&path-prefix=fr'
      );
      const categories = ['Wiki', 'Bot'];
      embed.setDescription(
        `**Utilisez ${this.bot.config.settings.prefix}aide <commande> pour plus de détails**\n`
      );
      categories.forEach((cat) => {
        embed.addField(
          cat,
          this.bot.commands
            .filter((c) => c.help.category === cat)
            .map((c) => `${this.bot.config.settings.prefix}${c.help.name}`)
            .join('\n'),
          true
        );
      });
      return message.repondre(embed);
    } else {
      let command = args[0].toLowerCase();
      if (this.bot.commands.has(command)) {
        command = this.bot.commands.get(command);

        embed
          .addField('Nom de la commande', `\`${command.help.name}\``, true)
          .addField('Description', command.help.description, true)
          .addField(
            'Utilisation',
            `\`${this.bot.config.settings.prefix + command.help.usage}\``
          )
          .addField(
            'Autres noms de la commande de la commande',
            command.conf.aliases.map((alias) => `\`${alias}\``).join(', '),
            true
          )
          .addField(
            !(
              level < this.bot.levelCache[command.conf.permLevel] &&
              command.conf.enabled
            )
              ? "<a:checksimplegif:767019089499389962> Vous avez la permission d'utiliser cette commande"
              : "<a:check_cross:767021936185442366> Vous n'avez pas la permission d'utiliser cette commande",
            '\u200b'
          );
      } else if (this.bot.aliases.has(command)) {
        command = this.bot.aliases.get(command);
        command = this.bot.commands.get(command);
        // if (level < this.bot.levelCache[command.conf.permLevel]) return;
        embed
          .addField('Nom de la commande', `\`${command.help.name}\``, true)
          .addField('Description', command.help.description, true)
          .addField(
            'Utilisation',
            `\`${this.bot.config.settings.prefix + command.help.usage}\``
          )
          .addField(
            'Autres noms de la commande de la commande',
            command.conf.aliases.map((alias) => `\`${alias}\``).join(', '),
            true
          )
          .addField(
            !(level < this.bot.levelCache[command.conf.permLevel])
              ? "<a:checksimplegif:767019089499389962> Vous avez la permission d'utiliser cette commande"
              : "<a:check_cross:767021936185442366> Vous n'avez pas la permission d'utiliser cette commande",
            '\u200b'
          );
      }
    }
    return message.channel.send(embed);
  }
}

module.exports = Help;
