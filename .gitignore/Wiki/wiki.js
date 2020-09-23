const { MessageEmbed } = require('discord.js'),
  axios = require('axios'),
  cheerio = require('cheerio'),
  {
    getInformationsPost,
    postTotalInformations,
    regBlogs,
    regInfos,
    regres,
  } = require('./regex');

/**
 * Modèle de fandom sur lequel se baser pour les commmandes
 */
class Wiki {
  /**
   * Créer un embed quand un billet de blog est posté sur le wiki
   * @public
   * @example
   * Wiki.checkBlogsPosted().then((result) => console.log(result));
   * // MessageEmbed|undefined
   */
  async checkBlogsPosted() {
    const bot = require('../setup.js');
    const blogEmbed = new MessageEmbed();

    await axios.default
      .get(
        encodeURI(
          `https://${this.nameURL}.fandom.com/fr/wiki/Blog:Billets_récents`
        )
      )
      .then(async (res) => {
        const data = res.data;

        let matched = await data.match(regBlogs);
        if (matched === null || matched === undefined) {
          return undefined;
        }
        matched = matched[0];
        const avatarurl =
          (await matched.match(regInfos)[1]) ||
          (await matched.match(
            /(?<=class="blog-listing__user-avatar__image"\/*src=")[^"]+/
          ));
        const user_name =
          (await matched.match(regInfos)[2]) ||
          (await matched.match(
            /(?<=class="blog-listing__user-name"\/*>)[^<]+/
          ));
        const timestamp =
          (await matched.match(regInfos)[3]) ||
          (await matched.match(
            /(?<=<span class="blog-listing__timestamp"\/*>)[^<]+/
          ));
        const link =
          `https://${this.nameURL}.fandom.com` +
          ((await matched.match(regInfos)[4]) ||
            (await matched.match(
              /(?<=class="blog-listing__title">\/*<a\/*href=")[^"]+/
            )));
        const title = await matched.match(regInfos)[5];
        let content =
            (await matched.match(regInfos)[6])
              .replace(/<p>/g, '')
              .replace(/<\/p>/g, '') ||
            (
              await matched.match(
                /(?<=class="blog-listing__summary">\/*)(?:<p>[^<]+<\/p>\/*)+/
              )
            )
              .replace(/<p>/g, '')
              .replace(/<\/p>/g, '')
              .replace(
                /<a href="([^"]+)">((?:.(?!\/a>))+)/g,
                `[$2](${`https://${this.nameURL}.fandom.com$1`})`
              ),
          user_url = encodeURI(
            `https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Utilisateur:${user_name}`
          );
        blogEmbed
          .setAuthor(user_name, avatarurl, user_url)
          .setTitle(title.correctString())
          .setURL(link)
          .setDescription(content.correctString())
          .setColor('RANDOM')
          .setFooter(timestamp.correctCase());
      });
    if (
      (
        await bot.channels.cache
          .get('751855074657042594')
          .messages.fetch({ limit: 1 })
      ).first().content !== blogEmbed.url
    ) {
      if (blogEmbed.url === undefined || blogEmbed.url === null) {
        return undefined;
      } else {
        await bot.channels.cache.get('751855074657042594').send(blogEmbed.url);
        return blogEmbed;
      }
    } else return undefined;
  }

  /**
   * Rechercher sur le wiki
   * @public
   * @param {string} toSearch Ce qu'il faut rechercher
   * @param {string} filter La catégorie par laquelle filtrer
   * @returns {Promise<MessageEmbed>}
   * @example
   * Wiki.search('Sophie', 'users').then(result => console.log(result));
   * // MessageEmbed
   */
  async search(toSearch, filter = false) {
    const embed = new MessageEmbed();

    if (filter) {
      embed.setColor('RANDOM').setTimestamp();
      filter = filter
        .replace(/u+s+e+u*r+s*/, 'users')
        .replace(/u+t+i+l+i+[sz]+a+t+e+u*r+s*/, 'users')
        .replace(/c+o+m+[ea]+n+t+a+i+r+e*s*/, 'commentaires')
        .replace(/d+i+s+c+u+[st]+i+o+n+s*/, 'commentaires')
        .replace(/b+l+o+g+[sue]*/, 'blog')
        .replace(/a+l+/, 'all')
        .replace(/t+o+u+[ts]*e*/, 'all');

      let boolResult = true;
      if (filter === 'users') {
        await axios.default
          .get(
            encodeURI(
              `https://gardiens-des-cites-perdues.fandom.com/fr/api.php?action=opensearch&format=json&search=${toSearch}&namespace=2&limit=500`
            )
          )
          .then(async (res) => {
            let body = res.data;
            let titles = body[1];
            let links = body[3];
            if (titles.length === 0) {
              boolResult = false;
            } else {
              embed.setDescription(
                `${
                  titles.length < 500 ? titles.length : 'Plus de 500'
                } résultats trouvés`
              );
              embed.title = `Résultats de la recherche pour \`${toSearch.trim()}\` dans les utilisateurs du wiki`;
              for (let i = 0; i < titles.length; i++) {
                if (i > 20) break;
                embed.addField(
                  titles[i].replace(/Utilisateur\:/, ''),
                  `[Page de profil](${links[i]})`
                );
              }
            }
          });
      } else if (filter === 'commentaires') {
        await axios.default
          .get(
            encodeURI(
              `https://gardiens-des-cites-perdues.fandom.com/fr/api.php?action=opensearch&format=json&search=${toSearch}&namespace=1&limit=500`
            )
          )
          .then(async (res) => {
            let body = res.data;
            let titles = body[1];
            let links = body[3];
            if (titles.length === 0) {
              boolResult = false;
            } else {
              embed.setDescription(
                `${
                  titles.length < 500 ? titles.length : 'Plus de 500'
                } résultats trouvés`
              );
              embed.title = `Résultats de la recherche pour \`${toSearch.trim()}\` dans les commentaires du wiki`;
              for (let i = 0; i < titles.length; i++) {
                if (i > 20) break;
                embed.addField(
                  titles[i].replace(/Discussion:/i, ''),
                  `[Lien vers le commentaire](${links[i]})`
                );
              }
            }
          });
      } else if (filter === 'all') {
        await axios.default
          .get(
            encodeURI(
              `https://gardiens-des-cites-perdues.fandom.com/fr/api.php?action=opensearch&format=json&search=${toSearch}&namespace=*&limit=500`
            )
          )
          .then(async (res) => {
            let body = res.data;
            let titles = body[1];
            let links = body[3];
            if (titles.length === 0) {
              boolResult = false;
            } else {
              embed.setDescription(
                `${
                  titles.length < 500 ? titles.length : 'Plus de 500'
                } résultats trouvés`
              );
              embed.title = `Résultats de la recherche pour \`${toSearch.trim()}\` dans tout le wiki`;
              for (let i = 0; i <= 15; i++) {
                embed.addField(
                  titles[i].replace(/:/g, ' : '),
                  `[Lien](${links[i]})`
                );
              }
            }
          });
      } else if (filter === 'blog') {
        await axios.default
          .get(
            encodeURI(
              `https://gardiens-des-cites-perdues.fandom.com/fr/api.php?action=opensearch&format=json&search=${toSearch}&namespace=500&limit=500`
            )
          )
          .then(async (res) => {
            let body = res.data;
            let titles = body[1];
            let links = body[3];
            if (titles.length === 0) {
              boolResult = false;
            } else {
              embed.setDescription(
                `${
                  titles.length < 500 ? titles.length : 'Plus de 500'
                } résultat${titles.length > 1 ? 's' : ''} trouvés`
              );
              embed.title = `Résultats de la recherche pour \`${toSearch.trim()}\` dans les blogs d'utilisateurs`;
              await titles.splice(20);

              for (let i = 0; i < titles.length; i++) {
                titles[i] = await titles[i].replace(
                  /blog\s*utilisateur:/gi,
                  ''
                );
                if (i === titles.length - 1) {
                  embed.addField(
                    titles[i],
                    `[Blog](${
                      links[i]
                    })\n\n[Voir tous les résultats](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Spécial:Recherche?scope=internal&query=${toSearch.trim()}&ns%5B0%5D=500&ns%5B1%5D=502)`
                  );
                } else {
                  embed.addField(titles[i], `[Blog](${links[i]})`);
                }
              }
            }
          });
      } else {
        return 'Aucune catégorie de recherche trouvée';
      }
      if (boolResult) {
        return embed;
      } else return 'Aucun résultat trouvé';
    } else {
      if (toSearch === '') return "Veuillez préciser ce qu'il faut rechercher";

      let nbrresults;
      let results = [];
      await axios.default
        .get(
          encodeURI(
            `https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Spécial:Recherche?query=${toSearch}&scope=internal`
          )
        )
        .then(async (res) => {
          if (
            !/Environ (\d+) résultat/i.test(res.data) &&
            !/Résultats? pour /i.test(res.data)
          )
            boolResult = false;
          let tableau = await res.data.match(regres);

          tableau.forEach(async (elem) => {
            let rege = /<li\s*class="[^"]+">\s*<article>\s*<h1>\s*<a\s*href="([^"]+)"\s*class="[^"]+"\s*data-wiki-id="\d+"\s*data-page-id="\d+"\s*data-title="([^"]+)"\s*data-thumbnail="([^"]+)"\s*data-position="\d+">[^<]+<\/a>\s*<\/h1>\s*<div\s*class="[^"]+">\s*(?:(?:<span\s*class="searchmatch">[^<]+<\/span>)?[^<]+)+/;
            let matched = await elem.match(rege);
            matched.forEach(async (matche) => {
              if (matche.length > 500) return;
              results.push(matche);
            });
            try {
              nbrresults = res.data.match(/Environ (\d+) résultat/i)[1];
            } catch {
              nbrresults = results.length / 3;
            }
            if (nbrresults === 0) nbrresults = 1;
          });
        })
        .then(async () => {
          let titles = [];
          let links = [];
          results.forEach(async (ress) => {
            if (
              [
                1,
                4,
                7,
                10,
                13,
                16,
                19,
                22,
                25,
                28,
                31,
                34,
                37,
                40,
                43,
                46,
                49,
                52,
                55,
                58,
                61,
                64,
                67,
                70,
                73,
              ].includes(results.indexOf(ress))
            ) {
              titles.push(ress);
            } else if (
              [
                0,
                3,
                6,
                9,
                12,
                15,
                18,
                21,
                24,
                27,
                30,
                33,
                36,
                39,
                42,
                45,
                48,
                51,
                54,
                57,
                60,
                63,
                66,
                69,
                72,
              ].includes(results.indexOf(ress))
            ) {
              links.push(ress);
            }
          });
          if (titles.length <= 4 && titles.length !== 0) {
            embed.title = `Résultats de la recherche pour \`${toSearch}\``;
            embed.description = `\`${nbrresults}\` résultat${(titles.length = 1
              ? ' '
              : 's')} trouvé${(titles.length = 1 ? ' ' : 's')}`;
            embed.fields = [
              {
                name:
                  titles[0] !== undefined
                    ? titles[0].correctString()
                    : undefined,
                value: `[Voir la page](${
                  links[0]
                })\n\n**[Voir tous les résultats](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Spécial:Recherche?query=${toSearch
                  .split(/ +/g)
                  .join('+')})**`,
              },
            ];
            embed.footer = {
              text: `Résultat de la recherche sur le wiki GDCP`,
              icon_url:
                'https://vignette.wikia.nocookie.net/gardiens-des-cites-perdue/images/8/89/Wiki-wordmark.png/revision/latest?cb=20191113140030&path-prefix=fr',
            };
            embed.thumbnail = {
              url:
                'https://vignette.wikia.nocookie.net/gardiens-des-cites-perdue/images/f/f7/Sophie_Foster_.jpg/revision/latest?cb=20170806113107&path-prefix=fr',
            };
            embed.url = `https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Spécial:Recherche?query=${toSearch
              .split(/ +/g)
              .join('+')}`;
            embed.setTimestamp();
            embed.setColor('RANDOM').setTimestamp();
          } else if (
            8 > titles.length &&
            titles.length >= 5 &&
            titles.length !== 0
          ) {
            embed.title = `Résultats de la recherche pour \`${toSearch}\``;
            embed.description = `Environ \`${nbrresults}\` résultats trouvés`;
            embed.fields = [
              {
                name:
                  titles[0] !== undefined
                    ? titles[0].correctString()
                    : undefined,
                value: `[Voir la page](${links[0]})`,
              },
              {
                name:
                  titles[1] !== undefined
                    ? titles[1].correctString()
                    : undefined,
                value: `[Voir la page](${links[1]})`,
              },
              {
                name:
                  titles[2] !== undefined
                    ? titles[2].correctString()
                    : undefined,
                value: `[Voir la page](${links[2]})`,
              },
              {
                name:
                  titles[3] !== undefined
                    ? titles[3].correctString()
                    : undefined,
                value: `[Voir la page](${links[3]})`,
              },
              {
                name:
                  titles[4] !== undefined
                    ? titles[4].correctString()
                    : undefined,
                value: `[Voir la page](${
                  links[4]
                })\n\n**[Voir tous les résultats](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Spécial:Recherche?query=${toSearch
                  .split(/ +/g)
                  .join('+')})**`,
              },
            ];
            embed.footer = {
              text: `Résultats de la recherche sur le wiki GDCP`,
              icon_url:
                'https://vignette.wikia.nocookie.net/gardiens-des-cites-perdue/images/8/89/Wiki-wordmark.png/revision/latest?cb=20191113140030&path-prefix=fr',
            };
            embed.thumbnail = {
              url:
                'https://vignette.wikia.nocookie.net/gardiens-des-cites-perdue/images/f/f7/Sophie_Foster_.jpg/revision/latest?cb=20170806113107&path-prefix=fr',
            };
            embed.url = `https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Spécial:Recherche?query=${toSearch
              .split(/ +/g)
              .join('+')}`;
            embed.setTimestamp();
            embed.setColor('RANDOM').setTimestamp();
          } else {
            embed.title = `Résultats de la recherche pour \`${toSearch}\``;
            embed.description = `Environ \`${nbrresults}\` résultats trouvés`;
            embed.fields = [
              {
                name:
                  titles[0] !== undefined
                    ? titles[0].correctString()
                    : undefined,
                value: `[Voir la page](${links[0]})`,
              },
              {
                name:
                  titles[1] !== undefined
                    ? titles[1].correctString()
                    : undefined,
                value: `[Voir la page](${links[1]})`,
              },
              {
                name:
                  titles[2] !== undefined
                    ? titles[2].correctString()
                    : undefined,
                value: `[Voir la page](${links[2]})`,
              },
              {
                name:
                  titles[3] !== undefined
                    ? titles[3].correctString()
                    : undefined,
                value: `[Voir la page](${links[3]})`,
              },
              {
                name:
                  titles[4] !== undefined
                    ? titles[4].correctString()
                    : undefined,
                value: `[Voir la page](${links[4]})`,
              },
              {
                name:
                  titles[5] !== undefined
                    ? titles[5].correctString()
                    : undefined,
                value: `[Voir la page](${links[5]})`,
              },
              {
                name:
                  titles[6] !== undefined
                    ? titles[6].correctString()
                    : undefined,
                value: `[Voir la page](${links[6]})`,
              },
              {
                name:
                  titles[7] !== undefined
                    ? titles[7].correctString()
                    : undefined,
                value: `[Voir la page](${
                  links[7]
                })\n\n**[Voir tous les résultats](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Spécial:Recherche?query=${toSearch
                  .split(/ +/g)
                  .join('+')})**`,
              },
            ];
            embed.url = `https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Spécial:Recherche?query=${toSearch
              .split(/ +/g)
              .join('+')}`;
            embed.footer = {
              text: `Résultats de la recherche sur le wiki GDCP`,
              icon_url:
                'https://vignette.wikia.nocookie.net/gardiens-des-cites-perdue/images/8/89/Wiki-wordmark.png/revision/latest?cb=20191113140030&path-prefix=fr',
            };
            embed.thumbnail = {
              url:
                'https://vignette.wikia.nocookie.net/gardiens-des-cites-perdue/images/f/f7/Sophie_Foster_.jpg/revision/latest?cb=20170806113107&path-prefix=fr',
            };
            embed.setTimestamp();
            embed.setColor('RANDOM').setTimestamp();
          }
        });
      if (embed.fields[0].name === undefined) return undefined;
      return embed;
    }
  }

  /**
   * @private
   * @example
   * Wiki.getCategories().then((embed) => console.log(embed));
   * // MessageEmbed
   */
  async _getCategories() {
    const code = (
      await axios.default.get(
        'https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Cat%C3%A9gorie:Cat%C3%A9gories'
      )
    ).data;

    const $ = cheerio.load(code);

    let categories = $('a[class="category-page__member-link"]');
    let links = [];
    let names = [];
    categories
      .toArray()
      .forEach((cat) =>
        names.push(cat.attribs.title.replace('Catégorie:', ''))
      );
    categories
      .toArray()
      .forEach((cat) =>
        links.push(`https://${this.nameURL}.fandom.com` + cat.attribs.href)
      );

    let total = $('p[class="category-page__total-number"]')
      .text()
      .replace('pages', 'catégories');

    const embed = new MessageEmbed()
      .setColor('RANDOM')
      .setTitle('Liste des catégories de tout le wiki')
      .setURL(
        'https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Cat%C3%A9gorie:Cat%C3%A9gories'
      )
      .setDescription(
        `Nombre de catégories : ${/\d+/.exec(
          total
        )}\n\n[Voir toutes les catégories](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Cat%C3%A9gorie:Cat%C3%A9gories)`
      );

    // embed.addField('\u200b', '\u200b');
    for (let i = 0; i <= 10; i++) {
      embed.addField(names[i], `[**Voir la catégorie**](${links[i]})`);
    }
    return { embed: embed, total: parseInt(total.match(/\d+/)[0]) };
  }

  /**
   * @private
   * @returns {Promise<string>}
   * @example
   * Wiki._getTotalChanges().then(res => console.log(res));
   * // xxx&#160;xxx
   * // (x is a Number)
   */
  async _getTotalChanges() {
    let totalChanges;
    const regChanges = /(?<=<div class="community-info-stats__value">)\d+(?=<\/div>)/i;
    await axios.default
      .get('https://gardiens-des-cites-perdues.fandom.com/fr/f')
      .then(async (res) => {
        totalChanges = await res.data.match(regChanges)[0];
      });
    return totalChanges.correctString();
  }

  /**
   * Liste des noms et liens des pages populaires du wiki
   * @private
   * @returns {Promise<string>}
   * @example
   * Wiki._getPopularPages().then(res => console.log(res))
   * // Pages populaires
   */
  async _getPopularPages() {
    let result;
    const regPop = /(?<=<div class="description-background"><\/div>\s*<div class="description">\s*<h2>)[^<]+(?=\<\/h2>\s*<p class="mw-empty-elt"><\/p>\s*<p class="read-more-button-wrapper">)/g;
    await axios.default
      .get(
        'https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Wiki_Gardiens_des_Cit%C3%A9s_Perdues'
      )
      .then((res) => {
        let populars = res.data.match(regPop);
        result = populars
          .map(
            (pop) =>
              `[${pop.replace(/ :(?=[A-Za-z])/, ' : ')}](${encodeURI(
                `https://${this.nameURL}.fandom.com/fr/wiki/${pop.replace(
                  / :(?=[A-Za-z])/,
                  ' : '
                )}`
              )})`
          )
          .join(' 🔹 ');
      });
    return result;
  }

  /**
   * @returns {Promise<number>}
   * @private
   */
  async _getTotalPages() {
    let retour;
    await axios.default
      .get(
        'https://gardiens-des-cites-perdues.fandom.com/fr/api.php?action=query&meta=allmessages|siteinfo&ammessages=custom-Wiki_Manager|custom-FandomMergeNotice&amenableparser=true&siprop=general|statistics|wikidesc&titles=Special:Statistics&format=json'
      )
      .then((res) => {
        const results = res.data;
        retour = parseInt(results.query.statistics.pages);
      });
    return retour;
  }

  /**
   * @returns {Promise<string>}
   * @private
   */
  async _getUsers() {
    let users;
    await axios.default
      .get(
        'https://gardiens-des-cites-perdues.fandom.com/fr/api.php?action=query&meta=allmessages|siteinfo&ammessages=custom-Wiki_Manager|custom-FandomMergeNotice&amenableparser=true&siprop=general|statistics|wikidesc&titles=Special:Statistics&format=json'
      )
      .then((res) => {
        const results = res.data;
        users =
          results.query.statistics.users +
          ` (${results.query.statistics.activeusers} actifs)`;
      });
    return users;
  }

  /**
   * @returns {Promise<number>}
   * @private
   */
  async _getArticlesCount() {
    let retour;

    await axios.default
      .get(
        'https://gardiens-des-cites-perdues.fandom.com/fr/api.php?action=query&meta=allmessages|siteinfo&ammessages=custom-Wiki_Manager|custom-FandomMergeNotice&amenableparser=true&siprop=general|statistics|wikidesc&titles=Special:Statistics&format=json'
      )
      .then((res) => {
        const results = res.data;
        retour = parseInt(results.query.statistics.articles);
      });
    return retour;
  }

  /**
   * Créer un embed quand un billet de blog est posté sur le wiki
   * @public
   * @example
   * Wiki.checkPosts().then((result) => console.log(result));
   * // MessageEmbed|undefined
   */
  async checkPosts() {
    const bot = require('../setup.js');
    const blogEmbed = new MessageEmbed();
    const data = (
      await axios.default.get(
        'https://gardiens-des-cites-perdues.fandom.com/fr/f'
      )
    ).data;

    const infos = await data.match(postTotalInformations);
    if (!infos || infos.length === 0) {
      return undefined;
    }
    /**
     *
     * @param  {...string} dates
     */
    function getLatestDate(...dates) {
      /**
       * @type {number[]}
       */
      let nums = [];
      dates.forEach((date) => {
        let toPush = new Date(date).getTime();
        nums.push(toPush);
      });
      return nums.sort((a, b) => b - a)[0];
    }

    let mostRecent = infos[0];
    let dates = [],
      latestDate;
    infos.forEach((info) => {
      if (
        /<time\s*datetime="[^"]+"\s*title="[^"]+"\s*>\s*[^<]+<\/time\s*>/is.test(
          info
        )
      ) {
        let matched = info.match(
          /<time\s*datetime="([^"]+)"\s*title="[^"]+"\s*>\s*[^<]+<\/time\s*>/is
        )[1];
        dates.push(matched);
      }
    });
    latestDate = getLatestDate(...dates);
    infos.forEach((info) => {
      if (
        /<time\s*datetime="[^"]+"\s*title="[^"]+"\s*>\s*[^<]+<\/time\s*>/is.test(
          info
        )
      ) {
        let matched = info.match(
          /<time\s*datetime="([^"]+)"\s*title="[^"]+"\s*>\s*[^<]+<\/time\s*>/is
        )[1];
        if (latestDate === new Date(matched).getTime()) mostRecent = info;
      }
    });

    /**
     * @type {RegExpMatchArray}
     */
    const infosSelected = mostRecent.match(getInformationsPost);
    const userURL = `https://${this.nameURL}.fandom.com` + infosSelected[1],
      thumbnail = infosSelected[2],
      // timestampURL = `https://${this.nameURL}.fandom.com` + infosSelected[3],
      user_name = cheerio
        .load(infosSelected[0])('a[class="post-attribution__username"]')
        .text(),
      timestamp = infosSelected[4],
      title = infosSelected[9],
      catURL = `https://${this.nameURL}.fandom.com` + infosSelected[6];
    let img;
    try {
      img = cheerio
        .load(infosSelected[0])('img[class="post__image"]')
        .toArray()[0].attribs.src;
    } catch {}
    let content;
    try {
      infosSelected[10]
        .replace(
          /<a href="([^"]+)">((?:.(?!\/a>))+)/g,
          `[$2](${`https://${this.nameURL}.fandom.com$1`})`
        )
        .replace(/<\/lu>/g, '')
        .replace(/<li>((?:.(?!\/li>))+)<\/li>\s*/gis, ' - $1\n')
        .split(/<\/p>/g)
        .forEach((par) => {
          let toUse = par + '</p>';
          let $ = cheerio.load(toUse);
          content = content + $('p').text() + '\n';
        });
    } catch {}

    const cat = infosSelected[7],
      upVotes = infosSelected[12],
      comments = infosSelected[13],
      link = `https://${this.nameURL}.fandom.com` + infosSelected[8];
    if (infosSelected[10].includes('post-poll'))
      content = `[[Sondage](${link})]`;
    content = content.replace(/(?:undefined|null)/g, '');

    blogEmbed
      .setAuthor(user_name, thumbnail, userURL)
      .setTitle(title.correctString())
      .setURL(link)
      .setDescription(` dans [${cat}](${catURL})\n\n${content.correctString()}`)
      .setImage(img)
      .setColor('RANDOM')
      .setFooter(
        timestamp.correctDate() +
          ' •' +
          (parseInt(upVotes) !== 0 ? ` ${upVotes} ❤️` : 'Aucun vote') +
          ' •' +
          (parseInt(comments) !== 0
            ? ` ${comments} commentaires`
            : ' Aucun commentaire')
      );

    if (
      (
        await bot.channels.cache
          .get('755540919263953036')
          .messages.fetch({ limit: 1 })
      ).first().content !== blogEmbed.url
    ) {
      if (blogEmbed.url === undefined || blogEmbed.url === null) {
        return undefined;
      } else {
        await bot.channels.cache.get('755540919263953036').send(blogEmbed.url);
        return blogEmbed;
      }
    }

    return undefined;
  }

  /**
   * Créer un embed avec une page Aléatoire du wiki
   * @public
   * @example
   * Wiki.random().then((result) => console.log(result));
   * // MessageEmbed|undefined
   */
  async random() {
    const embed = new MessageEmbed().setColor('RANDOM');
    await axios.default
      .get(
        'https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Sp%C3%A9cial:Random'
      )
      .then(async (res) => {
        const title =
          (await res.data.match(/<title>([^<]+)<\/title>/)[1]) ||
          (await res.data
            .match(/<title>[^<]+<\/title>/)
            .match(/(?<=>)[^<]+(?=<)/));
        if (!title) return undefined;

        const link =
          (await res.data.match(
            /<link rel="canonical" href="([^"]+)"\/>/
          )[1]) ||
          (await res.data.match(/<link rel="canonical" href="[^"]+"\/>/));
        if (!link) return undefined;
        let description =
          (await res.data.match(
            /<meta name="description" content="([^"]+)"/
          )[1]) ||
          (await res.data
            .match(/<meta name="description" content="[^"]+"/)
            .match(/(?<=content=")[^"]+(?=")/));
        if (!description) return undefined;
        description = description.replace(
          /<a href="([^"]+)">((?:.(?!\/a>))+)/g,
          `[$2](${`https://${this.nameURL}.fandom.com$1`})`
        );
        let imgURL;
        try {
          await axios.default.get(encodeURI(link)).then(async (body) => {
            imgURL =
              (await body.data.match(
                /<meta property="og:image" content="([^"]+)"\/>/
              )[1]) ||
              (await body.data
                .match(/<meta property="og:image" content="[^"]+"\/>/)
                .match(/(?<=content=")[^"]+(?=")/));
          });
        } catch {
          await axios.default.get(link).then(async (body) => {
            imgURL =
              (await body.data.match(
                /<meta property="og:image" content="([^"]+)"\/>/
              )[1]) ||
              (await body.data
                .match(/<meta property="og:image" content="[^"]+"\/>/)
                .match(/(?<=content=")[^"]+(?=")/));
          });
        }
        if (!imgURL) imgURL = this.bot.user.avatarURL();
        embed
          .setTitle(title.correctString())
          .setURL(link)
          .setDescription(description.correctString())
          .setThumbnail(imgURL.correctString())
          .setFooter("Génération d'une page aléatoire du wiki");
      });
    return embed;
  }

  /**
   * @param {string} name Le nom du wiki fandom
   * @param {string} nameURL Le nom du wiki fandom en format URI
   */
  constructor(name, nameURL) {
    this.name = name;
    this.nameURL = nameURL;
    this._getCategories().then((res) => (this.categories = res));
    this._getTotalChanges().then((res) => (this.totalChanges = res));
    this._getPopularPages().then((res) => (this.popularPages = res));
    this._getTotalPages().then((pages) => (this.totalPages = pages));
    this._getUsers().then((users) => (this.users = users));
    this._getArticlesCount().then((articles) => (this.articles = articles));
  }
}

module.exports = Wiki;
