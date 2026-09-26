import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'deal',
  title: 'Deal',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'store',
      title: 'Store',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'salePrice',
      title: 'Sale Price ($)',
      type: 'number',
    }),
    defineField({
      name: 'originalPrice',
      title: 'Original Price ($)',
      type: 'number',
    }),
    defineField({
      name: 'clipCoupon',
      title: 'Clip Coupon (no code)',
      type: 'boolean',
      initialValue: false,
      description: 'On when the Sale Price depends on a clip coupon on the Amazon product page. Shows a "Clip coupon" badge and checkout note, and makes verification compare the Amazon price against the Original Price (pre-coupon).',
    }),
    defineField({
      name: 'priceVerifiedAt',
      title: 'Price Verified At',
      type: 'datetime',
      description: 'Set by the daily verification job (or by hand when a price is captured). The site only shows the price while this is under 25 hours old; after that it shows "Check current price".',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: { hotspot: true },
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
        }),
      ],
    }),
    defineField({
      name: 'imageUrl',
      title: 'Image URL (Amazon-compliant)',
      type: 'string',
      description: 'Optional. Amazon Creators API primary image URL. When set, this is used in preference to the uploaded Image asset.',
    }),
    defineField({
      name: 'affiliateUrl',
      title: 'Affiliate URL',
      type: 'url',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'affiliateSlug',
      title: 'Affiliate Link Slug',
      type: 'slug',
      description: 'Used for cloaked links e.g. spartanshopper.com/go/nike-deal',
      options: { source: 'title', maxLength: 96 },
    }),
    defineField({
      name: 'asin',
      title: 'ASIN',
      type: 'string',
      description: 'Amazon Standard Identification Number — used by the Creators API price/image verification.',
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          { title: 'Electronics', value: 'electronics' },
          { title: 'Fashion', value: 'fashion' },
          { title: 'Home & Garden', value: 'home-garden' },
          { title: 'Food & Dining', value: 'food-dining' },
          { title: 'Travel', value: 'travel' },
          { title: 'Health & Beauty', value: 'health-beauty' },
          { title: 'Sports & Outdoors', value: 'sports-outdoors' },
          { title: 'Automotive', value: 'automotive' },
          { title: 'Baby & Nursery', value: 'baby' },
          { title: 'Luxury', value: 'luxury' },
          { title: 'Other', value: 'other' },
        ],
      },
    }),
    defineField({
      name: 'relatedGuides',
      title: 'Related Guides',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'post' }], weak: true }],
      validation: (Rule) => Rule.max(3).unique(),
      description: 'Optional, up to 3. Shown as "Read before you buy" on the deal page, overriding the automatic category match. Use it to push money pages.',
    }),
    defineField({
      name: 'expiryDate',
      title: 'Expiry Date',
      type: 'datetime',
    }),
    defineField({
      name: 'active',
      title: 'Active',
      type: 'boolean',
      initialValue: true,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      store: 'store',
      media: 'image',
      active: 'active',
    },
    prepare({ title, store, media, active }) {
      return {
        title,
        subtitle: `${store}${active ? '' : ' — INACTIVE'}`,
        media,
      }
    },
  },
})
