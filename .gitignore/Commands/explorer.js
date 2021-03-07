const Command = require('../Base/Command'),
  { MessageEmbed, Message } = require('discord.js'),
  { writeFile } = require('fs');

/**
 * Explorer le Wiki
 */
class Explorer extends Command {
  constructor() {
    super({
      name: 'explorer',
      description: 'Explorer le Wiki',
      usage: 'explorer',
      aliases: ['explore', 'exp', 'aperçu', 'apercu', 'preview'],
      guildOnly: true,
    });
  }

  /**
   *
   * @param {Message} message
   */
  async run(message) {
    const embed = new MessageEmbed()
      .setColor('BLUE')
      .setTitle('Explorer')
      .setDescription(
        `Cliquez sur les différentes réactions pour explorer les pages du Wiki Gardiens des Cités Perdues !\n\n:one: **Wiki**\n:two: **La série**\n:three: **Les personnages**\n:four: **L'Univers**`
      )
      .setThumbnail(this.bot.user.avatarURL({ format: 'png' }));

    let msg = await message.channel.send(
      '<a:chargement:756866883642458162> Chargement... '
    );

    await msg.react('⬅️').then(() =>
      msg.react('1️⃣').then(() =>
        msg
          .react('2️⃣')
          .then(() =>
            msg
              .react('3️⃣')
              .then(() => msg.react('4️⃣').then(() => msg.edit('', embed)))
              .catch(console.error)
          )
          .catch(console.error)
      )
    );
  }
}

module.exports = Explorer;
