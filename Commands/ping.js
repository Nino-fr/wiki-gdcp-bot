const Command = require('../Base/Command.js');
const { Message } = require('discord.js');

class Ping extends Command {
  constructor() {
    super({
      name: 'ping',
      description: "Latence du bot et temps de réponse de l'api Discord.",
      usage: 'ping',
      aliases: ['pong'],
      category: 'Bot',
    });
  }

  /**
   *
   * @param {Message} message
   */
  async run(message) {
    try {
      const msg = await message.channel.send(
        '<:ping:756850599416299611> Ping!'
      );
      msg.edit(
        `🏓 Pong ! \nLatence du bot : \`${
          msg.createdTimestamp - message.createdTimestamp
        }\`ms.  \nLatence de l'api : \`${Math.round(this.bot.ws.ping)}\`ms.`
      );
    } catch (e) {
      console.log(e);
    }
  }
}

module.exports = Ping;
