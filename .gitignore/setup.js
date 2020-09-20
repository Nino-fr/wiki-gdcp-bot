'use strict';

const { getValues } = require('./fonctions');

const { Client, Message, Collection } = require('discord.js'),
  path = require('path'),
  klaw = require('klaw'),
  { promisify } = require('util'),
  readdir = promisify(require('fs').readdir),
  wiki = require('./Wiki/gdcp');

/**
 * La classe qui permettra de construire le bot
 */
class WikiBot extends Client {
  /**
   *
   * @param {import("discord.js").ClientOptions} options
   */
  constructor(options) {
    super(options);

    this.config = require('./config');

    this.logger = require('./Logger');
    this.commands = new Collection();
    this.aliases = new Collection();
    this.settings = new Collection();
    this.owner = this.users.cache.get('428582719044452352');
    this.admins = this.config.admins;
    this.discordVisu = true;
    this.wattyVisu = true;
    this.YTVisu = true;
    this.wikiVisu = true;
    this.visus = [this.discordVisu, this.wattyVisu, this.YTVisu, this.wikiVisu];
    this.wiki = wiki;
    this.wait = promisify(setTimeout);
  }

  /**
   * Le niveau de permission de l'auteur du message
   * @param {Message} message Le message
   */
  permlevel(message) {
    let permlvl = 0;

    const permOrder = this.config.permLevels
      .slice(0)
      .sort((p, c) => (p.level < c.level ? 1 : -1));

    while (permOrder.length) {
      const currentLevel = permOrder.shift();
      if (message.guild && currentLevel.guildOnly) continue;
      if (currentLevel.check(message)) {
        permlvl = currentLevel.level;
        break;
      }
    }
    return permlvl;
  }

  /**
   * Charger une commande
   * @param {String} commandPath Le chemin vers le fichier de la commande.
   * @param {String} commandName Le nom de la commande.
   */
  loadCommand(commandPath, commandName) {
    try {
      const props = new (require(`${commandPath}${path.sep}${commandName}`))(
        this
      );
      this.logger.log(`Commande ${props.help.name} chargée.`, 'log');
      props.conf.location = commandPath;
      if (props.init) {
        props.init(this);
      }
      this.commands.set(props.help.name.toLowerCase(), props);
      props.conf.aliases.forEach((alias) => {
        this.aliases.set(alias.toLowerCase(), props.help.name.toLowerCase());
      });
      return false;
    } catch (e) {
      return `Impossible de load la commande ${commandName}: ${e}`;
    }
  }
  /**
   * Désactiver/décharger une commande
   * @param {String} commandPath Le chemin vers le fichier de la commande.
   * @param {String} commandName Le nom de la commande.
   */
  async unloadCommand(commandPath, commandName) {
    let command;
    if (this.commands.has(commandName)) {
      command = this.commands.get(commandName);
    } else if (this.aliases.has(commandName)) {
      command = this.commands.get(this.aliases.get(commandName));
    }
    if (!command)
      return `La commande \`${commandName}\` n'existe apparemment pas ! Veuillez réessayer.`;

    if (command.shutdown) {
      await command.shutdown(this);
    }
    delete require.cache[
      require.resolve(`${commandPath}${path.sep}${commandName}.js`)
    ];
    return false;
  }

