'use strict';
const getEmails = require('get-emails');
const got = require('got');

module.exports = async (username) => {
  if (typeof username !== 'string') {
    throw new TypeError(
      `Expected \`username\` to be of type \`string\` but received type \`${typeof username}\``
    );
  }

  try {
    const url = `https://instagram.com/${username}`;
    console.log(await got(url, { searchParams: { __a: 1 } }));
    const {
      graphql: { user },
    } = await got(url, { searchParams: { __a: 1 }, json: true });
    const email = getEmails(user.biography).values().next().value || '';

    return {
      ...user,
      description: user.biography,
      email,
      followers: user.edge_followed_by.count,
      following: user.edge_follow.count,
      fullName: user.full_name,
      posts: user.edge_owner_to_timeline_media.count,
      url,
      username,
      website: user.external_url,
    };
  } catch (error) {
    /* if (error.response.statusCode === 404) {
			error.message = `User "${username}" not found`;
		}
 */
    throw error;
  }
};
