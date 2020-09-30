const Wiki = require('./wiki');

const wiki = new Wiki(
  'Gardiens des Cités Perdues',
  'gardiens-des-cites-perdues'
);

setInterval(async function () {
  const bot = require('../setup.js');
  const blogEmbed = await wiki.checkBlogsPosted();
  if (blogEmbed !== undefined && blogEmbed !== null) {
    delete blogEmbed.footer;
    await bot.channels.cache.get('757017514025812082').send(blogEmbed);
  }
  const postEmbed = await wiki.checkPosts();
  if (postEmbed !== undefined && postEmbed !== null) {
    delete postEmbed.footer;
    await bot.channels.cache.get('757017442093629600').send(postEmbed);
  }
  const lastInstaPost = await wiki.checkInstaPost();
  if (lastInstaPost !== undefined && lastInstaPost !== null) {
    bot.channels.cache.get('759737105559060491').send(lastInstaPost);
  }
}, 60000);

module.exports = wiki;
