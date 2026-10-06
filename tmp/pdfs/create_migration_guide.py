from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate, Frame, PageTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether, Flowable
)
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "output/pdf/Tarawit-Database-Migration-Guide.pdf"
OUT.parent.mkdir(parents=True, exist_ok=True)

FONT_DIR = Path("/Users/yeawyow/Library/Fonts")
pdfmetrics.registerFont(TTFont("Sarabun", str(FONT_DIR / "Sarabun-Regular.ttf")))
pdfmetrics.registerFont(TTFont("Sarabun-Medium", str(FONT_DIR / "Sarabun-Medium.ttf")))
pdfmetrics.registerFont(TTFont("Sarabun-Bold", str(FONT_DIR / "Sarabun-Bold.ttf")))
pdfmetrics.registerFont(TTFont("Prompt", str(FONT_DIR / "Prompt-Regular.ttf")))
pdfmetrics.registerFont(TTFont("Prompt-Bold", str(FONT_DIR / "Prompt-Bold.ttf")))

NAVY = colors.HexColor("#17324D")
GREEN = colors.HexColor("#159A7D")
MINT = colors.HexColor("#E9F7F3")
AMBER = colors.HexColor("#E99A2C")
PALE_AMBER = colors.HexColor("#FFF6E8")
RED = colors.HexColor("#C84A4A")
PALE_RED = colors.HexColor("#FFF0F0")
INK = colors.HexColor("#243444")
MUTED = colors.HexColor("#657585")
LINE = colors.HexColor("#DDE5EA")
PAPER = colors.HexColor("#F7F9FA")
WHITE = colors.white

PAGE_W, PAGE_H = A4

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="ThaiBody", fontName="Sarabun", fontSize=10.2, leading=16, textColor=INK, spaceAfter=5))
styles.add(ParagraphStyle(name="ThaiSmall", fontName="Sarabun", fontSize=8.6, leading=13, textColor=MUTED))
styles.add(ParagraphStyle(name="ThaiH1", fontName="Prompt-Bold", fontSize=24, leading=32, textColor=NAVY, spaceAfter=8))
styles.add(ParagraphStyle(name="ThaiH2", fontName="Prompt-Bold", fontSize=16, leading=23, textColor=NAVY, spaceBefore=4, spaceAfter=9))
styles.add(ParagraphStyle(name="ThaiH3", fontName="Sarabun-Bold", fontSize=11.5, leading=17, textColor=NAVY, spaceBefore=5, spaceAfter=4))
styles.add(ParagraphStyle(name="CodeBlock", fontName="Courier", fontSize=7.6, leading=11.2, textColor=colors.HexColor("#D8E4EE"), leftIndent=0))
styles.add(ParagraphStyle(name="CoverTitle", fontName="Prompt-Bold", fontSize=31, leading=40, textColor=WHITE, alignment=TA_LEFT))
styles.add(ParagraphStyle(name="CoverSub", fontName="Sarabun", fontSize=13, leading=20, textColor=colors.HexColor("#D9EEE9")))
styles.add(ParagraphStyle(name="StepNo", fontName="Prompt-Bold", fontSize=16, leading=19, textColor=WHITE, alignment=TA_CENTER))


class ColorBox(Flowable):
    def __init__(self, width, height, fill, radius=8):
        super().__init__(); self.width=width; self.height=height; self.fill=fill; self.radius=radius
    def draw(self):
        self.canv.setFillColor(self.fill); self.canv.roundRect(0,0,self.width,self.height,self.radius,fill=1,stroke=0)


def P(text, style="ThaiBody"):
    return Paragraph(text, styles[style])


def code(text, width=170*mm):
    escaped = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    t = Table([[Paragraph(escaped.replace("\n", "<br/>"), styles["CodeBlock"])]], colWidths=[width])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), colors.HexColor("#172B3A")),
        ("BOX", (0,0), (-1,-1), 0.5, colors.HexColor("#244459")),
        ("LEFTPADDING", (0,0), (-1,-1), 10), ("RIGHTPADDING", (0,0), (-1,-1), 10),
        ("TOPPADDING", (0,0), (-1,-1), 8), ("BOTTOMPADDING", (0,0), (-1,-1), 8),
    ]))
    return t


