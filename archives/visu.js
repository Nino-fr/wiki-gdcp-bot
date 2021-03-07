const { Message } = require('discord.js');
const Command = require('../Base/Command');

/**
 * Activer ou désactiver les différentes prévisualisations des liens
 */
class Visu extends Command {
  constructor() {
    super({
      name: 'prévisualisation',
      description:
        'Activer ou désactiver les différentes prévisualisations des liens',
      usage: 'prévisualisation <Discord|Wattpad|YouTube|Wiki> <on|off>',
      category: 'Système',
      permLevel: 'Administrateur',
      aliases: [
        'visu',
        'prévisu',
        'previsu',
        'previsualisation',
        'aperçu',
        'apercu',
      ],
      enabled: false,
    });
  }

  /**
   *
   * @param {Message} message La commande
   * @param {string[]} args Les arguments passés dans la commande
   */
  async run(message, args) {
    if (args[0] && args[1]) {
      switch (args[0].toLowerCase()) {
        case 'discord':
          if (args[1].toLowerCase() === 'on') {
            if (this.bot.discordVisu === true)
              return message.repondre(
                'La prévisualisation des liens Discord est déjà activée !'
              );
            this.bot.discordVisu = true;
            return message.repondre(
              'La prévisualisation des liens Discord est désormais activée !'
            );
          } else if (args[1].toLowerCase() === 'off') {
            if (this.bot.discordVisu === false)
              return message.repondre(
                'La prévisualisation des liens Discord est déjà désactivée !'
              );
            this.bot.discordVisu = false;
            return message.repondre(
              'La prévisualisation des liens Discord est désormais désactivée !'
            );
          } else
            return message.repondre(
              "Utilisation de la commande incorrecte, veuillez l'utiliser ainsi : `" +
                prefix +
                'visu <Discord|Wattpad|YouTube|Wiki> <on|off>`'
            );
        case 'wattpad':
          if (args[1].toLowerCase() === 'on') {
            if (this.bot.wattyVisu === true)
              return message.repondre(
                'La prévisualisation des liens Wattpad est déjà activée !'
              );
            this.bot.wattyVisu = true;
            return message.repondre(
              'La prévisualisation des liens Wattpad est désormais activée !'
            );
          } else if (args[1].toLowerCase() === 'off') {
            if (this.bot.wattyVisu === false)
              return message.repondre(
                'La prévisualisation des liens Wattpad est déjà désactivée !'
              );
            this.bot.wattyVisu = false;
            return message.repondre(
              'La prévisualisation des liens Wattpad est désormais désactivée !'
            );
          } else
            return message.repondre(
              "Utilisation de la commande incorrecte, veuillez l'utiliser ainsi : `" +
                prefix +
                'visu <Discord|Wattpad|YouTube|Wiki> <on|off>`'
            );
        case 'youtube':
          if (args[1].toLowerCase() === 'on') {
            if (this.bot.YTVisu === true)
              return message.repondre(
                'La prévisualisation des liens YouTube est déjà activée !'
              );
            this.bot.YTVisu = true;
            return message.repondre(
              'La prévisualisation des liens YouTube est désormais activée !'
            );
          } else if (args[1].toLowerCase() === 'off') {
            if (this.bot.YTVisu === false)
              return message.repondre(
                'La prévisualisation des liens YouTube est déjà désactivée !'
              );
            this.bot.YTVisu = false;
            return message.repondre(
              'La prévisualisation des liens YouTube est désormais désactivée !'
            );
          } else
            return message.repondre(
              "Utilisation de la commande incorrecte, veuillez l'utiliser ainsi : `" +
                prefix +
                'visu <Discord|Wattpad|YouTube|Wiki> <on|off>`'
            );
        case 'wiki':
          if (args[1].toLowerCase() === 'on') {
            if (this.bot.wikiVisu === true)
              return message.repondre(
                'La prévisualisation des liens vers le Wiki est déjà activée !'
              );
            this.bot.wikiVisu = true;
            return message.repondre(
              'La prévisualisation des liens vers le Wiki est désormais activée !'
            );
          } else if (args[1].toLowerCase() === 'off') {
            if (this.bot.wikiVisu === false)
              return message.repondre(
                'La prévisualisation des liens vers le Wiki est déjà désactivée !'
              );
            this.bot.wikiVisu = false;
            return message.repondre(
              'La prévisualisation des liens vers le Wiki est désormais désactivée !'
            );
          } else
            return message.repondre(
              "Utilisation de la commande incorrecte, veuillez l'utiliser ainsi : `" +
                prefix +
                'visu <Discord|Wattpad|YouTube|Wiki> <on|off>`'
            );
        default:
          return message.repondre(
            "Utilisation de la commande incorrecte, veuillez l'utiliser ainsi : `" +
              prefix +
              'visu <Discord|Wattpad|YouTube|Wiki> <on|off>`'
          );
      }
    } else {
      return message.repondre(
        "Utilisation de la commande incorrecte, veuillez l'utiliser ainsi : `" +
          this.bot.config.settings.prefix +
          'visu <Discord|Wattpad|YouTube|Wiki> <on|off>`'
      );
    }
  }
}

module.exports = Visu;
