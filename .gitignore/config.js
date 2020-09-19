const config = {
  ownerID: '428582719044452352',
  version: '1.1.0',

  admins: [
    '689489970116952130',
    '441202025355542538',
    '535545825057832980',
    '443800928902971402',
    '684112671695699989',
    '745935191582703626',
    '690524819103547462',
    '557612750734491661',
  ],
  mod: ['718456289704804392'],

  // Le token de votre bot, trouvable sur https://discordapp.com/developers/applications/me
  token: process.env.TOKEN,

  settings: {
    prefix: ';',
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
    // Niveau de permission du propriétaire du serveur
    {
      level: 4,
      name: 'Propriétaire du serveur',
      // Vérifie si l'utilisateur est le propriétaire du serveur
      check: (message) =>
        message.channel.type === 'text'
          ? message.guild.owner.user.id === message.author.id
            ? true
            : false
          : false,
    },

    // Niveau de permission du/des propriétaire(s) du bot
    {
      level: 5,
      name: 'Créateur',
      // Si un seul propriétaire, faire :
      check: (message) => config.ownerID === message.author.id,
      // Si plusieurs propriétaires, faire :
      // check: (message) => ["ID du premier propriétaire", "ID du deuxième", "etc"].includes(message.author.id)
    },
  ],
};

module.exports = config;
