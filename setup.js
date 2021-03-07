'use strict';

const { getValues } = require('./fonctions');

const { Client, Message, Collection, MessageEmbed } = require('discord.js'),
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
   * @param {import('discord.js').ClientOptions} ClientOptions
   */
  constructor(ClientOptions) {
    super(ClientOptions);

    this.config = require('./config');
    this.visus = require('./settings.json');
    this.logger = require('./Logger');

    this.commands = new Collection();
    this.aliases = new Collection();
    this.settings = new Collection();
    this.owner = this.users.cache.get('428582719044452352');
    this.admins = this.config.admins;
    this.discordVisu = this.visus.discordVisu;
    this.wattyVisu = this.visus.wattyVisu;
    this.YTVisu = this.visus.wikiVisu;
    this.wikiVisu = this.visus.ytVisu;

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
const bot = new WikiBot({
  partials: ['REACTION', 'MESSAGE', 'USER', 'CHANNEL', 'GUILD_MEMBER'],
});

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

bot.on('message', (message) => {
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

const alf = new Client({ partials: ['MESSAGE', 'REACTION', 'USER'] });

alf.login('secretToken');

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
  alf.user.setStatus('idle');
  bot.alf = alf;
  bot.logger.log('Alf prêt !', 'ready');
});

bot.on('message', async (message) => {
  try {
    if (
      message.channel.id === '790932476439822336' &&
      message.author.id !== bot.user.id
    ) {
      let authorRoles = message.member.roles.cache.array(),
        content = message.content;
      if (content.startsWith('>')) content = '\n' + content;

      if (content.length > 1600) {
        let content1 = content.slice(0, 1500),
          content2 = content.slice(1500);

        let isAdmin = false,
          isMod = false;
        await authorRoles.forEach((r) => {
          if (r.name.toLowerCase().includes('administrateur')) {
            isAdmin = true;
          }
        });
        await authorRoles.forEach((r) => {
          if (r.name.toLowerCase().includes('modérateur')) {
            isMod = true;
          }
        });
        let msg = `**(${
          isAdmin ? 'Administrateur' : isMod ? 'Modérateur' : 'Membre'
        }) ${
          message.member.nickname
            ? message.member.nickname
            : message.author.username
        } :** ${content1}`;

        bot.channels.cache
          .get('790898364757049345')
          .send(msg)
          .then((m) => m.channel.send(content2));
      } else {
        let isAdmin = false,
          isMod = false;
        await authorRoles.forEach((r) => {
          if (r.name.toLowerCase().includes('administrateur')) {
            isAdmin = true;
          }
        });
        await authorRoles.forEach((r) => {
          if (r.name.toLowerCase().includes('modérateur')) {
            isMod = true;
          }
        });

        let msg = `**(${
          isAdmin ? 'Administrateur' : isMod ? 'Modérateur' : 'Membre'
        }) ${
          message.member.nickname
            ? message.member.nickname
            : message.author.username
        } :** ${content}`;

        if (message.attachments.first()) {
          let fichiers = [];
          let ind = 0;
          message.attachments.forEach((att) => {
            fichiers.push(att);
            ind += 1;
          });
          bot.channels.cache
            .get('790898364757049345')
            .send(msg, { files: fichiers });
        } else {
          bot.channels.cache.get('790898364757049345').send(msg);
        }
      }
    } else if (
      message.channel.id === '790898364757049345' &&
      message.content !== '' &&
      message.author.id !== bot.user.id
    ) {
      let msg = message.content;
      if (message.attachments.first()) {
        let fichiers = [];
        let ind = 0;
        message.attachments.forEach((att) => {
          fichiers.push(att);
          ind += 1;
        });
        bot.channels.cache
          .get('790932476439822336')
          .send(msg, { files: fichiers });
      } else {
        bot.channels.cache.get('790932476439822336').send(msg);
      }
    }
  } catch {}
});

bot.on('messageReactionAdd', async (reaction, user) => {
  if (reaction.partial) await reaction.fetch();
  if (user.partial) await user.fetch();

  if (
    !reaction.message.embeds[0] &&
    user.id !== bot.user.id &&
    reaction.message.author.id === bot.user.id
  ) {
    return reaction.users.remove(user);
  }

  if (reaction.message.embeds[0]) {
    if (reaction.message.partial) await reaction.message.fetch();

    let rTab = reaction.message.reactions.cache
      .array()
      .map((r) => r.emoji.name);

    if (
      rTab.includes('1️⃣') &&
      rTab.includes('2️⃣') &&
      rTab.includes('3️⃣') &&
      !rTab.includes('*️⃣') &&
      reaction.message.embeds[0].title.trim() !==
        'Quel est le dernier tome que vous avez terminé ?'
    ) {
      let msg = reaction.message,
        newEmbed = new MessageEmbed(msg.embeds[0]).setColor('BLUE');
      await newEmbed.spliceFields(0, 6);
      newEmbed.setTimestamp();
      if (reaction.emoji.name === '1️⃣') {
        if (newEmbed.description.startsWith('Cliquez')) {
          newEmbed
            .setDescription(
              'Voici la catégorie *Wiki*. Fais maintenant ton choix entre ces catégories :\n\n:one: **Pages populaires**\n:two: **Communauté**\n:three: **Aide**\n:four: **Utilitaires**'
            )
            .setThumbnail(
              'https://static.wikia.nocookie.net/gardiens-des-cites-perdue/images/d/db/GDCP.jpeg/revision/latest/scale-to-width-down/860?cb=20201108120226&path-prefix=fr'
            );

          await msg.edit({ embed: newEmbed });
          await msg.reactions.cache.map((r) =>
            r.users.cache.forEach((u) =>
              u.id === bot.user.id
                ? 's'
                : r.users.remove(u).catch(console.error)
            )
          );
        } else if (newEmbed.description.startsWith('Voici')) {
          newEmbed.setTitle('Explorer : Pages populaires');
          newEmbed
            .setDescription(
              'Tu peux voir ici la liste des pages populaires du wiki :\n\n• [Tome 8.5 : Le livre des secrets](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Tome_8.5_:_Le_Livre_des_secrets)\n• [Tome 9](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Tome_9)\n• [Sophie Elizabeth Foster](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Sophie_Elizabeth_Foster)\n• [Talents](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Talents)\n• [Keefe Sencen](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Keefe_Sencen)\n• [Fitzroy Avery Vacker](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Fitzroy_Avery_Vacker)\n• [Tome 7 : Réminiscences](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Tome_7_:_R%C3%A9miniscences)\n• [Biana Vacker](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Biana_Vacker)'
            )
            .setFooter('Pages populaires • Wiki GDCP');

          await msg.edit({ embed: newEmbed });
          await msg.reactions.cache.map((r) =>
            r.users.cache.forEach((u) =>
              u.id === bot.user.id
                ? 's'
                : r.users.remove(u).catch(console.error)
            )
          );
        } else if (
          newEmbed.thumbnail.url ===
          'https://static.wikia.nocookie.net/gardiens-des-cites-perdue/images/9/98/GDCP_serie.jpg/revision/latest/scale-to-width-down/215?cb=20201108140744&path-prefix=fr'
        ) {
          newEmbed
            .setTitle('Explorer : Tomes')
            .setDescription(
              'Tu as ici une liste de tous les tomes déjà sortis :\n\n• [Tome 1 : Gardiens des Cités perdues](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Tome_1_:_Gardiens_des_Cit%C3%A9s_Perdues)\n• [Tome 2 : Exil](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Tome_2_:_Exil)\n• [Tome 3 : Le Grand Brasier](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Tome_3_:_Le_Grand_Brasier)\n• [Tome 4 : Les Invisibles](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Tome_4_:_Les_Invisibles)\n• [Tome 5 : Projet Polaris](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Tome_5_:_Projet_Polaris)\n• [Tome 6 : Nocturna](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Tome_6_:_Nocturna)\n• [Tome 7 : Réminiscences](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Tome_7_:_R%C3%A9miniscences)\n• [Tome 8 : Héritages](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Tome_8_:_H%C3%A9ritages)\n• [Tome 8.5 : Le livre des secrets](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Tome_8.5_:_Le_Livre_des_secrets)'
            )
            .setFooter('Tomes • Wiki GDCP');

          await msg.edit({ embed: newEmbed });
          await msg.reactions.cache.map((r) =>
            r.users.cache.forEach((u) =>
              u.id === bot.user.id
                ? 's'
                : r.users.remove(u).catch(console.error)
            )
          );
        } else if (
          newEmbed.thumbnail.url ===
          'https://static.wikia.nocookie.net/gardiens-des-cites-perdue/images/c/cd/GDCP_Personnages.jpg/revision/latest/scale-to-width-down/215?cb=20201108140841&path-prefix=fr'
        ) {
          newEmbed
            .setTitle('Explorer : Protagonistes')
            .setDescription(
              'Voilà une liste des protagonistes, personnages principaux, de la saga :\n\n• [Sophie Foster](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Sophie_Foster)\n• [Fitz Vacker](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Fitz_Vacker)\n• [Keefe Sencen](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Keefe_Sencen)\n• [Dex Dizznee](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Dex_Dizznee)\n• [Biana Vacker](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Biana_Vacker)\n• [Tam Song](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Tam_Song)\n• [Linh Song](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Linh_Song)\n• [Wylie Endal](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Wylie_Endal)\n• [Marella Redek](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Marella_Redek)\n• [Stina Heks](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Stina_Heks)\n• [Maruca Endal](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Maruca_Endal)'
            )
            .setFooter('Protagonistes • Wiki GDCP');

          await msg.edit({ embed: newEmbed });
          await msg.reactions.cache.map((r) =>
            r.users.cache.forEach((u) =>
              u.id === bot.user.id
                ? 's'
                : r.users.remove(u).catch(console.error)
            )
          );
        } else if (
          newEmbed.thumbnail.url ===
          'https://static.wikia.nocookie.net/gardiens-des-cites-perdue/images/c/c7/GDCP_Univers.png/revision/latest/scale-to-width-down/215?cb=20201108140704&path-prefix=fr'
        ) {
          newEmbed
            .setTitle('Explorer : Talents')
            .setDescription(
              'Ici, tu as une liste de tous les talents connus à ce jour :\n\n• [Chargeur](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Chargeur)\n• [Discerneur](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Discerneur)\n• [Eclipseur](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Eclipseur)\n• [Enjôleur](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Enj%C3%B4leur)\n• [Empathe](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Empathe)\n• [Flasheur](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Flasheur)\n• [Fluctuateur](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Fluctuateur)\n• [Givreur](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Givreur)\n• [Hydrokinésiste](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Hydrokin%C3%A9siste)\n• [Hypnotiseur](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Hypnotiseur)\n• [Invocateur](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Invocateur)\n• [Instillateur](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Instillateur)\n• [Optimisateur](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Optimisateur)\n• [Rafaleur](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Rafaleur)/[Souffleur](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Souffleur)\n• [Phaseur/Passeur](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Phaseur)\n'
            )
            .addField(
              '\u200b',
              '• [Polyglotte](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Polyglotte)\n• [Psionipathe](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Psionipathe)\n• [Pyrokinésiste](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Pyrokin%C3%A9siste)\n• [Technopathe](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Technopathe)\n• [Télépathe](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/T%C3%A9l%C3%A9pathe)\n• [Téléportateur](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/T%C3%A9l%C3%A9portateur)\n• [Ténébreux](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/T%C3%A9n%C3%A9breux)\n• [Vociférateur](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Vocif%C3%A9rateur)'
            )
            .setFooter('Talents • Wiki GDCP');

          await msg.edit({ embed: newEmbed });
          await msg.reactions.cache.map((r) =>
            r.users.cache.forEach((u) =>
              u.id === bot.user.id
                ? 's'
                : r.users.remove(u).catch(console.error)
            )
          );
        }
      } else if (reaction.emoji.name === '2️⃣') {
        if (newEmbed.description.startsWith('Cliquez')) {
          newEmbed.description =
            'Tu es dans la catégorie *La série*. Fais maintenant ton choix entre ces catégories :\n\n:one: **Tomes**\n:two: **Nouvelles Bonus**\n:three: **Bonus**\n:four: **Auteurs**';
          newEmbed.setThumbnail(
            'https://static.wikia.nocookie.net/gardiens-des-cites-perdue/images/9/98/GDCP_serie.jpg/revision/latest/scale-to-width-down/215?cb=20201108140744&path-prefix=fr'
          );

          await msg.edit({ embed: newEmbed });
          await msg.reactions.cache.map((r) =>
            r.users.cache.forEach((u) =>
              u.id === bot.user.id
                ? 's'
                : r.users.remove(u).catch(console.error)
            )
          );
        } else if (newEmbed.description.startsWith('Voici')) {
          newEmbed
            .setTitle('Explorer : Communauté')
            .setDescription(
              'Tu peux voir ici une liste de liens concernant la communauté :\n\n• [Règlement](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Wiki_Gardiens_des_Cit%C3%A9s_Perdues:R%C3%A8glement)\n• [Portail communautaire](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Sp%C3%A9cial:Communaut%C3%A9)\n• [Utilisateurs](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Sp%C3%A9cial:Liste_des_utilisateurs)\n• [Équipe administrative](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Wiki_Gardiens_des_Cit%C3%A9s_Perdues:%C3%89quipe_administrative)\n• [Discussions](https://gardiens-des-cites-perdues.fandom.com/fr/f)\n• [Billets de blog récents](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Blog:Billets_r%C3%A9cents)\n• [Centre des communautés](https://community.fandom.com/wiki/c:fr.communaute)'
            )
            .setFooter('Communauté • Wiki GDCP');

          await msg.edit({ embed: newEmbed });
          await msg.reactions.cache.map((r) =>
            r.users.cache.forEach((u) =>
              u.id === bot.user.id
                ? 's'
                : r.users.remove(u).catch(console.error)
            )
          );
        } else if (newEmbed.description.startsWith('Tu es')) {
          newEmbed
            .setTitle('Explorer : Nouvelles Bonus')
            .setDescription(
              'Tu as ici une liste des nouvelles écrites par Shannon Messenger entre les tomes :\n\n• [Les révélations de Keefe](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Les_r%C3%A9v%C3%A9lations_de_Keefe)\n• [Une conversation décisive](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Une_conversation_d%C3%A9cisive)\n• [Les incertitudes de Fitz](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Les_incertitudes_de_Fitz)\n• [Tam, prisonnier des Invisibles](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Tam,_prisonnier_des_Invisibles)'
            )
            .setFooter('Nouvelles Bonus • Wiki GDCP');

          await msg.edit({ embed: newEmbed });
          await msg.reactions.cache.map((r) =>
            r.users.cache.forEach((u) =>
              u.id === bot.user.id
                ? 's'
                : r.users.remove(u).catch(console.error)
            )
          );
        } else if (
          newEmbed.thumbnail.url ===
          'https://static.wikia.nocookie.net/gardiens-des-cites-perdue/images/c/cd/GDCP_Personnages.jpg/revision/latest/scale-to-width-down/215?cb=20201108140841&path-prefix=fr'
        ) {
          newEmbed
            .setTitle('Explorer : Antagonistes')
            .setDescription(
              'Voilà une liste des antagonistes ("ennemis" principaux) de la saga :\n\n• [Gisela Sencen](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Gisela_Sencen)\n• [Fintan Pyren](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Fintan_Pyren)\n• [Vespéra](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Vesp%C3%A9ra)\n• [Gethen](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Gethen)\n• [Brant](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Brant)\n• [Alvar Vacker](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Alvar_Vacker)\n• [Ruy Ignis](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Ruy_Ignis)\n• [Ombre](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Ombre)\n• [Roi Dimitar](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Roi_Dimitar)\n• [Roi Enki](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Roi_Enki)\n• [Trix](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Trix)\n• [Cadfael](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Cadfael)'
            )
            .setFooter('Antagonistes • Wiki GDCP');

          await msg.edit({ embed: newEmbed });
          await msg.reactions.cache.map((r) =>
            r.users.cache.forEach((u) =>
              u.id === bot.user.id
                ? 's'
                : r.users.remove(u).catch(console.error)
            )
          );
        } else if (
          newEmbed.thumbnail.url ===
          'https://static.wikia.nocookie.net/gardiens-des-cites-perdue/images/c/c7/GDCP_Univers.png/revision/latest/scale-to-width-down/215?cb=20201108140704&path-prefix=fr'
        ) {
          newEmbed
            .setTitle('Explorer : Créatures')
            .setDescription(
              'Ici, tu as une liste de toutes les créatures connues actuellement :\n\n• [Halcyon](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Alcyon)\n• [Alicorne](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Alicorne)\n• [Apyrodon](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Apyrodon)\n• [Argentavis](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Argentavis)\n• [Banshee](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Banshee)\n• [Colibri lunaire](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Colibri_Lunaire)\n• [Eckodon](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Eckodon)\n• [Etincelle](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Etincelle)\n• [Euryptéride](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Eurypt%C3%A9ride)\n• [Gorgodon](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Gorgodon)\n• [Gorgonops](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Gorgonops)\n• [Gremlin](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Gremlin)\n• [Gulon](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Gulon)\n• [Kelpie](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Kelpie)\n• [Kraken](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Kraken)\n• [Licorne](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Kraken)\n• [Loup sinistre](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Loup_Sinistre_(Canis_Dirus))\n• [Lutin](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Lutin)\n• [Manticore](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Manticore)\n• [Muscrapaud](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Muscrapaud)\n'
            )
            .addField(
              '\u200b',
              '• [Méganeura](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/M%C3%A9ganeuras)\n• [Sasquatch](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Sasquatch)\n• [Sédicate](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/S%C3%A9dicate)\n• [Titanoboa](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Titanoboa)\n• [Tomple](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Tomple)\n• [Verminion](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Verminion)\n• [Wyverne](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Wyverne)\n• [Yéti](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Y%C3%A9ti)'
            )
            .setFooter('Créatures • Wiki GDCP');

          await msg.edit({ embed: newEmbed });
          await msg.reactions.cache.map((r) =>
            r.users.cache.forEach((u) =>
              u.id === bot.user.id
                ? 's'
                : r.users.remove(u).catch(console.error)
            )
          );
        }
      } else if (reaction.emoji.name === '3️⃣') {
        if (newEmbed.description.startsWith('Cliquez')) {
          newEmbed
            .setDescription(
              'Bienvenue dans la catégorie *Les Personnages*. Fais maintenant ton choix entre ces catégories :\n\n:one: **Protagonistes**\n:two: **Antagonistes**\n:three: **Conseillers**\n:four: **Cygne Noir**'
            )
            .setThumbnail(
              'https://static.wikia.nocookie.net/gardiens-des-cites-perdue/images/c/cd/GDCP_Personnages.jpg/revision/latest/scale-to-width-down/215?cb=20201108140841&path-prefix=fr'
            );
          await msg.edit({ embed: newEmbed });
          await msg.reactions.cache.map((r) =>
            r.users.cache.forEach((u) =>
              u.id === bot.user.id
                ? 's'
                : r.users.remove(u).catch(console.error)
            )
          );
        } else if (newEmbed.description.startsWith('Voici')) {
          newEmbed
            .setTitle('Explorer : Aide')
            .setDescription(
              "Tu peux voir ici une liste des pages d'aide du Wiki :\n\n• [Aide du Wiki](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Wiki_Gardiens_des_Cit%C3%A9s_Perdues:Aide)\n• [Modifier et ajouter du contenu](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Wiki_Gardiens_des_Cit%C3%A9s_Perdues:Aide/Contribuer)\n• [Découvrir les outils des utilisateurs](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Wiki_Gardiens_des_Cit%C3%A9s_Perdues:Aide/Votre_compte)\n• [Consulter les règles](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Wiki_Gardiens_des_Cit%C3%A9s_Perdues:R%C3%A8glement)\n• [Équipe administrative](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Wiki_Gardiens_des_Cit%C3%A9s_Perdues:%C3%89quipe_administrative)\n• [Apprendre le codage](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Wiki_Gardiens_des_Cit%C3%A9s_Perdues:Brigade_wikicode)\n• [Communiquer avec les autres membres](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Wiki_Gardiens_des_Cit%C3%A9s_Perdues:Aide/Discuter_et_communiquer)"
            )
            .setFooter('Aide • Wiki GDCP');

          await msg.edit({ embed: newEmbed });
          await msg.reactions.cache.map((r) =>
            r.users.cache.forEach((u) =>
              u.id === bot.user.id
                ? 's'
                : r.users.remove(u).catch(console.error)
            )
          );
        } else if (newEmbed.description.startsWith('Tu es')) {
          newEmbed
            .setTitle('Explorer : Bonus')
            .setDescription(
              'Tu as ici quelques bonus sympathiques :\n\n• [Carte des Cités perdues](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Tome_8.5)\n• [Stickers blason](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Cat%C3%A9gorie:Blason)\n• [Images officielles](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Images_officielles)'
            )
            .setFooter('Bonus • Wiki GDCP');
          await msg.edit({ embed: newEmbed });
          await msg.reactions.cache.map((r) =>
            r.users.cache.forEach((u) =>
              u.id === bot.user.id
                ? 's'
                : r.users.remove(u).catch(console.error)
            )
          );
        } else if (
          newEmbed.thumbnail.url ===
          'https://static.wikia.nocookie.net/gardiens-des-cites-perdue/images/c/cd/GDCP_Personnages.jpg/revision/latest/scale-to-width-down/215?cb=20201108140841&path-prefix=fr'
        ) {
          newEmbed
            .setTitle('Explorer : Conseillers')
            .setDescription(
              'Voilà la liste des conseillers :\n\n• [Conseillère Alina](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Conseill%C3%A8re_Alina)\n• [Conseiller Bronte](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Conseiller_Bronte)\n• [Conseillère Clarette](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Conseill%C3%A8re_Clarette)\n• [Conseiller Darek](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Conseiller_Darek)\n• [Conseiller Emery](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Conseiller_Emery)\n• [Conseillère Liora](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Conseill%C3%A8re_Liora)\n• [Conseiller Noland](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Conseiller_Noland)\n• [Conseillère Oralie](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Conseill%C3%A8re_Oralie)\n• [Conseillère Ramira](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Conseill%C3%A8re_Ramira)\n• [Conseiller Terik](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Conseiller_Terik)\n• [Conseillère Velia](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Conseill%C3%A8re_Velia)\n• [Conseillère Zarina](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Conseill%C3%A8re_Zarina)'
            )
            .setFooter('Conseillers • Wiki GDCP');
          await msg.edit({ embed: newEmbed });
          await msg.reactions.cache.map((r) =>
            r.users.cache.forEach((u) =>
              u.id === bot.user.id
                ? 's'
                : r.users.remove(u).catch(console.error)
            )
          );
        } else if (
          newEmbed.thumbnail.url ===
          'https://static.wikia.nocookie.net/gardiens-des-cites-perdue/images/c/c7/GDCP_Univers.png/revision/latest/scale-to-width-down/215?cb=20201108140704&path-prefix=fr'
        ) {
          newEmbed
            .setTitle('Explorer : Lieux')
            .setDescription(
              'Ici, tu as une liste de tous les lieux importants :\n\n• [Éternalia](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/%C3%89ternalia)\n• [Atlantide](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Atlantide)\n• [Gildingham](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Gildingham)\n• [Ravagog](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Ravagog)\n• [Val-Serein](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Val-Serein)\n• [Loamnore](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Loamnore)\n• [Mystérium](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Myst%C3%A9rium)\n• [Havenfield](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Havenfield)\n• [Everglen](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Everglen)\n• [Candleshade](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Candleshade)\n• [Rives du réconfort](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Rives_du_R%C3%A9confort)\n• [Rimeshire](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Rimeshire)\n• [Choralmere](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Choralmere)\n• [Foxfire](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Foxfire)\n• [Exillium](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Exillium)\n• [Alluveterre](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Alluveterre)\n• [Lumenaria](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Lumenaria)\n• [Exil](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Exil)'
            )
            .setFooter('Lieux • Wiki GDCP');

          await msg.edit({ embed: newEmbed });
          await msg.reactions.cache.map((r) =>
            r.users.cache.forEach((u) =>
              u.id === bot.user.id
                ? 's'
                : r.users.remove(u).catch(console.error)
            )
          );
        }
      } else if (reaction.emoji.name === '4️⃣') {
        if (newEmbed.description.startsWith('Cliquez')) {
          newEmbed
            .setDescription(
              "Tu te trouves maintenant dans la catégorie *L'Univers*. Fais désormais ton choix entre les catégories suivantes :\n\n:one: **Talents**\n:two: **Créatures**\n:three: **Lieux**\n:four: **Événements**"
            )
            .setThumbnail(
              'https://static.wikia.nocookie.net/gardiens-des-cites-perdue/images/c/c7/GDCP_Univers.png/revision/latest/scale-to-width-down/215?cb=20201108140704&path-prefix=fr'
            );
          await msg.edit({ embed: newEmbed });
          await msg.reactions.cache.map((r) =>
            r.users.cache.forEach((u) =>
              u.id === bot.user.id
                ? 's'
                : r.users.remove(u).catch(console.error)
            )
          );
        } else if (newEmbed.description.startsWith('Voici')) {
          newEmbed
            .setTitle('Explorer : Utilitaires')
            .setDescription(
              "Tu peux voir ici plusieurs pages qui te seront certainement utiles :\n\n• [Créer une page](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Sp%C3%A9cial:CreatePage)\n• [Parcourir le Wiki](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Sp%C3%A9cial:Recherche)\n• [Ajouter des fichiers](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Sp%C3%A9cial:T%C3%A9l%C3%A9verser)\n• [Voir l'ensemble des pages](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Sp%C3%A9cial:Toutes_les_pages)\n• [Discussions](https://gardiens-des-cites-perdues.fandom.com/fr/f)"
            )
            .setFooter('Utilitaires • Wiki GDCP');
          await msg.edit({ embed: newEmbed });
          await msg.reactions.cache.map((r) =>
            r.users.cache.forEach((u) =>
              u.id === bot.user.id
                ? 's'
                : r.users.remove(u).catch(console.error)
            )
          );
        } else if (newEmbed.description.startsWith('Tu es')) {
          newEmbed
            .setTitle('Explorer : Auteurs')
            .setDescription(
              'Tu as ici une liste des auteurs/artistes qui ont contribué à la réalisation des livres, que ce soit niveau écriture (Shannon), traduction (Mathilde), couvertures (Jason) ou encore des fan arts (Laura et Courtney) :\n\n• [Shannon Messenger](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Shannon_Messenger)\n• [Mathilde Tamae-Bouhon](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Mathilde_Tamae-Bouhon)\n• [Jason Chan](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Jason_Chan)\n• [Laura Hollingsworth](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Laura_Hollingsworth)\n• [Courtney Godbey](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Courtney_Godbey)'
            )
            .setFooter('Auteurs • Wiki GDCP');
          await msg.edit({ embed: newEmbed });
          await msg.reactions.cache.map((r) =>
            r.users.cache.forEach((u) =>
              u.id === bot.user.id
                ? 's'
                : r.users.remove(u).catch(console.error)
            )
          );
        } else if (
          newEmbed.thumbnail.url ===
          'https://static.wikia.nocookie.net/gardiens-des-cites-perdue/images/c/cd/GDCP_Personnages.jpg/revision/latest/scale-to-width-down/215?cb=20201108140841&path-prefix=fr'
        ) {
          newEmbed
            .setTitle('Explorer : Cygne Noir')
            .setDescription(
              'Voilà la liste des membres connus du Cygne Noir :\n\n• [Sophie Foster](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Sophie_Foster)\n• [Fitz Vacker](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Fitz_Vacker)\n• [Keefe Sencen](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Keefe_Sencen)\n• [Dex Dizznee](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Dex_Dizznee)\n• [Biana Vacker](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Biana_Vacker)\n• [Tam Song](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Tam_Song)\n• [Linh Song](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Linh_Song)\n• [Wylie Endal](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Wylie_Endal)\n• [Marella Redek](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Marella_Redek)\n• [Stina Heks](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Stina_Heks)\n• [Maruca Endal](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Maruca_Endal)\n• [M. Forkle](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/M._Forkle)\n• [Granite](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Granite)\n• [Blizzard](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Blizzard)\n• [Brume](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Brume)\n• [Spectre](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Spectre)\n• [Prentice Endal](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Prentice_Endal)\n• [Jolie Ruewen](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Jolie_Ruewen)\n• [Cassius Sencen](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Cassius_Sencen)'
            )
            .setFooter('Cygne Noir • Wiki GDCP');
          await msg.edit({ embed: newEmbed });
          await msg.reactions.cache.map((r) =>
            r.users.cache.forEach((u) =>
              u.id === bot.user.id
                ? 's'
                : r.users.remove(u).catch(console.error)
            )
          );
        } else if (
          newEmbed.thumbnail.url ===
          'https://static.wikia.nocookie.net/gardiens-des-cites-perdue/images/c/c7/GDCP_Univers.png/revision/latest/scale-to-width-down/215?cb=20201108140704&path-prefix=fr'
        ) {
          newEmbed
            .setTitle('Explorer : Événements')
            .setDescription(
              "Tu peux trouver ici une liste de différents événements pouvant avoir lieu :\n\n• [Audience](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Audience)\n• [Élections](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Consei)\n• [Entremettage](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Entremetteur)\n• [Exil](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Exil)\n• [Examens de mi-semestre](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Examens_de_mi-semestre)\n• [Festival céleste](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Festival_C%C3%A9leste)\n• [Manifestation de talent](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Talents)\n• [Gala du Vannage](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Gala_du_Vannage)\n• [Plantation d'Errants](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Errant)\n• [Sommet de la paix](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Sommet_de_la_Paix)\n• [Sommets spectraux](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Sommets_Spectraux)\n• [Mort](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Mort)"
            )
            .setFooter('Événements • Wiki GDCP');

          await msg.edit({ embed: newEmbed });
          await msg.reactions.cache.map((r) =>
            r.users.cache.forEach((u) =>
              u.id === bot.user.id
                ? 's'
                : r.users.remove(u).catch(console.error)
            )
          );
        }
      } else if (reaction.emoji.name === '⬅️') {
        newEmbed.setTitle('Explorer');
        if (newEmbed.description.startsWith('Cliquez')) {
          await reaction.users.remove(user);
          return;
        } else if (
          newEmbed.description.toLowerCase().includes('catégorie *') &&
          !newEmbed.description.startsWith('Voici la catégories *Gardiens')
        ) {
          newEmbed
            .setDescription(
              `Cliquez sur les différentes réactions pour explorer les pages du Wiki Gardiens des Cités Perdues !\n\n:one: **Wiki**\n:two: **La série**\n:three: **Les personnages**\n:four: **L'Univers**`
            )
            .setThumbnail(bot.user.avatarURL({ format: 'png' }));

          await msg.edit({ embed: newEmbed });
          await msg.reactions.cache.map((r) =>
            r.users.cache.forEach((u) =>
              u.id === bot.user.id
                ? 's'
                : r.users.remove(u).catch(console.error)
            )
          );
          return;
        } else if (newEmbed.description.startsWith('Tu peux voir ici')) {
          // Gardiens des Cités perdues
          newEmbed
            .setDescription(
              'Voici la catégorie *Wiki*. Fais maintenant ton choix entre ces catégories :\n\n:one: **Pages populaires**\n:two: **Communauté**\n:three: **Aide**\n:four: **Utilitaires**'
            )
            .setThumbnail(
              'https://static.wikia.nocookie.net/gardiens-des-cites-perdue/images/d/db/GDCP.jpeg/revision/latest/scale-to-width-down/860?cb=20201108120226&path-prefix=fr'
            );
          newEmbed.footer = null;

          await msg.edit({ embed: newEmbed });
          await msg.reactions.cache.map((r) =>
            r.users.cache.forEach((u) =>
              u.id === bot.user.id
                ? 's'
                : r.users.remove(u).catch(console.error)
            )
          );
        } else if (newEmbed.description.startsWith('Tu as ici')) {
          // La série
          newEmbed
            .setDescription(
              'Tu es dans la catégorie *La série*. Fais maintenant ton choix entre ces catégories :\n\n:one: **Tomes**\n:two: **Nouvelles Bonus**\n:three: **Bonus**\n:four: **Auteurs**'
            )
            .setThumbnail(
              'https://static.wikia.nocookie.net/gardiens-des-cites-perdue/images/9/98/GDCP_serie.jpg/revision/latest/scale-to-width-down/215?cb=20201108140744&path-prefix=fr'
            );
          newEmbed.footer = null;

          await msg.edit({ embed: newEmbed });
          await msg.reactions.cache.map((r) =>
            r.users.cache.forEach((u) =>
              u.id === bot.user.id
                ? 's'
                : r.users.remove(u).catch(console.error)
            )
          );
        } else if (newEmbed.description.startsWith('Voilà')) {
          // Personnages
          newEmbed
            .setDescription(
              'Bienvenue dans la catégorie *Les Personnages*. Fais maintenant ton choix entre ces catégories :\n\n:one: **Protagonistes**\n:two: **Antagonistes**\n:three: **Conseillers**\n:four: **Cygne Noir**'
            )
            .setThumbnail(
              'https://static.wikia.nocookie.net/gardiens-des-cites-perdue/images/c/cd/GDCP_Personnages.jpg/revision/latest/scale-to-width-down/215?cb=20201108140841&path-prefix=fr'
            );
          newEmbed.footer = null;

          await msg.edit({ embed: newEmbed });
          await msg.reactions.cache.map((r) =>
            r.users.cache.forEach((u) =>
              u.id === bot.user.id
                ? 's'
                : r.users.remove(u).catch(console.error)
            )
          );
        } else {
          // Univers
          newEmbed.setDescription(
            "Tu te trouves maintenant dans la catégorie *L'Univers*. Fais désormais ton choix entre les catégories suivantes :\n\n:one: **Talents**\n:two: **Créatures**\n:three: **Lieux**\n:four: **Événements**"
          );
          newEmbed.footer = null;

          await msg.edit({ embed: newEmbed });
          await msg.reactions.cache.map((r) =>
            r.users.cache.forEach((u) =>
              u.id === bot.user.id
                ? 's'
                : r.users.remove(u).catch(console.error)
            )
          );
        }
      } else reaction.remove();
    }
  }
});

module.exports = bot;