  /**
   * Retirer les mentions everyone et le token du bot d'un texte/code
   * @param {*} text Le texte/code à clean
   * @returns {Promise<string>}
   */
  async clean(text) {
    if (text && text.constructor.name == 'Promise') text = await text;
    if (typeof text !== 'string')
      text = require('util').inspect(text, { depth: 1 });

    text = text
      .replace(/`/g, '`' + String.fromCharCode(8203))
      .replace(/@/g, '@' + String.fromCharCode(8203))
      .replace(this.token, 'secretToken');

    return text;
  }
  /**
   * Attendre une réponse à une `question`. Seul **un** utilisateur peut répondre : l'auteur du message.
   * Raccourci de la méthode `awaitMessages()`
   * @param {typeof Message} msg Le message
   * @param {number} [limit=60000] Le temps maximum d'attente
   */
  async awaitReply(msg, temps = 60000) {
    const filter = (m) => m.author.id === msg.author.id;
    try {
      const collected = await msg.channel.awaitMessages(filter, {
        max: 1,
        time: temps,
        errors: ['time'],
      });
      return collected.first().content;
    } catch (e) {
      return false;
    }
  }
}

/**
 * Le bot du Wiki GDCP
 */
const bot = new WikiBot();

// Initialisons les commandes et événements.

const init = async () => {
  klaw('./Commands').on('data', (item) => {
    const cmdFile = path.parse(item.path);
    if (!cmdFile.ext || cmdFile.ext !== '.js') return;
    const response = bot.loadCommand(
      cmdFile.dir,
      `${cmdFile.name}${cmdFile.ext}`
    );

    if (response) bot.logger.error(response);
  });

  const evtFiles = await readdir('./Events');
  bot.logger.log(
    `Un total de ${evtFiles.length + 1} events ont été chargés.`,
    'log'
  );
  evtFiles.forEach((file) => {
    const eventName = file.split('.')[0];
    bot.logger.log(`Event ${eventName} chargé`);
    const event = new (require(`./Events/${file}`))(bot);
    bot.on(eventName, (...args) => event.run(...args));
    delete require.cache[require.resolve(`./Events/${file}`)];
  });

  bot.levelCache = {};
  for (let i = 0; i < bot.config.permLevels.length; i++) {
    const thisLevel = bot.config.permLevels[i];
    bot.levelCache[thisLevel.name] = thisLevel.level;
  }

  bot.login(bot.config.token);
};

init();

bot
  .on('disconnect', () =>
    bot.logger.warn('Le bot est en train de se déconnecter...')
  )
  .on('reconnecting', () =>
    bot.logger.log('Le bot est en train de se reconnecter...', 'log')
  )
  .on('error', (e) => bot.logger.error(e))
  .on('warn', (info) => bot.logger.warn(info))
  .on('message', (message) => {
    const event = new (require('./fonctionnalités'))(bot);
    event.run(message);
  });

String.prototype.correctCase = function () {
  if (!this.includes('.'))
    return this.trim().charAt(0).toUpperCase() + this.slice(1);
  return this.replace(/ *\. */g, function (txt) {
    return '. ' + txt.replace('.', '').trim().charAt(0).toUpperCase() + ' ';
  });
};

Array.prototype.random = function () {
  return this[Math.floor(Math.random() * this.length)];
};

Message.prototype.repondre = function (msg) {
  return this.channel.send(msg);
};

String.prototype.correctString = function () {
  const ascii = require('./ascii.json');
  let toChange,
    str = this;

  try {
    this.match(/&#x?\d+;/g).forEach((ress) => {
      toChange = ress.match(/\d+/)[0];
      if (parseInt(toChange) < 32) {
        toChange = getValues(ascii, toChange);
      }

      str = str.replace(/&#x?\d+;/, String.fromCharCode(parseInt(toChange)));
    });
  } catch {}
  return str

    .replace(/<\/?ul>/gis, '')
    .replace(/<li>((?:.(?!\/li>))+)<\/li>\s*/gis, ' - $1\n')
    .replace(/&egrave;/gi, 'è')
    .replace(/&eacute;/gi, 'é')
    .replace(/&ecirc;/gi, 'ê')
    .replace(/&euml;/gi, 'ë')
    .replace(/&auml;/gi, 'ä')
    .replace(/&uuml;/gi, 'ü')
    .replace(/&iuml;/gi, 'ï')
    .replace(/&quot;/gi, '"')
    .replace(/&ccedil;/gi, 'ç')
    .replace(/&aacute;/gi, 'à')
    .replace(/&agrave;/gi, 'á')
    .replace(/&acirc;/gi, 'â')
    .replace(/&uacute;/gi, 'ú')
    .replace(/&ugrave;/gi, 'ù')
    .replace(/&ucirc;/gi, 'û')
    .replace(/&iacute;/gi, 'í')
    .replace(/<[^>]+>/gi, '')
    .replace(/\&amp\;quot\;/gi, '"')
    .replace(/\&amp\;/gi, '&')
    .replace(/\&quot;/gi, '"');
};

String.prototype.correctDate = function () {
  let day = this.match(/(?<=\/)\d+/);
  let year = this.match(/(?<=\/)\d{4}/);
  let month = this.match(/\d+/);
  return [day, month, year].join('/');
};

// Affichons en console les différentes données d'utilisation du script.
const used = process.memoryUsage().heapUsed / 1024 / 1024;
console.log(
  `Le script utilise plus ou moins ${Math.round(used * 100) / 100} MB`
);

const use = process.memoryUsage();
for (let key in use) {
  console.log(`${key} ${Math.round((use[key] / 1024 / 1024) * 100) / 100} MB`);
}

// Affichons en console la liste des packages installés.

const packages = require(path.dirname(require.main.filename) + '/package.json');

let dependencies = Object.keys(packages.dependencies);
let result = '';
for (let i = 0; i < dependencies.length; i++) {
  let dependency = dependencies[i];
  result += dependency + ' - ' + packages['dependencies'][dependency] + '\n';
}
console.log(result);

module.exports = bot;

const alf = new Client();

alf.login('NzU3MjEyMzM1ODI2OTI3Njg3.X2dG8Q.CTwEGgzl_5EXpu3LzFjntL-XF2g');

alf.on('message', async (message) => {
  if (message.author.id !== '428582719044452352') return;
  if (message.content.toLowerCase().startsWith('a:')) {
    let toRepl = message.content.slice('a:'.length);
    message.delete();
    return message.channel.send(toRepl);
  }
});

alf.on('ready', () => {
  alf.user.setActivity('le monde à côté de Nino', { type: 'WATCHING' });
  bot.logger.log('Alf prêt !', 'ready');
});
