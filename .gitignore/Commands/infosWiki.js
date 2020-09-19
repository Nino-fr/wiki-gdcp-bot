const Command = require('../Base/Command');
const { MessageEmbed, Message } = require('discord.js');
const wiki = require('../Wiki/gdcp');

/**
 * Obtenir des infos sur le Wiki
 */
class Infos extends Command {
  constructor() {
    super({
      name: 'infosWiki',
      description: 'Obtenir des infos sur le Wiki',
      usage: 'infosWiki',
      aliases: ['infos', 'informations', 'wiki', 'wikiInfos'],
    });
  }

  /**
   *
   * @param {Message} message
   */
  async run(message) {
    const embed = new MessageEmbed()
      .setColor('BLUE')
      .setTitle('Informations sur le wiki ' + wiki.name)
      .setDescription(
        `“OK... Ce n'est pas facile à dire, donc je vais être direct : nous ne sommes pas humains, Sophie.”\n  — Fitz Vacker, Gardiens des Cités Perdues tome 1\n\n> Gardiens des Cités Perdues est une saga littéraire écrite par Shannon Messenger racontant les péripéties de Sophie Foster et ses amis. Elle découvre qu'elle n'est pas humaine, mais elfe. Un nouveau monde regorgeant de mystères s'offre alors à elle, le début d'une nouvelle vie...\n\n[Plus d'informations](https://discord.com/channels/719085354514251877/749179236215947354/749534090713104414)`
      )
      .setThumbnail(this.bot.user.avatarURL({ format: 'png' }))
      .addField(
        'Naviguer',
        '[Personnages](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Cat%C3%A9gorie:Personnages)\n[Familles](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Cat%C3%A9gorie:Famille)\n[Pouvoirs](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Cat%C3%A9gorie:Pouvoirs?action=edit&redlink=1)\n[Lieux](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Cat%C3%A9gorie:Lieux)\n[Conseillers](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Cat%C3%A9gorie:Conseiller)\n[Compagnons](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Cat%C3%A9gorie:Compagnon)\n[Théories](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Cat%C3%A9gorie:Th%C3%A9ories)\n[Aide](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Aide)'
      )
      .addField('Pages populaires', wiki.popularPages)
      .addField('Modifications totales actuelles', wiki.totalChanges, true)
      .addField(
        'Fondateur',
        '[Lou0420](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Utilisateur:Lou0420)',
        true
      )
      .addField('Pages au total', wiki.totalPages, true)
      .addField("Nombre d'utilisateurs", wiki.users, true);
    return message.channel.send(embed);
  }
}

module.exports = Infos;
