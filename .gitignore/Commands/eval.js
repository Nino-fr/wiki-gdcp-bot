const { Message } = require('discord.js'),
  Command = require('../base/Command.js');

/**
 * Evalue un code JavaScript
 */
class Eval extends Command {
  constructor() {
    super({
      name: 'eval',
      description: 'Evalue un code JavaScript.',
      category: 'Système',
      usage: 'eval <code>',
      aliases: ['ev', 'evaluer'],
      permLevel: 'Administrateur',
    });
  }

  /**
   *
   * @param {Message} message
   * @param {string[]} args
   */
  async run(message, args) {
    if (!args[0])
      return message.repondre('Veuillez préciser un code à evaluer');
    let code = args.join(' ').replace(' bot', ' this.bot');
    try {
      code = code.replace(/```/g, '').replace(/js/, '');
      const evaled = eval(code);
      const clean = await this.bot.clean(evaled);
      const MAX_CHARS = 57 + clean.length;
      if (MAX_CHARS > 2000) {
        return message.channel.send(
          "L'output comprend plus de 2000 charactères. Elle sera donc envoyée sous forme de fichier.",
          { files: [{ attachment: Buffer.from(clean), name: 'output.txt' }] }
        );
      }
      return message.channel.send(
        `__**Input :**__\n \`\`\`js\n${code}\n\`\`\`\n\n__**Output :**__\n \`\`\`js\n${clean}\n\`\`\``
      );
    } catch (err) {
      err = err
        .toString()
        .replace(/`/g, '`' + String.fromCharCode(8203))
        .replace(/@/g, '@' + String.fromCharCode(8203))
        .replace(this.bot.token, 'secretToken');
      try {
        message.channel.send(
          `__**Input :**__\n \`\`\`js\n${code}\n\`\`\`\n\n__**Output :**__\n \n\`ERROR\` \`\`\`xl\n${err}\n\`\`\``
        );
      } catch {
        message.channel.send(
          "L'erreur comprend plus de 2000 charactères. Elle sera donc envoyée sous forme de fichier.",
          { files: [{ attachment: Buffer.from(err), name: 'output.txt' }] }
        );
      }
    }
  }
}

module.exports = Eval;
