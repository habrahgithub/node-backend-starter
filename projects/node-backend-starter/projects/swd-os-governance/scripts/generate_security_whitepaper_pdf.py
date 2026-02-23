#!/usr/bin/env python3
from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Iterable

from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.platypus import ListFlowable, ListItem, Paragraph, SimpleDocTemplate, Spacer


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_INPUT = ROOT / "docs" / "security-whitepaper.md"
DEFAULT_OUTPUT = ROOT / "output" / "pdf" / "DocSmith-Security-Whitepaper-v1.pdf"


@dataclass(frozen=True)
class Block:
  kind: str
  text: str


H1_RE = re.compile(r"^#\s+(.*)$")
H2_RE = re.compile(r"^##\s+(.*)$")
H3_RE = re.compile(r"^###\s+(.*)$")
UL_RE = re.compile(r"^\s*-\s+(.*)$")
OL_RE = re.compile(r"^\s*(\d+)\.\s+(.*)$")
CODE_RE = re.compile(r"`([^`]+)`")
LINK_RE = re.compile(r"\[([^\]]+)\]\(([^)]+)\)")


def _normalize_text(text: str) -> str:
  return (
    text.replace("\u2011", "-")
    .replace("\u2013", "-")
    .replace("\u2014", "-")
    .replace("\u2018", "'")
    .replace("\u2019", "'")
    .replace("\u2026", "...")
  )


def _escape_para(text: str) -> str:
  text = _normalize_text(text)
  return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def _inline_format(text: str) -> str:
  text = _escape_para(text)

  def _code_sub(match: re.Match[str]) -> str:
    inner = _escape_para(match.group(1))
    return f'<font name="Courier">{inner}</font>'

  text = CODE_RE.sub(_code_sub, text)

  def _link_sub(match: re.Match[str]) -> str:
    label = _escape_para(match.group(1))
    url = _escape_para(match.group(2))
    return f"{label} ({url})"

  text = LINK_RE.sub(_link_sub, text)
  return text


def parse_markdown(path: Path) -> tuple[dict[str, str], list[Block]]:
  raw = path.read_text(encoding="utf-8").splitlines()
  meta: dict[str, str] = {}

  blocks: list[Block] = []
  paragraph_lines: list[str] = []

  def flush_paragraph() -> None:
    nonlocal paragraph_lines
    if not paragraph_lines:
      return
    text = " ".join([ln.strip() for ln in paragraph_lines if ln.strip()])
    if text:
      blocks.append(Block("p", text))
    paragraph_lines = []

  i = 0
  while i < len(raw):
    line = raw[i].rstrip()
    stripped = line.strip()

    if not stripped:
      flush_paragraph()
      i += 1
      continue

    if (m := H1_RE.match(stripped)) is not None:
      flush_paragraph()
      blocks.append(Block("title", m.group(1)))
      i += 1
      continue

    if (m := H2_RE.match(stripped)) is not None:
      flush_paragraph()
      blocks.append(Block("h1", m.group(1)))
      i += 1
      continue

    if (m := H3_RE.match(stripped)) is not None:
      flush_paragraph()
      blocks.append(Block("h2", m.group(1)))
      i += 1
      continue

    if (m := UL_RE.match(line)) is not None:
      flush_paragraph()
      items: list[str] = [m.group(1)]
      i += 1
      while i < len(raw):
        m2 = UL_RE.match(raw[i])
        if not m2:
          break
        items.append(m2.group(1))
        i += 1
      blocks.append(Block("ul", "\n".join(items)))
      continue

    if (m := OL_RE.match(line)) is not None:
      flush_paragraph()
      items: list[str] = [m.group(2)]
      i += 1
      while i < len(raw):
        m2 = OL_RE.match(raw[i])
        if not m2:
          break
        items.append(m2.group(2))
        i += 1
      blocks.append(Block("ol", "\n".join(items)))
      continue

    paragraph_lines.append(stripped)
    i += 1

  flush_paragraph()
  return meta, blocks


