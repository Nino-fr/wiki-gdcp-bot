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
    if (!blogDejaLa && blogEmbed.title) {
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

    /*  const lastInstaPost = await wiki.checkInstaPost();
    let instaDejaLa = false;
    async function checkinsta() {
      (
        await bot.channels.cache
          .get('759676597761998848')
          .messages.fetch({ limit: 25, query: lastInstaPost.id })
      ).forEach((msg) => {
        if (msg.content.includes(lastInstaPost.id)) instaDejaLa = true;
      });
    }

    await checkinsta();
    if (!instaDejaLa) {
      bot.channels.cache.get('759676597761998848').send(lastInstaPost.id);
      bot.channels.cache.get('790937608250589186').send(lastInstaPost);
    } */

    /* const tweets = require('tweets');
    let stream = new tweets({
      consumer_key: 'ERU9XWQHfpJiQMFUdvQeW0gIt',
      consumer_secret: 'q4pwkxIsafinWpHd67SgDx4ico44QMOGlBeTpEafDnoy9TvfSh',
      access_token: '1341699859519303681-1RWHQ4cpxGbhWXH4Xv5Kd5U9ZVlzMW',
      access_token_secret: 'UrfZqfLD0OpjlzZRj6ZhccaIyKvr8i2nvRkZxFYF0GSHA',
    });

    stream.filter({ track: 'sw_messenger' });
    stream.on('tweet', function (t) {
      console.log(t);
    }); */
  } catch {}
}, 60000);

module.exports = wiki;
