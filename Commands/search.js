const Command = require('../Base/Command.js');
const { Message } = require('discord.js');

/**
 * Rechercher dans les articles du wiki
 */
class Search extends Command {
  constructor() {
    super({
      name: 'recherche',
      description:
        'Rechercher dans les articles du wiki (vous pouvez ajouter des filtres différents à la recherche pour rechercher plus précisément : `+utilisateurs` pour rechercher dans les utilisateurs, `+commentaires` pour rechercher dans les commentaires, `+blog` pour rechercher dans les blogs des utilisateurs, `+discusBlog` pour rechercher dans les commentaires des blogs, `+fichiers` pour rechercher dans les fichiers, `+mur` pour rechercher dans les murs, `+catégorie` pour rechercher dans les catégories, `+posts` pour rechercher dans les posts du  DE ou encore `+tout` pour rechercher dans tout le wiki)',
      usage: "recherche <ce qu'il faut rechercher> [+filtre]",
      aliases: [
        'rechercher',
        'search',
        'searchWiki',
        'searchGDCP',
        'searchWikiGDCP',
      ],
    });
  }

  /**
   *
   * @param {Message} message
   * @param {string[]} args
   */
  async run(message, args) {
    try {
      const wiki = this.bot.wiki;
      if (!args[0] || args.join(' ') === '')
        return message.repondre("Veuillez préciser ce qu'il faut rechercher");
      if (/\+[^\s]+/.test(args.join(' '))) {
        if (args.join(' ').match(/\+[^\s]+/g)[1])
          return message.repondre(
            '<a:check_cross:767021936185442366> Vous ne pouvez pas ajouter plusieurs filtres de recherche. Un seul filtre est autorisé.'
          );
        const toSearch = args.join(' ').replace(/\+[^\s]+/g, '');
        const filter = args.join(' ').match(/\+([^\s]+)/)[1];
        await wiki
          .search(toSearch, filter)
          .then((result) =>
            result !== undefined
              ? message.repondre(result)
              : message.repondre('Aucun résultat trouvé')
          );
      } else {
        await wiki
          .search(args.join(' '))
          .then((res) =>
            res !== undefined
              ? message.repondre(res)
              : message.repondre('Aucun résultat trouvé')
          );
      }
    } catch (err) {
      console.log(err);
      message.repondre({
        embed: {
          title: 'Une erreur est survenue',
          description:
            ':warning: Une erreur est survenue avec la commande. Si cette erreur se reproduit, veuillez contacter mon créateur <@428582719044452352>',
          color: '#f94343',
        },
      });
    }
  }
}

module.exports = Search;