def _footer(canvas, doc, doc_title: str) -> None:
  canvas.saveState()
  canvas.setFont("Helvetica", 9)

  page_num = canvas.getPageNumber()
  width, height = LETTER
  y = 0.55 * inch

  left = doc.leftMargin
  right = width - doc.rightMargin

  title = doc_title
  max_title_width = (right - left) - 2.0 * inch
  if stringWidth(title, "Helvetica", 9) > max_title_width:
    while title and stringWidth(title + "…", "Helvetica", 9) > max_title_width:
      title = title[:-1]
    title = title + "…"

  canvas.drawString(left, y, title)
  canvas.drawRightString(right, y, f"Page {page_num}")
  canvas.restoreState()


def build_pdf(meta: dict[str, str], blocks: Iterable[Block], out_path: Path) -> None:
  out_path.parent.mkdir(parents=True, exist_ok=True)

  styles = getSampleStyleSheet()
  style_title = ParagraphStyle(
    "DocTitle",
    parent=styles["Title"],
    fontName="Helvetica-Bold",
    fontSize=22,
    leading=26,
    spaceAfter=12,
  )
  style_h1 = ParagraphStyle(
    "H1",
    parent=styles["Heading1"],
    fontName="Helvetica-Bold",
    fontSize=14,
    leading=18,
    spaceBefore=10,
    spaceAfter=6,
  )
  style_h2 = ParagraphStyle(
    "H2",
    parent=styles["Heading2"],
    fontName="Helvetica-Bold",
    fontSize=12,
    leading=15,
    spaceBefore=8,
    spaceAfter=4,
  )
  style_body = ParagraphStyle(
    "Body",
    parent=styles["BodyText"],
    fontName="Helvetica",
    fontSize=11,
    leading=15,
    spaceAfter=8,
  )

  doc_title = meta.get("Title", "Security Whitepaper")
  doc = SimpleDocTemplate(
    str(out_path),
    pagesize=LETTER,
    leftMargin=0.9 * inch,
    rightMargin=0.9 * inch,
    topMargin=0.85 * inch,
    bottomMargin=0.85 * inch,
    title=doc_title,
  )

  story: list[object] = []
  generated = datetime.now(UTC).strftime("%Y-%m-%d %H:%M UTC")

  for block in blocks:
    if block.kind == "title":
      doc_title = block.text
      story.append(Paragraph(_inline_format(block.text), style_title))
      story.append(Spacer(1, 6))
      story.append(Paragraph(_inline_format(f"Generated: {generated}"), ParagraphStyle("Generated", parent=style_body, fontSize=9, leading=12, textColor="#444444", spaceAfter=10)))
    elif block.kind == "h1":
      story.append(Paragraph(_inline_format(block.text), style_h1))
    elif block.kind == "h2":
      story.append(Paragraph(_inline_format(block.text), style_h2))
    elif block.kind == "ul":
      items = []
      for item in block.text.splitlines():
        items.append(ListItem(Paragraph(_inline_format(item), style_body), leftIndent=14))
      story.append(ListFlowable(items, bulletType="bullet", leftIndent=18, bulletFontName="Helvetica"))
      story.append(Spacer(1, 4))
    elif block.kind == "ol":
      items = []
      for item in block.text.splitlines():
        items.append(ListItem(Paragraph(_inline_format(item), style_body), leftIndent=14))
      story.append(ListFlowable(items, bulletType="1", leftIndent=18, bulletFontName="Helvetica"))
      story.append(Spacer(1, 4))
    elif block.kind == "p":
      story.append(Paragraph(_inline_format(block.text), style_body))

  doc.build(
    story,
    onFirstPage=lambda c, d: _footer(c, d, doc_title),
    onLaterPages=lambda c, d: _footer(c, d, doc_title),
  )


def main() -> int:
  import argparse

  parser = argparse.ArgumentParser(description="Generate DocSmith Security Whitepaper v1 PDF.")
  parser.add_argument("--in", dest="in_path", default=str(DEFAULT_INPUT), help="Input markdown path")
  parser.add_argument("--out", dest="out_path", default=str(DEFAULT_OUTPUT), help="Output PDF path")
  args = parser.parse_args()

  in_path = Path(args.in_path).resolve()
  out_path = Path(args.out_path).resolve()

  meta, blocks = parse_markdown(in_path)
  build_pdf(meta, blocks, out_path)
  print(str(out_path))
  return 0


if __name__ == "__main__":
  raise SystemExit(main())
