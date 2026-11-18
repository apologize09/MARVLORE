import type { Schema, Struct } from '@strapi/strapi';

export interface SharedAboutCollageImage extends Struct.ComponentSchema {
  collectionName: 'components_shared_about_collage_images';
  info: {
    description: 'About \u62FC\u8D34\u69FD\u4F4D';
    displayName: '\u5173\u4E8E\u9875\u62FC\u8D34\u56FE';
    icon: 'picture';
  };
  attributes: {
    alt: Schema.Attribute.String & Schema.Attribute.Required;
    focus: Schema.Attribute.String;
    image: Schema.Attribute.Media<'images'>;
    imageUrl: Schema.Attribute.String;
    slotIndex: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          max: 9;
          min: 0;
        },
        number
      >;
  };
}

export interface SharedAboutStat extends Struct.ComponentSchema {
  collectionName: 'components_shared_about_stats';
  info: {
    description: 'About \u7EDF\u8BA1\u6570\u5B57';
    displayName: '\u5173\u4E8E\u9875\u6570\u636E';
    icon: 'chartBubble';
  };
  attributes: {
    lines: Schema.Attribute.JSON & Schema.Attribute.Required;
    number: Schema.Attribute.String & Schema.Attribute.Required;
    sortOrder: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
  };
}

export interface SharedMedia extends Struct.ComponentSchema {
  collectionName: 'components_shared_media';
  info: {
    description: '\u5A92\u4F53\u6587\u4EF6';
    displayName: '\u5A92\u4F53';
    icon: 'file-video';
  };
  attributes: {
    file: Schema.Attribute.Media<'images' | 'files' | 'videos'>;
  };
}

export interface SharedQuote extends Struct.ComponentSchema {
  collectionName: 'components_shared_quotes';
  info: {
    description: '\u5F15\u7528\u5757';
    displayName: '\u5F15\u7528';
    icon: 'indent';
  };
  attributes: {
    body: Schema.Attribute.Text;
    title: Schema.Attribute.String;
  };
}

export interface SharedRichText extends Struct.ComponentSchema {
  collectionName: 'components_shared_rich_texts';
  info: {
    description: '\u5BCC\u6587\u672C\u5757';
    displayName: '\u5BCC\u6587\u672C';
    icon: 'align-justify';
  };
  attributes: {
    body: Schema.Attribute.RichText;
  };
}

export interface SharedSeo extends Struct.ComponentSchema {
  collectionName: 'components_shared_seos';
  info: {
    description: '\u9875\u9762 SEO \u7EC4\u4EF6';
    displayName: 'SEO';
    icon: 'allergies';
    name: 'Seo';
  };
  attributes: {
    metaDescription: Schema.Attribute.Text & Schema.Attribute.Required;
    metaTitle: Schema.Attribute.String & Schema.Attribute.Required;
    shareImage: Schema.Attribute.Media<'images'>;
  };
}

export interface SharedSlider extends Struct.ComponentSchema {
  collectionName: 'components_shared_sliders';
  info: {
    description: '\u8F6E\u64AD\u6587\u4EF6';
    displayName: '\u8F6E\u64AD';
    icon: 'address-book';
  };
  attributes: {
    files: Schema.Attribute.Media<'images', true>;
  };
}

export interface SharedSocialLink extends Struct.ComponentSchema {
  collectionName: 'components_shared_social_links';
  info: {
    description: '\u793E\u4EA4\u5E73\u53F0\u94FE\u63A5';
    displayName: '\u793E\u4EA4\u94FE\u63A5';
    icon: 'link';
  };
  attributes: {
    label: Schema.Attribute.String;
    platform: Schema.Attribute.Enumeration<
      [
        'instagram',
        'youtube',
        'facebook',
        'linkedin',
        'behance',
        'dribbble',
        'tiktok',
        'x',
        'other',
      ]
    >;
    sortOrder: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    url: Schema.Attribute.String;
  };
}

export interface SharedWhyChooseItem extends Struct.ComponentSchema {
  collectionName: 'components_shared_why_choose_items';
  info: {
    description: 'Why choose \u6761\u76EE';
    displayName: '\u4F18\u52BF\u6761\u76EE';
    icon: 'star';
  };
  attributes: {
    description: Schema.Attribute.Text;
    icon: Schema.Attribute.String;
    title: Schema.Attribute.String;
    titleLine1: Schema.Attribute.String;
    titleLine2: Schema.Attribute.String;
  };
}

declare module '@strapi/strapi' {
  export namespace Public {
    export interface ComponentSchemas {
      'shared.about-collage-image': SharedAboutCollageImage;
      'shared.about-stat': SharedAboutStat;
      'shared.media': SharedMedia;
      'shared.quote': SharedQuote;
      'shared.rich-text': SharedRichText;
      'shared.seo': SharedSeo;
      'shared.slider': SharedSlider;
      'shared.social-link': SharedSocialLink;
      'shared.why-choose-item': SharedWhyChooseItem;
    }
  }
}
