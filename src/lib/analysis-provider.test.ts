import { expect, it } from 'vitest'
import { heuristicProvider } from './analysis-provider'
import { analyzeScope } from './analysis-engine'

it('provides the deterministic engine through the async provider boundary', async () => {
  const input = { agreement: 'Build a website.', request: "Don't add payments, but add booking." }
  expect(await heuristicProvider.analyze(input)).toEqual(analyzeScope(input.agreement, input.request))
  expect(input).toEqual({ agreement: 'Build a website.', request: "Don't add payments, but add booking." })
})
