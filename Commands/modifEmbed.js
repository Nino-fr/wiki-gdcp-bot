const { Message, MessageEmbed } = require('discord.js'),
  Command = require('../Base/Command.js');

class ModifierEmbed extends Command {
  constructor() {
    super({
      name: 'modifierEmbed',
      description:
        "Me faire modifier un embed que **j'ai envoyé**. Les options :\n\ntitle(Le titre)\n\ndescription(La description = le texte en-dessous du titre)\n\ncolor(Couleur en MAJ ou couleur en hexadécimal ou en code couleur)\n\nthumb(url de l'image à mettre en haut à gauche)\n\nimg(Image à mettre sous les fields)\n\nfields({name: \"Le nom du premier field (s'affichera en gras dans l'embed)\", value: \"Sa valeur (pas en gras)\"}, ...lesautresfields)\n\nurl(URL à mettre en hyperlien sur le titre de l'embed)\n\nfooter(Texte à mettre en footer, tout en bas de l'embed en petit)\n\nauthor(Texte à mettre en auteur, tout en haut en gras, élément obligatoire pour les autres éléments de l'author)\n\nauthorimg(Image de l'author, affichée en tout petit)\n\nauthorurl(URL à mettre en hyperlien sur le texte de l'author)\n\ntimestamp() => Pour ajouter la date du jour sous le message, pouvant être raccourci en time()",
      usage:
        "modifierEmbed [salon optionnel] <l'ID du message à modifier> <ce qu'il faut modifier>",
      aliases: ['modifEmbed', 'changeEmbed', 'changEmbed', 'me'],
      guildOnly: true,
      permLevel: 'Administrateur',
      category: 'Bot',
    });
  }

