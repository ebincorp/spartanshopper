import dotenv from 'dotenv'
import path from 'path'
import { createClient } from '@sanity/client'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset:   process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  token:     process.env.SANITY_API_TOKEN!,
  apiVersion: '2024-01-01',
  useCdn:    false,
})

// ── Portable-text helpers ────────────────────────────────────────────────────

const k = () => crypto.randomUUID().replace(/-/g, '').slice(0, 12)

type Span     = { _type: 'span'; _key: string; text: string; marks: string[] }
type LinkDef  = { _key: string; _type: 'link'; href: string }
type Block    = { _type: 'block'; _key: string; style: string; children: Span[]; markDefs: LinkDef[]; listItem?: 'bullet' | 'number'; level?: number }
type TableRow = { _type: 'tableRow'; _key: string; cells: string[] }
type Table    = { _type: 'table'; _key: string; rows: TableRow[] }
type Body     = Block | Table

const s   = (text: string, marks: string[] = []): Span  => ({ _type: 'span', _key: k(), text, marks })
const p   = (spans: Span[], defs: LinkDef[] = []): Block => ({ _type: 'block', _key: k(), style: 'normal', children: spans, markDefs: defs })
const h2  = (text: string): Block => ({ _type: 'block', _key: k(), style: 'h2', children: [s(text)], markDefs: [] })
const h3  = (text: string): Block => ({ _type: 'block', _key: k(), style: 'h3', children: [s(text)], markDefs: [] })
const bl  = (label: string, rest: string): Block => p([s(label, ['strong']), s(rest)])
const bul = (spans: Span[], defs: LinkDef[] = []): Block => ({ _type: 'block', _key: k(), style: 'normal', listItem: 'bullet', level: 1, children: spans, markDefs: defs })
const num = (spans: Span[], defs: LinkDef[] = []): Block => ({ _type: 'block', _key: k(), style: 'normal', listItem: 'number', level: 1, children: spans, markDefs: defs })

function lnk(text: string, href: string): { span: Span; def: LinkDef } {
  const lk = k()
  return { span: s(text, [lk]), def: { _key: lk, _type: 'link', href } }
}

function tbl(rows: string[][]): Table {
  return { _type: 'table', _key: k(), rows: rows.map(cells => ({ _type: 'tableRow', _key: k(), cells })) }
}

const disc = (): Block => p([s('Disclosure: SpartanShopper participates in the Amazon Associates Program. We may earn a small commission on qualifying purchases at no extra cost to you. This article is for informational purposes only and is not a substitute for professional medical advice. Always consult your healthcare provider before beginning a new supplement routine.', ['em'])])

// ── Shared URLs ──────────────────────────────────────────────────────────────

const U = {
  organicIndia:    'https://www.spartanshopper.com/go/organic-india-psyllium',
  nowCaps:         'https://www.spartanshopper.com/go/now-psyllium-husk-caps',
  metamucil:       'https://www.spartanshopper.com/go/metamucil-premium-blend',
  colonbroom:      'https://www.spartanshopper.com/go/colonbroom-fiber',
  constipation:    'https://www.spartanshopper.com/blog/psyllium-husk-constipation',
  cancerWarning:   'https://www.spartanshopper.com/blog/psyllium-husk-cancer-warning',
  fiberSupplement: 'https://www.spartanshopper.com/blog/psyllium-husk-fiber-supplement',
  weightLoss:      'https://www.spartanshopper.com/blog/psyllium-husk-weight-loss',
  dosage:          'https://www.spartanshopper.com/blog/psyllium-husk-dosage',
  vsmiralax:       'https://www.spartanshopper.com/blog/psyllium-husk-vs-miralax',
  probiotics:      'https://www.spartanshopper.com/blog/probiotics-for-gut-health',
}

// ── Post 1: psyllium-husk-cancer-warning ─────────────────────────────────────

function buildCancerWarningBody(): Body[] {
  const lOI    = lnk('Shop Organic India Whole Husk Psyllium on Amazon', U.organicIndia)
  const lNow   = lnk('Shop NOW Foods Psyllium Husk Capsules on Amazon', U.nowCaps)
  const lConst = lnk('psyllium husk for constipation guide', U.constipation)

  return [
    p([s('If you\'ve ever picked up a bag of psyllium husk and noticed a '), s('cancer warning', ['strong']), s(' on the label, you\'re not alone — and your concern is completely understandable. A cancer warning on a health supplement is alarming. But before you throw it out or swear off fiber supplements entirely, it\'s worth understanding exactly what that warning means and where it comes from.')]),
    p([s('The short version: the warning is a California legal requirement, not a clinical determination that psyllium husk causes cancer. Here\'s the full picture.')]),

    h2('What Is the Psyllium Husk Cancer Warning?'),
    p([s('The cancer warning on psyllium husk products is a '), s('California Proposition 65 warning', ['strong']), s(', also known as a Prop 65 warning. You\'ll see it on thousands of consumer products sold in California — everything from coffee to parking garages to certain supplements.')]),
    p([s('Prop 65 is a California law passed in 1986 that requires businesses to provide a "clear and reasonable warning" before exposing anyone to chemicals listed by the state as known to cause cancer, birth defects, or other reproductive harm. The list currently contains over 900 chemicals.')]),
    p([s('The specific chemical triggering the psyllium husk warning is '), s('lead', ['strong']), s(' — a naturally occurring heavy metal found in trace amounts in soil. Because psyllium husk is a plant-based product grown in soil, it can absorb small amounts of lead from the ground during cultivation.')]),

    h2('Does Psyllium Husk Actually Cause Cancer?'),
    p([s('No clinical evidence links psyllium husk consumption to cancer in humans. The Prop 65 warning does not mean the product has been tested and found to cause cancer — it means the product contains a listed chemical at a level that triggers California\'s disclosure threshold.')]),
    p([s('Here\'s the critical context: '), s('the Prop 65 threshold is set extraordinarily low', ['strong']), s('. California sets its warning threshold at 1/1000th of the level that has been shown to cause no observable effect in laboratory animals. The intent is to be maximally cautious, not to indicate that exposure at the listed level is actually dangerous.')]),
    p([s('The FDA, the World Health Organization, and the American College of Gastroenterology all consider psyllium husk safe for daily consumption. The FDA has actually approved a health claim for psyllium fiber, stating that 7 grams per day may reduce the risk of coronary heart disease.')]),
    p([s('A product can legally carry a Prop 65 warning while simultaneously having an FDA-approved health claim — and psyllium husk is exactly that product.')]),

    h2('Why Does Psyllium Husk Contain Lead?'),
    p([s('Lead occurs naturally in soil worldwide. Plants absorb it through their root systems during growth, which means virtually any plant-based food or supplement contains some trace level of lead. Wheat, rice, leafy vegetables, and many other staple foods contain detectable lead levels.')]),
    p([s('Psyllium husk is grown primarily in India and requires a specific soil type. The lead content in psyllium husk products varies by:')]),
    bul([s('Country and region of origin', ['strong']), s(' — soil lead levels vary geographically')]),
    bul([s('Processing method', ['strong']), s(' — some methods reduce heavy metal content more than others')]),
    bul([s('Third-party testing', ['strong']), s(' — brands that test for heavy metals can ensure their products stay below threshold levels')]),
    p([s('The trace lead found in psyllium husk is not unique to psyllium — it reflects the reality that plant-based foods grown in soil will contain naturally occurring minerals, including heavy metals in trace amounts.')]),

    h2('Is the Prop 65 Warning Meaningful?'),
    p([s('The Prop 65 warning system is controversial among scientists and public health experts for exactly this reason. Critics argue that the threshold is so low that it creates warnings on products with no realistic health risk, causing consumers to avoid beneficial foods and supplements unnecessarily.')]),
    p([s('The warning on psyllium husk does not mean:')]),
    bul([s('Psyllium husk has been proven to cause cancer')]),
    bul([s('The lead level in psyllium husk is dangerous')]),
    bul([s('You should stop taking psyllium husk')]),
    bul([s('The product failed safety testing')]),
    p([s('It means: a chemical on California\'s list is present above California\'s extremely conservative disclosure threshold.')]),

    h2('How to Choose a Lower-Risk Psyllium Husk Product'),
    p([s('If you want to minimize your lead exposure from psyllium husk — which is a reasonable thing to do even if the risk is low — here\'s what to look for:')]),
    bl('Third-party testing:', ' Choose brands that publish Certificates of Analysis (COA) showing heavy metal testing results. This is the most direct way to know what\'s in your product.'),
    bl('Sourcing transparency:', ' Some brands disclose where their psyllium is grown. Caribbean and European sourcing tends to have lower heavy metal exposure than some South Asian sources due to soil composition differences.'),
    bl('Organic certification:', ' Organic psyllium is grown without synthetic pesticides but is not automatically lower in heavy metals — lead is a naturally occurring element, not a pesticide. Don\'t assume organic means lower lead.'),
    p([s('Recommended products with clean labels:', ['strong'])]),
    bul([lOI.span, s(' — transparent sourcing, widely tested')], [lOI.def]),
    bul([lNow.span, s(' — NOW Foods publishes COAs for their products')], [lNow.def]),

    h2('Should You Stop Taking Psyllium Husk Because of the Warning?'),
    p([s('For most healthy adults, no. The clinical benefits of psyllium husk — improved regularity, reduced cholesterol, better blood sugar control, prebiotic support — are well-documented and significant. The trace lead exposure from standard doses of psyllium husk is not considered clinically meaningful by the major health bodies that have reviewed the evidence.')]),
    p([s('The populations who may want to be more cautious:')]),
    bul([s('Pregnant women', ['strong']), s(' — lead exposure during pregnancy warrants extra caution given fetal development concerns. Consult your OB-GYN.')]),
    bul([s('Children', ['strong']), s(' — children are more sensitive to lead exposure. Psyllium husk is not typically recommended for children anyway.')]),
    bul([s('People with high dietary lead exposure', ['strong']), s(' — if you\'re already consuming significant amounts of other lead-containing foods or supplements, minimizing additional sources is reasonable.')]),
    p([s('For everyone else, choosing a reputable brand with published third-party testing and taking psyllium at standard doses (5–10g per day) carries a risk profile that health authorities consider acceptable.')]),

    h2('Frequently Asked Questions'),
    h3('Is psyllium husk safe to take every day?'),
    p([s('Yes — psyllium husk is endorsed for daily long-term use by the American College of Gastroenterology. The Prop 65 warning reflects California\'s extremely conservative disclosure threshold, not a finding that daily use is dangerous.')]),
    h3('Which psyllium husk brands don\'t have the cancer warning?'),
    p([s('Any psyllium husk product sold in California is legally required to carry the Prop 65 warning if its lead content exceeds California\'s threshold, regardless of brand. A brand that doesn\'t display the warning is either not selling in California or has lead levels below the threshold — the latter is preferable and achievable through careful sourcing and testing.')]),
    h3('Does Metamucil have the cancer warning?'),
    p([s('Yes — Metamucil and other major psyllium husk brands carry the Prop 65 warning on products sold in California for the same reason. The warning is category-wide, not specific to one manufacturer.')]),
    h3('Is the lead in psyllium husk the same as lead paint?'),
    p([s('No. Lead paint contained extremely high concentrations of lead compounds deliberately added for paint properties. The lead in psyllium husk is a trace naturally occurring element absorbed from soil — the quantity and context are entirely different.')]),
    h3('What is the safe daily dose of psyllium husk?'),
    p([s('The standard clinical dose is 5–10 grams per day. The FDA-approved health claim for heart disease risk reduction is based on 7 grams per day. These doses are considered safe for daily long-term use by healthy adults.')]),

    h2('Final Verdict'),
    p([s('The '), s('psyllium husk cancer warning', ['strong']), s(' is a California Prop 65 label triggered by trace naturally occurring lead — not a finding that psyllium husk causes cancer or poses a meaningful health risk at normal doses. The FDA, WHO, and American College of Gastroenterology all consider psyllium husk safe for daily use.')]),
    p([s('If you want to minimize your exposure, choose a brand with published third-party heavy metal testing. But for most healthy adults, the well-documented benefits of psyllium husk — regularity, cholesterol reduction, blood sugar support — significantly outweigh the trace lead exposure at standard doses.')]),
    p([s('For the complete guide on how to use psyllium husk safely and effectively, see our '), lConst.span, s('.')], [lConst.def]),
    disc(),
  ]
}

