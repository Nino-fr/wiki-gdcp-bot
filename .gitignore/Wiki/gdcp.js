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
      await g.channels.cache
        .find((ch) => ch.name.includes('général'))
        .send(blogEmbed);
    });
  }
  const postEmbed = await wiki.checkPosts();
  if (postEmbed !== undefined && postEmbed !== null) {
    await bot.channels.cache.find((ch) => ch.name === 'posts').send(postEmbed);
  }
}, 60000);

module.exports = wiki;