def callout(title, body, tone="green"):
    cfg = {
        "green": (MINT, GREEN), "amber": (PALE_AMBER, AMBER), "red": (PALE_RED, RED),
    }[tone]
    t = Table([[Paragraph(title, styles["ThaiH3"]), Paragraph(body, styles["ThaiBody"])]], colWidths=[35*mm, 130*mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), cfg[0]), ("BOX", (0,0), (-1,-1), 0.8, cfg[1]),
        ("VALIGN", (0,0), (-1,-1), "TOP"), ("LEFTPADDING", (0,0), (-1,-1), 9),
        ("RIGHTPADDING", (0,0), (-1,-1), 9), ("TOPPADDING", (0,0), (-1,-1), 7),
        ("BOTTOMPADDING", (0,0), (-1,-1), 7),
    ]))
    return t


def step_row(num, title, desc, command=None):
    badge = Table([[P(str(num), "StepNo")]], colWidths=[11*mm], rowHeights=[11*mm])
    badge.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,-1),GREEN),("VALIGN",(0,0),(-1,-1),"MIDDLE")]))
    content = [P(title, "ThaiH3"), P(desc, "ThaiSmall")]
    if command: content += [Spacer(1,2*mm), code(command)]
    t = Table([[badge, content]], colWidths=[15*mm, 150*mm])
    t.setStyle(TableStyle([("VALIGN",(0,0),(-1,-1),"TOP"),("BOTTOMPADDING",(0,0),(-1,-1),9)]))
    return t


def flow_diagram():
    labels = ["เขียน SQL", "ตรวจ status", "Apply ใน Dev", "ทดสอบ API/UI", "Deploy Prod"]
    cells=[]
    for i, label in enumerate(labels):
        cells.append(P(label, "ThaiSmall"))
        if i < len(labels)-1: cells.append(P("→", "ThaiH2"))
    widths=[]
    for i in range(len(cells)): widths.append(27*mm if i%2==0 else 7*mm)
    t=Table([cells], colWidths=widths, rowHeights=[18*mm])
    style=[("VALIGN",(0,0),(-1,-1),"MIDDLE"),("ALIGN",(0,0),(-1,-1),"CENTER")]
    for i in range(0,len(cells),2):
        style += [("BACKGROUND",(i,0),(i,0),MINT),("BOX",(i,0),(i,0),0.8,GREEN),("ROUNDEDCORNERS",[6])]
    t.setStyle(TableStyle(style)); return t


def header_footer(canvas, doc):
    canvas.saveState()
    if doc.page > 1:
        canvas.setStrokeColor(LINE); canvas.line(20*mm, 15*mm, PAGE_W-20*mm, 15*mm)
        canvas.setFont("Sarabun", 8); canvas.setFillColor(MUTED)
        canvas.drawString(20*mm, 9*mm, "TARAWIT · คู่มือ Database Migration")
        canvas.drawRightString(PAGE_W-20*mm, 9*mm, f"หน้า {doc.page}")
    canvas.restoreState()


doc = BaseDocTemplate(str(OUT), pagesize=A4, leftMargin=20*mm, rightMargin=20*mm, topMargin=18*mm, bottomMargin=20*mm,
                      title="คู่มือ Database Migration สำหรับระบบ Tarawit", author="Tarawit")
frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="normal")
doc.addPageTemplates([PageTemplate(id="main", frames=[frame], onPage=header_footer)])

story=[]

# Cover
cover = Table([[P("คู่มือ\nDatabase Migration", "CoverTitle")],
               [Spacer(1,5*mm)],
               [P("สำหรับระบบ Tarawit · Dev → Production", "CoverSub")],
               [Spacer(1,65*mm)],
               [P("หลักสำคัญ: เปลี่ยนโครงสร้างฐานข้อมูลทุกครั้ง ต้องสร้าง migration ใหม่", "CoverSub")],
               [P("ฉบับใช้งานจริง · กันข้อมูลหาย · ทำตามได้ทีละขั้น", "CoverSub")]],
              colWidths=[170*mm], rowHeights=[45*mm,5*mm,18*mm,65*mm,16*mm,14*mm])
