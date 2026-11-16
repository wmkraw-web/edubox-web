#!/usr/bin/env python3
"""Bank zwrotów nauczyciela (PDF) – prezent za zapis na listę mailingową.

Treść NIE jest pisana tutaj: skrypt bierze zwroty z tablicy PAGES w scripts/generate-wzory.js
(te same, które są na stronach *-przyklady.html), więc poprawka zwrotu w generatorze wzorów
trafia też do PDF-u po ponownym uruchomieniu.

Uruchamianie (ręcznie, poza npm test – wymaga Pythona z reportlab i czcionek DejaVu):
    pip install reportlab
    python3 scripts/generate-bank-zwrotow.py
Wynik: pobierz/bank-zwrotow-nauczyciela.pdf
"""
import json
import os
import subprocess
import sys

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (BaseDocTemplate, CondPageBreak, Frame, KeepTogether, PageBreak,
                                PageTemplate, Paragraph, Spacer, Table, TableStyle)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'pobierz', 'bank-zwrotow-nauczyciela.pdf')
FONTS = '/usr/share/fonts/truetype/dejavu'
SITE = 'https://eduboxpro.pl'
UTM = '?utm_source=pdf&utm_medium=bank-zwrotow'

pdfmetrics.registerFont(TTFont('Sans', os.path.join(FONTS, 'DejaVuSans.ttf')))
pdfmetrics.registerFont(TTFont('Sans-Bold', os.path.join(FONTS, 'DejaVuSans-Bold.ttf')))
pdfmetrics.registerFont(TTFont('Sans-Italic', os.path.join(FONTS, 'DejaVuSans-Oblique.ttf')))

NAVY = colors.HexColor('#0f172a')
BLUE = colors.HexColor('#2563eb')
MUTED = colors.HexColor('#475569')
LINE = colors.HexColor('#cbd5e1')
SOFT = colors.HexColor('#eff6ff')
AMBER = colors.HexColor('#fffbeb')
AMBER_LINE = colors.HexColor('#fcd34d')


def esc(text):
    return str(text).replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')


def load_pages():
    code = ("const {PAGES}=require('./scripts/generate-wzory.js');"
            "process.stdout.write('\\n@@JSON@@'+JSON.stringify(PAGES.map(p=>({slug:p.slug,h1:p.h1,"
            "tool:p.tool.name,toolUrl:p.tool.url,phrases:p.phrases}))))")
    out = subprocess.run(['node', '-e', code], cwd=ROOT, capture_output=True, text=True, check=True).stdout
    return json.loads(out.split('@@JSON@@', 1)[1])


S = {
    'title': ParagraphStyle('title', fontName='Sans-Bold', fontSize=30, leading=36, textColor=NAVY, alignment=TA_CENTER),
    'sub': ParagraphStyle('sub', fontName='Sans', fontSize=13, leading=19, textColor=MUTED, alignment=TA_CENTER),
    'kicker': ParagraphStyle('kicker', fontName='Sans-Bold', fontSize=9, leading=12, textColor=BLUE, alignment=TA_CENTER),
    'h1': ParagraphStyle('h1', fontName='Sans-Bold', fontSize=15, leading=19, textColor=NAVY, spaceAfter=2),
    'src': ParagraphStyle('src', fontName='Sans', fontSize=8, leading=11, textColor=MUTED, spaceAfter=6),
    'h2': ParagraphStyle('h2', fontName='Sans-Bold', fontSize=10.5, leading=14, textColor=BLUE, spaceBefore=8, spaceAfter=3),
    'li': ParagraphStyle('li', fontName='Sans', fontSize=9.8, leading=14.2, textColor=NAVY, leftIndent=13, bulletIndent=2, spaceAfter=2.2),
    'p': ParagraphStyle('p', fontName='Sans', fontSize=10, leading=15, textColor=NAVY, spaceAfter=6),
    'box': ParagraphStyle('box', fontName='Sans', fontSize=9.5, leading=14, textColor=NAVY),
    'toc': ParagraphStyle('toc', fontName='Sans', fontSize=10, leading=16, textColor=NAVY),
}


def box(html, fill, line):
    t = Table([[Paragraph(html, S['box'])]], colWidths=[170 * mm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), fill), ('BOX', (0, 0), (-1, -1), 0.8, line),
        ('LEFTPADDING', (0, 0), (-1, -1), 10), ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 8), ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    return t


def footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.5)
    canvas.line(20 * mm, 15 * mm, 190 * mm, 15 * mm)
    canvas.setFont('Sans', 8)
    canvas.setFillColor(MUTED)
    canvas.drawString(20 * mm, 10.5 * mm, 'Bank zwrotów nauczyciela · EduBox AI · eduboxpro.pl')
    canvas.drawRightString(190 * mm, 10.5 * mm, str(doc.page))
    canvas.restoreState()


