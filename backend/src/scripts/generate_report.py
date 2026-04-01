"""
StudySmart – Professional Student Analytics PDF Generator
=========================================================
Backend: Express route calls this via child_process or you can run standalone.
Usage:   node calls  python3 generate_report.py  with JSON piped to stdin,
         or import generate_pdf(data_dict) → bytes  from a Python micro-service.

The function generate_pdf(data) returns raw PDF bytes ready to stream to the client.
"""

import io, json, sys, math
from datetime import datetime

from reportlab.lib.pagesizes   import A4
from reportlab.lib.units        import cm, mm
from reportlab.lib.colors       import (
    HexColor, white, black, Color
)
from reportlab.lib               import colors
from reportlab.lib.styles        import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums         import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.platypus          import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether, PageBreak
)
from reportlab.graphics.shapes  import Drawing, Rect, String, Line, Circle
from reportlab.graphics          import renderPDF
from reportlab.pdfbase           import pdfmetrics
from reportlab.pdfbase.ttfonts   import TTFont

# ── Brand colours ─────────────────────────────────────────────────────────────
C_PRIMARY    = HexColor('#2563eb')
C_PRIMARY_LT = HexColor('#dbeafe')
C_PRIMARY_BG = HexColor('#eff6ff')
C_PURPLE     = HexColor('#7c3aed')
C_SUCCESS    = HexColor('#059669')
C_SUCCESS_BG = HexColor('#ecfdf5')
C_WARNING    = HexColor('#d97706')
C_WARNING_BG = HexColor('#fffbeb')
C_ERROR      = HexColor('#dc2626')
C_ERROR_BG   = HexColor('#fef2f2')
C_TEXT       = HexColor('#1e293b')
C_TEXT_MD    = HexColor('#475569')
C_TEXT_SM    = HexColor('#64748b')
C_BORDER     = HexColor('#dbeafe')
C_BG         = HexColor('#f0f5ff')
C_WHITE      = white
C_GRAD_END   = HexColor('#1e40af')

PAGE_W, PAGE_H = A4
MARGIN = 2 * cm

# ── Helper: safe value ────────────────────────────────────────────────────────
def safe(val, default='Insufficient Data', fmt=None):
    if val is None or val == '' or val == 'N/A':
        return default
    if fmt == 'pct':
        try:    return f'{float(val):.2f}%'
        except: return default
    if fmt == 'score':
        try:    return f'{float(val):.1f}'
        except: return default
    if fmt == 'gpa':
        try:    return f'{float(val):.2f}'
        except: return default
    return str(val)

def score_to_gpa(score):
    try: s = float(score)
    except: return 0.0
    if s >= 85: return 4.0
    if s >= 75: return 3.7
    if s >= 70: return 3.3
    if s >= 65: return 3.0
    if s >= 60: return 2.7
    if s >= 55: return 2.3
    if s >= 50: return 2.0
    if s >= 40: return 1.7
    return 0.0

def get_grade(score):
    try: s = float(score)
    except: return 'F'
    if s >= 85: return 'A+'
    if s >= 75: return 'A'
    if s >= 70: return 'B+'
    if s >= 65: return 'B'
    if s >= 60: return 'C+'
    if s >= 55: return 'C'
    if s >= 50: return 'D'
    return 'F'

def get_status(score):
    try:    return 'Excellent' if float(score) >= 75 else ('Good' if float(score) >= 50 else 'Needs Improvement')
    except: return 'Insufficient Data'

def get_trend_arrow(trend):
    t = str(trend).lower()
    if 'improv' in t or 'up' in t:   return '↑ Improving'
    if 'declin' in t or 'down' in t: return '↓ Declining'
    return '→ Stable'

def score_color(score):
    try: s = float(score)
    except: return C_TEXT_SM
    if s >= 75: return C_SUCCESS
    if s >= 50: return C_WARNING
    return C_ERROR

def confidence_level(total_assessments):
    n = int(total_assessments or 0)
    if n >= 10: return ('High',   C_SUCCESS)
    if n >= 5:  return ('Medium', C_WARNING)
    return ('Low – limited data', C_ERROR)