// ── Post 2: psyllium-husk-fiber-supplement ────────────────────────────────────

function buildFiberSupplementBody(): Body[] {
  const lNowShop  = lnk('Shop NOW Foods Psyllium Husk Capsules on Amazon', U.nowCaps)
  const lOIShop   = lnk('Shop Organic India Whole Husk Psyllium on Amazon', U.organicIndia)
  const lMetaShop = lnk('Shop Metamucil Premium Blend on Amazon', U.metamucil)
  const lColonShop = lnk('Shop ColonBroom on Amazon', U.colonbroom)
  const lCancer   = lnk('psyllium husk cancer warning guide', U.cancerWarning)
  const lWtLoss   = lnk('psyllium husk weight loss guide', U.weightLoss)
  const lConst    = lnk('psyllium husk for constipation guide', U.constipation)
  const lProbio   = lnk('probiotics for gut health guide', U.probiotics)
  const lNowFinal = lnk('NOW Foods Psyllium Husk Capsules', U.nowCaps)
  const lOIFinal  = lnk('Organic India Whole Husk Psyllium', U.organicIndia)
  const lMetaFinal = lnk('Metamucil Premium Blend', U.metamucil)

  return [
    p([s('Walk into any pharmacy or supplement store and the fiber supplement section is overwhelming — powders, capsules, gummies, chewables, flavored and unflavored, soluble and insoluble. Most of them work. But one of them has significantly more clinical research behind it than everything else on the shelf: '), s('psyllium husk', ['strong']), s('.')]),
    p([s('This guide covers what makes psyllium husk different from other fiber supplements, what the research actually shows about its benefits, how to take it correctly, and how to choose a clean product in 2026.')]),

    h2('What Is Psyllium Husk Fiber?'),
    p([s('Psyllium husk is the outer shell of the '), s('Plantago ovata', ['em']), s(' seed — a plant cultivated primarily in India. It\'s classified as a '), s('soluble, gel-forming fiber', ['strong']), s(', which distinguishes it from the two other main types of dietary fiber:')]),
    bul([s('Insoluble fiber', ['strong']), s(' (wheat bran, celery) — adds bulk to stool but doesn\'t dissolve in water. Good for regularity but can worsen IBS symptoms.')]),
    bul([s('Soluble non-gel-forming fiber', ['strong']), s(' (inulin, FOS) — dissolves in water but doesn\'t form a thick gel. Good for microbiome support but limited effect on stool consistency.')]),
    bul([s('Soluble gel-forming fiber', ['strong']), s(' (psyllium husk) — dissolves in water AND forms a thick viscous gel. Affects cholesterol, blood sugar, stool consistency, and gut bacteria simultaneously.')]),
    p([s('That gel-forming property is what makes psyllium husk uniquely versatile as a fiber supplement. Most fiber supplements do one or two things. Psyllium husk does four.')]),

    h2('What the Research Shows'),
    p([s('Psyllium husk has been studied in hundreds of clinical trials across multiple conditions. Here\'s what the evidence actually supports:')]),
    h3('Digestive Regularity'),
    p([s('The most established benefit. Psyllium husk\'s gel adds water to dry stool and bulk to loose stool — making it one of the few supplements that works for both constipation and diarrhea. The American College of Gastroenterology endorses it as a first-line treatment for chronic constipation and IBS.')]),
    h3('Cholesterol Reduction'),
    p([s('The FDA has approved a health claim for psyllium fiber stating that 7 grams per day, as part of a diet low in saturated fat, may reduce the risk of coronary heart disease. Multiple meta-analyses show psyllium reduces LDL cholesterol by 5–10% with consistent daily use.')]),
    h3('Blood Sugar Control'),
    p([s('Psyllium\'s gel slows the digestion and absorption of carbohydrates, flattening post-meal blood sugar spikes. Studies in people with type 2 diabetes show meaningful improvements in fasting glucose and HbA1c with daily psyllium supplementation.')]),
    h3('Prebiotic Effect'),
    p([s('A portion of psyllium fiber undergoes fermentation in the lower colon, feeding beneficial gut bacteria. This makes psyllium a mild prebiotic — not as potent as inulin or FOS for microbiome support, but meaningful as part of a broader gut health stack.')]),

    h2('Psyllium Husk vs. Other Fiber Supplements'),
    tbl([
      ['Supplement', 'Type', 'Regularity', 'Cholesterol', 'Blood Sugar', 'Microbiome'],
      ['Psyllium husk', 'Soluble, gel-forming', '✅ Strong', '✅ FDA-approved claim', '✅ Documented', '✅ Mild prebiotic'],
      ['Inulin / FOS', 'Soluble, fermentable', '⚠️ Moderate', '❌ Minimal', '⚠️ Moderate', '✅ Strong prebiotic'],
      ['Wheat bran', 'Insoluble', '✅ Strong', '❌ Minimal', '❌ Minimal', '⚠️ Moderate'],
      ['Methylcellulose (Citrucel)', 'Soluble, non-fermentable', '✅ Strong', '❌ Minimal', '❌ Minimal', '❌ None'],
      ['Guar gum', 'Soluble, gel-forming', '✅ Strong', '⚠️ Moderate', '⚠️ Moderate', '❌ Minimal'],
    ]),
    p([s('Psyllium husk is the only fiber supplement with an FDA-approved cardiovascular health claim and documented benefits across all four categories.')]),

    h2('How to Take Psyllium Husk Fiber Supplement'),
    bl('Dosage:', ' 5–10 grams per day, split into one or two doses. Start at 5g for the first week to allow your gut to adjust.'),
    bl('Timing:', ' Take with a full glass of water, 30 minutes before a meal or before bed. Do not take within 2 hours of medications.'),
    bl('Water requirement:', ' This is non-negotiable. Psyllium expands dramatically when it contacts water. Taking it without adequate fluid (minimum 8 oz, ideally 12–16 oz) can cause the powder to swell before it reaches your stomach, creating a risk of choking or esophageal blockage. Always mix thoroughly and drink immediately.'),
    p([s('Timeline for results:', ['strong'])]),
    bul([s('Digestive regularity: 12–72 hours')]),
    bul([s('Cholesterol reduction: 4–8 weeks of consistent daily use')]),
    bul([s('Blood sugar benefits: 4–6 weeks')]),

    h2('Best Psyllium Husk Fiber Supplements in 2026'),
    p([s('SpartanShopper is reader-supported. When you buy through links on our site, we may earn an affiliate commission at no extra cost to you.', ['em'])]),
    h3('NOW Foods Psyllium Husk Capsules — Best for Daily Use'),
    p([s('NOW Foods publishes Certificates of Analysis for their products and the capsule formula contains psyllium husk and nothing else. Clean label, consistent quality, and the capsule format eliminates the texture issue that drives many people away from powder.')]),
    p([lNowShop.span], [lNowShop.def]),
    h3('Organic India Whole Husk Psyllium — Best Powder Option'),
    p([s('Certified organic, whole husk (minimally processed), neutral flavor. One of the cleanest powder options available with transparent sourcing from India.')]),
    p([lOIShop.span], [lOIShop.def]),
    h3('Metamucil Premium Blend — Best Flavored Option'),
    p([s('If you need a flavored option to maintain daily consistency, Metamucil\'s Premium Blend uses stevia instead of sugar and skips the artificial dyes found in the standard formula. It\'s the cleanest Metamucil formulation.')]),
    p([lMetaShop.span], [lMetaShop.def]),
    h3('ColonBroom — Best for Gut Health Stack'),
    p([s('ColonBroom combines psyllium husk with a prebiotic blend for people whose digestive issues go beyond simple irregularity. The strawberry flavor makes daily compliance easier and the formula is free of aspartame and artificial dyes.')]),
    p([lColonShop.span], [lColonShop.def]),

    h2('Side Effects and Who Should Be Cautious'),
    p([s('Common side effects (usually resolve in 1–2 weeks):', ['strong'])]),
    bul([s('Bloating and gas — from bacterial fermentation. Start at half dose and increase slowly.')]),
    bul([s('Increased fullness — expected; psyllium is a bulking agent')]),
    bul([s('Mild cramping — usually related to insufficient water intake')]),
    p([s('Drug interactions — space psyllium 2 hours away from:', ['strong'])]),
    bul([s('Levothyroxine (thyroid medication)')]),
    bul([s('Metformin and other diabetes medications')]),
    bul([s('Blood thinners')]),
    bul([s('Tricyclic antidepressants')]),
    p([s('People who should consult a doctor first:', ['strong'])]),
    bul([s('Difficulty swallowing or esophageal narrowing')]),
    bul([s('Bowel obstruction or Crohn\'s disease')]),
    bul([s('Kidney disease')]),
    p([s('For a complete breakdown of side effects including the Prop 65 cancer warning label, see our '), lCancer.span, s('.')], [lCancer.def]),

    h2('Frequently Asked Questions'),
    h3('Is psyllium husk the same as Metamucil?'),
    p([s('Metamucil\'s active ingredient is psyllium husk — so yes, they are the same fiber. The difference is that Metamucil adds flavorings, sweeteners, and in some formulations, sugar and artificial dyes. Plain psyllium husk powder is the same fiber without the additives.')]),
    h3('Can you take psyllium husk every day long term?'),
    p([s('Yes. Unlike stimulant laxatives, psyllium husk is safe for indefinite daily use. It works with your body\'s existing digestive mechanics rather than overriding them, so there is no dependency risk.')]),
    h3('How long before psyllium husk works?'),
    p([s('For digestive regularity, most people see results within 12–72 hours of their first dose. For cholesterol and blood sugar benefits, consistent daily use for 4–8 weeks is required.')]),
    h3('Is psyllium husk good for weight loss?'),
    p([s('Psyllium husk can support weight management by increasing satiety — the gel expands in the stomach and slows digestion, helping you feel fuller longer. It is not a weight loss supplement in the direct sense, but it can be a useful tool as part of a broader approach. See our dedicated '), lWtLoss.span, s(' for more detail.')], [lWtLoss.def]),
    h3('Powder vs capsules — which is better?'),
    p([s('Powder gives you faster gel formation and better dose control. Capsules are more convenient, easier to travel with, and eliminate texture issues. Both deliver the same clinical benefits — the choice comes down to personal preference and consistency.')]),

    h2('Final Verdict'),
    p([s('Psyllium husk is the most thoroughly researched fiber supplement available. The clinical evidence for its benefits on digestion, cholesterol, blood sugar, and gut bacteria is stronger than any other fiber supplement on the market, and the FDA has approved it for a cardiovascular health claim that no other fiber supplement can match.')]),
    p([s('If you want a single fiber supplement that does more than one job, psyllium husk is it.')]),
    bul([s('Best capsule: '), lNowFinal.span], [lNowFinal.def]),
    bul([s('Best powder: '), lOIFinal.span], [lOIFinal.def]),
    bul([s('Best flavored: '), lMetaFinal.span], [lMetaFinal.def]),
    p([s('For specifics on using psyllium for constipation, see our '), lConst.span, s('. For the full gut health picture, our '), lProbio.span, s(' covers how fiber fits into a complete microbiome support stack.')], [lConst.def, lProbio.def]),
    disc(),
  ]
}