cover.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,-1),NAVY),("LEFTPADDING",(0,0),(-1,-1),16*mm),
                           ("RIGHTPADDING",(0,0),(-1,-1),16*mm),("TOPPADDING",(0,0),(-1,-1),10*mm),
                           ("VALIGN",(0,0),(-1,-1),"MIDDLE")]))
story += [cover, PageBreak()]

# Page 2
story += [P("ภาพรวม: Migration คืออะไร?", "ThaiH1"),
          P("Migration คือไฟล์ SQL ที่บอกฐานข้อมูลว่าโครงสร้างต้องเปลี่ยนจากเวอร์ชันเดิมไปเป็นเวอร์ชันใหม่อย่างไร โดยระบบจะบันทึกว่าไฟล์ใดทำงานแล้ว จึงไม่รันซ้ำโดยไม่ตั้งใจ."),
          Spacer(1,4*mm), flow_diagram(), Spacer(1,7*mm),
          callout("กฎทอง", "ไฟล์ที่ apply แล้วถือเป็นประวัติ ห้ามย้อนกลับไปแก้ ให้สร้างไฟล์เลขถัดไปเพื่อแก้ไขแทน", "amber"),
          Spacer(1,6*mm), P("โครงสร้างในโปรเจกต์", "ThaiH2"),
          code("server/db/migrations/\n  000011_add_nickname.sql\n  000012_add_department_id.sql\n  000013_add_evaluation_assignment_comment.sql\n  000014_your_next_change.sql"),
          Spacer(1,5*mm),
          P("ใครทำหน้าที่อะไร", "ThaiH2")]
roles=[[P("ส่วน", "ThaiH3"),P("หน้าที่", "ThaiH3")],
       [P("ไฟล์ .sql"),P("เปลี่ยน schema หรือย้ายข้อมูล")],
       [P("schema_migrations"),P("บันทึกว่า migration ใด apply แล้ว")],
       [P("migrate status"),P("แสดง applied และ pending โดยไม่แก้ DB")],
       [P("migrate up"),P("apply migration ที่ pending ทั้งหมดตามลำดับ")]]
rt=Table(roles,colWidths=[45*mm,120*mm]); rt.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,0),PAPER),("GRID",(0,0),(-1,-1),0.5,LINE),("VALIGN",(0,0),(-1,-1),"TOP"),("LEFTPADDING",(0,0),(-1,-1),8),("TOPPADDING",(0,0),(-1,-1),6),("BOTTOMPADDING",(0,0),(-1,-1),6)])); story += [rt,PageBreak()]

# Page 3
story += [P("1 · สร้าง Migration ใหม่", "ThaiH1"),
          step_row(1,"หาเลขล่าสุด","ดูชื่อไฟล์ทั้งหมดและเรียงตามเลข", "ls server/db/migrations/*.sql | sort"),
          step_row(2,"ตั้งชื่อไฟล์","ใช้เลข 6 หลักต่อจากไฟล์ล่าสุด ตามด้วยคำอธิบายภาษาอังกฤษแบบ snake_case", "000014_add_evaluation_deadline.sql"),
          step_row(3,"เขียน SQL แบบปลอดภัย","เพิ่มคอลัมน์ก่อนและใช้ IF NOT EXISTS เมื่อคำสั่งรองรับ"),
          code("ALTER TABLE evaluation_instances\n    ADD COLUMN IF NOT EXISTS deadline TIMESTAMPTZ;\n\nCREATE INDEX IF NOT EXISTS idx_evaluation_deadline\n    ON evaluation_instances(deadline);"),
          Spacer(1,5*mm), callout("ควรทำ", "เพิ่มคอลัมน์เป็น nullable หรือกำหนด DEFAULT เพื่อให้ข้อมูลเดิมยังใช้งานได้", "green"),
          Spacer(1,3*mm), callout("หลีกเลี่ยง", "DROP COLUMN, เปลี่ยนชนิดข้อมูลทันที หรือเพิ่ม NOT NULL โดยยังไม่เติมข้อมูลเดิม", "red"),
          Spacer(1,6*mm), P("รูปแบบ 3 ขั้นสำหรับการเปลี่ยนใหญ่", "ThaiH2"),
          P("รอบ 1: เพิ่มของใหม่โดยยังรองรับของเก่า → รอบ 2: ย้ายข้อมูลและเปลี่ยนโค้ด → รอบ 3: ลบของเก่าหลังตรวจว่าไม่มีผู้ใช้งานแล้ว") , PageBreak()]

