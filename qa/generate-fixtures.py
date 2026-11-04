"""Regenerate fictional QA documents. Optional tools: python-docx and reportlab."""
from pathlib import Path
import json
from docx import Document
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.pagesizes import A4
from xml.sax.saxutils import escape

out = Path(__file__).parent / 'fixtures'
out.mkdir(exist_ok=True)
intro = [
    'EXAMPLE STUDIO - FICTIONAL WEBSITE SERVICES AGREEMENT',
    'This document is synthetic QA data. It contains no real client information and is not legal advice.',
    '1. Engagement: Design and build a responsive restaurant website with a homepage, menu, contact page and photo gallery.',
    '2. Included deliverables: Homepage copy edits and gallery image replacement are included. The studio will deliver a contact form.',
    '3. Review process: The client supplies final approved materials and consolidated feedback. Two review rounds are included.',
]
terms = [
    'The client nominates one representative to consolidate comments and approve each delivery milestone in writing.',
    'The studio maintains an agreed delivery schedule. Delays in receiving client materials require a revised schedule approved by both parties.',
    'The client confirms ownership or permission to use supplied photographs and written materials. Final assets are reviewed before publication.',
    'Either party can raise a concern through the nominated representative. The parties record any agreed change in a written change notice.',
    'Confidential draft materials remain restricted to the engagement. The client reviews a preview and supplies a consolidated list of corrections.',
    'Any new deliverable requires written confirmation of requirements, responsibilities and the estimated completion date before work starts.',
]
paragraphs = intro + [f'{i+4}. Delivery record: {terms[i % len(terms)]}' for i in range(335)] + [
    'EXPLICIT EXCLUSIONS',
    'Blog functionality is not included. Booking systems are excluded. Newsletter is excluded.',
    'OPTIONAL SERVICES',
    'An online store is optional and requires a separate written agreement. No optional service is an approved deliverable.',
    'END OF AGREEMENT - QA SENTINEL 091',
]
text = '\n\n'.join(paragraphs)
assert 50000 < len(text) < 150000
(out / 'restaurant-agreement.txt').write_text(text, encoding='utf-8')
doc = Document()
for paragraph in paragraphs:
    doc.add_paragraph(paragraph)
doc.save(out / 'restaurant-agreement.docx')
styles = getSampleStyleSheet()
story=[]
for paragraph in paragraphs:
    story.extend([Paragraph(escape(paragraph), styles['BodyText']), Spacer(1, 5)])
SimpleDocTemplate(str(out / 'restaurant-agreement.pdf'), pagesize=A4).build(story)
(out / 'mixed-request.txt').write_text('Update homepage copy; replace gallery images; add a booking system.', encoding='utf-8')
(out / 'empty.txt').write_bytes(b'')
(out / 'malformed.docx').write_text('This is not a Word archive.', encoding='utf-8')
(out / 'malformed.pdf').write_text('This is not a PDF document.', encoding='utf-8')
SimpleDocTemplate(str(out / 'image-only.pdf'), pagesize=A4).build([Spacer(1,100), PageBreak()])
SimpleDocTemplate(str(out / 'partial-scan.pdf'), pagesize=A4).build([Paragraph('Selectable text: homepage copy edits included.', styles['BodyText']), PageBreak(), Spacer(1,100), PageBreak()])
(out / 'manifest.json').write_text(json.dumps({'synthetic':True, 'agreementCharacters':len(text), 'sentinel':'END OF AGREEMENT - QA SENTINEL 091', 'mixedVerdicts':['likely-covered','likely-covered','potential-change']},indent=2)+'\n')
print(f'Generated fixtures: {len(text)} agreement characters')