  /**
   *
   * @param {Message} message
   * @param {string[]} args
   */
  async run(message, args) {
    let argsresult,
      mChannel =
        message.mentions.channels.first() ||
        message.guild.channels.cache.get(args[0]);

    if (mChannel) {
      if (!args.slice(1)[0])
        return message.channel.send(
          "Veuillez préciser l'ID du message à modifier"
        );
      if (!args.slice(1)[1])
        return message.channel.send(
          "Veuillez préciser le nouveau contenu de l'embed."
        );
      message.delete();

      argsresult = args.slice(2).join(' ');
      let msg = await mChannel.messages.fetch(args[1]);
      if (!msg.embeds[0])
        return message.channel
          .send('Ce message ne contient aucun embed')
          .then((m) => m.delete());

      if (!argsresult || argsresult.trim() === '')
        return message.channel.send(
          "Veuillez préciser le nouveau contenu de l'embed."
        );
      let title = await argsresult.match(/title\(([^\)]+)\)/i),
        author = await argsresult.match(/auth?or\(([^\)]+)\)/i),
        description = await argsresult.match(/descr?i?p?t?i?o?n?\(([^\)]+)\)/i),
        authorurl = await argsresult.match(/auth?orurl\(([^\)]+)\)/i),
        fields = await argsresult.match(/fields\(((?:(?:.(?!\}\)))+).\})\)/i),
        footer = await argsresult.match(/footer\(([^\)]+)\)/i),
        thumb = await argsresult.match(/thumbn?a?i?l?\(([^\)]+)\)/i),
        url = await argsresult.match(/url\(([^\)]+)\)/i),
        img = await argsresult.match(/img\(([^\)]+)\)/i),
        color = await argsresult.match(/color\(([^\)]+)\)/i),
        authorimg = await argsresult.match(/auth?orimg\(([^\)]+)\)/i),
        timestamp = /time(?:stamp)?\([^\)]*\)/i.test(argsresult);

      let em = new MessageEmbed(),
        oldEmbed = msg.embeds[0];

      description
        ? em.setDescription(description[1])
        : (em.description = oldEmbed.description);
      title ? em.setTitle(title[1]) : (em.title = oldEmbed.title);
      thumb ? em.setThumbnail(thumb[1]) : (em.thumbnail = oldEmbed.thumbnail);
      color ? em.setColor(color[1]) : em.setColor(oldEmbed.color);
      timestamp ? em.setTimestamp() : (em.timestamp = oldEmbed.timestamp);
      fields
        ? (fields = fields[1]
            .replace(/(\w+)(?=:)/g, '"$1"')
            .split(/(?<=\}),(?=\s*\{)/g))
        : undefined;
      fields
        ? em.addFields(fields.map((f) => JSON.parse(f)))
        : (em.fields = oldEmbed.fields);

      author
        ? em.setAuthor(
            author[1],
            authorimg ? authorimg[1] : null,
            authorurl ? authorurl[1] : null
          )
        : (em.author = oldEmbed.author);

      img ? em.setImage(img[1]) : (em.image = oldEmbed.image);

      url ? em.setURL(encodeURI(url[1])) : (em.url = oldEmbed.url);
      footer ? em.setFooter(footer[1]) : (em.footer = oldEmbed.footer);

      msg.embeds[0] = em;
      return msg.edit(msg);
    } else {
      if (!args[0])
        return message.channel.send(
          "Veuillez préciser l'ID du message à modifier"
        );
      if (!args[1])
        return message.channel.send(
          'Veuillez préciser le nouveau contenu du message.'
        );
      argsresult = args.slice(1).join(' ');
      let msg = await message.channel.messages.fetch(args[0]);
      message.delete();

      if (!msg.embeds[0])
        return message.channel
          .send('Ce message ne contient aucun embed')
          .then((m) => m.delete());

      if (!argsresult || argsresult.trim() === '')
        return message.channel.send(
          "Veuillez préciser le nouveau contenu de l'embed."
        );
      let title = await argsresult.match(/title\(([^\)]+)\)/i),
        author = await argsresult.match(/auth?or\(([^\)]+)\)/i),
        description = await argsresult.match(
          /desc(?:r?i?p?t?i?o?n?)?\(([^\)]+)\)/i
        ),
        authorurl = await argsresult.match(/auth?orurl\(([^\)]+)\)/i),
        fields = await argsresult.match(/fields\(((?:(?:.(?!\}\)))+).\})\)/i),
        footer = await argsresult.match(/footer\(([^\)]+)\)/i),
        thumb = await argsresult.match(/thumbn?a?i?l?\(([^\)]+)\)/i),
        url = await argsresult.match(/url\(([^\)]+)\)/i),
        img = await argsresult.match(/img\(([^\)]+)\)/i),
        color = await argsresult.match(/color\(([^\)]+)\)/i),
        authorimg = await argsresult.match(/auth?orimg\(([^\)]+)\)/i),
        timestamp = /time(?:stamp)?\([^\)]*\)/i.test(argsresult);

      let em = new MessageEmbed(),
        oldEmbed = msg.embeds[0];

      description
        ? (em.description = description[1])
        : (em.description = oldEmbed.description);
      title ? em.setTitle(title[1]) : (em.title = oldEmbed.title);
      thumb ? em.setThumbnail(thumb[1]) : (em.thumbnail = oldEmbed.thumbnail);
      color ? em.setColor(color[1]) : em.setColor(oldEmbed.color);
      timestamp ? em.setTimestamp() : (em.timestamp = oldEmbed.timestamp);
      fields
        ? (fields = fields[1]
            .replace(/(\w+)(?=:)/g, '"$1"')
            .split(/(?<=\}),(?=\s*\{)/g))
        : undefined;
      fields
        ? em.addFields(fields.map((f) => JSON.parse(f)))
        : (em.fields = oldEmbed.fields);

      author
        ? em.setAuthor(
            author[1],
            authorimg ? authorimg[1] : null,
            authorurl ? authorurl[1] : null
          )
        : (em.author = oldEmbed.author);

      img ? em.setImage(img[1]) : (em.image = oldEmbed.image);

      url ? em.setURL(encodeURI(url[1])) : (em.url = oldEmbed.url);
      footer ? em.setFooter(footer[1]) : (em.footer = oldEmbed.footer);

      msg.embeds[0] = em;
      return msg.edit(msg.embeds[0]);
    }
  }
}

module.exports = ModifierEmbed;
