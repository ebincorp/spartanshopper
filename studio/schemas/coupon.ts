import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'coupon',
  title: 'Coupon',
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
      name: 'code',
      title: 'Coupon Code',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'discount',
      title: 'Discount Label',
      type: 'string',
      description: 'e.g. "20% off" or "$10 off sitewide"',
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
      description: 'Used for cloaked links e.g. spartanshopper.com/go/valvoline-10-off',
      options: { source: 'title', maxLength: 96 },
    }),
    defineField({
      name: 'startDate',
      title: 'Start Date',
      type: 'datetime',
      description: 'Optional. If set, the coupon will not appear on the site until this date.',
    }),
    defineField({
      name: 'expiryDate',
      title: 'Expiry Date',
      type: 'datetime',
    }),
    defineField({
      name: 'verified',
      title: 'Verified / Working',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'active',
      title: 'Active',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          { title: 'Health & Wellness', value: 'health' },
          { title: 'Tech & Gadgets', value: 'tech' },
          { title: 'Home & Kitchen', value: 'home' },
          { title: 'Food & Grocery', value: 'food' },
          { title: 'Beauty', value: 'beauty' },
          { title: 'Fitness', value: 'fitness' },
          { title: 'Pets', value: 'pets' },
          { title: 'Travel', value: 'travel' },
          { title: 'Fashion', value: 'fashion' },
          { title: 'Amazon Deals', value: 'amazon' },
        ],
      },
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Free-form tags for more specific matching e.g. "ear-care", "sleep"',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      store: 'store',
      code: 'code',
      verified: 'verified',
      active: 'active',
    },
    prepare({ title, store, code, verified, active }) {
      return {
        title,
        subtitle: `${store} — ${code}${verified ? ' ✓' : ''}${active ? '' : ' — INACTIVE'}`,
      }
    },
  },
})
