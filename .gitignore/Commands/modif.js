const { Message } = require('discord.js');
const Command = require('../Base/Command.js');

class Modifier extends Command {
  constructor() {
    super({
      name: 'modifier',
      description: "Me faire modifier un message que **j'ai envoyé**",
      usage:
        "modifier  [salon optionnel] <l'ID du message à modifier> <ce qu'il faut modifier>",
      aliases: ['modif', 'change'],
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
    let argsresult;
    let mChannel = message.mentions.channels.first();

    if (mChannel) {
      if (!args.slice(1)[0])
        return message.channel.send(
          "Veuillez préciser l'ID du message à modifier"
        );
      if (!args.slice(1)[1])
        return message.channel.send(
          'Veuillez préciser le nouveau contenu du message.'
        );
      message.delete();

      argsresult = args.slice(2).join(' ');
      let msg = await mChannel.messages.fetch(args[1]);
      if (!argsresult || argsresult.trim() === '')
        return message.channel.send(
          'Veuillez préciser le nouveau contenu du message.'
        );
      await msg.edit(argsresult);
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

      if (!argsresult || argsresult.trim() === '')
        return message.channel.send(
          'Veuillez préciser le nouveau contenu du message.'
        );
      await msg.edit(argsresult, { disableMentions: 'everyone' });
    }
  }
}

module.exports = Modifier;
