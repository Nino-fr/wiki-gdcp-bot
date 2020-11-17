/**
 * @type {{
  ownerID: '428582719044452352',
  version: string,

  admins: string[],
  mod: string[],

  token: string,

  settings: {
    prefix: string,
    modLogChannel: string,
    systemNotice: string,
    welcomeEnabled: string,
    welcomeMessage: string,
  },

  permLevels: object[],
}}
 */
let confType;

/**
 * @type {confType}
 */
const config = {
  ownerID: '428582719044452352',
  version: '1.1.5',

  admins: [
    '689489970116952130',
    '441202025355542538',
    '443800928902971402',
    '684112671695699989',
    '745935191582703626',
    '718456289704804392',
  ],
  mod: [],

  token: 'NzQ5OTg3MTEzNTExOTQ0Mzc0.X0z97Q.jjP_XxBehH4JLulyIsWfia_lAv8',

  settings: {
    prefix: require('./settings.json').prefix,
    modLogChannel: 'logs',
    systemNotice: 'true',
    welcomeEnabled: 'false',
    welcomeMessage: 'Bienvenue dans ce serveur {{user}} !',
  },

  permLevels: [
    // Niveau de permission des simples membres
    {
      level: 1,
      name: 'Membre',
      // Pas besoin de vérifier, tout le monde est membre
      check: () => true,
    },

    {
      level: 2,
      // Niveau de permission des modérateurs du serveur
      name: 'Moderateur',
      // Les lignes suivantes vérifient que l'utilisateur possède bien un rôle contenant "mod"
      check: (message) => {
        try {
          if (config.mod.includes(message.member.id)) return true;
        } catch (e) {
          return false;
        }
      },
    },

    {
      level: 3,
      name: 'Administrateur',
      // Les lignes suivantes vérifient que l'utilisateur possède bien un rôle contenant "admin"
      check: (message) => {
        try {
          return config.admins.includes(message.member.id);
        } catch (e) {
          return false;
        }
      },
    },

    // Niveau de permission du/des propriétaire(s) du bot
    {
      level: 4,
      name: 'Créateur',
      // Si un seul propriétaire, faire :
      check: (message) => config.ownerID === message.author.id,
      // Si plusieurs propriétaires, faire :
      // check: (message) => ["ID du premier propriétaire", "ID du deuxième", "etc"].includes(message.author.id)
    },
  ],
};

module.exports = config;
