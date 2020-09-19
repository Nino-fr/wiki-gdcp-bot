const Wiki = require('./wiki');

const wiki = new Wiki(
  'Gardiens des Cités Perdues',
  'gardiens-des-cites-perdues'
);

setInterval(async function () {
  const bot = require('../setup.js');
  const blogEmbed = await wiki.checkBlogsPosted();
  if (blogEmbed !== undefined && blogEmbed !== null) {
    bot.guilds.cache.forEach(async (g) => {
      await g.channels.cache.get('757017514025812082').send(blogEmbed);
    });
  }
  const postEmbed = await wiki.checkPosts();
  if (postEmbed !== undefined && postEmbed !== null) {
    await bot.channels.cache.get('757017442093629600').send(postEmbed);
  }
}, 60000);

module.exports = wiki;
