const { Message } = require('discord.js');
const Command = require('../base/Command.js');

class Say extends Command {
  constructor() {
    super({
      name: 'dire',
      description: 'Me faire dire un message au choix',
      usage: "dire  [salon optionnel] <ce qu'il faut dire>",
      aliases: ['say', 'repeat'],
      guildOnly: true,
      permLevel: 'Administrateur',
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

    message.delete();
    if (mChannel) {
      argsresult = args.slice(1).join(' ');
      if (!argsresult)
        return message.repondre(
          message,
          'Veuillez préciser un message à répéter'
        );
      mChannel.send(argsresult, { disableMentions: 'everyone' });
    } else {
      argsresult = args.join(' ');
      if (!argsresult)
        return message.repondre(
          message,
          'Veuillez préciser un message à répéter'
        );
      message.channel.send(argsresult, { disableMentions: 'everyone' });
    }
  }
}

module.exports = Say;
