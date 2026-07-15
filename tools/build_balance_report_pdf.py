from pathlib import Path
import re
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, LongTable, TableStyle

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'output'/'pdf';OUT.mkdir(parents=True,exist_ok=True)
pdfmetrics.registerFont(TTFont('Audit',r'C:\Windows\Fonts\arial.ttf'))
pdfmetrics.registerFont(TTFont('Audit-Bold',r'C:\Windows\Fonts\arialbd.ttf'))
base=getSampleStyleSheet()
S={
 'title':ParagraphStyle('title',parent=base['Title'],fontName='Audit-Bold',fontSize=21,leading=25,alignment=TA_CENTER,textColor=colors.HexColor('#281B18'),spaceAfter=12),
 'h1':ParagraphStyle('h1',parent=base['Heading1'],fontName='Audit-Bold',fontSize=15,leading=18,textColor=colors.HexColor('#9A572A'),spaceBefore=9,spaceAfter=5),
 'h2':ParagraphStyle('h2',parent=base['Heading2'],fontName='Audit-Bold',fontSize=11.5,leading=14,textColor=colors.HexColor('#58433B'),spaceBefore=7,spaceAfter=4),
 'body':ParagraphStyle('body',parent=base['BodyText'],fontName='Audit',fontSize=9.1,leading=12.5,textColor=colors.HexColor('#292624'),spaceAfter=4),
 'bullet':ParagraphStyle('bullet',parent=base['BodyText'],fontName='Audit',fontSize=8.9,leading=12,leftIndent=11,firstLineIndent=-7,spaceAfter=2.5),
 'cell':ParagraphStyle('cell',parent=base['BodyText'],fontName='Audit',fontSize=7.2,leading=9,textColor=colors.HexColor('#292624')),
 'cellh':ParagraphStyle('cellh',parent=base['BodyText'],fontName='Audit-Bold',fontSize=7.3,leading=9,textColor=colors.white),
}
def esc(x):
 x=x.replace('&','&amp;').replace('<','&lt;').replace('>','&gt;')
 x=re.sub(r'`([^`]+)`',r"<font name='Audit-Bold'>\1</font>",x)
 x=re.sub(r'\*\*([^*]+)\*\*',r"<font name='Audit-Bold'>\1</font>",x)
 return x
def footer(c,d):
 c.saveState();c.setStrokeColor(colors.HexColor('#D8C2A4'));c.line(17*mm,14*mm,193*mm,14*mm)
 c.setFont('Audit',7.2);c.setFillColor(colors.HexColor('#776A61'));c.drawString(17*mm,9*mm,'Draconis 2.3.0-test - баланс и экономика');c.drawRightString(193*mm,9*mm,f'Страница {d.page}');c.restoreState()
def table_from(lines):
 rows=[]
 for i,line in enumerate(lines):
  vals=[x.strip() for x in line.strip().strip('|').split('|')]
  if i==1 and all(set(x)<=set('-: ') for x in vals):continue
  rows.append([Paragraph(esc(x),S['cellh' if i==0 else 'cell']) for x in vals])
 n=len(rows[0]);usable=176*mm
 if n==2: widths=[45*mm,131*mm]
 elif n==3: widths=[42*mm,67*mm,67*mm]
 elif n==4: widths=[42*mm,44.5*mm,44.5*mm,45*mm]
 elif n==5: widths=[29*mm,36.5*mm,36.5*mm,36.5*mm,37.5*mm]
 else: widths=[usable/n]*n
 t=LongTable(rows,colWidths=widths,repeatRows=1,hAlign='LEFT')
 t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),colors.HexColor('#8E542F')),('GRID',(0,0),(-1,-1),.35,colors.HexColor('#CBB89F')),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),4),('RIGHTPADDING',(0,0),(-1,-1),4),('TOPPADDING',(0,0),(-1,-1),4),('BOTTOMPADDING',(0,0),(-1,-1),4),('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white,colors.HexColor('#F7F2EA')])]))
 return t
def append_doc(story,path,first_doc):
 lines=path.read_text(encoding='utf-8').splitlines();i=0
 if not first_doc: story.append(PageBreak())
 while i<len(lines):
  line=lines[i].strip()
  if not line: story.append(Spacer(1,1.5*mm));i+=1;continue
  if line.startswith('|'):
   block=[]
   while i<len(lines) and lines[i].strip().startswith('|'):block.append(lines[i]);i+=1
   story.append(table_from(block));story.append(Spacer(1,3*mm));continue
  if line.startswith('# '):story.append(Paragraph(esc(line[2:]),S['title']))
  elif line.startswith('## '):story.append(Paragraph(esc(line[3:]),S['h1']))
  elif line.startswith('### '):story.append(Paragraph(esc(line[4:]),S['h2']))
  elif line.startswith('- '):story.append(Paragraph('• '+esc(line[2:]),S['bullet']))
  elif re.match(r'^\d+\. ',line):story.append(Paragraph(esc(line),S['bullet']))
  else:story.append(Paragraph(esc(line),S['body']))
  i+=1

docs=['BALANCE_IMPLEMENTATION_2.3.0.md','ECONOMY_MODEL_2.3.0.md','SIMULATION_REPORT_2.3.0.md','TELEMETRY_PLAN_2.3.0.md']
story=[]
for i,name in enumerate(docs):append_doc(story,ROOT/'docs'/name,i==0)
target=OUT/'Draconis_Balance_Economy_Implementation_2.3.0.pdf'
doc=SimpleDocTemplate(str(target),pagesize=A4,leftMargin=17*mm,rightMargin=17*mm,topMargin=16*mm,bottomMargin=18*mm,title='Draconis 2.3.0-test - баланс и экономика',author='Draconis team')
doc.build(story,onFirstPage=footer,onLaterPages=footer)
print(target)
