const Command = require('../Base/Command.js');
const { MessageEmbed, Message } = require('discord.js');

class Intro extends Command {
  constructor() {
    super({
      name: 'presentation',
      description: 'Présente le bot et ses fonctionnalités',
      category: 'Bot',
      usage: 'presentation [commande]',
      aliases: [
        'présentation',
        'intro',
        'introduce',
        'introduire',
        'introduction',
      ],
    });
  }

  /**
   *
   * @param { Message } message La commande
   * @param { String[] } args Les args passés après la commande
   * @param { Number | String } level Le niveau de permission de l'utilisateur
   */
  async run(message) {
    const intro = new MessageEmbed()
      .setColor('BLUE')
      .setTitle('Présentation du bot')
      .setThumbnail(this.bot.user.avatarURL({ format: 'png' }))
      .setDescription(
        `Bonjour et bienvenue sur la page de présentation du bot **${this.bot.user.username}**.\nSur cette page, tu vas apprendre quelques informations utiles sur mon fonctionnement, ma création et mes fonctionnalités. C'est parti !\n`
      )
      .addField(
        'Création',
        `J'ai été créé le 31 août 2020 par <@428582719044452352> pour le serveur Discord du **Wiki Gardiens des Cités Perdues**. Depuis ce jour-là, j'ai été développé pendant trois mois (toujours par Nino) et j'ai enfin été terminé le premier novembre 2020.`
      )
      .addField(
        'Mes commandes',
        `Pour découvrir la liste de mes commandes, il faut exécuter la commande \`${this.bot.config.settings.prefix}aide\`.\nPour voir la page d'aide d'une commande en particulier, tu peux exécuter la commande \`${this.bot.config.settings.prefix}aide <le nom de la commande>\`.\nCertaines commandes possèdent ce qu'on appelle des **aliases**, c'est-à-dire des raccourcis du nom de la commande qui permet, si ce nom est trop long, d'utiliser la commande plus rapidement. Les aliases sont visibles sur la page d'aide de la commande en question.`
      )
      .addField(
        'Mes fonctionnalités',
        "Je possède plusieurs fonctionnalités spéciales comme la prévisualisation des liens Discord (lien vers un message) et des liens vers le Wiki (seulement les articles pour l'instant).\n\nVoilà, tu sais maintenant tout ce que tu as besoin de savoir pour bien m'utiliser.\nBon amusement !"
      );
    return message.channel.send(intro);
  }
}

module.exports = Intro;
