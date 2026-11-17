import type { Schema, Struct } from '@strapi/strapi';

export interface SharedAboutCollageImage extends Struct.ComponentSchema {
  collectionName: 'components_shared_about_collage_images';
  info: {
    description: 'Replaces artwork src/alt/focus only; geometry stays in frontend.';
    displayName: 'About Collage Image';
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
    description: 'About center copy statistics block';
    displayName: 'About Stat';
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
    displayName: 'Media';
    icon: 'file-video';
  };
  attributes: {
    file: Schema.Attribute.Media<'images' | 'files' | 'videos'>;
  };
}

export interface SharedQuote extends Struct.ComponentSchema {
  collectionName: 'components_shared_quotes';
  info: {
    displayName: 'Quote';
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
    description: '';
    displayName: 'Rich text';
    icon: 'align-justify';
  };
  attributes: {
    body: Schema.Attribute.RichText;
  };
}

export interface SharedSeo extends Struct.ComponentSchema {
  collectionName: 'components_shared_seos';
  info: {
    description: '';
    displayName: 'Seo';
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
    description: '';
    displayName: 'Slider';
    icon: 'address-book';
  };
  attributes: {
    files: Schema.Attribute.Media<'images', true>;
  };
}

export interface SharedSocialLink extends Struct.ComponentSchema {
  collectionName: 'components_shared_social_links';
  info: {
    description: 'Public social profile link';
    displayName: 'Social Link';
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
    displayName: 'Why Choose Item';
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
