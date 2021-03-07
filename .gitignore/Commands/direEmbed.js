const { Message, MessageEmbed } = require('discord.js');
const Command = require('../Base/Command.js');

class SayEmbed extends Command {
  constructor() {
    super({
      name: 'direEmbed',
      description:
        "Me faire dire un message au choix dans un embed avec des options :\n\n+title(Le titre)\n\n+color(Couleur en MAJ ou couleur en hexadécimal ou en code couleur)\n\n+thumb(url de l'image à mettre en haut à gauche)\n\n+img(Image à mettre sous les fields)\n\n+fields({name: \"Le nom du premier field (s'affichera en gras dans l'embed)\", value: \"Sa valeur (pas en gras)\"}, ...lesautresfields)\n\n+url(URL à mettre en hyperlien sur le titre de l'embed)\n\n+footer(Texte à mettre en footer, tout en bas de l'embed en petit)\n\n+author(Texte à mettre en auteur, tout en haut en gras, élément obligatoire pour les autres éléments de l'author)\n\n+authorimg(Image de l'author, affichée en tout petit)\n\n+authorurl(URL à mettre en hyperlien sur le texte de l'author)\n\n+timestamp() => Pour ajouter la date du jour sous le message, pouvant être raccourci en +time()",
      usage: "direEmbed [salon optionnel] <ce qu'il faut dire>",
      aliases: ['sayembed', 'repeatembed', 'se'],
      guildOnly: true,
      permLevel: 'Bot Admin',
    });
  }

  /**
   * Faire dire un message au choix dans un embed avec des options
   * @param {Message} message
   * @param {string[]} args
   */
  async run(message, args) {
    try {
      let argsresult;
      let mChannel = message.mentions.channels.first();

      await message.delete();

      let title = await message.content.match(/\+title\(([^\)]+)\)/i),
        author = await message.content.match(/\+auth?or\(([^\)]+)\)/i),
        authorurl = await message.content.match(/\+auth?orurl\(([^\)]+)\)/i),
        fields = await message.content.match(
          /\+fields\(((?:(?:.(?!\}\)))+).\})\)/i
        ),
        footer = await message.content.match(/\+footer\(([^\)]+)\)/i),
        thumb = await message.content.match(/\+thumb\(([^\)]+)\)/i),
        url = await message.content.match(/\+url\(([^\)]+)\)/i),
        img = await message.content.match(/\+img\(([^\)]+)\)/i),
        color = await message.content.match(/\+color\(([^\)]+)\)/i),
        authorimg = await message.content.match(/\+auth?orimg\(([^\)]+)\)/i),
        timestamp = /\+time(?:stamp)?\([^\)]*\)/i.test(message.content);

      if (mChannel) {
        argsresult = args.slice(1).join(' ');
        argsresult = argsresult
          .replace(/\+title\(([^\)]+)\)/i, '')
          .replace(/\+auth?or\(([^\)]+)\)/, '')
          .replace(/\+auth?orurl\(([^\)]+)\)/, '')
          .replace(/\+auth?orimg\(([^\)]+)\)/, '')
          .replace(/\+fields\(((?:(?:.(?!\}\)))+).\})\)/i, '')
          .replace(/\+footer\(([^\)]+)\)/i, '')
          .replace(/\+thumb\(([^\)]+)\)/i, '')
          .replace(/\+url\(([^\)]+)\)/i, '')
          .replace(/\+img\(([^\)]+)\)/i, '')
          .replace(/\+color\(([^\)]+)\)/i, '')
          .replace(/\+time(?:stamp)?\([^\)]*\)/i, '');

        if (!argsresult)
          return message.channel.send('Veuillez renseigner au moins un champ');
        let em = new MessageEmbed();
        em.description = argsresult;
        title ? em.setTitle(title[1]) : undefined;
        thumb ? em.setThumbnail(thumb[1]) : undefined;
        color ? em.setColor(color[1]) : em.setColor('#ff3300');
        timestamp ? em.setTimestamp() : undefined;
        fields
          ? (fields = fields[1]
              .replace(/(\w+)(?=:)/g, '"$1"')
              .split(/(?<=\}),(?=\s*\{)/g))
          : undefined;
        fields ? em.addFields(fields.map((f) => JSON.parse(f))) : undefined;

        author
          ? em.setAuthor(
              author[1],
              authorimg ? authorimg[1] : null,
              authorurl ? authorurl[1] : null
            )
          : undefined;
        img ? em.setImage(img[1]) : undefined;
        url ? em.setURL(encodeURI(url[1])) : undefined;
        footer ? em.setFooter(footer[1]) : undefined;

        mChannel.send(em);
      } else {
        argsresult = args.join(' ');
        argsresult = argsresult
          .replace(/\+title\(([^\)]+)\)/i, '')
          .replace(/\+auth?or\(([^\)]+)\)/, '')
          .replace(/\+auth?orurl\(([^\)]+)\)/, '')
          .replace(/\+auth?orimg\(([^\)]+)\)/, '')
          .replace(/\+fields\(((?:(?:.(?!\}\)))+).\})\)/i, '')
          .replace(/\+footer\(([^\)]+)\)/i, '')
          .replace(/\+thumb\(([^\)]+)\)/i, '')
          .replace(/\+url\(([^\)]+)\)/i, '')
          .replace(/\+img\(([^\)]+)\)/i, '')
          .replace(/\+color\(([^\)]+)\)/i, '')
          .replace(/\+time(?:stamp)?\([^\)]*\)/i, '');

        if (!argsresult)
          return message.channel.send('Veuillez préciser un message à répéter');
        let em = new MessageEmbed();
        em.description = argsresult;
        title ? em.setTitle(title[1]) : undefined;
        thumb ? em.setThumbnail(thumb[1]) : undefined;
        color ? em.setColor(color[1]) : em.setColor('#ff3300');
        timestamp ? em.setTimestamp() : undefined;
        fields
          ? (fields = fields[1]
              .replace(/(\w+)(?=:)/g, '"$1"')
              .split(/(?<=\}),(?=\s*\{)/g))
          : undefined;
        fields ? em.addFields(fields.map((f) => JSON.parse(f))) : undefined;

        author
          ? em.setAuthor(
              author[1],
              authorimg ? authorimg[1] : null,
              authorurl ? authorurl[1] : null
            )
          : undefined;
        img ? em.setImage(img[1]) : undefined;
        url ? em.setURL(encodeURI(url[1])) : undefined;

        footer ? em.setFooter(footer[1]) : undefined;

        message.channel.send(em);
      }
    } catch (err) {
      console.log(err);
      return message.channel.send(
        ":warning: Une erreur est survenue durant l'exécution de la commande, veuillez réessayer en vérifiant que tous les champs sont rentrés correctement et qu'aucune erreur n'est présente puis réessayez."
      );
    }
  }
}

module.exports = SayEmbed;