// ── Post 3: psyllium-husk-dosage ─────────────────────────────────────────────

function buildDosageBody(): Body[] {
  const lOI    = lnk('Organic India Whole Husk Psyllium', U.organicIndia)
  const lMeta  = lnk('Metamucil Premium Blend', U.metamucil)
  const lNow   = lnk('NOW Foods Psyllium Husk Capsules', U.nowCaps)
  const lFiber = lnk('psyllium husk fiber supplement guide', U.fiberSupplement)
  const lConst = lnk('psyllium husk for constipation guide', U.constipation)

  return [
    p([s('Psyllium husk dosage', ['strong']), s(' is one of those things that looks simple but has enough nuance to make the difference between it working and it making things worse. The right dose depends on what you\'re using it for, whether you\'re taking powder or capsules, and where you are in the adjustment period.')]),
    p([s('This guide gives you the exact numbers across every use case, plus the timing rules most people get wrong.')]),

    h2('Standard Psyllium Husk Dosage for Adults'),
    p([s('The clinical dosage range studied in the majority of trials is '), s('5–10 grams per day', ['strong']), s('. Most products deliver this in one or two doses.')]),
    tbl([
      ['Goal', 'Daily dose', 'Frequency'],
      ['Digestive regularity / constipation', '5–10g', 'Once or twice daily'],
      ['IBS symptom management', '5–10g', 'Once or twice daily'],
      ['Cholesterol reduction', '7–10g', 'Split across 2–3 doses'],
      ['Blood sugar management', '5–10g', 'Before meals'],
      ['Weight management / satiety', '5g', '30 min before largest meal'],
    ]),
    bl('Starting dose:', ' Always begin at 5g once daily for the first 1–2 weeks regardless of your goal. Your gut bacteria need time to adjust to increased fiber. Going straight to 10g can cause significant bloating and gas.'),
    bl('Maximum dose:', ' Studies have used up to 30g per day in clinical settings, but there is no benefit to exceeding 15g per day for typical health goals. More is not better with psyllium — the gel-forming capacity plateaus.'),

    h2('Psyllium Husk Powder Dosage'),
    p([s('Powder gives you the most control over your dose and produces faster gel formation than capsules.')]),
    p([s('Measuring powder:', ['strong'])]),
    bul([s('1 teaspoon of psyllium husk powder = approximately 5g of fiber')]),
    bul([s('1 tablespoon = approximately 15g')]),
    p([s('How to mix:', ['strong'])]),
    num([s('Measure your dose into a glass')]),
    num([s('Add 8–16 oz of water (more is better)')]),
    num([s('Stir vigorously for 10–15 seconds')]),
    num([s('Drink immediately — do not let it sit')]),
    p([s('Psyllium powder begins to gel within 30–60 seconds of contacting water. If you let it sit, it becomes a thick, difficult-to-drink gel. Mix and drink in one motion.')]),
    p([s('Recommended powder products:', ['strong'])]),
    bul([lOI.span, s(' — 1 teaspoon = 5g, clean label')], [lOI.def]),
    bul([lMeta.span, s(' — pre-measured packets available')], [lMeta.def]),

    h2('Psyllium Husk Capsule Dosage'),
    p([s('Capsules are more convenient but require more units to reach a therapeutic dose.')]),
    p([s('Typical capsule sizes:', ['strong'])]),
    bul([s('Most brands: 500–700mg per capsule')]),
    bul([s('To reach 5g: 7–10 capsules (at 500–700mg each)')]),
    p([s('This sounds like a lot, but most people split it across two doses of 4–5 capsules. Take each dose with a full 12–16 oz of water — capsule users often underestimate how much water they need because there\'s no visible powder to mix.')]),
    p([s('Recommended capsule products:', ['strong'])]),
    bul([lNow.span, s(' — 700mg per capsule, clean label')], [lNow.def]),

    h2('Timing: When to Take Psyllium Husk'),
    p([s('Best times:', ['strong'])]),
    bul([s('30 minutes before a meal', ['strong']), s(' — maximizes satiety effect and slows carbohydrate absorption for blood sugar benefits')]),
    bul([s('Before bed', ['strong']), s(' — allows overnight transit time, often results in morning regularity')]),
    p([s('Worst times:', ['strong'])]),
    bul([s('With or immediately after meals', ['strong']), s(' — reduces effectiveness for satiety and blood sugar management')]),
    bul([s('Within 2 hours of medications', ['strong']), s(' — psyllium can significantly slow the absorption of several drug categories')]),
    p([s('Medication timing is critical.', ['strong']), s(' Always take psyllium at least 2 hours before or after:')]),
    bul([s('Levothyroxine and other thyroid medications')]),
    bul([s('Metformin, glipizide, and other diabetes medications')]),
    bul([s('Warfarin and other blood thinners')]),
    bul([s('Tricyclic antidepressants (amitriptyline, nortriptyline)')]),
    bul([s('Digoxin (heart medication)')]),
    p([s('If you take any of these, confirm your psyllium timing with your prescriber.')]),

    h2('Psyllium Husk Dosage by Goal'),
    h3('For Constipation'),
    bl('Dose:', ' 5–10g once or twice daily'),
    bl('Timing:', ' Before bed or 30 minutes before breakfast'),
    bl('Timeline:', ' 12–72 hours for initial results; 1–2 weeks for consistent regularity'),
    bl('Key:', ' Water intake is the most important variable. Take with 12–16 oz minimum.'),
    h3('For IBS'),
    bl('Dose:', ' 5g once daily to start — increase very slowly'),
    bl('Timing:', ' Same time each day, before a meal'),
    bl('Timeline:', ' 4–6 weeks for meaningful symptom improvement'),
    bl('Key:', ' IBS patients are more sensitive to dose changes. Increase by no more than 2.5g per week.'),
    h3('For Cholesterol Reduction'),
    bl('Dose:', ' 7–10g daily, split across 2–3 doses'),
    bl('Timing:', ' With meals — taking psyllium with food appears to improve the cholesterol-lowering effect'),
    bl('Timeline:', ' 4–8 weeks of consistent daily use'),
    bl('Key:', ' The FDA-approved health claim is based on 7g per day as part of a diet low in saturated fat.'),
    h3('For Blood Sugar Management'),
    bl('Dose:', ' 5–10g daily'),
    bl('Timing:', ' 15–30 minutes before your largest carbohydrate meal'),
    bl('Timeline:', ' 4–6 weeks'),
    bl('Key:', ' The gel slows carbohydrate digestion — timing relative to meals matters more for this goal than for regularity.'),
    h3('For Weight Management'),
    bl('Dose:', ' 5g'),
    bl('Timing:', ' 30 minutes before your largest meal with 16 oz of water'),
    bl('Timeline:', ' Satiety effect is immediate; meaningful impact on caloric intake takes consistent daily use'),
    bl('Key:', ' Psyllium supports weight management through satiety, not direct fat burning. It works best as part of a calorie-controlled approach.'),

    h2('How to Adjust Your Dose'),
    bl('Week 1:', ' 5g once daily'),
    bl('Week 2:', ' 5g twice daily (10g total) if tolerated well'),
    bl('Week 3+:', ' Maintain 10g or adjust based on results'),
    p([s('Signs you need to reduce your dose:', ['strong'])]),
    bul([s('Significant bloating that doesn\'t improve after 2 weeks')]),
    bul([s('Cramping or abdominal pain')]),
    bul([s('Constipation worsening (usually means insufficient water, not too much psyllium)')]),
    p([s('Signs your dose is working:', ['strong'])]),
    bul([s('More regular bowel movements')]),
    bul([s('Softer, easier-to-pass stool')]),
    bul([s('Reduced bloating (after the initial adjustment period)')]),
    bul([s('Increased satiety between meals')]),

    h2('The Water Rule'),
    p([s('There is no dosage consideration more important than water intake. Psyllium husk absorbs water and expands dramatically — this is the mechanism that makes it work. Without adequate water:')]),
    bul([s('The gel cannot form properly in your digestive tract')]),
    bul([s('The expanded husk can compact in your colon, temporarily worsening constipation')]),
    bul([s('In rare cases, inadequate water with psyllium can cause esophageal blockage')]),
    bl('Minimum water per dose:', ' 8 oz'),
    bl('Recommended water per dose:', ' 12–16 oz'),
    bl('Total daily water:', ' Increase your total daily fluid intake by at least 16–24 oz above your baseline when adding psyllium to your routine.'),

    h2('Frequently Asked Questions'),
    h3('Can you take too much psyllium husk?'),
    p([s('Yes. Taking more than 15g per day without gradually building up to it can cause significant bloating, gas, and cramping. The maximum dose used in clinical studies is 30g per day, but this is well above what most people need and should only be approached very gradually.')]),
    h3('Is 1 tablespoon of psyllium husk too much to start?'),
    p([s('Yes. One tablespoon is approximately 15g — three times the recommended starting dose. Begin with 1 teaspoon (5g) and stay there for at least a week before increasing.')]),
    h3('Can I take psyllium husk twice a day?'),
    p([s('Yes — splitting your dose into two smaller servings (5g morning, 5g evening) is often better tolerated than a single 10g dose and may improve the cholesterol-lowering effect.')]),
    h3('Does psyllium husk dosage change for weight loss?'),
    p([s('The dosage for weight management (5g before meals) is at the lower end of the clinical range. More is not more effective for satiety — 5g is enough to produce meaningful gel formation and appetite suppression.')]),
    h3('How long should I take psyllium husk?'),
    p([s('Psyllium husk is safe for indefinite daily use. Unlike stimulant laxatives, it does not cause dependency or reduce your bowel\'s natural function. Many people use it daily for years without issue.')]),

    h2('Final Verdict'),
    p([s('The optimal psyllium husk dosage for most adults is '), s('5–10g per day', ['strong']), s(', starting at 5g for the first week and building up gradually. Take it with significantly more water than you think you need, time it at least 2 hours away from medications, and give it 1–2 weeks before evaluating whether it\'s working.')]),
    p([s('For more on what psyllium husk does and the clinical evidence behind it, see our complete '), lFiber.span, s('. For specific use in constipation, see our '), lConst.span, s('.')], [lFiber.def, lConst.def]),
    disc(),
  ]
}