def build():
    pages = load_pages()
    total = sum(len(items) for p in pages for _, items in p['phrases'])
    rounded = total // 10 * 10
    story = []

    # Okładka
    story += [Spacer(1, 42 * mm), Paragraph('EDUBOX AI · DLA NAUCZYCIELI', S['kicker']), Spacer(1, 6 * mm),
              Paragraph('Bank zwrotów<br/>nauczyciela', S['title']), Spacer(1, 7 * mm),
              Paragraph(f'Ponad {rounded} gotowych sformułowań do opinii o uczniu, ocen opisowych, '
                        'wiadomości do rodziców, sprawozdań i wpisów do dziennika.', S['sub']),
              Spacer(1, 16 * mm),
              box('<b>Jak korzystać.</b> Wybierz rozdział, skopiuj zwrot i dopasuj go do konkretnego ucznia – '
                  'zmień formę (uczeń/uczennica), dopisz przykład z własnych obserwacji. Zwroty są punktem wyjścia, '
                  'nie gotową opinią: o treści dokumentu decyduje nauczyciel, a o jego formie – zasady przyjęte w Twojej placówce.',
                  SOFT, colors.HexColor('#bfdbfe')),
              Spacer(1, 5 * mm),
              box('<b>Dane uczniów.</b> Jeśli pomagasz sobie narzędziami AI, nie wpisuj do nich imion, nazwisk ani '
                  'innych danych pozwalających rozpoznać dziecko. Imię dopisz dopiero w gotowym dokumencie.',
                  AMBER, AMBER_LINE),
              Spacer(1, 14 * mm),
              Paragraph(f'Pełne przykłady tekstów do każdego rozdziału: <a href="{SITE}/{UTM}" color="#2563eb">eduboxpro.pl</a>', S['sub']),
              PageBreak()]

    # Spis treści
    story += [Paragraph('Spis treści', S['h1']), Spacer(1, 3 * mm)]
    for i, p in enumerate(pages, 1):
        n = sum(len(items) for _, items in p['phrases'])
        story.append(Paragraph(f'{i}. {esc(p["h1"])} <font color="#475569">({n})</font>', S['toc']))
    story.append(PageBreak())

    # Rozdziały
    for i, p in enumerate(pages, 1):
        url = f'{SITE}/{p["slug"]}{UTM}'
        head = [Paragraph(f'{i}. {esc(p["h1"])}', S['h1']),
                Paragraph(f'Pełne przykłady: <a href="{url}" color="#2563eb">eduboxpro.pl/{p["slug"]}</a>', S['src'])]
        first = True
        for group, items in p['phrases']:
            block = [Paragraph(esc(group), S['h2'])] + [Paragraph(esc(item), S['li'], bulletText='•') for item in items]
            if first:
                story.append(CondPageBreak(60 * mm))
                story.append(KeepTogether(head + block[:3]))
                story += block[3:]
                first = False
            else:
                story.append(KeepTogether(block[:3]))
                story += block[3:]
        tool_url = f'{SITE}/{p["toolUrl"].split("?")[0]}{UTM}'
        story += [Spacer(1, 3 * mm),
                  box(f'Potrzebujesz całego tekstu, nie tylko zwrotów? <b>{esc(p["tool"])}</b> złoży szkic z Twoich obserwacji – '
                      f'za darmo, bez rejestracji: <a href="{tool_url}" color="#2563eb">eduboxpro.pl/{p["toolUrl"].split("?")[0]}</a>',
                      SOFT, colors.HexColor('#bfdbfe')),
                  Spacer(1, 7 * mm)]

    # Zakończenie
    story += [CondPageBreak(70 * mm), Paragraph('Na koniec', S['h1']), Spacer(1, 2 * mm),
              Paragraph('EduBox AI to ponad 60 darmowych narzędzi dla nauczycieli, prowadzonych przez jedną osobę. '
                        'Jeśli ten bank zaoszczędził Ci choć jeden wieczór, podaj go dalej koleżance albo koledze z pokoju nauczycielskiego.', S['p']),
              Paragraph(f'Wszystkie narzędzia: <a href="{SITE}/{UTM}" color="#2563eb">eduboxpro.pl</a><br/>'
                        'Podziękować kawą można tutaj: <a href="https://buycoffee.to/magiccolor" color="#2563eb">buycoffee.to/magiccolor</a>', S['p'])]

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    doc = BaseDocTemplate(OUT, pagesize=A4, leftMargin=20 * mm, rightMargin=20 * mm, topMargin=18 * mm, bottomMargin=22 * mm,
                          title='Bank zwrotów nauczyciela', author='EduBox AI – eduboxpro.pl',
                          subject='Gotowe sformułowania do opinii, ocen opisowych i wiadomości do rodziców', invariant=1)
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id='f', leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
    doc.addPageTemplates([PageTemplate(id='p', frames=[frame], onPage=footer)])
    doc.build(story)
    print(f'[Bank zwrotów] {OUT}: {total} zwrotów w {len(pages)} rozdziałach, stron: {doc.page}')


if __name__ == '__main__':
    try:
        build()
    except subprocess.CalledProcessError as error:
        sys.exit(f'Nie udało się wczytać zwrotów z generate-wzory.js: {error.stderr}')
