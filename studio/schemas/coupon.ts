import { defineField, defineType } from 'sanity'
import { couponVerificationLabels, formatCouponVerificationDate } from '../../lib/couponVerification'

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
      name: 'asin',
      title: 'ASIN',
      type: 'string',
      description: 'Amazon Standard Identification Number — used by the Creators API price/image verification.',
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
      title: 'Verified / Working (legacy)',
      description: 'Legacy field. Use Verification Evidence to display a dated result to shoppers.',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'verification',
      title: 'Verification Evidence',
      type: 'object',
      description: 'Record the most recent supported observation. Clear or recheck this evidence when the code or eligibility changes.',
      fields: [
        defineField({
          name: 'status',
          title: 'Result and Method',
          type: 'string',
          description: 'Use a checkout result only when the discount was actually attempted on eligible items.',
          options: {
            list: Object.entries(couponVerificationLabels).map(([value, title]) => ({ title, value })),
          },
          validation: (Rule) => Rule.required().custom((value) =>
            value && !Object.hasOwn(couponVerificationLabels, value) ? 'Choose a listed verification result.' : true,
          ),
        }),
        defineField({
          name: 'checkedOn',
          title: 'Check Date',
          type: 'date',
          description: 'Use the date the offer was observed or confirmed.',
          validation: (Rule) => Rule.required().custom((value) =>
            value && !formatCouponVerificationDate(value) ? 'Enter a valid check date on or before today.' : true,
          ),
        }),
        defineField({
          name: 'evidenceNote',
          title: 'Editorial Evidence Note',
          type: 'text',
          rows: 2,
          description: 'Record the source and relevant test conditions. Keep coupon codes and personal details out of this field.',
        }),
      ],
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
          { title: 'Gaming', value: 'gaming' },
          { title: 'Korean Skincare', value: 'korean-skincare' },
          { title: 'Automotive',    value: 'automotive'  },
          { title: 'Outdoor',       value: 'outdoor'     },
          { title: 'Baby & Nursery', value: 'baby-nursery' },
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
    defineField({
      name: 'whyWeLikeThis',
      title: 'Why We Like This',
      type: 'text',
      rows: 5,
      description: 'Optional editorial note shown on the coupon detail page (~200 words).',
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'object',
      fields: [
        defineField({
          name: 'metaTitle',
          title: 'Meta Title',
          type: 'string',
          description: 'Overrides the coupon title in search results. Leave blank to use the coupon title.',
        }),
        defineField({
          name: 'metaDescription',
          title: 'Meta Description',
          type: 'text',
          rows: 3,
          description: 'Overrides the description as meta description. Aim for 150–160 characters.',
          validation: (Rule) => Rule.max(160),
        }),
        defineField({
          name: 'canonicalUrl',
          title: 'Canonical URL',
          type: 'url',
          description: 'Set only if this content is syndicated from another URL.',
        }),
      ],
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
