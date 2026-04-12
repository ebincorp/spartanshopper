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