// ── Post 4: psyllium-husk-weight-loss ────────────────────────────────────────

function buildWeightLossBody(): Body[] {
  const lNow    = lnk('Shop NOW Foods Psyllium Husk Capsules on Amazon', U.nowCaps)
  const lOI     = lnk('Shop Organic India Whole Husk Psyllium on Amazon', U.organicIndia)
  const lColon  = lnk('Shop ColonBroom on Amazon', U.colonbroom)
  const lDosage = lnk('psyllium husk dosage guide', U.dosage)
  const lMirLax = lnk('psyllium husk vs MiraLax comparison', U.vsmiralax)

  return [
    p([s('Psyllium husk for weight loss', ['strong']), s(' is one of the more nuanced supplement topics you\'ll find — because unlike most weight loss supplements, psyllium husk actually has clinical research behind it. The mechanism is real. The effect size is modest. And the way most people use it is wrong.')]),
    p([s('This guide covers what the research actually shows, the correct way to use psyllium for appetite control, and what to realistically expect.')]),

    h2('How Psyllium Husk Affects Weight'),
    p([s('Psyllium husk is not a fat burner, metabolism booster, or appetite suppressant in the pharmaceutical sense. What it is: a gel-forming soluble fiber that affects satiety through several well-documented mechanisms.')]),
    h3('Mechanism 1: Gastric Emptying Delay'),
    p([s('When psyllium husk contacts water in your stomach, it forms a thick viscous gel. This gel slows the rate at which your stomach empties its contents into the small intestine — a process called '), s('gastric emptying delay', ['strong']), s('.')]),
    p([s('Slower gastric emptying means:')]),
    bul([s('You feel full longer after eating')]),
    bul([s('Post-meal hunger returns more slowly')]),
    bul([s('You\'re less likely to snack between meals')]),
    p([s('Multiple studies have demonstrated that psyllium supplementation before meals reduces caloric intake at that meal and extends the time to next hunger.')]),
    h3('Mechanism 2: Blood Sugar Stabilization'),
    p([s('The psyllium gel also slows the absorption of carbohydrates from the small intestine, flattening the post-meal blood sugar spike and the subsequent crash. This blood sugar stabilization effect reduces the sharp hunger that follows a rapid glucose spike — the kind of hunger that sends you back to the kitchen an hour after a meal.')]),
    h3('Mechanism 3: Appetite Hormone Effects'),
    p([s('Emerging research suggests psyllium fiber influences GLP-1 and PYY — hormones that signal satiety to the brain. The effect is modest compared to pharmaceutical GLP-1 agonists like semaglutide, but the mechanism is the same category.')]),

    h2('What the Research Shows'),
    p([s('A 2020 meta-analysis of 22 randomized controlled trials found that psyllium supplementation produced a '), s('statistically significant reduction in body weight, BMI, and waist circumference', ['strong']), s(' compared to placebo. The effect was modest — approximately 0.4–1.5 kg of additional weight loss over study periods of 4–24 weeks.')]),
    p([s('That\'s not dramatic, but it\'s real and consistent. And it\'s additive — psyllium works on top of whatever dietary approach you\'re already using, not instead of it.')]),
    p([s('A 2016 study in the '), s('Annals of Internal Medicine', ['em']), s(' found that simply increasing fiber intake to 30g per day produced meaningful weight loss even without any other dietary changes — suggesting that fiber\'s effects on satiety are powerful enough to reduce caloric intake passively.')]),

    h2('How to Use Psyllium Husk for Weight Loss'),
    p([s('The key distinction from using psyllium for digestive health: '), s('timing matters more for weight loss than for regularity', ['strong']), s('.')]),
    p([s('Optimal approach:', ['strong'])]),
    num([s('Take 5g psyllium husk in 16 oz of water')]),
    num([s('30 minutes before your largest meal')]),
    num([s('Drink the full glass immediately after mixing')]),
    p([s('The 30-minute window allows the gel to form and begin expanding in your stomach before food arrives, maximizing the satiety effect at the meal where you\'re most likely to overeat.')]),
    bl('Dosage for weight management:', ' 5g before your largest meal is the most studied approach. Going higher (10g) doesn\'t appear to meaningfully increase the satiety effect and increases the risk of digestive discomfort.'),
    bl('What won\'t work:', ' Taking psyllium after meals, or without enough water. The gel formation is the mechanism — if you don\'t give it time and fluid to work, you don\'t get the satiety benefit.'),

    h2('Psyllium Husk vs. Weight Loss Supplements'),
    tbl([
      ['Supplement', 'Mechanism', 'Evidence', 'Safety'],
      ['Psyllium husk', 'Satiety via gel formation', '✅ Strong', '✅ Excellent'],
      ['Glucomannan', 'Satiety via gel formation', '✅ Moderate', '✅ Good'],
      ['Green tea extract', 'Mild thermogenesis', '⚠️ Weak', '⚠️ Liver risk at high doses'],
      ['Garcinia cambogia', 'Claimed appetite suppression', '❌ Not supported', '⚠️ Liver risk'],
      ['Raspberry ketones', 'Claimed fat metabolism', '❌ No human evidence', '⚠️ Unknown'],
    ]),
    p([s('Psyllium husk and glucomannan are the only fiber supplements with meaningful clinical evidence for weight management. Psyllium has a larger body of research and a longer safety record.')]),

    h2('Best Psyllium Husk Products for Weight Management'),
    p([s('SpartanShopper is reader-supported. When you buy through links on our site, we may earn an affiliate commission at no extra cost to you.', ['em'])]),
    h3('NOW Foods Psyllium Husk Capsules — Most Convenient'),
    p([s('Taking capsules 30 minutes before a meal is easier to maintain as a daily habit than mixing powder. At 700mg per capsule, you need 7 capsules to reach 5g — take with 16 oz of water.')]),
    p([lNow.span], [lNow.def]),
    h3('Organic India Whole Husk Psyllium — Best Clean Powder'),
    p([s('One teaspoon (5g) mixed into 16 oz of water 30 minutes before your largest meal. Neutral flavor mixes well with water or can be added to a smoothie.')]),
    p([lOI.span], [lOI.def]),
    h3('ColonBroom — Best for Combined Gut Health and Weight Management'),
    p([s('If your weight management goals are tied to bloating, irregular digestion, or gut dysbiosis, ColonBroom\'s prebiotic-enhanced psyllium formula addresses both simultaneously.')]),
    p([lColon.span], [lColon.def]),

    h2('Realistic Expectations'),
    p([s('Be honest with yourself about what psyllium husk can and can\'t do:')]),
    p([s('What to expect:', ['strong'])]),
    bul([s('Reduced hunger and improved satiety, especially after meals')]),
    bul([s('More stable energy levels from flattened blood sugar spikes')]),
    bul([s('Modest additional weight loss (0.5–1.5 kg) over several months compared to not using it')]),
    bul([s('Improved digestive regularity as a side benefit')]),
    p([s('What not to expect:', ['strong'])]),
    bul([s('Rapid weight loss')]),
    bul([s('Fat burning or metabolism boosting')]),
    bul([s('Results without dietary changes')]),
    bul([s('A substitute for caloric deficit')]),
    p([s('Psyllium husk is a tool that makes it easier to eat less — not a supplement that burns fat independently. Used correctly, it\'s one of the better-evidenced additions to a weight management approach. Used as a magic bullet, it will disappoint.')]),

    h2('Frequently Asked Questions'),
    h3('Does psyllium husk reduce belly fat specifically?'),
    p([s('Studies showing waist circumference reduction suggest psyllium contributes to abdominal fat reduction, but this is likely a result of overall caloric reduction rather than targeted belly fat burning. There is no supplement that reduces belly fat selectively.')]),
    h3('How long does psyllium husk take to show weight loss results?'),
    p([s('The satiety effect is immediate from the first dose. Measurable weight loss effects in studies typically appear after 4–8 weeks of consistent daily use before meals.')]),
    h3('Should I take psyllium husk before or after meals for weight loss?'),
    p([s('Before meals — specifically 30 minutes before your largest meal. Taking it after meals provides digestive benefits but does not produce the pre-meal satiety effect that drives the weight management benefit.')]),
    h3('Can psyllium husk replace other weight loss supplements?'),
    p([s('It can replace supplements with no evidence behind them (garcinia cambogia, raspberry ketones) without losing anything. It competes well with other fiber-based satiety supplements like glucomannan. It cannot replace pharmaceutical interventions like GLP-1 agonists for people who need significant weight loss.')]),
    h3('Is psyllium husk safe to take daily for weight loss long term?'),
    p([s('Yes. Psyllium husk is safe for indefinite daily use and carries no dependency risk. It\'s one of the few weight management supplements that can genuinely be used long term without concern.')]),

    h2('Final Verdict'),
    p([s('Psyllium husk is one of the most evidence-backed fiber supplements for weight management, but the mechanism is satiety — not fat burning. Take 5g in a large glass of water 30 minutes before your largest meal, maintain it consistently for 4–8 weeks, and combine it with a caloric deficit for meaningful results.')]),
    p([s('For the complete guide on psyllium husk dosage across all use cases, see our '), lDosage.span, s('. For how psyllium compares to MiraLax and other fiber options, see our '), lMirLax.span, s('.')], [lDosage.def, lMirLax.def]),
    disc(),
  ]
}

