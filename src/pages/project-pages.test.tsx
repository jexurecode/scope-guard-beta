import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ProjectsPage } from './ProjectsPage'
import { ProjectWorkspacePage } from './ProjectWorkspacePage'
import { NewProjectPage } from './NewProjectPage'
import type { ScopeState } from '../hooks/useScopeAnalysis'
import { createSavedAnalysis } from '../lib/workspace'

const project = { id: 'p1', name: 'First engagement', agreement: 'UNIQUE_LONG_AGREEMENT '.repeat(2500) + 'END_OF_FULL_AGREEMENT' }
const other = { id: 'p2', name: 'Other engagement', agreement: 'OTHER_PRIVATE_AGREEMENT' }
const saved = createSavedAnalysis('p1', 'Saved original', 'FIRST_CLIENT_REQUEST')
const otherSaved = createSavedAnalysis('p2', 'Other original', 'OTHER_CLIENT_REQUEST')
const scope = { data: { version: 1, projects: [project, other], analyses: [saved, otherSaved] }, project, history: [saved], projectId: 'p1', storageError: null, loading: false } as ScopeState
const props = { scope, navigate: () => {}, openAnalysis: () => {} }

describe('project pages', () => {
  it('keeps creation on its dedicated page', () => {
    const list = renderToStaticMarkup(<ProjectsPage {...props} />)
    expect(list).not.toContain('<form')
    const create = renderToStaticMarkup(<NewProjectPage {...props} />)
    expect(create).toContain('<form')
    expect(create).not.toContain('UNIQUE_LONG_AGREEMENT')
    expect(create).not.toContain('OTHER_CLIENT_REQUEST')
  })
  it('renders only bounded previews in project cards', () => {
    const html = renderToStaticMarkup(<ProjectsPage {...props} />)
    expect(html).toContain('View Full Agreement')
    expect(html).not.toContain('END_OF_FULL_AGREEMENT')
    expect(html.length).toBeLessThan(10000)
  })
  it('isolates the open workspace to its agreement and history', () => {
    const html = renderToStaticMarkup(<ProjectWorkspacePage {...props} />)
    expect(html).toContain('END_OF_FULL_AGREEMENT')
    expect(html).toContain('FIRST_CLIENT_REQUEST')
    expect(html).toContain('Analyze a request')
    expect(html).not.toContain('OTHER_PRIVATE_AGREEMENT')
    expect(html).not.toContain('OTHER_CLIENT_REQUEST')
    expect(html).not.toContain('Other engagement')
  })
})
