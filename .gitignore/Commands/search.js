const Command = require("../base/Command.js");
const { Message } = require("discord.js");
const wiki = require("../Wiki/gdcp.js");

/**
 * Rechercher dans les articles du wiki
 */
class Search extends Command {
  constructor() {
    super({
      name: "search",
      description:
        "Rechercher dans les articles du wiki (ajoutez +users pour rechercher dans les utilisateurs ou +commentaires pour rechercher dans les commentaires ou encore +all pour rechercher dans tout le wiki)",
      usage: "search <ce qu'il faut rechercher> [+users | +commentaires]",
      aliases: ["searchWiki", "searchGDCP", "searchWikiGDCP"],
      category: "Gardiens des cités perdues",
    });
  }

  /**
   *
   * @param {Message} message
   * @param {string[]} args
   */
  async run(message, args) {
    try {
      if (!args[0] || args.join(" ") === "")
        return message.repondre("Veuillez préciser ce qu'il faut rechercher");
      if (/\+\s*[^\s]+/.test(args.join(" "))) {
        const toSearch = args.join(" ").replace(/\+\s*[^\s]+/g, "");
        const filter = args.join(" ").match(/\+\s*([^\s]+)/)[1];
        await wiki
          .search(toSearch, filter)
          .then((result) => message.repondre(result));
      } else {
        await wiki
          .search(args.join(" "))
          .then((res) =>
            res !== undefined
              ? message.repondre(res)
              : message.repondre("Aucun résultat trouvé")
          );
      }
    } catch (err) {
      message.repondre(err.message);
      console.log(err.message, err.stack);
    }
  }
}

module.exports = Search;