// ── Post 5: psyllium-husk-how-to-use ─────────────────────────────────────────

function buildHowToUseBody(): Body[] {
  const lOI    = lnk('Organic India Whole Husk Psyllium', U.organicIndia)
  const lMeta  = lnk('Metamucil Premium Blend', U.metamucil)
  const lNow   = lnk('NOW Foods Psyllium Husk Capsules', U.nowCaps)
  const lDosage = lnk('psyllium husk dosage guide', U.dosage)
  const lFiber  = lnk('psyllium husk fiber supplement guide', U.fiberSupplement)

  return [
    p([s('How to use psyllium husk', ['strong']), s(' correctly makes the difference between it working well and making things worse. The supplement itself is simple — soluble fiber from the '), s('Plantago ovata', ['em']), s(' plant — but the way you take it, when you take it, and how much water you use all significantly affect whether you get the results you\'re looking for.')]),
    p([s('This guide covers everything: powder vs capsules, mixing instructions, timing, common mistakes, and how to build it into a daily routine that sticks.')]),

    h2('The Most Important Rule: Water First, Always'),
    p([s('Before anything else — psyllium husk requires significantly more water than most people give it. This is the single most common mistake and the root cause of most complaints about psyllium "not working" or "making things worse."')]),
    bl('Minimum water per dose:', ' 8 oz (one full glass)'),
    bl('Recommended water per dose:', ' 12–16 oz'),
    bl('Why it matters:', ' Psyllium expands by absorbing water. If there isn\'t enough liquid available, it draws moisture from your intestinal walls instead, which can compact stool rather than soften it — the opposite of what you want. In rare cases, taking psyllium with insufficient water can cause esophageal blockage.'),
    p([s('Every instruction in this guide assumes you\'re drinking at least 12 oz of water with each dose. If you\'re not doing this, nothing else matters.')]),

    h2('How to Use Psyllium Husk Powder'),
    p([s('Powder is the most flexible form — you have full control over your dose and it produces the fastest gel formation.')]),
    h3('Step-by-step mixing instructions:'),
    num([s('Measure your dose', ['strong']), s(' — start with 1 teaspoon (approximately 5g) for your first week')]),
    num([s('Pour 12–16 oz of water into a glass', ['strong']), s(' — room temperature or cold both work')]),
    num([s('Add the psyllium powder to the water', ['strong']), s(' (not the other way around — this reduces clumping)')]),
    num([s('Stir vigorously for 10–15 seconds', ['strong'])]),
    num([s('Drink immediately', ['strong']), s(' — do not let it sit')]),
    p([s('This last point is critical. Psyllium powder begins to gel within 30–60 seconds of contacting water. If you mix it and walk away, you\'ll return to a thick, unappetizing gel that\'s difficult to drink. Mix it, drink it, done.')]),
    h3('Mixing into other liquids:'),
    p([s('Psyllium powder can be mixed into:')]),
    bul([s('Water (neutral, recommended)')]),
    bul([s('Orange juice (masks the mild earthy flavor)')]),
    bul([s('Smoothies (adds thickness — adjust liquid accordingly)')]),
    bul([s('Yogurt (creates a thicker texture — works well for some people)')]),
    bl('Do not mix into hot liquids', ' — heat affects the gel-forming properties and can result in an unpleasant texture.'),
    h3('Recommended powder products:'),
    bul([lOI.span, s(' — whole husk, organic, neutral flavor')], [lOI.def]),
    bul([lMeta.span, s(' — stevia-sweetened, orange flavor, no artificial dyes')], [lMeta.def]),

    h2('How to Use Psyllium Husk Capsules'),
    p([s('Capsules eliminate the texture issue entirely and are easier to travel with. The tradeoff is that you need more units to reach a therapeutic dose.')]),
    h3('Capsule dosing:'),
    p([s('Most psyllium capsules contain 500–700mg per capsule. To reach a 5g dose:')]),
    bul([s('At 500mg per capsule: 10 capsules')]),
    bul([s('At 700mg per capsule: 7–8 capsules')]),
    p([s('Split into two doses of 4–5 capsules if a single sitting feels like too many.')]),
    h3('Water with capsules:'),
    p([s('This is where capsule users frequently go wrong. Because there\'s no visible powder to mix, people underestimate how much water they need. Take each dose with '), s('a minimum of 12 oz of water', ['strong']), s(' — the same as powder. The capsule casing dissolves in your stomach and releases the powder, which then needs water to form its gel.')]),
    h3('Recommended capsule products:'),
    bul([lNow.span, s(' — 700mg per capsule, clean label, no additives')], [lNow.def]),

    h2('When to Take Psyllium Husk'),
    p([s('Timing depends on your primary goal:')]),
    bl('For digestive regularity and constipation:', ' Take once or twice daily — before bed works well for many people as it allows overnight transit time and often results in morning regularity. Before breakfast is the other common timing.'),
    bl('For IBS management:', ' Take consistently at the same time each day. Consistency matters more than specific timing for IBS.'),
    bl('For cholesterol reduction:', ' Take with meals — research suggests taking psyllium with food improves its cholesterol-lowering effect compared to taking it between meals.'),
    bl('For blood sugar management:', ' Take 15–30 minutes before your largest carbohydrate meal. The gel needs time to form before food arrives to effectively slow carbohydrate absorption.'),
    bl('For weight management / satiety:', ' Take 30 minutes before your largest meal with 16 oz of water. This is the most researched timing for appetite control.'),

    h2('How to Build Psyllium Husk Into a Daily Routine'),
    p([s('Consistency is the key to psyllium working — the digestive and cholesterol benefits build over time with daily use.')]),
    bl('Week 1:', ' 5g (1 teaspoon or 7–8 capsules) once daily at a consistent time'),
    bl('Week 2:', ' If well tolerated, add a second dose for 10g total daily'),
    bl('Week 3+:', ' Maintain your dose and evaluate results'),
    p([s('Tips for consistency:', ['strong'])]),
    bul([s('Link it to an existing habit — morning coffee, brushing your teeth, taking other supplements')]),
    bul([s('Keep it visible — a jar on the counter is more likely to get used than a bottle in a cabinet')]),
    bul([s('Prepare your glass of water first, then add the powder — don\'t measure the powder first and leave it sitting')]),

    h2('Common Mistakes to Avoid'),
    bl('Not enough water', ' — The most common mistake and the cause of most complaints. If psyllium isn\'t working or is making constipation worse, insufficient water is the likely cause.'),
    bl('Starting with too high a dose', ' — Beginning at 10g or more causes significant bloating and gas as your gut bacteria adjust. Start at 5g.'),
    bl('Taking it with medications', ' — Psyllium can dramatically slow the absorption of several drug categories. Always space it at least 2 hours from levothyroxine, diabetes medications, blood thinners, and antidepressants.'),
    bl('Mixing in advance', ' — Mixing psyllium powder and letting it sit creates a thick gel that\'s unpleasant to drink. Always mix and drink immediately.'),
    bl('Expecting immediate results for everything', ' — Regularity often improves within 12–72 hours. Cholesterol and blood sugar benefits require 4–8 weeks of consistent daily use.'),
    bl('Stopping too soon', ' — Many people stop after a week because of initial bloating. This almost always resolves within 2 weeks as your gut adjusts.'),

    h2('Psyllium Husk and Food: What to Know'),
    p([s('Can you add psyllium husk to food?', ['strong'])]),
    p([s('Yes. Psyllium powder can be added to:')]),
    bul([s('Oatmeal (stir in at serving)')]),
    bul([s('Smoothies')]),
    bul([s('Baked goods (replaces some flour — adds moisture retention)')]),
    bul([s('Soups (as a thickener)')]),
    p([s('Does it change the taste of food?', ['strong'])]),
    p([s('Plain psyllium husk has a very mild, slightly earthy flavor that\'s barely detectable when mixed into flavorful foods. It won\'t significantly change the taste of a smoothie or oatmeal.')]),

    h2('Frequently Asked Questions'),
    h3('Can I take psyllium husk on an empty stomach?'),
    p([s('Yes. Taking psyllium on an empty stomach with plenty of water is the standard approach for digestive regularity. For blood sugar and weight management benefits, timing it before meals is more effective.')]),
    h3('Can I take psyllium husk with coffee?'),
    p([s('Yes — coffee doesn\'t interfere with psyllium\'s mechanism. However, take your psyllium with water rather than mixing it into coffee, as hot liquids affect gel formation.')]),
    h3('How do I know if psyllium husk is working?'),
    p([s('Signs it\'s working: more regular bowel movements, softer easier-to-pass stool, increased fullness after meals, more stable energy levels. Give it at least 72 hours for digestive effects and 4–6 weeks for cholesterol and blood sugar effects.')]),
    h3('Can I take psyllium husk with other supplements?'),
    p([s('Generally yes, with the same 2-hour spacing rule that applies to medications. Take psyllium separately from other supplements to ensure absorption isn\'t affected.')]),
    h3('Is psyllium husk safe to take long term?'),
    p([s('Yes. Unlike stimulant laxatives, psyllium husk does not cause dependency, does not reduce your bowel\'s natural function, and is safe for indefinite daily use.')]),

    h2('Final Verdict'),
    p([s('Using psyllium husk correctly comes down to three things: enough water (always more than you think), the right timing for your goal, and starting at a low dose. Get those three right and psyllium is one of the most effective and versatile supplements you can add to your routine.')]),
    p([s('For dosage specifics across every use case, see our '), lDosage.span, s('. For the clinical evidence behind psyllium\'s benefits, see our '), lFiber.span, s('.')], [lDosage.def, lFiber.def]),
    disc(),
  ]
}

