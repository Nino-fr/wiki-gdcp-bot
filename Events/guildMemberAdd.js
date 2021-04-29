const { GuildMember, Message } = require('discord.js');
module.exports = class {
  /**
   * @param { GuildMember } member The member that's joined the server
   * @returns {Promise<Message>}
   */
  async run(member) {
    if (member.partial) await member.fetch();
    member.roles.cache.has('751709770653761587')
      ? null
      : member.roles.add('751709770653761587');

    const wChannel = member.guild.channels.cache.get('719085354514251881');
    return wChannel.send(`Bienvenue sur le serveur du **Wiki Gardiens des Cités Perdues**, ${member.toString()}  !
Commence par lire l’<#777816328244559883> pour t’orienter à travers le serveur. Si tu as des questions le salon <#719100920901795861> est là pour ça. 
Cela fait,  va dans <#749218089593339935> et clique sur les réactions correspondantes pour obtenir des rôles spécifiques, et lie ton compte avec celui que tu as sur le Wiki dans <#754016305807360110>. 


Ensuite, tu pourras rejoindre les discussions dans le <#719215577994100766> pour discuter librement avec les autres membres. Et n’oublie pas de consulter l’<#749218555496497172> pour en apprendre plus sur la saga !

Amuse-toi bien sur le serveur !`);
  }
};
