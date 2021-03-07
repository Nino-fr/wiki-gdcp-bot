const { Message } = require('discord.js');
const Command = require('../Base/Command'),
  translate = require('translate-google');

class Translate extends Command {
  constructor() {
    super({
      name: 'traduire',
      description:
        "Traduire un texte au choix de l'anglais vers le français via Google Traduction",
      usage: 'traduire <texte>',
      aliases: ['translate', 'trans', 'trad', 'googleTrad', 'googleTrans'],
      enabled: true,
    });
  }

  /**
   *
   * @param {Message} message
   * @param {string[]} args
   */
  async run(message, args) {
    console.log(translate.getCode);

    translate(args.join(' '), { from: 'en', to: 'fr' })
      .then((res) => {
        const translated = res;
        if (translated === '')
          return message.channel.send(
            "Une erreur est survenue durant l'exécution de la commande, veuillez réessayer ou contacter mon créateur **Nino#3670**"
          );
        if (translated.length <= 850)
          return message.channel.send({
            embed: {
              title: `<:googletrans:763364807880474634> Traduction de l'anglais vers le français`,
              description: `**__Anglais__**\n\n${args.join(
                ' '
              )}\n\n**__Français__**\n\n${translated}`,
            },
          });

        let toBuffer = `ANGLAIS :\n\n${args.join(
          ' '
        )}\n\nFRANCAIS :\n\n${translated}`;

        if (translated.length > 900)
          return message.channel.send(
            'Le résultat de la traduction était trop grand et sera donc envoyé sous forme de fichier nommé `traduction.txt`',
            {
              files: [
                {
                  attachment: Buffer.from(toBuffer),
                  name: 'traduction.txt',
                },
              ],
            }
          );
      })
      .catch((err) => console.log(err));
  }
}

module.exports = Translate;
