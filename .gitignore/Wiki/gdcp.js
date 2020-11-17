const Wiki = require('./wiki');

const wiki = new Wiki(
  'Gardiens des Cités Perdues',
  'gardiens-des-cites-perdues'
);

setInterval(async function () {
  try {
    const bot = require('../setup.js');
    const blogEmbed = await wiki.checkBlogsPosted();
    let blogDejaLa = false;

    async function check() {
      (
        await bot.channels.cache
          .get('751855074657042594')
          .messages.fetch({ limit: 25, query: blogEmbed.url })
      ).forEach((msg) => {
        // console.log(msg.content);
        if (msg.content.includes(blogEmbed.url)) blogDejaLa = true;
      });
    }
    await check();
    if (!blogDejaLa) {
      bot.channels.cache.get('751855074657042594').send(blogEmbed.url);
      bot.channels.cache.get('772508271863922689').send(blogEmbed);
    }

    const postEmbed = await wiki.checkPosts();
    if (postEmbed !== undefined && postEmbed !== null) {
      delete postEmbed.footer;

      let dejaLa = false;
      async function verify() {
        (
          await bot.channels.cache
            .get('755540919263953036')
            .messages.fetch({ limit: 25, query: postEmbed.url })
        ).forEach((msg) => {
          if (msg.content.includes(postEmbed.url)) dejaLa = true;
        });
      }
      await verify();
      if (!dejaLa) {
        await bot.channels.cache.get('755540919263953036').send(postEmbed.url);
        await bot.channels.cache.get('772508195959734302').send(postEmbed);
      }
    }

    /* const lastInstaPost = await wiki.checkInstaPost();
  if (lastInstaPost !== undefined && lastInstaPost !== null) {
    bot.channels.cache.get('759737105559060491').send(lastInstaPost);
  } */
  } catch {}
}, 60000);

module.exports = wiki;
