import lodashTruncate from 'lodash.truncate';

const MediaUtil = {
  url(media, data) {
    try {
      return media.url || data.url || '';
    } catch (e) {
      return '';
    }
  },

  networkIconName(media) {
    try {
      return ({ // uncomment in font-awesome/_icons.scss
        'facebook.com': 'facebook-square',
        'instagram.com': 'instagram',
        'twitter.com': 'twitter',
        'youtube.com': 'youtube-play'
      }[media.domain] || 'link');
    } catch (e) {
      return '';
    }
  },

  authorAvatarUrl(media, data) {
    try {
      return ({
        'twitter.com': data.picture,
        'facebook.com': data.picture,
        // 'instagram.com': data.picture, // returns media image url
        // 'youtube.com': data.picture // returns media image url
      }[media.domain]);
    } catch (e) {
      return '';
    }
  },

  authorName(media, data) {
    try {
      switch (media.domain) {
        case 'twitter.com':
          return data.user ? data.user.name : '';
        case 'facebook.com':
          return data.user_name;
        case 'youtube.com':
          return data.username;
        case 'instagram.com':
          return data.username;
        default:
          return data.user_name || data.username || '';
      }
    } catch (e) {
      return  '';
    }
  },

  authorUsername(media, data) {
    try {
      switch (media.domain) {
        case 'twitter.com':
          return data.user ? `@${data.user.screen_name}` : ''; // data.username?
        case 'facebook.com':
          return '';
        case 'instagram.com':
          return `@${data.author_name}`;
        case 'youtube.com':
          return `@${data.username}`;
        default:
          return data.username || '';
      }
    } catch (e) {
      return '';
    }
  },

  authorUrl(media, data) {
    try {
      return data.author_url;
    } catch (e) {
      return '';
    }
  },

  typeLabel(media, data) {
    try {
      const socialMedia = ({
        'twitter.com': 'Tweet',
        'facebook.com': 'Facebook post',
        'instagram.com': 'Instagram',
        'youtube.com': 'Video'
      }[media.domain]);

      if (socialMedia) {
        return socialMedia;
      }
      if (data && data.quote) {
       return 'Claim';
      }
      if (media && media.domain) {
        return 'Page';
      }
    } catch (e) {}
    return '';
  },

  title(media, data) {
    var typeLabel;
    try {
      typeLabel = this.typeLabel(media, data);
      if (typeLabel === 'Page') {
        return `${typeLabel} on ${media.domain}`;
      }
      else if (typeLabel === 'Claim') {
        const text = this.truncate(data.quote);
        return `${typeLabel}${text ? ': ' + text : ''}`;
      }
      else {
        const attribution = this.authorName(media, data);
        const text = this.truncate(this.bodyText(media, data));
        return `${typeLabel}${attribution ? ' by ' + attribution : ''}${text && text.length ? ': ' + text : ''}`;
      }
    } catch (e) {
      return typeLabel || '';
    }
  },

  truncate(text) {
    return lodashTruncate(text, {length: 50, separator: /,? +/, ellipsis: '…'});
  },

  notesCount(media, data) {
    return media.annotations_count; // TODO: filter to visible notes
  },

  createdAt(media) { // check media
    return new Date(parseInt(media.published) * 1000);
  },

  embedPublishedAt(media, data) { // embedded media
    try {
      return data.published_at;
    } catch (e) {
      return '';
    }
  },

  bodyText(media, data) {
    try {
      return ({
        'twitter.com': data.text,
        'facebook.com': data.text,
        'instagram.com': data.description,
        'youtube.com': 'Video'
      }[media.domain] || data.text || data.description || '');
    } catch (e) {
      return '';
    }
  },

  bodyImageUrl(media, data) {
    try {
      switch (media.domain) {
        case 'twitter.com':
          return data.entities.media[0].media_url_https || data.entities.media[0].media_url;
        case 'facebook.com':
          return data.photos[0];
        case 'instagram.com':
          return data.picture;
        case 'youtube.com':
          return data.picture;
      }
    } catch (e) {
      return null;
    }
  },

  stats(media, data) {
    try {
      return ({
        'twitter.com': [
          `${data.favorite_count || 0} favorite${data.favorite_count !== 1 ? 's' : ''}`,
          `${data.retweet_count || 0} retweet${data.retweet_count !== 1 ? 's' : ''}`
        ]
      }[media.domain] || []);
    } catch (e) {
      return [];
    }
  }
}

export default MediaUtil;