# Page 4
story += [P("2 · ตรวจและ Apply ใน Dev", "ThaiH1"),
          step_row(1,"ตรวจสถานะก่อนทุกครั้ง","คำสั่งนี้อ่านอย่างเดียว ไม่เปลี่ยนฐานข้อมูล", "docker compose -f docker-compose.dev.yml exec -T server \\\n  go run ./cmd/migrate status"),
          step_row(2,"อ่านรายการ pending","ตรวจให้แน่ใจว่าไม่มี migration แปลกปลอมหรือยังไม่ได้ review"),
          step_row(3,"Apply migration","คำสั่ง up จะรัน pending ทั้งหมด ไม่ได้เลือกเฉพาะไฟล์ล่าสุด", "docker compose -f docker-compose.dev.yml exec -T \\\n  -e MIGRATION_CONFIRM_DB=tarawitDB \\\n  server go run ./cmd/migrate up"),
          step_row(4,"ตรวจ schema จริง","เข้า psql แล้วตรวจตารางและประวัติ migration", "docker compose -f docker-compose.dev.yml exec db \\\n  psql -U yeawyow -d tarawitDB\n\n\\d evaluation_instances\nSELECT name, applied_at FROM schema_migrations ORDER BY name;\n\\q"),
          Spacer(1,4*mm), callout("จำไว้", "status ก่อน up เสมอ เพราะ up จะ apply ทุกไฟล์ที่ pending ตามลำดับ", "amber"), PageBreak()]

# Page 5
story += [P("3 · ถ้าแก้พลาด ทำอย่างไร?", "ThaiH1"),
          P("ให้ถามก่อนว่า migration ถูก apply ไปแล้วหรือยัง"), Spacer(1,4*mm)]
decision=[[P("ยังไม่ Apply", "ThaiH3"),P("Apply แล้ว", "ThaiH3")],
          [P("แก้ไฟล์เดิมได้ เพราะยังไม่มีฐานข้อมูลใดบันทึกว่าไฟล์นี้ทำงานแล้ว"),P("ห้ามแก้ไฟล์เดิม ให้สร้าง migration เลขถัดไปเพื่อแก้")],
          [code("แก้ 000014_...sql\nแล้วรัน status ใหม่", 74*mm),code("000015_fix_deadline_type.sql", 74*mm)]]
dt=Table(decision,colWidths=[82.5*mm,82.5*mm]); dt.setStyle(TableStyle([("BACKGROUND",(0,0),(0,0),MINT),("BACKGROUND",(1,0),(1,0),PALE_AMBER),("GRID",(0,0),(-1,-1),0.6,LINE),("VALIGN",(0,0),(-1,-1),"TOP"),("LEFTPADDING",(0,0),(-1,-1),8),("RIGHTPADDING",(0,0),(-1,-1),8),("TOPPADDING",(0,0),(-1,-1),8),("BOTTOMPADDING",(0,0),(-1,-1),8)])); story += [dt,Spacer(1,7*mm),P("ตัวอย่างแก้ชนิดข้อมูลในไฟล์ใหม่", "ThaiH2"),code("ALTER TABLE evaluation_instances\n    ALTER COLUMN deadline TYPE TIMESTAMPTZ\n    USING deadline AT TIME ZONE 'Asia/Bangkok';"),Spacer(1,6*mm),callout("ห้ามทำ", "อย่าลบแถวออกจาก schema_migrations เพื่อบังคับรันซ้ำ เพราะ SQL อาจทำงานซ้ำและทำให้ข้อมูลเสียหาย", "red"),Spacer(1,4*mm),callout("ก่อนทดลอง", "ถ้า migration แตะข้อมูลจำนวนมาก ให้สร้าง backup ของ Dev ก่อน แม้จะไม่ใช่ Production", "green"),PageBreak()]

