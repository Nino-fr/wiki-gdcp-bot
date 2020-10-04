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
    });
  }

  async run(message, args) {
    translate(args.join(' '), { from: 'en', to: 'fr' })
      .then((res) => message.channel.send(res))
      .catch((err) => console.log(err));
  }
}

module.exports = Translate;
