#!/usr/bin/env python3
from __future__ import annotations

import re
from pathlib import Path

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    ListFlowable,
    ListItem,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
)


def _sanitize_md(text: str) -> str:
    # ReportLab Paragraph is HTML-ish; escape the few characters we use.
    text = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    # Render inline code using a simple monospace span.
    text = re.sub(r"`([^`]+)`", r'<font face="Courier">\1</font>', text)
    return text


def parse_markdown(md: str, styles: dict) -> list:
    story: list = []
    lines = md.splitlines()
    i = 0

    def add_paragraph(style_key: str, para: str) -> None:
        para = para.strip()
        if not para:
            return
        story.append(Paragraph(_sanitize_md(para), styles[style_key]))
        story.append(Spacer(1, 10))

    while i < len(lines):
        line = lines[i].rstrip()
        if not line.strip():
            i += 1
            continue

        if line.startswith("# "):
            add_paragraph("title", line[2:].strip())
            i += 1
            continue

        if line.startswith("## "):
            add_paragraph("h2", line[3:].strip())
            i += 1
            continue

        if line.startswith("### "):
            add_paragraph("h3", line[4:].strip())
            i += 1
            continue

        if line.startswith("```"):
            i += 1
            code_lines = []
            while i < len(lines) and not lines[i].startswith("```"):
                code_lines.append(lines[i].rstrip("\n"))
                i += 1
            if i < len(lines) and lines[i].startswith("```"):
                i += 1
            code = "<br/>".join(_sanitize_md(l).replace(" ", "&nbsp;") for l in code_lines)
            story.append(Paragraph(f"<font face=\"Courier\">{code}</font>", styles["code"]))
            story.append(Spacer(1, 10))
            continue

        if line.startswith("- "):
            items = []
            while i < len(lines):
                cur = lines[i].rstrip()
                if not cur.startswith("- "):
                    break
                items.append(cur[2:].strip())
                i += 1
            lf_items = [
                ListItem(Paragraph(_sanitize_md(it), styles["body"]), leftIndent=12)
                for it in items
                if it
            ]
            story.append(ListFlowable(lf_items, bulletType="bullet", leftIndent=18))
            story.append(Spacer(1, 10))
            continue

        # Paragraph: merge consecutive non-blank lines until a structural token.
        para_lines = [line.strip()]
        i += 1
        while i < len(lines):
            nxt = lines[i].rstrip()
            if not nxt.strip():
                break
            if nxt.startswith(("# ", "## ", "### ", "- ", "```")):
                break
            para_lines.append(nxt.strip())
            i += 1
        add_paragraph("body", " ".join(para_lines))
        i += 1

    return story


def build_pdf(src_md: Path, out_pdf: Path) -> None:
    styles_base = getSampleStyleSheet()
    styles = {
        "title": ParagraphStyle(
            "Title",
            parent=styles_base["Title"],
            fontName="Helvetica-Bold",
            fontSize=20,
            leading=24,
            spaceAfter=12,
        ),
        "h2": ParagraphStyle(
            "H2",
            parent=styles_base["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=14,
            leading=18,
            spaceBefore=8,
            spaceAfter=6,
        ),
        "h3": ParagraphStyle(
            "H3",
            parent=styles_base["Heading3"],
            fontName="Helvetica-Bold",
            fontSize=12,
            leading=16,
            spaceBefore=6,
            spaceAfter=4,
        ),
        "body": ParagraphStyle(
            "Body",
            parent=styles_base["BodyText"],
            fontName="Helvetica",
            fontSize=10.5,
            leading=14,
            spaceAfter=6,
        ),
        "code": ParagraphStyle(
            "Code",
            parent=styles_base["BodyText"],
            fontName="Courier",
            fontSize=9.5,
            leading=12,
            backColor="#f5f5f5",
            borderPadding=6,
        ),
    }

    out_pdf.parent.mkdir(parents=True, exist_ok=True)
    doc = SimpleDocTemplate(
        str(out_pdf),
        pagesize=A4,
        leftMargin=0.9 * inch,
        rightMargin=0.9 * inch,
        topMargin=0.8 * inch,
        bottomMargin=0.8 * inch,
        title="DocSmith Security Whitepaper v1",
        author="Star Wealth Dynamics",
    )

    md = src_md.read_text(encoding="utf-8")
    story = parse_markdown(md, styles)
    doc.build(story)


def main() -> int:
    repo_root = Path(__file__).resolve().parents[1]
    src_md = repo_root / "docs" / "security-whitepaper.md"
    if not src_md.exists():
        raise SystemExit(f"Missing source markdown: {src_md}")

    out_pdf = repo_root / "output" / "pdf" / "DocSmith-Security-Whitepaper-v1.pdf"
    build_pdf(src_md, out_pdf)

    # Stable alias used by website links and governance index.
    alias_pdf = repo_root / "output" / "pdf" / "security-whitepaper.pdf"
    alias_pdf.write_bytes(out_pdf.read_bytes())
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