// ── JSON-LD builder ───────────────────────────────────────────────────────────

function makeJsonLd(
  headline: string,
  description: string,
  url: string,
  image: string,
  faqs: Array<{ q: string; a: string }>,
): string {
  return JSON.stringify([
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline,
      description,
      url,
      datePublished: '2026-05-23T00:00:00Z',
      dateModified: '2026-05-23T00:00:00Z',
      author: { '@type': 'Organization', name: 'SpartanShopper', url: 'https://www.spartanshopper.com' },
      publisher: { '@type': 'Organization', name: 'SpartanShopper', url: 'https://www.spartanshopper.com' },
      image,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map(({ q, a }) => ({
        '@type': 'Question',
        name: q,
        acceptedAnswer: { '@type': 'Answer', text: a },
      })),
    },
  ], null, 2)
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('═══════════════════════════════════════════════════════')
  console.log('  SpartanShopper — Add Psyllium Husk Post Drafts')
  console.log('═══════════════════════════════════════════════════════\n')

  const slugs = [
    'psyllium-husk-cancer-warning',
    'psyllium-husk-fiber-supplement',
    'psyllium-husk-dosage',
    'psyllium-husk-weight-loss',
    'psyllium-husk-how-to-use',
  ]

  const existing = await client.fetch<{ slug: string }[]>(
    `*[_type == "post" && slug.current in $slugs]{ "slug": slug.current }`,
    { slugs }
  )
  if (existing.length > 0) {
    console.error(`  ✗ Slug(s) already in use: ${existing.map(d => d.slug).join(', ')}`)
    process.exit(1)
  }

  const publishedAt = '2026-05-23T00:00:00Z'
  const BASE = 'https://www.spartanshopper.com'
  const CDN  = 'https://cdn.sanity.io/images/eohdr7jw/production'

  const posts = [
    {
      _id: `drafts.${crypto.randomUUID()}`,
      _type: 'post',
      title: 'Psyllium Husk Cancer Warning: What the Label Actually Means',
      slug: { _type: 'slug', current: 'psyllium-husk-cancer-warning' },
      publishedAt,
      author: 'SpartanShopper',
      category: 'Gut Health',
      excerpt: 'You bought a bag of psyllium husk, flipped it over, and saw a cancer warning label. Before you throw it out — here\'s what that warning actually means and why it almost certainly doesn\'t apply to you the way you think.',
      coverImage: {
        _type: 'image',
        asset: { _type: 'reference', _ref: 'image-a1e76749e003b829411a3c73901b828fb0bc5ebb-1408x768-png' },
        alt: 'Psyllium husk supplement bag with a warning label on a white marble countertop next to a glass of water',
      },
      seo: { metaDescription: 'Psyllium husk products carry a cancer warning label in California — but it\'s not what you think. Here\'s what Prop 65 actually means and whether psyllium husk is safe to take.' },
      jsonLd: makeJsonLd(
        'Psyllium Husk Cancer Warning: What the Label Actually Means',
        'Psyllium husk products carry a cancer warning label in California — but it\'s not what you think. Here\'s what Prop 65 actually means and whether psyllium husk is safe to take.',
        `${BASE}/blog/psyllium-husk-cancer-warning`,
        `${CDN}/a1e76749e003b829411a3c73901b828fb0bc5ebb-1408x768.png`,
        [
          { q: 'Is psyllium husk safe to take every day?', a: 'Yes — psyllium husk is endorsed for daily long-term use by the American College of Gastroenterology. The Prop 65 warning reflects California\'s extremely conservative disclosure threshold, not a finding that daily use is dangerous.' },
          { q: 'Which psyllium husk brands don\'t have the cancer warning?', a: 'Any psyllium husk product sold in California is legally required to carry the Prop 65 warning if its lead content exceeds California\'s threshold, regardless of brand. A brand that doesn\'t display the warning is either not selling in California or has lead levels below the threshold.' },
          { q: 'Does Metamucil have the cancer warning?', a: 'Yes — Metamucil and other major psyllium husk brands carry the Prop 65 warning on products sold in California for the same reason. The warning is category-wide, not specific to one manufacturer.' },
          { q: 'Is the lead in psyllium husk the same as lead paint?', a: 'No. Lead paint contained extremely high concentrations of lead compounds deliberately added for paint properties. The lead in psyllium husk is a trace naturally occurring element absorbed from soil — the quantity and context are entirely different.' },
          { q: 'What is the safe daily dose of psyllium husk?', a: 'The standard clinical dose is 5–10 grams per day. The FDA-approved health claim for heart disease risk reduction is based on 7 grams per day. These doses are considered safe for daily long-term use by healthy adults.' },
        ]
      ),
      body: buildCancerWarningBody(),
    },
    {
      _id: `drafts.${crypto.randomUUID()}`,
      _type: 'post',
      title: 'Psyllium Husk Fiber Supplement: What It Is, How It Works, and Whether It\'s Worth It',
      slug: { _type: 'slug', current: 'psyllium-husk-fiber-supplement' },
      publishedAt,
      author: 'SpartanShopper',
      category: 'Gut Health',
      excerpt: 'The fiber supplement aisle is full of options, but one has decades of clinical research behind it. Here\'s what makes psyllium husk different from every other fiber supplement and whether it\'s worth adding to your routine.',
      coverImage: {
        _type: 'image',
        asset: { _type: 'reference', _ref: 'image-260717a167bd648a22679b4fcbfe3ca84f2c3bcd-1408x768-png' },
        alt: 'Psyllium husk powder jar, supplement capsule bottle, and glass of water arranged on a white marble surface',
      },
      seo: { metaDescription: 'Psyllium husk is the most clinically studied fiber supplement available. Here\'s how it works, what the research actually shows, and how to choose the right product in 2026.' },
      jsonLd: makeJsonLd(
        'Psyllium Husk Fiber Supplement: What It Is, How It Works, and Whether It\'s Worth It',
        'Psyllium husk is the most clinically studied fiber supplement available. Here\'s how it works, what the research actually shows, and how to choose the right product in 2026.',
        `${BASE}/blog/psyllium-husk-fiber-supplement`,
        `${CDN}/260717a167bd648a22679b4fcbfe3ca84f2c3bcd-1408x768.png`,
        [
          { q: 'Is psyllium husk the same as Metamucil?', a: 'Metamucil\'s active ingredient is psyllium husk — so yes, they are the same fiber. The difference is that Metamucil adds flavorings, sweeteners, and in some formulations, sugar and artificial dyes. Plain psyllium husk powder is the same fiber without the additives.' },
          { q: 'Can you take psyllium husk every day long term?', a: 'Yes. Unlike stimulant laxatives, psyllium husk is safe for indefinite daily use. It works with your body\'s existing digestive mechanics rather than overriding them, so there is no dependency risk.' },
          { q: 'How long before psyllium husk works?', a: 'For digestive regularity, most people see results within 12–72 hours of their first dose. For cholesterol and blood sugar benefits, consistent daily use for 4–8 weeks is required.' },
          { q: 'Is psyllium husk good for weight loss?', a: 'Psyllium husk can support weight management by increasing satiety — the gel expands in the stomach and slows digestion, helping you feel fuller longer. It is not a weight loss supplement in the direct sense, but it can be a useful tool as part of a broader approach.' },
          { q: 'Powder vs capsules — which is better?', a: 'Powder gives you faster gel formation and better dose control. Capsules are more convenient, easier to travel with, and eliminate texture issues. Both deliver the same clinical benefits — the choice comes down to personal preference and consistency.' },
        ]
      ),
      body: buildFiberSupplementBody(),
    },
    {
      _id: `drafts.${crypto.randomUUID()}`,
      _type: 'post',
      title: 'Psyllium Husk Dosage: How Much to Take and When',
      slug: { _type: 'slug', current: 'psyllium-husk-dosage' },
      publishedAt,
      author: 'SpartanShopper',
      category: 'Gut Health',
      excerpt: 'Most people take psyllium husk wrong — either too much at once, without enough water, or at the wrong time relative to their medications. Here\'s the exact dosage protocol that actually works.',
      coverImage: {
        _type: 'image',
        asset: { _type: 'reference', _ref: 'image-bb9ac6ef07a9c247a26ca70855a84409671207cc-1408x768-png' },
        alt: 'A measured teaspoon of psyllium husk powder being added to a glass of water on a white marble countertop',
      },
      seo: { metaDescription: 'How much psyllium husk should you take? Here\'s the exact dosage for constipation, cholesterol, blood sugar, and weight loss — plus timing, powder vs capsules, and what to avoid.' },
      jsonLd: makeJsonLd(
        'Psyllium Husk Dosage: How Much to Take and When',
        'How much psyllium husk should you take? Here\'s the exact dosage for constipation, cholesterol, blood sugar, and weight loss — plus timing, powder vs capsules, and what to avoid.',
        `${BASE}/blog/psyllium-husk-dosage`,
        `${CDN}/bb9ac6ef07a9c247a26ca70855a84409671207cc-1408x768.png`,
        [
          { q: 'Can you take too much psyllium husk?', a: 'Yes. Taking more than 15g per day without gradually building up to it can cause significant bloating, gas, and cramping. The maximum dose used in clinical studies is 30g per day, but this is well above what most people need.' },
          { q: 'Is 1 tablespoon of psyllium husk too much to start?', a: 'Yes. One tablespoon is approximately 15g — three times the recommended starting dose. Begin with 1 teaspoon (5g) and stay there for at least a week before increasing.' },
          { q: 'Can I take psyllium husk twice a day?', a: 'Yes — splitting your dose into two smaller servings (5g morning, 5g evening) is often better tolerated than a single 10g dose and may improve the cholesterol-lowering effect.' },
          { q: 'Does psyllium husk dosage change for weight loss?', a: 'The dosage for weight management (5g before meals) is at the lower end of the clinical range. More is not more effective for satiety — 5g is enough to produce meaningful gel formation and appetite suppression.' },
          { q: 'How long should I take psyllium husk?', a: 'Psyllium husk is safe for indefinite daily use. Unlike stimulant laxatives, it does not cause dependency or reduce your bowel\'s natural function. Many people use it daily for years without issue.' },
        ]
      ),
      body: buildDosageBody(),
    },
    {
      _id: `drafts.${crypto.randomUUID()}`,
      _type: 'post',
      title: 'Psyllium Husk for Weight Loss: What the Research Actually Shows',
      slug: { _type: 'slug', current: 'psyllium-husk-weight-loss' },
      publishedAt,
      author: 'SpartanShopper',
      category: 'Gut Health',
      excerpt: 'Psyllium husk isn\'t a fat burner. But the research on fiber, appetite, and caloric intake tells a more interesting story than most supplement marketing lets on. Here\'s what it actually does.',
      coverImage: {
        _type: 'image',
        asset: { _type: 'reference', _ref: 'image-8607f5c3f8a93f5d64c15dae868a4dfad50a5a69-1408x768-png' },
        alt: 'Psyllium husk powder mixed in a glass of water next to a measuring tape on a white marble surface',
      },
      seo: { metaDescription: 'Can psyllium husk help with weight loss? Here\'s what the clinical research actually shows about fiber, satiety, and fat loss — and how to use it effectively in 2026.' },
      jsonLd: makeJsonLd(
        'Psyllium Husk for Weight Loss: What the Research Actually Shows',
        'Can psyllium husk help with weight loss? Here\'s what the clinical research actually shows about fiber, satiety, and fat loss — and how to use it effectively in 2026.',
        `${BASE}/blog/psyllium-husk-weight-loss`,
        `${CDN}/8607f5c3f8a93f5d64c15dae868a4dfad50a5a69-1408x768.png`,
        [
          { q: 'Does psyllium husk reduce belly fat specifically?', a: 'Studies showing waist circumference reduction suggest psyllium contributes to abdominal fat reduction, but this is likely a result of overall caloric reduction rather than targeted belly fat burning. There is no supplement that reduces belly fat selectively.' },
          { q: 'How long does psyllium husk take to show weight loss results?', a: 'The satiety effect is immediate from the first dose. Measurable weight loss effects in studies typically appear after 4–8 weeks of consistent daily use before meals.' },
          { q: 'Should I take psyllium husk before or after meals for weight loss?', a: 'Before meals — specifically 30 minutes before your largest meal. Taking it after meals provides digestive benefits but does not produce the pre-meal satiety effect that drives the weight management benefit.' },
          { q: 'Can psyllium husk replace other weight loss supplements?', a: 'It can replace supplements with no evidence behind them (garcinia cambogia, raspberry ketones) without losing anything. It competes well with other fiber-based satiety supplements like glucomannan. It cannot replace pharmaceutical interventions like GLP-1 agonists for people who need significant weight loss.' },
          { q: 'Is psyllium husk safe to take daily for weight loss long term?', a: 'Yes. Psyllium husk is safe for indefinite daily use and carries no dependency risk. It\'s one of the few weight management supplements that can genuinely be used long term without concern.' },
        ]
      ),
      body: buildWeightLossBody(),
    },
    {
      _id: `drafts.${crypto.randomUUID()}`,
      _type: 'post',
      title: 'How to Use Psyllium Husk: The Complete Guide to Powder, Capsules, and Timing',
      slug: { _type: 'slug', current: 'psyllium-husk-how-to-use' },
      publishedAt,
      author: 'SpartanShopper',
      category: 'Gut Health',
      excerpt: 'Psyllium husk is one of the most effective fiber supplements available, but a surprising number of people use it wrong. Here\'s exactly how to take it so it actually works.',
      coverImage: {
        _type: 'image',
        asset: { _type: 'reference', _ref: 'image-b836c59b3b5b2c1927be5dda6d126b505b4c2388-1408x768-png' },
        alt: 'Measuring spoon, psyllium husk powder jar, and glass of water on a white marble kitchen counter showing how to mix psyllium husk',
      },
      seo: { metaDescription: 'How to use psyllium husk correctly — powder vs capsules, how much water, the best time to take it, and the mistakes that make it stop working or feel worse.' },
      jsonLd: makeJsonLd(
        'How to Use Psyllium Husk: The Complete Guide to Powder, Capsules, and Timing',
        'How to use psyllium husk correctly — powder vs capsules, how much water, the best time to take it, and the mistakes that make it stop working or feel worse.',
        `${BASE}/blog/psyllium-husk-how-to-use`,
        `${CDN}/b836c59b3b5b2c1927be5dda6d126b505b4c2388-1408x768.png`,
        [
          { q: 'Can I take psyllium husk on an empty stomach?', a: 'Yes. Taking psyllium on an empty stomach with plenty of water is the standard approach for digestive regularity. For blood sugar and weight management benefits, timing it before meals is more effective.' },
          { q: 'Can I take psyllium husk with coffee?', a: 'Yes — coffee doesn\'t interfere with psyllium\'s mechanism. However, take your psyllium with water rather than mixing it into coffee, as hot liquids affect gel formation.' },
          { q: 'How do I know if psyllium husk is working?', a: 'Signs it\'s working: more regular bowel movements, softer easier-to-pass stool, increased fullness after meals, more stable energy levels. Give it at least 72 hours for digestive effects and 4–6 weeks for cholesterol and blood sugar effects.' },
          { q: 'Can I take psyllium husk with other supplements?', a: 'Generally yes, with the same 2-hour spacing rule that applies to medications. Take psyllium separately from other supplements to ensure absorption isn\'t affected.' },
          { q: 'Is psyllium husk safe to take long term?', a: 'Yes. Unlike stimulant laxatives, psyllium husk does not cause dependency, does not reduce your bowel\'s natural function, and is safe for indefinite daily use.' },
        ]
      ),
      body: buildHowToUseBody(),
    },
  ]

  for (const post of posts) {
    process.stdout.write(`  Creating: ${(post.slug as { current: string }).current}… `)
    await client.create(post)
    console.log('✓')
    console.log(`  Draft ID: ${post._id}\n`)
  }

  console.log('── Done ────────────────────────────────────────────────')
  console.log('  Review at: https://spartanshopper.sanity.studio')
  console.log()
  console.log('  ⚠  "Gut Health" is not in the current category list.')
  console.log('     Add it to studio/schemas/post.ts and run: npx sanity deploy')
}

main().catch((err) => {
  console.error('\n[fatal]', err.message ?? err)
  process.exit(1)
})
