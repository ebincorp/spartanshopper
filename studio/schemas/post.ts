import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'post',
  title: 'Blog Post',
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
      options: { source: 'title', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'string',
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          { title: 'Deals', value: 'Deals' },
          { title: 'Coupons', value: 'Coupons' },
          { title: 'Sweepstakes', value: 'Sweepstakes' },
          { title: 'Saving Tips', value: 'Saving Tips' },
          { title: 'News', value: 'News' },
          { title: 'Reviews', value: 'Reviews' },
        ],
      },
    }),
    defineField({
      name: 'relatedCategory',
      title: 'Related Coupon Category',
      type: 'string',
      description: 'Show related coupons from this category at the bottom of the post.',
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
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      rows: 3,
      description: 'Used as meta description and card preview.',
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover Image',
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
      description: 'Optional affiliate link for this post e.g. a featured product.',
    }),
    defineField({
      name: 'affiliateSlug',
      title: 'Affiliate Link Slug',
      type: 'slug',
      description: 'Used for cloaked links e.g. spartanshopper.com/go/japanese-exfoliating-towel',
      options: { source: 'title', maxLength: 96 },
    }),
    defineField({
      name: 'jsonLd',
      title: 'Structured Data (JSON-LD)',
      type: 'text',
      rows: 6,
      description: 'Paste a JSON-LD schema block here (e.g. Review, Product, FAQPage). Injected as <script type="application/ld+json"> in the page head.',
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'array',
      of: [
        {
          type: 'block',
          styles: [
            { title: 'Normal', value: 'normal' },
            { title: 'Heading 2', value: 'h2' },
            { title: 'Heading 3', value: 'h3' },
            { title: 'Quote', value: 'blockquote' },
          ],
          lists: [
            { title: 'Bullet', value: 'bullet' },
            { title: 'Numbered', value: 'number' },
          ],
          marks: {
            decorators: [
              { title: 'Bold', value: 'strong' },
              { title: 'Italic', value: 'em' },
            ],
            annotations: [
              {
                name: 'link',
                type: 'object',
                title: 'Link',
                fields: [
                  {
                    name: 'href',
                    type: 'url',
                    title: 'URL',
                  },
                ],
              },
            ],
          },
        },
        {
          type: 'object',
          name: 'couponEmbed',
          title: 'Coupon Card',
          fields: [
            {
              name: 'coupon',
              title: 'Coupon',
              type: 'reference',
              to: [{ type: 'coupon' }],
            },
          ],
          preview: {
            select: { title: 'coupon.title' },
            prepare({ title }: { title?: string }) {
              return { title: `Coupon: ${title ?? 'Untitled'}` }
            },
          },
        },
        {
          type: 'image',
          options: { hotspot: true },
          fields: [
            {
              name: 'alt',
              type: 'string',
              title: 'Alt Text',
            },
            {
              name: 'caption',
              type: 'string',
              title: 'Caption',
            },
          ],
        },
      ],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      category: 'category',
      media: 'coverImage',
      publishedAt: 'publishedAt',
    },
    prepare({ title, category, media, publishedAt }) {
      return {
        title,
        subtitle: `${category ?? 'Uncategorized'} · ${publishedAt ? new Date(publishedAt).toLocaleDateString() : 'No date'}`,
        media,
      }
    },
  },
})