# Page 6
story += [P("4 · นำขึ้น Production อย่างปลอดภัย", "ThaiH1"),
          P("Production ต้องแยกการเปลี่ยน schema ออกจากการตัดสินใจ restore ข้อมูล และต้องมี backup ก่อนทุกครั้ง"),Spacer(1,4*mm),
          step_row(1,"Commit ให้ครบชุด","migration, API model/query และ UI ต้องอยู่ใน revision เดียวกัน"),
          step_row(2,"สร้าง ARM64 binary","API บน Pi ใช้ binary ที่ build ล่วงหน้า", "make -C server build"),
          step_row(3,"ตรวจและ Backup","deploy.sh จะรัน pre-deploy check และสร้าง logical backup"),
          step_row(4,"Deploy","สคริปต์จะแสดง migration status, apply pending migrations แล้ว replace API", "./deploy.sh"),
          step_row(5,"ตรวจหลัง Deploy","ดู health, logs, schema และทดสอบ flow ที่เกี่ยวข้อง"),
          Spacer(1,5*mm),callout("ลำดับสำคัญ", "ออกแบบให้ API ช่วงเปลี่ยนผ่านรองรับ schema เดิมและใหม่ได้ ถ้า migration กับการเปลี่ยน container ไม่เกิดพร้อมกันพอดี", "amber"),
          Spacer(1,5*mm), P("Rollback", "ThaiH2"),
          P("โดยทั่วไปให้ rollback เฉพาะ API ก่อน ถ้า migration เป็นแบบ additive เช่นเพิ่ม nullable column API เก่ายังทำงานได้ การ restore DB ควรเป็นทางเลือกสุดท้าย เพราะข้อมูลใหม่หลังเวลา backup จะหาย") ,PageBreak()]

# Page 7
story += [P("Checklist ใช้งานจริง", "ThaiH1")]
checks=[
    ("ก่อนเขียน", "เลข migration ไม่ซ้ำ · ชื่อบอกวัตถุประสงค์ · หนึ่งไฟล์หนึ่งเรื่อง"),
    ("ก่อน Apply Dev", "รัน status · อ่าน pending ทุกไฟล์ · ตรวจ SQL ว่าไม่ลบข้อมูล"),
    ("หลัง Apply Dev", "ตรวจ schema · ทดสอบ API/UI · ดู log · รัน tests/build"),
    ("ก่อน Commit", "migration อยู่พร้อมโค้ดที่ใช้งาน schema ใหม่ · ไม่ commit secrets หรือ dump"),
    ("ก่อน Production", "backup · pre-deploy check · ตรวจพื้นที่ disk · ตรวจ binary ARM64"),
    ("หลัง Production", "health ผ่าน · migration applied · login/บันทึก/อ่านข้อมูลได้ · ไม่มี error log"),
]
rows=[]
for title,desc in checks:
    rows.append([P("OK", "ThaiSmall"),P(title,"ThaiH3"),P(desc,"ThaiBody")])
ct=Table(rows,colWidths=[10*mm,38*mm,117*mm]); ct.setStyle(TableStyle([("GRID",(0,0),(-1,-1),0.5,LINE),("BACKGROUND",(0,0),(0,-1),MINT),("VALIGN",(0,0),(-1,-1),"MIDDLE"),("ALIGN",(0,0),(0,-1),"CENTER"),("LEFTPADDING",(0,0),(-1,-1),8),("RIGHTPADDING",(0,0),(-1,-1),8),("TOPPADDING",(0,0),(-1,-1),7),("BOTTOMPADDING",(0,0),(-1,-1),7)])); story += [ct,Spacer(1,8*mm),P("สูตรจำง่าย", "ThaiH2"),callout("ทุกครั้ง", "สร้างไฟล์ใหม่ → status → up ใน Dev → ทดสอบ → commit พร้อมโค้ด → backup → deploy Production", "green"),Spacer(1,6*mm),P("คำสั่งสั้นที่ใช้บ่อย", "ThaiH2"),code("# ดูไฟล์ล่าสุด\nls server/db/migrations/*.sql | sort\n\n# ตรวจสถานะ\ndocker compose -f docker-compose.dev.yml exec -T server go run ./cmd/migrate status\n\n# Apply Dev\ndocker compose -f docker-compose.dev.yml exec -T -e MIGRATION_CONFIRM_DB=tarawitDB server go run ./cmd/migrate up")]

doc.build(story)
print(OUT)
