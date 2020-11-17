const { ownerID } = require('./config.js');

const bot = require('./setup.js'),
  { Message, MessageEmbed, TextChannel } = require('discord.js'),
  regWiki = /https:\/\/gardiens-des-cites-perdues.fandom.com\/fr\/wiki\/[^\s]+/,
  axios = require('axios'),
  prefix = bot.config.settings.prefix,
  { getValues, HTTPSRequest, HTTPRequest } = require('./fonctions'),
  loguer = bot.logger.log,
  asc = require('./ascii.json');

module.exports = class {
  /**
   * Détecte quand un message est envoyé par un utilisateur du bot
   * @param {Message} message Le message détecté
   */
  async run(message) {
    if (
      regWiki.test(message.content) &&
      bot.wikiVisu === true &&
      !message.channel.name.includes('annonce')
    ) {
      message.content.match(new RegExp(regWiki, 'g')).forEach(async (url) => {
        if (!url) return;
        url = decodeURI(url);
        url = encodeURI(url);
        const cheerio = require('cheerio');
        await axios.default.get(url).then(async (res) => {
          try {
            const $ = cheerio.load(res.data);
            let title = $('meta[property="og:title"]')[0].attribs.content;
            let description = $('meta[name="description"]')[0].attribs.content;
            description =
              description.slice(0, description.indexOf('...')) +
              '[...](' +
              url +
              ')';
            description = description.correctString();
            let img = $('meta[property="og:image"]')[0].attribs.content;
            const embed = new MessageEmbed()
              .setColor('RANDOM')
              .setDescription(description)
              .setTitle(title)
              .setURL(url)
              .setTimestamp()
              .setThumbnail(img)
              .setFooter(
                $('title').text(),
                bot.user.avatarURL({ format: 'png' })
              );
            await message.channel.send(embed);
          } catch {
            return undefined;
          }
        });
      });
    }

    // Si le contenu du message est "postcode", le bot envoie un embed expliquant comment partager du code sur Discord.
    if (message.content === 'postcode') {
      return message.repondre({
        embed: {
          color: 2860732,
          title: `:handshake: Aide à l'envoi de code`,
          description:
            '__**Pour formater votre code sur Discord :**__\n\n> \\`\\`\\`langage\n> Code à formater\n> \\`\\`\\`\n\n__Exemple :__\n\n> \\`\\`\\`js\n> console.log("Je suis un exemple de code");\n> \\`\\`\\`\n```js\nconsole.log("Je suis un exemple de code");\n```\n\nSi le code est trop grand (+ de 2000 caractères), vous avez une liste de sites ci-dessous pour déposer votre code.\n\n__**Liste de sites pour déposer votre code :**__\n\n>> [sourcebin](http://sourceb.in)\n>> [hastebin](https://hasteb.in)\n>> [gist](https://gist.github.com)',
        },
      });
    }

    // Deux conditions créant une prévisualisation des liens Discord vers des messages.
    if (
      message.content.includes('https://discord.com/channels/') &&
      bot.discordVisu &&
      !message.channel.name.includes('annonce')
    ) {
      try {
        if (message.author.bot) return;

        let n = message.content.indexOf('h', 'https');
        let mmm = message.content.substr(n, 85);
        let serveurid = mmm.substring(29, 47);
        let serveur = bot.guilds.cache.get(serveurid);
        let salonid = mmm.substring(48, 66);
        let messageid = mmm.substring(67, 86);
        /**
         * @type {TextChannel}
         */
        let salon = bot.channels.cache.get(salonid);
        let lien = mmm;
        await salon.messages.fetch(messageid).then((m) => {
          let mEmbed = {
            color: '#061499',
            title: `Message de ${m.author.tag}`,
            description: `${m.content}\n\n[Sauter vers le message](${lien})`,
            footer: {
              text: `Message du serveur ${serveur.name} dans le salon ${salon.name}`,
            },
            timestamp: new Date(),
          };
          if (m.attachments.first())
            mEmbed.image = { url: m.attachments.first().url };

          if (m.content && m.content !== '')
            message.channel.send({
              embed: mEmbed,
            });
          if (m.embeds.length !== 0) {
            message.channel.send(
              'Ce message contenait un embed. En voici une représentation ci-dessous.'
            );
            return message.channel.send({
              embed: m.embeds[0],
            });
          }
        });
      } catch (err) {
        console.log(err);
      }
    }
    // La deuxième condition qui fait pareil mais avec les liens `discordapp.com`
    if (
      message.content.includes('https://discordapp.com/channels/') &&
      bot.discordVisu &&
      !message.channel.name.includes('annonce')
    ) {
      try {
        if (message.author.bot) return;

        let n = message.content.indexOf('h', 'https');
        let mmm = message.content.substr(n, 88);
        let serveurid = mmm.substring(32, 50);
        let serveur = bot.guilds.cache.get(serveurid);
        let salonid = mmm.substring(51, 69);
        let messageid = mmm.substring(70, 89);
        /**
         * @type {TextChannel}
         */
        let salon = bot.channels.cache.get(salonid);
        let lien = mmm;
        await salon.messages.fetch(messageid).then((m) => {
          let mEmbed = {
            color: 12124160,
            title: `Message de ${m.author.tag}`,
            description: `${m.content}\n\n[Sauter vers le message](${lien})`,
            footer: {
              text: `Message du serveur ${serveur.name} dans le salon ${salon.name}`,
            },
            timestamp: new Date(),
          };
          if (m.attachments.first())
            mEmbed.image = { url: m.attachments.first().url };

          if (m.content && m.content !== '')
            message.channel.send({
              embed: mEmbed,
            });

          if (m.embeds.length !== 0) {
            message.channel.send(
              'Ce message contenait un embed. En voici une représentation ci-dessous.'
            );
            return message.channel.send({
              embed: m.embeds[0],
            });
          }
        });
      } catch (err) {
        console.log(err);
      }
    }

    // Deux conditions permettant d'envoyer un embed de prévisualisation des liens YouTube
    if (
      /https\:\/\/youtu\.be\/[\w\d\-]+/.test(message.content) &&
      bot.YTVisu &&
      !message.channel.name.includes('annonce')
    ) {
      let regYt = /https\:\/\/youtu\.be\/[\w\d\-]+/;
      let url = message.content.match(regYt);
      let videoId = message.content
        .match(regYt)
        .toString()
        .match(/(?<=https\:\/\/youtu\.be\/)[\w\d\-]+/)
        .toString();
      const axios = require('axios');
      let ytdvideo = await axios.default.get(
        `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}&key=AIzaSyBIvSnYmTSRxjnyeDf106P1FsBqkngTKXs`
      );
      let likeCount = ytdvideo.data.items[0].statistics.likeCount;
      let dislikeCount = ytdvideo.data.items[0].statistics.dislikeCount;
      let views = ytdvideo.data.items[0].statistics.viewCount;
      let commentCount = ytdvideo.data.items[0].statistics.commentCount;

      let title, description, owner, urlowner, duration, totalduration;
      const fetchVideoInfo = require('updated-youtube-info');
      await axios.default
        .get(
          `https://www.googleapis.com/youtube/v3/videos?part=snippet&part=contentDetails&id=${videoId}&key=AIzaSyBIvSnYmTSRxjnyeDf106P1FsBqkngTKXs`
        )
        .then((res) => {
          let info = res.data;
          let item = info.items[0].snippet,
            channelId = item.channelId;
          description = item.description;
          title = item.title;
          owner = item.channelTitle;
          totalduration = info.items[0].contentDetails.duration
            .replace(/(\d+)M/i, ` $1 minutes`)
            .replace(/(\d+)S/i, ` $1 secondes`)
            .replace(/(\d+)H/i, `$1 heures,`)
            .replace('PT', '');

          urlowner = `https://www.youtube.com/channel/${channelId}`;
        });

      let video = await fetchVideoInfo(videoId);
      message.channel.send({
        embed: {
          description: `**[${title}](${url})**\n  par **[${owner}](${urlowner})**`,
          fields: [
            {
              name: 'Description',
              value:
                description.length > 900
                  ? description.slice(0, 900).split(/ +/g).splice(1).join(' ') +
                    ` [\[...\]](${url})`
                  : description,
            },
            {
              name: '⏲️ Durée de la vidéo',
              value: totalduration,
              inline: true,
            },
            {
              name: ':thumbsup: Likes',
              value: likeCount,
              inline: true,
            },
            {
              name: '__\n__',
              value: '__\n__',
              inline: false,
            },
            {
              name: ':eyes: Vues',
              value: views,
              inline: true,
            },
            {
              name: ':thumbsdown: Dislikes',
              value: dislikeCount,
              inline: true,
            },
            {
              name: ':pencil: Commentaires',
              value: commentCount,
            },
          ],
          thumbnail: { url: video.thumbnailUrl },
          footer: {
            text: `Date de publication : ${video.datePublished}`,
          },
          color: 0x1f75fe,
        },
      });
    }
    if (
      /https\:\/\/www\.youtube\.com\/watch\?v\=[\w\d\-]+/.test(
        message.content
      ) &&
      bot.YTVisu &&
      !message.channel.name.includes('annonce')
    ) {
      let regYt = /https\:\/\/www\.youtube\.com\/watch\?v\=[\w\d\-]+/;
      let url = message.content.match(regYt);
      let videoId = message.content
        .match(regYt)
        .toString()
        .match(/(?<=https:\/\/www.youtube.com\/watch\?v=)[\w\d\-]+/)
        .toString();
      const axios = require('axios');
      let ytdvideo = await axios.default.get(
        `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}&key=AIzaSyBIvSnYmTSRxjnyeDf106P1FsBqkngTKXs`
      );
      ytdvideo = ytdvideo.data;
      console.log(ytdvideo);
      let likeCount = ytdvideo.items[0].statistics.likeCount;
      let dislikeCount = ytdvideo.items[0].statistics.dislikeCount;
      let views = ytdvideo.items[0].statistics.viewCount;
      let commentCount = ytdvideo.items[0].statistics.commentCount;

      let title, description, owner, urlowner, duration, totalduration;
      const fetchVideoInfo = require('updated-youtube-info');
      await axios.default
        .get(
          `https://www.googleapis.com/youtube/v3/videos?part=snippet&part=contentDetails&id=${videoId}&key=AIzaSyBIvSnYmTSRxjnyeDf106P1FsBqkngTKXs`
        )
        .then((res) => {
          let info = res.data;
          let item = info.items[0].snippet,
            channelId = item.channelId;
          description = item.description;
          title = item.title;
          owner = item.channelTitle;
          totalduration = info.items[0].contentDetails.duration
            .replace(/(\d+)M/i, ` $1 minutes`)
            .replace(/(\d+)S/i, ` $1 secondes`)
            .replace(/(\d+)H/i, `$1 heures,`)
            .replace('PT', '');

          urlowner = `https://www.youtube.com/channel/${channelId}`;
        });

      let video = await fetchVideoInfo(videoId);
      message.channel.send({
        embed: {
          description: `**[${title}](${url})**\n  par **[${owner}](${urlowner})**`,
          fields: [
            {
              name: 'Description',
              value:
                description.length > 900
                  ? description.slice(0, 900).split(/ +/g).splice(1).join(' ') +
                    ` [\[...\]](${url})`
                  : description,
            },
            {
              name: '⏲️ Durée de la vidéo',
              value: totalduration,
              inline: true,
            },
            {
              name: ':thumbsup: Likes',
              value: likeCount,
              inline: true,
            },
            {
              name: '__\n__',
              value: '__\n__',
              inline: false,
            },
            {
              name: ':eyes: Vues',
              value: views,
              inline: true,
            },
            {
              name: ':thumbsdown: Dislikes',
              value: dislikeCount,
              inline: true,
            },
            {
              name: ':pencil: Commentaires',
              value: commentCount,
            },
          ],
          thumbnail: { url: video.thumbnailUrl },
          footer: {
            text: `Date de publication : ${video.datePublished}`,
          },
          color: 0x1f75fe,
        },
      });
    }

    let mywtt = /https:\/\/my.w.tt\/[^ ]+/gi;
    if (
      /https:\/\/my.w.tt\/[^ ]+/gi.test(message.content) &&
      bot.wattyVisu &&
      !message.channel.name.includes('annonce')
    ) {
      let lienAndroid = message.content.match(mywtt)[0];
      HTTPSRequest(lienAndroid).then(async (result) => {
        let regStory = /getElementById\("l"\).src\s*=\s*validate\("nullstory\/((?:.(?!\(;\s*))+)"\);\s*window.setTimeout\(function\(\)\s*\{\s*\s*if\s*\(!hasURI\)\s*\{\s*\s*window.top.location\s*=\s*validate\("((?:.(?!\(;\s*))+)"\);\s*\s*}\s*\s*intervalExecuted\s*=\s*true;\s*},\s*\d+\);\s*};\s*window.onblur\s*=\s*function\(\)\s*\{\s*hasURI\s*=\s*true;\s*};\s*window.onfocus\s*=\s*function\(\)\s*\{\s*if\s*\(hasURI\)\s*\{\s*\s*window.top.location\s*=\s*validate\("((?:.(?!\(;\s*))+)"\);\s*}\s*else\s*if\(intervalExecuted\)\s*\{\s*\s*window.top.location\s*=\s*validate\("((?:.(?!\(;\s*))+)"\);\s*}\s*}\s*<\/script/;
        let regUser = /getElementById\("l"\).src\s*=\s*validate\("nulluser\/((?:.(?!\(;\s*))+)"\);\s*window.setTimeout\(function\(\)\s*\{\s*\s*if\s*\(!hasURI\)\s*\{\s*\s*window.top.location\s*=\s*validate\("https:\/\/www.wattpad.com\/user\/((?:.(?!\(;\s*))+)"\);\s*\s*}\s*\s*intervalExecuted\s*=\s*true;\s*},\s*\d+\);\s*};\s*window.onblur\s*=\s*function\(\)\s*\{\s*hasURI\s*=\s*true;\s*};\s*window.onfocus\s*=\s*function\(\)\s*\{\s*if\s*\(hasURI\)\s*\{\s*\s*window.top.location\s*=\s*validate\("((?:.(?!\(;\s*))+)"\);\s*}\s*else\s*if\(intervalExecuted\)\s*\{\s*\s*window.top.location\s*=\s*validate\("((?:.(?!\(;\s*))+)"\);\s*}\s*}\s*<\/script/;

        if (regStory.test(result)) {
          let lienOrdi = await result.match(regStory)[3];
          HTTPSRequest(lienOrdi).then(async (ress) => {
            HTTPSRequest(
              ress.match(/<link rel="canonical" href="((?:.(?! ))+)" \/>/)[1]
            ).then(async (res) => {
              let alles = await res.match(
                /<img src="(https:\/\/a\.wattpad\.com\/cover\/[\d\w]+\-[\d\w]+\-[\d\w]+\.jpg)" height="\d+" width="\d+" alt="(?:.(?!><))+">\s?<\/div>\s?<h1>\s?((?:.(?!\/h1>))+)\s?<\/h1>/
              );
              let nameOfStory = alles[2];
              let ascii = /&#x(\d+);/g;
              if (ascii.test(nameOfStory)) {
                let pesto = await nameOfStory.match(ascii);

                let authorName = res.match(
                  /<a href="\/user\/((?:.(?! ))+)" class="(?:.(?!>))+">\s?<img src="(https:\/\/a\.wattpad\.com\/useravatar\/(?:.(?!\d+\.\d+))+\.\d+\.\d+\.jpg)" width="\d+" height="\d+" alt="((?:.(?! \/))+)" \/>\s?<\/a>/
                );
                let reginfo = /<span data-toggle="tooltip"\s?data-placement="bottom"\s?title="((?:[\dKk,\. ](?!Reads))+)\s?Reads">\s?((?:[\dKk,\. ](?!Reads))+)\s?Reads<\/span>\s?<span\s?data-toggle="tooltip"\s?data-placement="bottom"\s?title="((?:[\dKk,\. ](?!Votes))+)\s?Votes">\s?((?:[\dKk,\. ](?!Votes))+)\s?Votes<\/span>\s?<span>([\d]+)\s?Part\s?Story<\/span>\s?<\/div>\s?<div\s?class="promotion-description-story-details">\s<\/div>/i;
                let infosStory = await res.match(reginfo);
                loguer(reginfo.test(res));
                let coverURL = await alles[1];
                let viewCount = await infosStory[2];
                let viewCountPlus = await infosStory[1];
                let voteCountPlus = await infosStory[3];
                let voteCount = await infosStory[4];
                let chapterCount = await infosStory[5];
                for (let i of pesto) {
                  nameOfStory = await nameOfStory.replace(
                    ascii,
                    String.fromCharCode(
                      getValues(asc, i.match(/\d+/).toString())
                    )
                  );
                }
                loguer(pesto);
                message.repondre({
                  embed: {
                    description: `**Informations sur l'histoire [${nameOfStory.replace(
                      ascii,
                      String.fromCharCode(
                        getValues(asc, pesto.match(/\d+/).toString())
                      )
                    )}](${lienOrdi})**\n\n`,
                    thumbnail: { url: coverURL },
                    author: {
                      name: `@${authorName[1]}`,
                      icon_url: authorName[2],
                      url: 'https://www.wattpad.com/user/' + authorName[1],
                    },
                    fields: [
                      {
                        name: "Auteur(e) de l'histoire",
                        value: `${authorName[3]} (@${authorName[1]})`,
                      },
                      {
                        name: 'Lectures',
                        value: `${viewCount}${
                          viewCount !== viewCountPlus
                            ? ` (${viewCountPlus})`
                            : ''
                        }`,
                      },
                      {
                        name: 'Votes',
                        value: `${voteCount}${
                          voteCount !== voteCountPlus
                            ? ` (${voteCountPlus})`
                            : ''
                        }`,
                      },
                      {
                        name: 'Chapitres',
                        value: chapterCount,
                      },
                    ],
                    footer: {
                      text: `Histoire par ${authorName[1]}`,
                    },
                    color: 16748341,
                  },
                });
              } else {
                let authorName = res.match(
                  /<a href="\/user\/((?:.(?! ))+)" class="(?:.(?!>))+">\s?<img src="(https:\/\/a\.wattpad\.com\/useravatar\/(?:.(?!\d+\.\d+))+\.\d+\.\d+\.jpg)" width="\d+" height="\d+" alt="((?:.(?! \/))+)" \/>\s?<\/a>/
                );
                let reginfo = /<span data-toggle="tooltip"\s?data-placement="bottom"\s?title="((?:[\dKk,\. ](?!Reads))+)\s?Reads">\s?((?:[\dKk,\. ](?!Reads))+)\s?Reads<\/span>\s?<span\s?data-toggle="tooltip"\s?data-placement="bottom"\s?title="((?:[\dKk,\. ](?!Votes))+)\s?Votes">\s?((?:[\dKk,\. ](?!Votes))+)\s?Votes<\/span>\s?<span>([\d]+)\s?Part\s?Story<\/span>\s?<\/div>\s?<div\s?class="promotion-description-story-details">\s<\/div>/i;
                let infosStory = await res.match(reginfo);
                loguer(reginfo.test(res));
                let coverURL = await alles[1];
                let viewCount = await infosStory[2];
                let voteCount = await infosStory[4];
                let chapterCount = await infosStory[5];
                let viewCountPlus = await infosStory[1];
                let voteCountPlus = await infosStory[3];
                message.repondre({
                  embed: {
                    description: `**Informations sur l'histoire [${nameOfStory}](${lienOrdi})**\n\n`,
                    thumbnail: { url: coverURL },
                    author: {
                      name: `@${authorName[1]}`,
                      icon_url: authorName[2],
                      url: 'https://www.wattpad.com/user/' + authorName[1],
                    },
                    fields: [
                      {
                        name: "Auteur(e) de l'histoire",
                        value: `${authorName[3]} (@${authorName[1]})`,
                      },
                      {
                        name: 'Lectures',
                        value: `${viewCount}${
                          viewCount !== viewCountPlus
                            ? ` (${viewCountPlus})`
                            : ''
                        }`,
                      },
                      {
                        name: 'Votes',
                        value: `${voteCount}${
                          voteCount !== voteCountPlus
                            ? ` (${voteCountPlus})`
                            : ''
                        }`,
                      },
                      {
                        name: 'Chapitres',
                        value: chapterCount,
                      },
                    ],
                    footer: {
                      text: `Histoire par ${authorName[1]}`,
                    },
                    color: 16748341,
                  },
                });
              }
            });
          });
        } else if (regUser.test(result)) {
          let urlwatt = await result.match(regUser)[3];
          HTTPSRequest(urlwatt).then(async (res) => {
            let username = await res.match(
              /https:\/\/www.wattpad.com\/user\/((?:.(?! \/>))+)/
            )[1];
            let followersCount = await res.match(/(?<="numFollowers":)\d+K?/);
            let followingCount = await res.match(/(?<="numFollowing":)\d+K?/);
            let gender = await res
              .match(/(?<="gender":")(?:\w+)/)
              .toString()
              .replace(/she/i, 'Femme')
              .replace(/female/i, 'Femme')
              .replace(/male/i, 'Homme')
              .replace(/he/i, 'Homme')
              .replace(/they/i, 'Eux')
              .replace(/unknown/i, 'Inconnu');
            let storyCount = await res.match(
              /data\-id\="profile\-works"\>\n\<p\>(\d+)\<\/p\>\n\<p\>Works\<\/p\>\n\<\/div\>/
            )[1];
            let userAvatarURL = await res.match(
              /(?<="avatar":")(?:.(?!,"is))+/
            );
            let pseudo = await res
              .match(/(?<=<title>)(?:.(?!\/title))+/)
              .toString()
              .match(/(?:.(?! Wattpad))+/)
              .toString();
            let regcreatedat = /(?<="createDate":")(\d+)\-(\d+)\-(\d+)T(\d+):(\d+):(\d+)Z/;
            let resultCreatedAt = await res.match(regcreatedat);
            let createdat = {
              year: resultCreatedAt[1].toString(),
              month: resultCreatedAt[2].toString(),
              day: resultCreatedAt[3].toString(),
              hour: resultCreatedAt[4].toString(),
              min: resultCreatedAt[5].toString(),
              sec: resultCreatedAt[6].toString(),
            };
            let accountCreatedAt = `Le ${createdat.day}/${createdat.month}/${createdat.year} à ${createdat.hour}h${createdat.min} et ${createdat.sec} secondes`;
            let ascii = /&#x(\d+);/g;

            if (ascii.test(pseudo)) {
              let pesdo = pseudo.match(ascii)[1];
              await message.channel.send({
                embed: {
                  author: {
                    name: 'Wattpad',
                    icon_url: 'https://logodix.com/logo/15417.png',
                  },
                  description: `**Informations sur ${username} :**`,
                  fields: [
                    {
                      name: 'Pseudo',
                      value: pseudo.replace(
                        ascii,
                        String.fromCharCode(
                          getValues(asc, pesdo.match(/\d+/).toString())
                        )
                      ),
                      inline: true,
                    },
                    {
                      name: `Nombre d'abonnés`,
                      value: followersCount,
                      inline: true,
                    },
                    {
                      name: `Nombre d'abonnements`,
                      value: followingCount,
                      inline: true,
                    },
                    {
                      name: `Sexe`,
                      value: gender,
                      inline: true,
                    },
                    {
                      name: `Histoires`,
                      value: storyCount,
                      inline: true,
                    },
                    {
                      name: 'Compte créé le',
                      value: accountCreatedAt,
                      inline: true,
                    },
                  ],
                  color: 16748341,
                  thumbnail: {
                    url: userAvatarURL.toString(),
                  },

                  footer: {
                    text: `Informations sur ${username}`,
                  },
                },
              });
            } else {
              await message.channel.send({
                embed: {
                  author: {
                    name: 'Wattpad',
                    icon_url: 'https://logodix.com/logo/15417.png',
                  },
                  description: `**Informations sur ${`[${username}](${urlwatt})`} :**`,
                  fields: [
                    {
                      name: 'Pseudo',
                      value: pseudo,
                      inline: true,
                    },
                    {
                      name: `Nombre d'abonnés`,
                      value: followersCount,
                      inline: true,
                    },
                    {
                      name: `Nombre d'abonnements`,
                      value: followingCount,
                      inline: true,
                    },
                    {
                      name: `Sexe`,
                      value: gender,
                      inline: true,
                    },
                    {
                      name: `Histoires`,
                      value: storyCount,
                      inline: true,
                    },
                    {
                      name: 'Compte créé le',
                      value: accountCreatedAt,
                      inline: true,
                    },
                  ],
                  color: 16748341,
                  thumbnail: {
                    url: userAvatarURL.toString(),
                  },

                  footer: {
                    text: `Informations sur ${username}`,
                  },
                },
              });
            }
          });
        }
      });
    }
    let storyURL = message.content.match(
      /https:\/\/www.wattpad.com\/story\/\d+\-[^\s]+/i
    );
    if (
      storyURL &&
      storyURL.length !== 0 &&
      storyURL !== null &&
      bot.wattyVisu &&
      !message.channel.name.includes('annonce')
    ) {
      HTTPSRequest(storyURL.toString()).then(async (res) => {
        let alles = await res.match(
          /<img src="(https:\/\/a\.wattpad\.com\/cover\/[\d\w]+\-[\d\w]+\-[\d\w]+\.jpg)" height="\d+" width="\d+" alt="(?:.(?!><))+">\s?<\/div>\s?<h1>\s?((?:.(?!\/h1>))+)\s?<\/h1>/
        );
        let nameOfStory = alles[2];
        let ascii = /&#x\d+;/g;
        if (ascii.test(nameOfStory)) {
          let authorName = res.match(
            /<a href="\/user\/((?:.(?! ))+)" class="(?:.(?!>))+">\s?<img src="(https:\/\/a\.wattpad\.com\/useravatar\/(?:.(?!\d+\.\d+))+\.\d+\.\d+\.jpg)" width="\d+" height="\d+" alt="((?:.(?! \/))+)" \/>\s?<\/a>/
          );
          let reginfo = /<span data-toggle="tooltip"\s?data-placement="bottom"\s?title="((?:[\dKk,\. ](?!Reads))+)\s?Reads">\s?((?:[\dKk,\. ](?!Reads))+)\s?Reads<\/span>\s?<span\s?data-toggle="tooltip"\s?data-placement="bottom"\s?title="((?:[\dKk,\. ](?!Votes))+)\s?Votes">\s?((?:[\dKk,\. ](?!Votes))+)\s?Votes<\/span>\s?<span>([\d]+)\s?Part\s?Story<\/span>\s?<\/div>\s?<div\s?class="promotion-description-story-details">\s<\/div>/i;
          let infosStory = await res.match(reginfo);
          loguer(reginfo.test(res));
          let coverURL = await alles[1];
          let viewCount = await infosStory[2];
          let viewCountPlus = await infosStory[1];
          let voteCountPlus = await infosStory[3];
          let voteCount = await infosStory[4];
          let chapterCount = await infosStory[5];
          for (let i of nameOfStory.match(ascii)) {
            nameOfStory = await nameOfStory.replace(
              ascii,
              String.fromCharCode(getValues(asc, i.match(/\d+/).toString()))
            );
          }

          loguer(nameOfStory);
          message.repondre({
            embed: {
              description: `**Informations sur l'histoire [${nameOfStory}](${storyURL})**\n\n`,
              thumbnail: { url: coverURL },
              author: {
                name: `@${authorName[1]}`,
                icon_url: authorName[2],
                url: 'https://www.wattpad.com/user/' + authorName[1],
              },
              fields: [
                {
                  name: "Auteur(e) de l'histoire",
                  value: `${authorName[3]} (@${authorName[1]})`,
                },
                {
                  name: 'Lectures',
                  value: `${viewCount}${
                    viewCount !== viewCountPlus ? ` (${viewCountPlus})` : ''
                  }`,
                },
                {
                  name: 'Votes',
                  value: `${voteCount}${
                    voteCount !== voteCountPlus ? ` (${voteCountPlus})` : ''
                  }`,
                },
                {
                  name: 'Chapitres',
                  value: chapterCount,
                },
              ],
              footer: {
                text: `Histoire par ${authorName[1]}`,
              },
              color: 16748341,
            },
          });
        } else {
          let authorName = res.match(
            /<a href="\/user\/((?:.(?! ))+)" class="(?:.(?!>))+">\s?<img src="(https:\/\/a\.wattpad\.com\/useravatar\/(?:.(?!\d+\.\d+))+\.\d+\.\d+\.jpg)" width="\d+" height="\d+" alt="((?:.(?! \/))+)" \/>\s?<\/a>/
          );
          let reginfo = /<span data-toggle="tooltip"\s?data-placement="bottom"\s?title="((?:[\dKk,\. ](?!Reads))+)\s?Reads">\s?((?:[\dKk,\. ](?!Reads))+)\s?Reads<\/span>\s?<span\s?data-toggle="tooltip"\s?data-placement="bottom"\s?title="((?:[\dKk,\. ](?!Votes))+)\s?Votes">\s?((?:[\dKk,\. ](?!Votes))+)\s?Votes<\/span>\s?<span>([\d]+)\s?Part\s?Story<\/span>\s?<\/div>\s?<div\s?class="promotion-description-story-details">\s<\/div>/i;
          let infosStory = await res.match(reginfo);
          loguer(reginfo.test(res));
          let coverURL = await alles[1];
          let viewCount = await infosStory[2];
          let voteCount = await infosStory[4];
          let chapterCount = await infosStory[5];
          let viewCountPlus = await infosStory[1];
          let voteCountPlus = await infosStory[3];
          message.repondre({
            embed: {
              description: `**Informations sur l'histoire [${nameOfStory}](${storyURL})**\n\n`,
              thumbnail: { url: coverURL },
              author: {
                name: `@${authorName[1]}`,
                icon_url: authorName[2],
                url: 'https://www.wattpad.com/user/' + authorName[1],
              },
              fields: [
                {
                  name: "Auteur(e) de l'histoire",
                  value: `${authorName[3]} (@${authorName[1]})`,
                },
                {
                  name: 'Lectures',
                  value: `${viewCount}${
                    viewCount !== viewCountPlus ? ` (${viewCountPlus})` : ''
                  }`,
                },
                {
                  name: 'Votes',
                  value: `${voteCount}${
                    voteCount !== voteCountPlus ? ` (${voteCountPlus})` : ''
                  }`,
                },
                {
                  name: 'Chapitres',
                  value: chapterCount,
                },
              ],
              footer: {
                text: `Histoire par ${authorName[1]}`,
              },
              color: 16748341,
            },
          });
        }
      });
    }
    // Quitter le serveur dans lequel a été envoyé le message
    if (message.content === prefix + 'leave') {
      if (
        message.guild.id !== '574532041836593153' &&
        message.author.id === ownerID
      )
        await message.guild.leave();
    }
    // Déclarer les args
    let args = message.content.slice(prefix.length).trim().split(/ +/g);
    // Enlever le nom de la commande des args
    args.shift();

    // Changer le statut du bot. Envoyer `${prefix}status idle|dnd|online|invisible`
    if (message.content.startsWith(`${prefix}status`)) {
      if (
        !bot.config.admins.includes(message.author.id) &&
        !message.author.id === ownerID
      )
        return;
      message.delete();
      await bot.user.setStatus(args[0].toLowerCase());
    }

    // Prévisualisation des liens Wattpad vers un profil.
    let urlwatt = /https:\/\/www.wattpad.com\/user\/((?:[^ ])+)/;
    if (
      urlwatt.test(message.content) &&
      bot.wattyVisu &&
      !message.channel.name.includes('annonce')
    ) {
      let lien = message.content.match(urlwatt)[0];
      HTTPSRequest(lien).then(async (res) => {
        let username = message.content.match(urlwatt)[1];
        let followersCount = await res.match(/(?<="numFollowers":)\d+K?/);
        let followingCount = await res.match(/(?<="numFollowing":)\d+K?/);
        let gender = await res
          .match(/(?<="gender":")(?:\w+)/)
          .toString()
          .replace(/she/i, 'Femme')
          .replace(/female/i, 'Femme')
          .replace(/male/i, 'Homme')
          .replace(/he/i, 'Homme')
          .replace(/they/i, 'Eux')
          .replace(/unknown/i, 'Inconnu');
        let storyCount = await res.match(
          /data\-id\="profile\-works"\>\n\<p\>(\d+)\<\/p\>\n\<p\>Works\<\/p\>\n\<\/div\>/
        )[1];
        let userAvatarURL = await res.match(/(?<="avatar":")(?:.(?!,"is))+/);
        let pseudo = await res
          .match(/(?<=<title>)(?:.(?!\/title))+/)
          .toString()
          .match(/(?:.(?! Wattpad))+/)
          .toString();
        let regcreatedat = /(?<="createDate":")(\d+)\-(\d+)\-(\d+)T(\d+):(\d+):(\d+)Z/;
        let resultCreatedAt = await res.match(regcreatedat);
        let createdat = {
          year: resultCreatedAt[1].toString(),
          month: resultCreatedAt[2].toString(),
          day: resultCreatedAt[3].toString(),
          hour: resultCreatedAt[4].toString(),
          min: resultCreatedAt[5].toString(),
          sec: resultCreatedAt[6].toString(),
        };
        let accountCreatedAt = `Le ${createdat.day}/${createdat.month}/${createdat.year} à ${createdat.hour}h${createdat.min} et ${createdat.sec} secondes`;
        let ascii = /&#x(\d+);/g;

        if (ascii.test(pseudo)) {
          let pesdo = pseudo.match(ascii)[1];
          await message.channel.send({
            embed: {
              author: {
                name: 'Wattpad',
                icon_url: 'https://logodix.com/logo/15417.png',
              },
              description: `**Informations sur ${username} :**`,
              fields: [
                {
                  name: 'Pseudo',
                  value: pseudo.replace(
                    ascii,
                    String.fromCharCode(
                      getValues(asc, pesdo.match(/\d+/).toString())
                    )
                  ),
                  inline: true,
                },
                {
                  name: `Nombre d'abonnés`,
                  value: followersCount,
                  inline: true,
                },
                {
                  name: `Nombre d'abonnements`,
                  value: followingCount,
                  inline: true,
                },
                {
                  name: `Sexe`,
                  value: gender,
                  inline: true,
                },
                {
                  name: `Histoires`,
                  value: storyCount,
                  inline: true,
                },
                {
                  name: 'Compte créé le',
                  value: accountCreatedAt,
                  inline: true,
                },
              ],
              color: 16748341,
              thumbnail: {
                url: userAvatarURL.toString(),
              },

              footer: {
                text: `Informations sur ${username}`,
              },
            },
          });
        } else {
          await message.channel.send({
            embed: {
              author: {
                name: 'Wattpad',
                icon_url: 'https://logodix.com/logo/15417.png',
              },
              description: `**Informations sur ${`[${username}](${lien})`} :**`,
              fields: [
                {
                  name: 'Pseudo',
                  value: pseudo,
                  inline: true,
                },
                {
                  name: `Nombre d'abonnés`,
                  value: followersCount,
                  inline: true,
                },
                {
                  name: `Nombre d'abonnements`,
                  value: followingCount,
                  inline: true,
                },
                {
                  name: `Sexe`,
                  value: gender,
                  inline: true,
                },
                {
                  name: `Histoires`,
                  value: storyCount,
                  inline: true,
                },
                {
                  name: 'Compte créé le',
                  value: accountCreatedAt,
                  inline: true,
                },
              ],
              color: 16748341,
              thumbnail: {
                url: userAvatarURL.toString(),
              },

              footer: {
                text: `Informations sur ${username}`,
              },
            },
          });
        }
      });
    }

    if (message.content.toLowerCase().startsWith(prefix + 'viewcode')) {
      const msg = await message.channel.messages.fetch(args[0]);
      if (!msg.embeds || !msg.embeds[0])
        return message.channel
          .send('Ce message ne contient aucun embed !')
          .then((m) => {
            message.delete();
            m.delete();
          });
      let embed = JSON.stringify(msg.embeds[0].toJSON(), null, '\t');
      return message.channel.send('```json\n' + embed + '\n```');
    }

    // Obtenir le code source d'une page Web
    if (message.content.toLowerCase().startsWith(prefix + 'getsource')) {
      const URL = args.join('_'),
        ISHTTPS = /https/.test(URL);

      if (ISHTTPS) {
        HTTPSRequest(URL)
          .then((res) => {
            if (typeof res !== 'string') throw res;

            const ISJSON = res.startsWith('{');
            if (ISJSON) {
              if (res.length >= 1000) {
                return message.channel.send({
                  files: [
                    { attachment: Buffer.from(res), name: 'source.json' },
                  ],
                });
              } else return message.channel.send('```json\n' + res + '\n```');
            } else {
              if (res.length >= 1000) {
                return message.channel.send({
                  files: [
                    { attachment: Buffer.from(res), name: 'source.html' },
                  ],
                });
              } else return message.channel.send('```html\n' + res + '\n```');
            }
          })
          .catch((err) =>
            message.channel.send('```cs\n' + err.toString() + '\n```')
          );
      } else if (/http/.test(URL)) {
        await HTTPRequest(URL)
          .then((res) => {
            if (typeof res !== 'string') throw res;

            const ISJSON = res.startsWith('{');
            if (ISJSON) {
              if (res.length >= 1000) {
                return message.channel.send({
                  files: [
                    { attachment: Buffer.from(res), name: 'source.json' },
                  ],
                });
              } else return message.channel.send('```json\n' + res + '\n```');
            } else {
              if (res.length >= 1000) {
                return message.channel.send({
                  files: [
                    { attachment: Buffer.from(res), name: 'source.html' },
                  ],
                });
              } else return message.channel.send('```html\n' + res + '\n```');
            }
          })
          .catch((err) =>
            message.channel.send('```cs\n' + err.toString() + '\n```')
          );
      }
    }
  }
};
