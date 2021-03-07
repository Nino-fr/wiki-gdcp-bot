const { MessageEmbed } = require('discord.js'),
  axios = require('axios'),
  cheerio = require('cheerio'),
  {
    getInformationsPost,
    postTotalInformations,
    regBlogs,
    regInfos,
    // regres,
  } = require('./regex');

/**
 * Modèle de fandom sur lequel se baser pour les commmandes
 */
class Wiki {
  /**
   * Créer un embed quand un billet de blog est posté sur le wiki
   * @example
   * Wiki.checkBlogsPosted().then((result) => console.log(result));
   * // MessageEmbed|undefined
   */
  async checkBlogsPosted() {
    // const bot = require('../setup.js');
    const blogEmbed = new MessageEmbed();
    try {
      await axios.default
        .get(
          encodeURI(
            `https://${this.nameURL}.fandom.com/fr/wiki/Blog:Billets_récents`
          )
        )
        .then(async (res) => {
          /**
           * @type {string}
           */
          const data = res.data;

          let matched = data.match(regBlogs);
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
          // const timestamp = new Date().toLocaleDateString('fr');
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
                .replace(/<\/p>/g, '')
                .replace(
                  /<a href="([^"]+)">((?:.(?!\/a>))+)/g,
                  `[$2](${`https://${this.nameURL}.fandom.com$1`})`
                )
                .replace(
                  /<a href="([^"]+)"(?:(?:[^>](?!<\/a>))+)>([^<]+)/g,
                  `[$2]($1)`
                ) ||
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
                )
                .replace(
                  /<a href="([^"]+)"(?:(?:[^>](?!<\/a>))+)>([^<]+)/g,
                  `[$2]($1)`
                ),
            user_url = encodeURI(
              `https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Utilisateur:${user_name}`
            );
          content = content.correctString();
          blogEmbed
            .setAuthor(user_name, avatarurl, user_url)
            .setTitle(title.correctString())
            .setURL(link)
            .setDescription(
              content.length > 900 ? content.slice(0, 890) + '\n[...]' : content
            )
            .setColor('RANDOM')
            .setTimestamp();
        });

      return blogEmbed;
    } catch {
      return undefined;
    }
  }

  /**
   * Rechercher sur le wiki
   * @param {string} toSearch Ce qu'il faut rechercher
   * @param {string} filter La catégorie par laquelle filtrer
   * @returns {Promise<MessageEmbed>}
   * @example
   * Wiki.search('Sophie', 'users').then(result => console.log(result));
   * // MessageEmbed
   */
  async search(toSearch, filter = false) {
    const embed = new MessageEmbed();
    try {
      if (filter) {
        embed.setColor('RANDOM').setTimestamp();
        filter = filter
          .replace(/u+s+e+u*r+s*/, 'users')
          .replace(/u+t+i+l+i+[sz]+a+t+e+u*r+s*/i, 'users')
          // .replace(/c+o+m+[ea]+n+t+a+i+r+e*s*/i, 'commentaires')
          .replace(/c+o+m+s*(?:[ea]+n+t+a+i+r+e*s*)?/i, 'commentaires')
          .replace(/discution/i, 'discussion')
          .replace(/discussions/i, 'discussion')
          .replace(/posts?/i, 'discussion')
          .replace(/d+i+s+c+u+[st]*b+l+o+g+s*/i, 'discusblog')
          .replace(/c+o+m+m*e*n*t*a*i*r*e*s*b+l+o+g+s*/i, 'discusblog')
          .replace(/b+l+o+g+[sue]*/i, 'blog')
          .replace(/a+l+/i, 'all')
          .replace(/t+o+u+[ts]*e*/i, 'all')
          .replace(/c+a+t+[eé]+g+o+r+[iy]+e*s*/i, 'category')
          .replace(/f+i+[lchi]+e+r*s*/i, 'files')
          .replace(/m+u+r+s*/i, 'wall');

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
                  if (i === 16) break;
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
                  if (i === 16) break;
                  embed.addField(
                    titles[i]
                      .replace(/Discussion:/i, '')
                      .replace(/([^\/]+).+/, '$1'),
                    `[Lien vers le commentaire](${links[i]})`
                  );
                }
              }
            });
        } else if (filter === 'discusblog') {
          await axios.default
            .get(
              encodeURI(
                `https://gardiens-des-cites-perdues.fandom.com/fr/api.php?action=opensearch&format=json&search=${toSearch}&namespace=501&limit=500`
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
                embed.title = `Résultats de la recherche pour \`${toSearch.trim()}\` dans les commentaires sur les blogs du wiki`;
                for (let i = 0; i < titles.length; i++) {
                  if (i === 16) break;
                  embed.addField(
                    titles[i]
                      .replace(/Commentaire blog utilisateur:/i, '')
                      .replace(/([^\/]+\/[^\/]+).+/, '$1'),
                    `[Commentaire sur le blog](${links[i]})`
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
                for (let i = 0; i < titles.length; i++) {
                  if (i === 16) break;
                  if (i === 15 || i === titles.length) {
                    embed.addField(
                      titles[i].replace(/:/g, ' : '),
                      `[Lien](${
                        links[i]
                      })\n\n[Voir tous les résultats](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Sp%C3%A9cial:Recherche?scope=internal&query=${encodeURI(
                        toSearch.trim()
                      )}&ns%5B0%5D=0&ns%5B1%5D=1&ns%5B2%5D=2&ns%5B3%5D=3&ns%5B4%5D=4&ns%5B5%5D=5&ns%5B6%5D=6&ns%5B7%5D=7&ns%5B8%5D=8&ns%5B9%5D=9&ns%5B10%5D=10&ns%5B11%5D=11&ns%5B12%5D=12&ns%5B13%5D=13&ns%5B14%5D=14&ns%5B15%5D=15&ns%5B16%5D=110&ns%5B17%5D=111&ns%5B18%5D=420&ns%5B19%5D=421&ns%5B20%5D=500&ns%5B21%5D=501&ns%5B22%5D=502&ns%5B23%5D=503&ns%5B24%5D=710&ns%5B25%5D=711&ns%5B26%5D=828&ns%5B27%5D=829&ns%5B28%5D=1200&ns%5B29%5D=1201&ns%5B30%5D=1202&ns%5B31%5D=2000&ns%5B32%5D=2001&ns%5B33%5D=2002)`
                    );
                  } else
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
                  if (i === 16) break;
                  titles[i] = await titles[i].replace(
                    /blog\s*utilisateur:/gi,
                    ''
                  );
                  if (i === titles.length || i === 15) {
                    embed.addField(
                      titles[i],
                      `[Blog](${
                        links[i]
                      })\n\n[Voir tous les résultats](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Spécial:Recherche?scope=internal&query=${encodeURI(
                        toSearch.trim()
                      ).replace(/\+/g, '%2B')}&ns%5B0%5D=500&ns%5B1%5D=502)`
                    );
                  } else {
                    embed.addField(titles[i], `[Blog](${links[i]})`);
                  }
                }
              }
            });
        } else if (filter === 'files') {
          await axios.default
            .get(
              encodeURI(
                `https://gardiens-des-cites-perdues.fandom.com/fr/api.php?action=opensearch&format=json&search=${toSearch}&namespace=6&limit=500`
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
                embed.title = `Résultats de la recherche pour \`${toSearch.trim()}\` dans les fichiers du wiki`;
                for (let i = 0; i < titles.length; i++) {
                  if (i === 16) break;
                  embed.addField(
                    titles[i].replace(/Fichier:/i, ''),
                    `[Lien vers le fichier](${links[i]})`
                  );
                }
              }
            });
        } else if (filter === 'category') {
          await axios.default
            .get(
              encodeURI(
                `https://gardiens-des-cites-perdues.fandom.com/fr/api.php?action=opensearch&format=json&search=${toSearch}&namespace=14&limit=500`
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
                embed.title = `Résultats de la recherche pour \`${toSearch.trim()}\` dans les catégories du wiki`;
                for (let i = 0; i < titles.length; i++) {
                  if (i === 16) break;
                  embed.addField(
                    titles[i].replace(/Cat[eé]gories?:/i, ''),
                    `[Lien vers la catégorie](${links[i]})`
                  );
                }
              }
            });
        } else if (filter === 'wall') {
          await axios.default
            .get(
              encodeURI(
                `https://gardiens-des-cites-perdues.fandom.com/fr/api.php?action=opensearch&format=json&search=${toSearch}&namespace=1200&limit=500`
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
                embed.title = `Résultats de la recherche pour \`${toSearch.trim()}\` dans les messages sur les murs des membres du wiki`;
                for (let i = 0; i < titles.length; i++) {
                  if (i === 16) break;
                  embed.addField(
                    titles[i].replace(/Mur:/i, ''),
                    `[Lien vers le message](${links[i]})`
                  );
                }
              }
            });
        } else if (filter === 'discussion') {
          await axios.default
            .get(
              encodeURI(
                `https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Spécial:Recherche?scope=internal&query=${toSearch}&contentType=posts`
              )
            )
            .then(async (res) => {
              let body = res.data;
              const regDis = /<article>\s*<h1>\s*<a\s*href="([^"]+)"\s*class="unified-search__result__title"\s*data-wiki-id="\d+"\s*data-title="([^"]+)/gi,
                secRegDis = /<article>\s*<h1>\s*<a\s*href="([^"]+)"\s*class="unified-search__result__title"\s*data-wiki-id="\d+"\s*data-title="([^"]+)/i;
              let titles = [],
                links = [];
              body.match(regDis).forEach((matched) => {
                let matche = String(matched).match(secRegDis);
                titles.push(matche[2]);
                links.push(matche[1]);
              });

              if (titles.length === 0) {
                boolResult = false;
              } else {
                embed.setDescription(
                  `${
                    titles.length < 500 ? titles.length : 'Plus de 500'
                  } résultats trouvés`
                );
                embed.title = `Résultats de la recherche pour \`${toSearch.trim()}\` dans les posts du DE`;
                for (let i = 0; i < titles.length; i++) {
                  if (i === 16) break;
                  embed.addField(titles[i], `[Lien vers le post](${links[i]})`);
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
        if (toSearch === '')
          return "Veuillez préciser ce qu'il faut rechercher";
        let boolResult = true;
        await axios.default
          .get(
            encodeURI(
              `https://gardiens-des-cites-perdues.fandom.com/fr/api.php?action=opensearch&format=json&search=${toSearch}&namespace=0&limit=500`
            )
          )
          .then(async (res) => {
            let body = res.data;
            let titles = body[1];
            let links = body[3];
            if (titles.length === 0) {
              boolResult = false;
            } else {
              embed
                .setColor('RANDOM')
                .setTimestamp()
                .setDescription(
                  `${
                    titles.length < 500 ? titles.length : 'Plus de 500'
                  } résultat${titles.length > 1 ? 's' : ''} trouvé${
                    titles.length > 1 ? 's' : ''
                  }`
                );
              embed.footer = {
                text: `Résultats de la recherche sur le wiki GDCP`,
                icon_url:
                  'https://cdn.discordapp.com/attachments/574532041836593155/766941930067984384/avatar.png',
              };
              embed.thumbnail = {
                url:
                  'https://vignette.wikia.nocookie.net/gardiens-des-cites-perdue/images/f/f7/Sophie_Foster_.jpg/revision/latest?cb=20170806113107&path-prefix=fr',
              };
              embed.title = `Résultats de la recherche pour \`${toSearch.trim()}\` dans les articles du Wiki`;
              await titles.splice(20);

              for (let i = 0; i < titles.length; i++) {
                if (i === 16) break;
                if (i === titles.length || i === 15) {
                  embed.addField(
                    titles[i],
                    `[Voir l'article](${
                      links[i]
                    })\n\n[Voir tous les résultats](https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Spécial:Recherche?scope=internal&query=${encodeURI(
                      toSearch.trim()
                    ).replace(/\+/g, '%2B')})`
                  );
                } else {
                  embed.addField(titles[i], `[Voir l'article](${links[i]})`);
                }
              }
            }
          });
        if (boolResult) {
          return embed;
        } else return 'Aucun résultat trouvé';
        return embed;
      }
    } catch {
      embed
        .setTitle('Une erreur est survenue')
        .setDescription(
          ':warning: Une erreur est survenue avec la commande. Si cette erreur se reproduit, veuillez contacter mon créateur <@428582719044452352>'
        )
        .setColor('RED');
      return embed;
    }
  }

  /**
   * @example
   * Wiki.getCategories().then((embed) => console.log(embed));
   * // MessageEmbed
   */
  async getCategories() {
    /**
     * @type {string}
     */
    const code = (
      await axios.default.get(
        'https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Sp%C3%A9cial:Cat%C3%A9gories?offset=&limit=250'
      )
    ).data;

    let aExploiter = code
      .match(/(?<=<ul><li>)(?:.(?!\/ul))+/is)
      .toString()
      .replace(/<\/?ul>/g, '');
    let names = aExploiter
      .match(/(?<=">)\w+(?=<\/a>)/g)
      .join('dddd')
      .split(/dddd/g);
    if (names[0].length > 50) names = names.slice(1);

    let links = aExploiter
      .match(/(?<=href=")[^"]+(?=")/g)
      .join('dddd')
      .split('dddd')
      .map((l) => 'https://' + this.nameURL + '.fandom.com' + l);

    if (links[0].length > 50) links = links.slice(1);

    let total = names.length;

    const embed = new MessageEmbed()
      .setColor('RANDOM')
      .setTitle('Liste des catégories de tout le wiki')
      .setURL(
        'https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Sp%C3%A9cial:Cat%C3%A9gories'
      )
      .setDescription(
        `Nombre de catégories : ${total}\n\n[Voir toutes les catégories](${encodeURI(
          'https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Spécial:Catégories'
        )})`
      );

    // embed.addField('\u200b', '\u200b');
    for (let i = 0; i <= 15; i++) {
      embed.addField(names[i], `[**Voir la catégorie**](${links[i]})`);
    }
    return { embed: embed, total: total };
  }

  /**
   * @returns {Promise<string>}
   * @example
   * Wiki.getTotalChanges().then(res => console.log(res));
   * // xxx&#160;xxx
   * // (x is a Number)
   */
  async getTotalChanges() {
    let retour;
    await axios.default
      .get(
        'https://gardiens-des-cites-perdues.fandom.com/fr/api.php?action=query&meta=siteinfo&siprop=statistics&format=json'
      )
      .then((res) => {
        const results = res.data;
        let arr = [],
          num = results.query.statistics.edits;
        let str = String(num);
        for (let st of str) {
          arr.push(st);
        }
        let newStr = '';
        for (let i = 0; i < arr.length; i++) {
          newStr += arr[i];
          if (arr.length === 9) {
            if (i === 2) newStr += ' ';
            if (i === 5) newStr += ' ';
          } else if (arr.length === 8) {
            if (i === 1) newStr += ' ';
            if (i === 4) newStr += ' ';
          } else if (arr.length <= 6 && arr.length >= 4) {
            if (i === 2) newStr += ' ';
          }
        }

        retour = newStr.trim();
      });
    return retour;
  }

  // /**
  //  * Liste des noms et liens des pages populaires du wiki
  //  * @returns {Promise<string>}
  //  * @example
  //  * Wiki.getPopularPages().then(res => console.log(res))
  //  * // Pages populaires
  //  */
  // async getPopularPages() {
  //   let result;
  //   const regPop = /(?<=<div class="description-background"><\/div>\s*<div class="description">\s*<h2>)[^<]+(?=\<\/h2>\s*<p class="mw-empty-elt"><\/p>\s*<p class="read-more-button-wrapper">)/g;
  //   await axios.default
  //     .get(
  //       'https://gardiens-des-cites-perdues.fandom.com/fr/wiki/Wiki_Gardiens_des_Cit%C3%A9s_Perdues'
  //     )
  //     .then((res) => {
  //       let populars = res.data.match(regPop);
  //       result = populars
  //         .map(
  //           (pop) =>
  //             `[${pop.replace(/ :(?=[A-Za-z])/, ' : ')}](${encodeURI(
  //               `https://${this.nameURL}.fandom.com/fr/wiki/${pop.replace(
  //                 / :(?=[A-Za-z])/,
  //                 ' : '
  //               )}`
  //             )})`
  //         )
  //         .join(' 🔹 ');
  //     });
  //   return result;
  // }

  /**
   * @returns {Promise<number>}
   */
  async getTotalPages() {
    let retour;
    await axios.default
      .get(
        'https://gardiens-des-cites-perdues.fandom.com/fr/api.php?action=query&meta=siteinfo&siprop=statistics&format=json'
      )
      .then((res) => {
        const results = res.data;
        let arr = [],
          num = results.query.statistics.pages;
        let str = String(num);
        for (let st of str) {
          arr.push(st);
        }
        let newStr = '';
        for (let i = 0; i < arr.length; i++) {
          newStr += arr[i];
          if (arr.length === 9) {
            if (i === 2) newStr += ' ';
            if (i === 5) newStr += ' ';
          } else if (arr.length === 8) {
            if (i === 1) newStr += ' ';
            if (i === 4) newStr += ' ';
          } else if (arr.length <= 6 && arr.length >= 4) {
            if (i === 2) newStr += ' ';
          }
        }

        retour = newStr.trim();
      });
    return retour;
  }

  /**
   * @returns {Promise<string>}
   */
  async getUsers() {
    let users;
    await axios.default
      .get(
        'https://gardiens-des-cites-perdues.fandom.com/fr/api.php?action=query&meta=siteinfo&siprop=statistics&format=json'
      )
      .then((res) => {
        const results = res.data;
        let arr = [],
          num = results.query.statistics.users;
        let str = String(num);
        for (let st of str) {
          arr.push(st);
        }
        let newStr = '';
        for (let i = 0; i < arr.length; i++) {
          newStr += arr[i];
          if (arr.length === 9) {
            if (i === 2) newStr += ' ';
            if (i === 5) newStr += ' ';
          } else if (arr.length === 8) {
            if (i === 1) newStr += ' ';
            if (i === 4) newStr += ' ';
          } else if (arr.length <= 6 && arr.length >= 4) {
            if (i === 2) newStr += ' ';
          }
        }

        users =
          newStr.trim() + ` (${results.query.statistics.activeusers} actifs)`;
      });
    return users;
  }

  /**
   * @returns {Promise<number>}
   */
  async getArticlesCount() {
    let retour;

    await axios.default
      .get(
        'https://gardiens-des-cites-perdues.fandom.com/fr/api.php?action=query&meta=siteinfo&siprop=statistics&format=json'
      )
      .then((res) => {
        const results = res.data;
        retour = parseInt(results.query.statistics.articles);
      });
    return retour;
  }

  /**
   * Créer un embed quand un billet de blog est posté sur le wiki
   * @example
   * Wiki.checkPosts().then((result) => console.log(result));
   * // MessageEmbed|undefined
   */
  async checkPosts() {
    // const bot = require('../setup.js');
    const postsEmbed = new MessageEmbed();
    try {
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
          .replace(
            /<a href="([^"]+)"(?:(?:[^>](?!<\/a>))+)>([^<]+)/g,
            `[$2]($1)`
          )
          .replace(/<\/lu>/g, '')
          .replace(/<li>((?:.(?!\/li>))+)<\/li>\s*/gis, ' - $1\n')
          .replace(/<br\s*\/>/gi, '\n')
          .replace(
            /<div\s*class="post__image-wrapper">\s*<img\s*class="post__image"\s*src="([^"]+)"\s*alt="Fandom\s*Image"\s*itemprop="image"\s*role="presentation"\s*\/>\s*<\/div>\s*/gi,
            `[\[Image\]]($1)`
          )
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
      if (infosSelected[10].includes('post-poll')) {
        postsEmbed.setThumbnail(
          'https://images-ext-2.discordapp.net/external/cntRg-ABgCtADuw0nRUBUpPkfT8YVjaPLsD2VU71SbE/https/gardiens-des-cites-perdues.fandom.com/feeds-and-posts/public/12c5a3ac1/assets/server/poll-opengraph.png'
        );
        content = `[[Sondage](${link})]`;
      }
      content = content.replace(/(?:undefined|null)/g, '').correctString();

      postsEmbed
        .setAuthor(user_name, thumbnail, userURL)
        .setTitle(title.correctString())
        .setURL(link)
        .setDescription(
          ` dans [${cat}](${catURL})\n\n${
            content.length > 900 ? content.slice(0, 890) + '\n[...]' : content
          }`
        )
        .setImage(img)
        .setColor('RANDOM')
        .setTimestamp()
        .setFooter(
          (parseInt(upVotes) !== 0 ? ` ${upVotes} ❤️` : 'Aucun vote') +
            ' •' +
            (parseInt(comments) !== 0
              ? ` ${comments} commentaires`
              : ' Aucun commentaire')
        );

      return postsEmbed;
    } catch {
      return undefined;
    }
  }

  /**
   * Créer un embed avec une page Aléatoire du wiki
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
        const title = res.data.match(
          /<meta property="og:title" content="([^"]+)"\/>/
        )[1];
        if (!title) return undefined;

        const link =
          (await res.data.match(
            /<link rel="canonical" href="([^"]+)"\/>/
          )[1]) ||
          (await res.data.match(/<link rel="canonical" href="[^"]+"\/>/));
        if (!link) return undefined;
        let description = await res.data.match(
          /<p>(?:(?:<a[^>]*>)|(?:<b[^>]*>)|(?:<i[^>]*>)|(?:<u[^>]*>))*(?:(?:[^<])|(?:<\/?[ubia]>)|(?:<a [^>]*>)){3,}/
        );
        if (!description) return undefined;
        description = String(description)
          .replace(
            /<a href="([^"]+)">((?:.(?!\/a>))+)/g,
            `[$2](${`https://${this.nameURL}.fandom.com$1`})`
          )
          .slice(0, description.indexOf('. '));
        description = description.correctString();
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

  // /**
  //  * Check si SM a fait un nouveau post Instagram
  //  */
  // async checkInstaPost() {
  //   const Insta = require('instagram-posts');
  //   let lastSMPost = await Insta('sw_messenger');
  //   lastSMPost = lastSMPost[0];
  //   try {
  //     const lEmbed = new MessageEmbed()
  //       .setColor('RANDOM')
  //       .setAuthor(
  //         lastSMPost.username,
  //         'https://i0.wp.com/novelnovice.com/wp-content/uploads/sites/210/2016/04/Shannon-Messenger-YA.jpg',
  //         'https://www.instagram.com/' + lastSMPost.username
  //       )
  //       .setDescription(
  //         lastSMPost.text +
  //           `\n\n[Voir la publication en entier](https://www.instagram.com/p/${lastSMPost.shortcode})`
  //       )
  //       .setImage(lastSMPost.display_url)
  //       .setFooter(
  //         lastSMPost.likes + ' likes • ' + lastSMPost.comments + ' commentaires'
  //       )
  //       .setTimestamp();
  //     lEmbed.id = lastSMPost.id;

  //     return lEmbed;
  //   } catch {
  //     return undefined;
  //   }
  //   /*
  //   let sm = await axios.default.get(
  //     'https://www.instagram.com/sw_messenger/?__a=1'
  //   );
  //   sm = JSON.parse(sm.data);
  //   let lastSMPost = sm.graphql.user.edge_owner_to_timeline_media.edges[0].node;
  //   try {
  //     const lEmbed = new MessageEmbed()
  //       .setColor('RANDOM')
  //       .setAuthor(
  //         lastSMPost.owner.username,
  //         'https://pbs.twimg.com/profile_images/2854007123/5697810c2469f90473751c1b4ddd8aa6_400x400.jpeg',
  //         'https://www.instagram.com/' + lastSMPost.owner.username
  //       )
  //       .setDescription(
  //         lastSMPost.edge_media_to_caption.edges[0].node.text +
  //           `\n\n[Voir la publication en entier](https://www.instagram.com/p/${lastSMPost.shortcode})`
  //       )
  //       .setImage(lastSMPost.display_url)
  //       .setFooter(
  //         lastSMPost.edge_liked_by.count +
  //           ' likes • ' +
  //           lastSMPost.edge_media_to_comment.count +
  //           ' commentaires'
  //       )
  //       .setTimestamp();
  //     lEmbed.id = lastSMPost.id;

  //     return lEmbed;
  //   } catch {
  //     return undefined;
  //   }
  //    */
  // }

  /**
   * @param {string} name Le nom du wiki fandom
   * @param {string} nameURL Le nom du wiki fandom en format URI
   */
  constructor(name, nameURL) {
    this.name = name;
    this.nameURL = nameURL;
    this.getCategories().then((res) => (this.categories = res));
    this.getTotalChanges().then((res) => (this.totalChanges = res));
    // this.getPopularPages().then((res) => (this.popularPages = res));
    this.getTotalPages().then((pages) => (this.totalPages = pages));
    this.getUsers().then((users) => (this.users = users));
    this.getArticlesCount().then((articles) => (this.articles = articles));
  }
}

module.exports = Wiki;