# ── Styles ────────────────────────────────────────────────────────────────────
def build_styles():
    base = getSampleStyleSheet()
    def S(name, **kw):
        return ParagraphStyle(name, **kw)

    return {
        'h_title': S('h_title',
            fontName='Helvetica-Bold', fontSize=22,
            textColor=C_WHITE, alignment=TA_LEFT, leading=28),
        'h_sub': S('h_sub',
            fontName='Helvetica', fontSize=11,
            textColor=HexColor('#bfdbfe'), alignment=TA_LEFT, leading=16),
        'meta_label': S('meta_label',
            fontName='Helvetica', fontSize=9,
            textColor=HexColor('#bfdbfe'), alignment=TA_RIGHT, leading=13),
        'meta_value': S('meta_value',
            fontName='Helvetica-Bold', fontSize=10,
            textColor=C_WHITE, alignment=TA_RIGHT, leading=14),
        'section_title': S('section_title',
            fontName='Helvetica-Bold', fontSize=13,
            textColor=C_PRIMARY, spaceBefore=4, spaceAfter=6),
        'body': S('body',
            fontName='Helvetica', fontSize=10,
            textColor=C_TEXT_MD, leading=15, spaceAfter=4),
        'bold': S('bold',
            fontName='Helvetica-Bold', fontSize=10,
            textColor=C_TEXT, leading=15),
        'small': S('small',
            fontName='Helvetica', fontSize=9,
            textColor=C_TEXT_SM, leading=12),
        'insight': S('insight',
            fontName='Helvetica', fontSize=10,
            textColor=C_TEXT_MD, leading=16, leftIndent=12),
        'table_hdr': S('table_hdr',
            fontName='Helvetica-Bold', fontSize=9,
            textColor=C_WHITE, alignment=TA_CENTER, leading=13),
        'table_cell': S('table_cell',
            fontName='Helvetica', fontSize=9,
            textColor=C_TEXT, alignment=TA_CENTER, leading=12),
        'table_cell_l': S('table_cell_l',
            fontName='Helvetica', fontSize=9,
            textColor=C_TEXT, alignment=TA_LEFT, leading=12),
        'kpi_num': S('kpi_num',
            fontName='Helvetica-Bold', fontSize=20,
            textColor=C_PRIMARY, alignment=TA_CENTER, leading=24),
        'kpi_lbl': S('kpi_lbl',
            fontName='Helvetica', fontSize=8,
            textColor=C_TEXT_SM, alignment=TA_CENTER, leading=11),
        'footer': S('footer',
            fontName='Helvetica', fontSize=8,
            textColor=C_TEXT_SM, alignment=TA_CENTER, leading=11),
        'warn': S('warn',
            fontName='Helvetica-Bold', fontSize=10,
            textColor=C_ERROR, leading=14),
    }

# ── Header canvas (blue gradient banner) ─────────────────────────────────────
def draw_header_banner(canvas, doc):
    """Draws the full-width gradient header on page 1."""
    w, h = A4
    bh = 7.2 * cm
    y0 = h - bh

    # Simulate gradient with overlapping rects (light → dark left to right)
    steps = 30
    for i in range(steps):
        r1 = 0x25 + int((0x1e - 0x25) * i / steps)
        g1 = 0x63 + int((0x40 - 0x63) * i / steps)
        b1 = 0xeb + int((0xaf - 0xeb) * i / steps)
        canvas.setFillColorRGB(r1/255, g1/255, b1/255)
        canvas.rect(w * i / steps, y0, w / steps + 1, bh, fill=1, stroke=0)

    # Decorative circles
    canvas.saveState()
    canvas.setFillColorRGB(1, 1, 1, 0.07)
    canvas.circle(w - 3*cm, y0 + bh - 2*cm, 3.5*cm, fill=1, stroke=0)
    canvas.circle(w - 6*cm, y0 + 0.5*cm,   2.0*cm, fill=1, stroke=0)
    canvas.circle(3*cm,     y0 + bh/2,      1.2*cm, fill=1, stroke=0)
    canvas.restoreState()

    # Bottom accent bar
    canvas.setFillColor(HexColor('#1d4ed8'))
    canvas.rect(0, y0 - 4, w, 4, fill=1, stroke=0)

def draw_footer(canvas, doc):
    w, h = A4
    canvas.setFillColor(C_BG)
    canvas.rect(0, 0, w, 1.2*cm, fill=1, stroke=0)
    canvas.setStrokeColor(C_BORDER)
    canvas.setLineWidth(0.5)
    canvas.line(MARGIN, 1.2*cm, w - MARGIN, 1.2*cm)
    canvas.setFont('Helvetica', 8)
    canvas.setFillColor(C_TEXT_SM)
    canvas.drawString(MARGIN, 0.5*cm,
        'Generated by StudySmart AI System  •  Confidential Student Report')
    canvas.drawRightString(w - MARGIN, 0.5*cm,
        f'Page {doc.page}  •  {datetime.now().strftime("%d %b %Y")}')

