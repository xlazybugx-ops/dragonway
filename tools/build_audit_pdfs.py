from pathlib import Path
import re

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, KeepTogether

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output" / "pdf"
OUT.mkdir(parents=True, exist_ok=True)

regular = Path(r"C:\Windows\Fonts\arial.ttf")
bold = Path(r"C:\Windows\Fonts\arialbd.ttf")
pdfmetrics.registerFont(TTFont("Audit", str(regular)))
pdfmetrics.registerFont(TTFont("Audit-Bold", str(bold)))

base = getSampleStyleSheet()
styles = {
    "title": ParagraphStyle("title", parent=base["Title"], fontName="Audit-Bold", fontSize=22, leading=27, textColor=colors.HexColor("#2B1C18"), alignment=TA_CENTER, spaceAfter=15),
    "h1": ParagraphStyle("h1", parent=base["Heading1"], fontName="Audit-Bold", fontSize=15, leading=19, textColor=colors.HexColor("#9A572A"), spaceBefore=10, spaceAfter=6),
    "h2": ParagraphStyle("h2", parent=base["Heading2"], fontName="Audit-Bold", fontSize=12, leading=16, textColor=colors.HexColor("#564039"), spaceBefore=8, spaceAfter=4),
    "body": ParagraphStyle("body", parent=base["BodyText"], fontName="Audit", fontSize=9.4, leading=13.2, textColor=colors.HexColor("#2C2927"), spaceAfter=5),
    "bullet": ParagraphStyle("bullet", parent=base["BodyText"], fontName="Audit", fontSize=9.2, leading=12.8, leftIndent=12, firstLineIndent=-7, spaceAfter=3),
}

def safe(text):
    text = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    return re.sub(r"`([^`]+)`", r"<font name='Audit-Bold'>\1</font>", text)

def footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(colors.HexColor("#D7C2A5"))
    canvas.line(18 * mm, 14 * mm, 192 * mm, 14 * mm)
    canvas.setFont("Audit", 7.5)
    canvas.setFillColor(colors.HexColor("#786A60"))
    canvas.drawString(18 * mm, 9 * mm, "Draconis 2.2.2-test - внутренний аудит")
    canvas.drawRightString(192 * mm, 9 * mm, f"Страница {doc.page}")
    canvas.restoreState()

def build(source, target):
    lines = source.read_text(encoding="utf-8").splitlines()
    story = []
    first = True
    for raw in lines:
        line = raw.strip()
        if not line:
            story.append(Spacer(1, 2.5 * mm))
        elif line.startswith("# "):
            if not first:
                story.append(PageBreak())
            story.append(Paragraph(safe(line[2:]), styles["title"]))
            first = False
        elif line.startswith("## "):
            story.append(Paragraph(safe(line[3:]), styles["h1"]))
        elif line.startswith("### "):
            story.append(Paragraph(safe(line[4:]), styles["h2"]))
        elif re.match(r"^\d+\. ", line):
            story.append(Paragraph(safe(line), styles["bullet"]))
        elif line.startswith("- "):
            story.append(Paragraph("• " + safe(line[2:]), styles["bullet"]))
        else:
            story.append(Paragraph(safe(line), styles["body"]))
    doc = SimpleDocTemplate(str(target), pagesize=A4, rightMargin=18*mm, leftMargin=18*mm, topMargin=17*mm, bottomMargin=18*mm, title=lines[0].removeprefix("# "), author="Draconis team")
    doc.build(story, onFirstPage=footer, onLaterPages=footer)

build(ROOT / "docs" / "UI_AUDIT_2.2.2.md", OUT / "Draconis_UI_Audit_2.2.2.pdf")
build(ROOT / "docs" / "GAMEPLAY_ECONOMY_AUDIT_2.2.2.md", OUT / "Draconis_Gameplay_Economy_Audit_2.2.2.pdf")
