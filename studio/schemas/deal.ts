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
          { title: 'Other', value: 'other' },
        ],
      },
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