def on_first_page(canvas, doc):
    draw_header_banner(canvas, doc)
    draw_footer(canvas, doc)

def on_later_pages(canvas, doc):
    draw_footer(canvas, doc)
    # Thin top bar
    w, h = A4
    canvas.setFillColor(C_PRIMARY)
    canvas.rect(0, h - 0.6*cm, w, 0.6*cm, fill=1, stroke=0)
    canvas.setFont('Helvetica-Bold', 8)
    canvas.setFillColor(C_WHITE)
    canvas.drawString(MARGIN, h - 0.42*cm, 'StudySmart – Student Analytics Report')
    canvas.drawRightString(w - MARGIN, h - 0.42*cm,
        f'Confidential  •  Page {doc.page}')

# ── Section heading helper ────────────────────────────────────────────────────
def section_heading(title, styles, icon='▶'):
    elems = []
    elems.append(Spacer(1, 0.4*cm))
    p = Paragraph(f'<font color="#2563eb">{icon}</font>  {title}',
                  styles['section_title'])
    elems.append(p)
    elems.append(HRFlowable(width='100%', thickness=1.5,
                             color=C_PRIMARY_LT, spaceAfter=6))
    return elems

# ── Mini horizontal bar ───────────────────────────────────────────────────────
def score_bar(score, width=80, height=7):
    try:    pct = min(max(float(score), 0), 100) / 100
    except: pct = 0
    d = Drawing(width, height)
    d.add(Rect(0, 0, width, height,
               fillColor=HexColor('#e2e8f0'), strokeColor=None))
    if pct > 0:
        col = C_SUCCESS if pct >= 0.75 else (C_WARNING if pct >= 0.5 else C_ERROR)
        d.add(Rect(0, 0, width * pct, height,
                   fillColor=col, strokeColor=None))
    return d

# ── GPA ring (simple arc approximated with a thick circle drawing) ────────────
def gpa_ring(gpa, size=60):
    try:    g = min(max(float(gpa), 0), 4.0)
    except: g = 0
    d = Drawing(size, size)
    cx, cy, r = size/2, size/2, size/2 - 4
    col = (C_SUCCESS if g >= 3.5 else
           C_PRIMARY  if g >= 2.5 else
           C_WARNING  if g >= 2.0 else C_ERROR)
    # background circle
    d.add(Circle(cx, cy, r, fillColor=None,
                 strokeColor=HexColor('#e2e8f0'), strokeWidth=5))
    # value text
    d.add(String(cx, cy - 4, f'{g:.2f}',
                 fontName='Helvetica-Bold', fontSize=12,
                 fillColor=col, textAnchor='middle'))
    d.add(String(cx, cy - 15, '/ 4.0',
                 fontName='Helvetica', fontSize=7,
                 fillColor=C_TEXT_SM, textAnchor='middle'))
    return d

