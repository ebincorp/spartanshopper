import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'affiliateLink',
  title: 'Affiliate Link',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Internal label, e.g. "Japanese Exfoliating Towel"',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'Path used in /go/[slug] — e.g. "japanese-towel" → spartanshopper.com/go/japanese-towel',
      options: { source: 'title', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'destination',
      title: 'Destination URL',
      type: 'url',
      description: 'The affiliate URL this slug redirects to',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'notes',
      title: 'Notes',
      type: 'text',
      rows: 2,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      slug: 'slug.current',
      destination: 'destination',
    },
    prepare({ title, slug, destination }: { title?: string; slug?: string; destination?: string }) {
      return {
        title: title ?? 'Untitled',
        subtitle: `/go/${slug ?? '…'}  →  ${destination ?? ''}`,
      }
    },
  },
})
