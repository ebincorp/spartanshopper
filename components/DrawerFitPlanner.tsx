'use client'

import { useState } from 'react'

const example = {
  width: '16.3',
  depth: '12.5',
  height: '5',
  organizerWidth: '14.9',
  organizerDepth: '5.3',
  loadedHeight: '',
}

const drawer = [
  ['width', 'Usable width'],
  ['depth', 'Usable depth'],
  ['height', 'Closing height'],
] as const

const organizer = [
  ['organizerWidth', 'Organizer width'],
  ['organizerDepth', 'Organizer depth'],
  ['loadedHeight', 'Height with tools loaded'],
] as const

type Dimensions = typeof example

function clearance(available: number, occupied: number) {
  return Math.round((available - occupied) * 1000) / 1000
}

function fitMessage(values: Dimensions) {
  const [width, depth, height, organizerWidth, organizerDepth] = [
    ...drawer, ...organizer.slice(0, 2),
  ].map(([field]) => Number(values[field]))

  if (![width, depth, height, organizerWidth, organizerDepth].every(value => Number.isFinite(value) && value > 0)) {
    return 'Enter positive numbers for the drawer and organizer dimensions.'
  }

  const orientations = [
    { label: 'Straight placement', across: clearance(width, organizerWidth), frontToBack: clearance(depth, organizerDepth) },
    { label: 'Rotated 90°', across: clearance(width, organizerDepth), frontToBack: clearance(depth, organizerWidth) },
  ]
  const fit = orientations.find(({ across, frontToBack }) => across > 0 && frontToBack > 0)
  if (!fit) return 'Neither orientation leaves positive width and depth clearance. Check the narrowest points or choose a smaller organizer.'

  const footprint = fit.label + ' leaves ' + fit.across + ' in. across and ' + fit.frontToBack + ' in. front-to-back on paper.'
  const loaded = Number(values.loadedHeight)
  if (!Number.isFinite(loaded) || loaded <= 0) return footprint + ' Enter the loaded height to check closing clearance.'

  const above = clearance(height, loaded)
  if (above <= 0) return footprint + ' The loaded organizer has no positive closing clearance.'

  return footprint + ' Your inputs leave ' + above + ' in. of closing clearance. Confirm clearance around slides, dividers, and handles on your drawer.'
}

export default function DrawerFitPlanner() {
  const [values, setValues] = useState<Dimensions>(example)

  return (
    <section id="drawer-fit-planner" aria-labelledby="drawer-fit-heading" className="mb-8 rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
      <h2 id="drawer-fit-heading" className="text-xl font-extrabold text-[#1A1A2E]">Will the organizer fit your drawer?</h2>
      <p className="mt-2 text-sm text-gray-700">The example uses published dimensions for a Milwaukee 48-22-8442 drawer and an Ernst 8498HV organizer. Enter the narrowest usable dimensions in inches and measure the organizer with your tallest tool installed.</p>
      <form className="mt-4 space-y-4" onSubmit={event => event.preventDefault()}>
        {[
          { title: 'Drawer interior', fields: drawer },
          { title: 'Organizer', fields: organizer },
        ].map(({ title, fields }) => (
          <fieldset key={title}>
            <legend className="mb-2 text-sm font-bold text-gray-900">{title}</legend>
            <div className="grid gap-3 sm:grid-cols-3">
              {fields.map(([field, label]) => (
                <label key={field} className="block min-w-0 text-sm font-medium text-gray-700">
                  {label}
                  <input
                    className="mt-1 block w-full rounded-md border border-gray-400 bg-white px-2 py-2 text-base text-gray-900 focus:border-[#A62B3E] focus:outline-[#A62B3E]"
                    name={field}
                    type="number"
                    inputMode="decimal"
                    min="0.001"
                    step="any"
                    value={values[field]}
                    onChange={event => setValues(current => ({ ...current, [field]: event.target.value }))}
                  />
                </label>
              ))}
            </div>
          </fieldset>
        ))}
        <output aria-live="polite" className="block rounded-md bg-[#fff1f2] p-3 text-sm text-gray-900">
          {fitMessage(values)}
        </output>
      </form>
    </section>
  )
}