# ═════════════════════════════════════════════════════════════════════════════
# MAIN GENERATOR
# ═════════════════════════════════════════════════════════════════════════════
def generate_pdf(data: dict) -> bytes:
    buf    = io.BytesIO()
    styles = build_styles()

    # ── Unpack data ────────────────────────────────────────────────────────────
    personal = data.get('personalInfo',  {}) or {}
    academic = data.get('academicInfo',  {}) or {}
    perf     = data.get('performance',   {}) or {}
    subjects = perf.get('subjectPerformance', []) or []
    summary  = perf.get('summary',       perf) or {}
    trend    = perf.get('performanceTrend', []) or []
    study    = data.get('studyHabits',   {}) or {}

    name        = safe(personal.get('name')          or data.get('name'),   'Unknown Student')
    student_num = safe(personal.get('studentNumber') or data.get('studentId'), 'N/A')
    email       = safe(personal.get('email')         or data.get('email'),  'N/A')
    program     = safe(academic.get('program'),  'Insufficient Data')
    batch       = safe(academic.get('batch'),    'N/A')
    semester    = safe(academic.get('semester'), 'N/A')
    branch      = safe(academic.get('branch'),   'N/A')

    avg_score   = summary.get('averageScore') or perf.get('overallAverage') or perf.get('averageScore') or 0
    pass_rate   = summary.get('passRate', 0)
    total_ass   = summary.get('totalAssessments') or perf.get('totalAssessments', 0)
    top_score   = summary.get('topScore',  0)
    bot_score   = summary.get('bottomScore', 0)
    current_gpa = academic.get('currentGPA') or score_to_gpa(avg_score)

    conf_label, conf_color = confidence_level(total_ass)

    gen_date = datetime.now().strftime('%d %B %Y, %H:%M')

    # ── Doc setup ──────────────────────────────────────────────────────────────
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        leftMargin=MARGIN, rightMargin=MARGIN,
        topMargin=7.8*cm,   # leave room for banner
        bottomMargin=1.8*cm,
        title='StudySmart Student Analytics Report',
        author='StudySmart AI System',
    )
    story = []

    # ══════════════════════════════════════════════════════════════════════════
    # PAGE 1 HEADER CONTENT (sits inside topMargin space via canvas overlay)
    # We add a spacer, then a 2-col table for title | meta
    # ══════════════════════════════════════════════════════════════════════════

    # Header table (white text on transparent background — banner is drawn by canvas)
    left_col = [
        Paragraph('StudySmart', styles['h_title']),
        Spacer(1, 0.15*cm),
        Paragraph('Student Analytics Report', ParagraphStyle(
            'sub2', fontName='Helvetica', fontSize=13,
            textColor=HexColor('#93c5fd'), leading=17)),
        Spacer(1, 0.3*cm),
        Paragraph(f'Generated: {gen_date}', styles['h_sub']),
    ]
    right_col = [
        Paragraph(f'<b>{name}</b>', styles['meta_value']),
        Paragraph(f'ID: {student_num}', styles['meta_label']),
        Paragraph(f'{email}', styles['meta_label']),
        Spacer(1, 0.2*cm),
        Paragraph(f'Program: {program}', styles['meta_label']),
        Paragraph(f'Batch: {batch}  •  Sem: {semester}', styles['meta_label']),
        Paragraph(f'Branch: {branch}', styles['meta_label']),
    ]

    hdr_table = Table(
        [[left_col, right_col]],
        colWidths=[PAGE_W - 2*MARGIN - 7*cm, 7*cm],
    )
    hdr_table.setStyle(TableStyle([
        ('VALIGN',      (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING',  (0,0), (-1,-1), 6),
        ('BOTTOMPADDING',(0,0),(-1,-1), 6),
        ('LEFTPADDING', (0,0), (0,-1), 0),
        ('RIGHTPADDING',(1,0), (1,-1), 0),
    ]))
    story.append(hdr_table)
    story.append(Spacer(1, 0.5*cm))

    # ══════════════════════════════════════════════════════════════════════════
    # 1. EXECUTIVE SUMMARY
    # ══════════════════════════════════════════════════════════════════════════
    story += section_heading('Executive Summary', styles, '📊')

    # KPI cards as a 6-col table
    def kpi(label, value, sub=''):
        return [
            Paragraph(str(value), styles['kpi_num']),
            Paragraph(label, styles['kpi_lbl']),
            Paragraph(sub, ParagraphStyle('ksub', fontName='Helvetica',
                fontSize=7, textColor=C_TEXT_SM, alignment=TA_CENTER)),
        ]

    gpa_str     = safe(current_gpa, fmt='gpa')   if current_gpa else 'Insufficient Data'
    avg_str     = safe(avg_score,   fmt='score')  if avg_score   else 'Insufficient Data'
    pass_str    = safe(pass_rate,   fmt='pct')    if pass_rate   else 'Insufficient Data'
    top_str     = safe(top_score,   fmt='score')  if top_score   else 'Insufficient Data'

    kpi_data = [[
        kpi('Total Subjects',    len(subjects) or 'N/A',    ''),
        kpi('Assessments',       total_ass or 'N/A',        ''),
        kpi('Average Score',     avg_str,                   '/ 100%'),
        kpi('Current GPA',       gpa_str,                   '/ 4.0'),
        kpi('Pass Rate',         pass_str,                  'Target: 75%'),
        kpi('Confidence',        conf_label,                'Prediction'),
    ]]

    cw = (PAGE_W - 2*MARGIN) / 6
    kpi_table = Table(kpi_data, colWidths=[cw]*6, rowHeights=[None])
    kpi_table.setStyle(TableStyle([
        ('BOX',         (0,0), (-1,-1), 0.5,   C_BORDER),
        ('INNERGRID',   (0,0), (-1,-1), 0.5,   C_BORDER),
        ('BACKGROUND',  (0,0), (-1,-1),        C_PRIMARY_BG),
        ('TOPPADDING',  (0,0), (-1,-1), 10),
        ('BOTTOMPADDING',(0,0),(-1,-1), 10),
        ('ALIGN',       (0,0), (-1,-1), 'CENTER'),
        ('ROUNDEDCORNERS', [6]),
    ]))
    story.append(kpi_table)
    story.append(Spacer(1, 0.3*cm))

    # ══════════════════════════════════════════════════════════════════════════
    # 2. ACADEMIC STANDING PANEL
    # ══════════════════════════════════════════════════════════════════════════
    gpa_val = float(current_gpa) if current_gpa else 0
    standing = ('Excellent Standing' if gpa_val >= 3.5 else
                'Good Standing'      if gpa_val >= 2.5 else
                'Satisfactory'       if gpa_val >= 2.0 else
                'At Risk'            if gpa_val > 0   else 'No Assessment Data')
    standing_col = (C_SUCCESS if gpa_val >= 3.5 else
                    C_PRIMARY  if gpa_val >= 2.5 else
                    C_WARNING  if gpa_val >= 2.0 else
                    C_ERROR    if gpa_val > 0   else C_TEXT_SM)

    panel_data = [[
        [Paragraph('Academic Standing', styles['kpi_lbl']),
         Paragraph(standing,
                   ParagraphStyle('std', fontName='Helvetica-Bold', fontSize=13,
                                  textColor=standing_col, alignment=TA_CENTER))],
        [Paragraph('Top Score', styles['kpi_lbl']),
         Paragraph(f'{top_str}%', styles['kpi_num'])],
        [Paragraph('Lowest Score', styles['kpi_lbl']),
         Paragraph(safe(bot_score, fmt='score'), styles['kpi_num'])],
        [Paragraph('Study Hours/Day', styles['kpi_lbl']),
         Paragraph(safe(study.get('dailyAverage'), fmt='score'), styles['kpi_num'])],
        [Paragraph('Consistency', styles['kpi_lbl']),
         Paragraph(safe(study.get('consistency'), fmt='pct')
                   if study.get('consistency') else 'Insufficient Data',
                   styles['kpi_num'])],
    ]]

    pn_cw = (PAGE_W - 2*MARGIN) / 5
    panel = Table(panel_data, colWidths=[pn_cw]*5)
    panel.setStyle(TableStyle([
        ('BOX',          (0,0),(-1,-1), 0.5, C_BORDER),
        ('INNERGRID',    (0,0),(-1,-1), 0.5, C_BORDER),
        ('BACKGROUND',   (0,0),(-1,-1),      C_BG),
        ('TOPPADDING',   (0,0),(-1,-1), 8),
        ('BOTTOMPADDING',(0,0),(-1,-1), 8),
        ('ALIGN',        (0,0),(-1,-1), 'CENTER'),
    ]))
    story.append(panel)

    # ══════════════════════════════════════════════════════════════════════════
    # 3. SUBJECT PERFORMANCE TABLE
    # ══════════════════════════════════════════════════════════════════════════
    story += section_heading('Subject Performance', styles, '📚')

    if subjects:
        col_w = [(PAGE_W - 2*MARGIN) * f for f in
                 [0.30, 0.10, 0.12, 0.12, 0.09, 0.12, 0.15]]
        headers = ['Subject', 'Assess.', 'Avg Score', 'Grade', 'GPA', 'Trend', 'Status']
        hdr_row = [Paragraph(h, styles['table_hdr']) for h in headers]
        rows    = [hdr_row]

        for i, s in enumerate(sorted(subjects, key=lambda x: -float(x.get('score') or x.get('average') or 0))):
            avg   = float(s.get('score') or s.get('average') or 0)
            grade = s.get('grade') or get_grade(avg)
            gpa_s = s.get('gpa')
            if gpa_s is None: gpa_s = score_to_gpa(avg)
            status_lbl = get_status(avg)
            trend_lbl  = get_trend_arrow(s.get('trend', 'stable'))
            n_ass      = s.get('attempts') or s.get('totalStudents') or 1

            # Status cell colour
            st_color = (C_SUCCESS_BG if 'Excell' in status_lbl else
                        C_WARNING_BG if 'Good'   in status_lbl else C_ERROR_BG)
            st_text  = (C_SUCCESS    if 'Excell' in status_lbl else
                        C_WARNING    if 'Good'   in status_lbl else C_ERROR)

            row_bg = C_WHITE if i % 2 == 0 else C_BG

            subj_name = str(s.get('subject', 'Unknown'))
            if len(subj_name) > 42: subj_name = subj_name[:42] + '…'

            rows.append([
                Paragraph(subj_name, styles['table_cell_l']),
                Paragraph(str(n_ass), styles['table_cell']),
                [score_bar(avg, width=55, height=6),
                 Paragraph(f'{avg:.1f}%',
                           ParagraphStyle('sc', fontName='Helvetica-Bold', fontSize=8,
                                          textColor=score_color(avg), alignment=TA_CENTER))],
                Paragraph(grade, ParagraphStyle('gr', fontName='Helvetica-Bold',
                          fontSize=9, textColor=score_color(avg), alignment=TA_CENTER)),
                Paragraph(f'{float(gpa_s):.1f}',
                          ParagraphStyle('gp', fontName='Helvetica-Bold', fontSize=9,
                                         textColor=C_PRIMARY, alignment=TA_CENTER)),
                Paragraph(trend_lbl, styles['table_cell']),
                Paragraph(status_lbl,
                          ParagraphStyle('stl', fontName='Helvetica-Bold', fontSize=8,
                                         textColor=st_text, alignment=TA_CENTER)),
            ])

        subj_table = Table(rows, colWidths=col_w, repeatRows=1)
        row_styles = [
            ('BACKGROUND',   (0,0),  (-1,0),  C_PRIMARY),
            ('TEXTCOLOR',    (0,0),  (-1,0),  C_WHITE),
            ('ALIGN',        (0,0),  (-1,-1), 'CENTER'),
            ('VALIGN',       (0,0),  (-1,-1), 'MIDDLE'),
            ('FONTNAME',     (0,0),  (-1,0),  'Helvetica-Bold'),
            ('FONTSIZE',     (0,0),  (-1,-1), 9),
            ('ROWBACKGROUNDS',(0,1), (-1,-1), [C_WHITE, C_BG]),
            ('BOX',          (0,0),  (-1,-1), 0.5, C_BORDER),
            ('INNERGRID',    (0,0),  (-1,-1), 0.3, C_BORDER),
            ('TOPPADDING',   (0,0),  (-1,-1), 6),
            ('BOTTOMPADDING',(0,0),  (-1,-1), 6),
            ('LEFTPADDING',  (0,1),  (0,-1),  6),
        ]
        subj_table.setStyle(TableStyle(row_styles))
        story.append(subj_table)
    else:
        story.append(Paragraph(
            '⚠  No subject data available. Upload a marks file to populate this section.',
            styles['warn']))

    story.append(Spacer(1, 0.3*cm))

    # ══════════════════════════════════════════════════════════════════════════
    # 4. PERFORMANCE ANALYSIS
    # ══════════════════════════════════════════════════════════════════════════
    story += section_heading('Performance Analysis', styles, '📈')

    sorted_subj = sorted(subjects,
                         key=lambda x: -float(x.get('score') or x.get('average') or 0))
    best   = sorted_subj[0]  if sorted_subj else None
    worst  = sorted_subj[-1] if sorted_subj else None

    # Build analysis paragraphs
    analysis_items = []

    if best:
        b_avg = float(best.get('score') or best.get('average') or 0)
        analysis_items.append(
            f'<b>Highest scoring subject:</b> {best["subject"]} with an average of '
            f'<b>{b_avg:.1f}%</b> (Grade {best.get("grade") or get_grade(b_avg)}).')

    if worst and worst != best:
        w_avg = float(worst.get('score') or worst.get('average') or 0)
        analysis_items.append(
            f'<b>Lowest scoring subject:</b> {worst["subject"]} at '
            f'<b>{w_avg:.1f}%</b> — targeted revision is recommended.')

    if avg_score:
        consistency = study.get('consistency') or 0
        if float(consistency) >= 70:
            analysis_items.append(
                f'Study consistency is <b>{consistency}%</b> — above average. '
                f'This positively correlates with the current GPA of {gpa_str}.')
        elif float(consistency) > 0:
            analysis_items.append(
                f'Study consistency stands at <b>{consistency}%</b>. '
                f'Increasing regularity could significantly improve overall performance.')
        else:
            analysis_items.append(
                'Study session data is limited. Recording study sessions will enable '
                'better performance predictions.')

    if total_ass and int(total_ass) < 5:
        analysis_items.append(
            f'Only <b>{total_ass}</b> assessments recorded. More data will increase '
            f'prediction accuracy and report reliability.')

    for item in analysis_items or ['Insufficient assessment data to generate detailed analysis.']:
        story.append(Paragraph(f'• {item}', styles['body']))
        story.append(Spacer(1, 0.15*cm))

    # ══════════════════════════════════════════════════════════════════════════
    # PAGE BREAK before AI insights
    # ══════════════════════════════════════════════════════════════════════════
    story.append(PageBreak())

    # ══════════════════════════════════════════════════════════════════════════
    # 5. AI INSIGHTS
    # ══════════════════════════════════════════════════════════════════════════
    story += section_heading('AI Insights', styles, '🧠')

    failing = [s for s in subjects
               if float(s.get('score') or s.get('average') or 0) < 50]
    passing = [s for s in subjects
               if float(s.get('score') or s.get('average') or 0) >= 75]

    insight_sections = [
        ('✅  Strengths', [
            f'Strong performance in {best["subject"].split(" - ")[0]} ({float(best.get("score") or best.get("average") or 0):.1f}%).'
            if best else 'No strength data available.',
            f'{len(passing)} subject(s) at Excellent level (≥75%).' if passing else 'No subjects at Excellent level yet.',
            f'Pass rate is {pass_rate:.1f}%.' if pass_rate else 'Insufficient Data.',
        ], C_SUCCESS),
        ('⚠   Weaknesses', [
            f'{len(failing)} subject(s) below pass threshold.' if failing else 'No failing subjects detected.',
            f'Low study consistency ({study.get("consistency", "N/A")}%).'
            if study.get('consistency') and float(study.get('consistency', 0)) < 60
            else 'Study consistency data unavailable.',
            f'Limited assessment data reduces prediction accuracy.'
            if int(total_ass or 0) < 10 else 'Sufficient assessment history available.',
        ], C_WARNING),
        ('🚨  Risk Areas', [
            f'Subjects below 50%: {", ".join(s["subject"].split(" - ")[0] for s in failing)}.'
            if failing else 'No high-risk subjects identified.',
            f'GPA of {gpa_str} indicates {"At Risk status — immediate action required." if gpa_val < 2.0 and gpa_val > 0 else "acceptable academic standing."}'
            if gpa_val > 0 else 'Insufficient GPA data.',
            f'Confidence level is {conf_label} — more assessments needed.'
            if 'Low' in conf_label or 'Medium' in conf_label else 'Sufficient data for reliable predictions.',
        ], C_ERROR),
    ]

    for section_title, points, col in insight_sections:
        story.append(Paragraph(
            section_title,
            ParagraphStyle('isect', fontName='Helvetica-Bold', fontSize=11,
                           textColor=col, spaceBefore=8, spaceAfter=4)))
        for pt in points:
            story.append(Paragraph(f'   — {pt}', styles['insight']))
        story.append(Spacer(1, 0.2*cm))

    # ══════════════════════════════════════════════════════════════════════════
    # 6. RECOMMENDATIONS
    # ══════════════════════════════════════════════════════════════════════════
    story += section_heading('Recommendations', styles, '🎯')

    recs = []
    if failing:
        recs.append(f'Prioritise revision for: '
                    f'{", ".join(s["subject"].split(" - ")[0] for s in failing[:3])}.')
    if int(total_ass or 0) < 10:
        recs.append('Attempt at least 10 assessments to enable reliable AI predictions.')
    if study.get('consistency') and float(study.get('consistency', 0)) < 70:
        recs.append('Increase study consistency — aim for daily sessions of ≥ 2 hours.')
    if avg_score and float(avg_score) < 75:
        recs.append('Target a 5–10% score improvement per subject this semester.')
    recs.append('Review subject-specific weak areas using the StudySmart topic planner.')
    recs.append('Maintain a regular upload schedule to keep analytics current.')

    rec_data = [[
        Paragraph(f'<b>{i+1}.</b>', styles['body']),
        Paragraph(r, styles['body']),
    ] for i, r in enumerate(recs)]

    rec_table = Table(rec_data, colWidths=[0.8*cm, PAGE_W - 2*MARGIN - 0.8*cm])
    rec_table.setStyle(TableStyle([
        ('VALIGN',       (0,0),(-1,-1), 'TOP'),
        ('TOPPADDING',   (0,0),(-1,-1), 5),
        ('BOTTOMPADDING',(0,0),(-1,-1), 5),
        ('ROWBACKGROUNDS',(0,0),(-1,-1),[C_WHITE, C_PRIMARY_BG]),
        ('BOX',          (0,0),(-1,-1), 0.5, C_BORDER),
        ('INNERGRID',    (0,0),(-1,-1), 0.3, C_BORDER),
        ('LEFTPADDING',  (0,0),(0,-1),  8),
        ('LEFTPADDING',  (1,0),(1,-1),  8),
    ]))
    story.append(rec_table)
    story.append(Spacer(1, 0.4*cm))

    # ══════════════════════════════════════════════════════════════════════════
    # 7. DATA LIMITATION NOTICE
    # ══════════════════════════════════════════════════════════════════════════
    if int(total_ass or 0) < 10 or not subjects:
        story += section_heading('Data Limitation Notice', styles, '⚠')
        note_data = [[
            Paragraph('⚠', ParagraphStyle('icon', fontName='Helvetica-Bold',
                      fontSize=16, textColor=C_WARNING, alignment=TA_CENTER)),
            Paragraph(
                '<b>Limited Data Warning:</b>  Predictions and analytics are based on '
                f'<b>{total_ass or 0}</b> assessment(s). For reliable AI predictions, '
                'a minimum of <b>10 assessments</b> per subject is recommended. '
                'Upload additional marks files via the StudySmart Upload page to '
                'improve accuracy.',
                ParagraphStyle('note', fontName='Helvetica', fontSize=10,
                               textColor=C_TEXT_MD, leading=15)),
        ]]
        note_table = Table(note_data, colWidths=[1.2*cm, PAGE_W - 2*MARGIN - 1.2*cm])
        note_table.setStyle(TableStyle([
            ('BACKGROUND',   (0,0),(-1,-1), C_WARNING_BG),
            ('BOX',          (0,0),(-1,-1), 1.2, C_WARNING),
            ('VALIGN',       (0,0),(-1,-1), 'MIDDLE'),
            ('TOPPADDING',   (0,0),(-1,-1), 12),
            ('BOTTOMPADDING',(0,0),(-1,-1), 12),
            ('LEFTPADDING',  (0,0),(-1,-1), 10),
        ]))
        story.append(note_table)

    # ══════════════════════════════════════════════════════════════════════════
    # 8. PERFORMANCE TREND TABLE (if available)
    # ══════════════════════════════════════════════════════════════════════════
    if trend:
        story += section_heading('Monthly Score Trend', styles, '📅')
        tr_headers = ['Month', 'Avg Score', 'Target', 'vs Target', 'Assessments']
        tr_hdr_row = [Paragraph(h, styles['table_hdr']) for h in tr_headers]
        tr_rows    = [tr_hdr_row]
        for t in trend:
            avg_t  = float(t.get('average') or t.get('score') or 0)
            tgt    = float(t.get('target', 75))
            delta  = avg_t - tgt
            delta_str = f'+{delta:.1f}' if delta >= 0 else f'{delta:.1f}'
            delta_col = C_SUCCESS if delta >= 0 else C_ERROR
            tr_rows.append([
                Paragraph(str(t.get('month','—')), styles['table_cell']),
                Paragraph(f'{avg_t:.1f}%',
                          ParagraphStyle('tr', fontName='Helvetica-Bold', fontSize=9,
                                         textColor=score_color(avg_t), alignment=TA_CENTER)),
                Paragraph(f'{tgt:.0f}%', styles['table_cell']),
                Paragraph(delta_str,
                          ParagraphStyle('dl', fontName='Helvetica-Bold', fontSize=9,
                                         textColor=delta_col, alignment=TA_CENTER)),
                Paragraph(str(t.get('students', '—')), styles['table_cell']),
            ])
        tr_cw = [(PAGE_W - 2*MARGIN) * f for f in [0.20,0.20,0.20,0.20,0.20]]
        tr_table = Table(tr_rows, colWidths=tr_cw, repeatRows=1)
        tr_table.setStyle(TableStyle([
            ('BACKGROUND',    (0,0),  (-1,0),   C_PRIMARY),
            ('ROWBACKGROUNDS',(0,1),  (-1,-1),  [C_WHITE, C_BG]),
            ('BOX',           (0,0),  (-1,-1),  0.5, C_BORDER),
            ('INNERGRID',     (0,0),  (-1,-1),  0.3, C_BORDER),
            ('ALIGN',         (0,0),  (-1,-1),  'CENTER'),
            ('VALIGN',        (0,0),  (-1,-1),  'MIDDLE'),
            ('TOPPADDING',    (0,0),  (-1,-1),  5),
            ('BOTTOMPADDING', (0,0),  (-1,-1),  5),
        ]))
        story.append(tr_table)

    # ══════════════════════════════════════════════════════════════════════════
    # BUILD
    # ══════════════════════════════════════════════════════════════════════════
    doc.build(story,
              onFirstPage=on_first_page,
              onLaterPages=on_later_pages)
    return buf.getvalue()


# ── CLI: read JSON from stdin, write PDF to stdout ────────────────────────────
if __name__ == '__main__':
    raw = sys.stdin.read()
    try:
        data = json.loads(raw) if raw.strip() else {}
    except Exception as e:
        sys.stderr.write(f'JSON parse error: {e}\n')
        data = {}
    pdf_bytes = generate_pdf(data)
    sys.stdout.buffer.write(pdf_bytes)