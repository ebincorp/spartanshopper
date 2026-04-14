import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'sweepstake',
  title: 'Sweepstake',
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
      name: 'sponsor',
      title: 'Sponsor',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'prize',
      title: 'Prize',
      type: 'string',
      description: 'e.g. "$500 Amazon Gift Card" or "PlayStation 5"',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'entryUrl',
      title: 'Entry URL (Affiliate Link)',
      type: 'url',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'affiliateSlug',
      title: 'Affiliate Link Slug',
      type: 'slug',
      description: 'Used for cloaked links e.g. spartanshopper.com/go/ps5-sweepstakes',
      options: { source: 'title', maxLength: 96 },
    }),
    defineField({
      name: 'entryDeadline',
      title: 'Entry Deadline',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'entryFrequency',
      title: 'Entry Frequency',
      type: 'string',
      description: 'How often can someone enter?',
      options: {
        list: [
          { title: 'One-time', value: 'one-time' },
          { title: 'Daily', value: 'daily' },
          { title: 'Weekly', value: 'weekly' },
          { title: 'Unlimited', value: 'unlimited' },
        ],
      },
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
      name: 'active',
      title: 'Active',
      type: 'boolean',
      initialValue: true,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      prize: 'prize',
      media: 'image',
      active: 'active',
      deadline: 'entryDeadline',
    },
    prepare({ title, prize, media, active, deadline }) {
      const deadlineStr = deadline
        ? new Date(deadline).toLocaleDateString()
        : 'No deadline'
      return {
        title,
        subtitle: `${prize} — Ends: ${deadlineStr}${active ? '' : ' — INACTIVE'}`,
        media,
      }
    },
  },
})
