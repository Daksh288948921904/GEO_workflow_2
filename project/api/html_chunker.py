from __future__ import annotations
import re
import hashlib
from dataclasses import dataclass, field, asdict
from typing import List, Optional
from bs4 import BeautifulSoup, Tag
_ROLE_PATTERNS = {
    "navigation":   re.compile(r'nav|menu|breadcrumb|sidebar', re.I),
    "header":       re.compile(r'header|top-bar|masthead|banner', re.I),
    "footer":       re.compile(r'footer|bottom|copyright', re.I),
    "product-info": re.compile(r'product|pdp|item-detail|listing', re.I),
    "pricing":      re.compile(r'price|offer|buy|cart|add-to', re.I),
    "specs":        re.compile(r'spec|technical|config|detail|param|attribute', re.I),
    "faq":          re.compile(r'faq|question|accordion|collaps', re.I),
    "reviews":      re.compile(r'review|rating|testimonial|feedback', re.I),
    "media":        re.compile(r'gallery|carousel|slider|image|video|media', re.I),
    "trust":        re.compile(r'trust|warranty|return|refund|shipping|policy', re.I),
    "description":  re.compile(r'desc|overview|summary|about|content', re.I),
}
def _guess_role(tag:Tag)->str:
    searchable=" ".join([
        " ".join(tag.get("class", [])),
        tag.get("id", ""),
        tag.get("aria-label", ""),
        tag.get("data-section", ""),
        tag.get("data-testid", ""),
    ])
    for role, pattern in _ROLE_PATTERNS.items():
        if pattern.search(searchable):
            return role
    return "unknown"
@dataclass
class HTMLChunk:
    chunk_id:      str                      # deterministic hash
    html:          str                      # raw inner HTML
    text:          str                      # extracted visible text
    tag_name:      str                      # div / section / article / etc.
    css_classes:   List[str]                # class list
    element_id:    Optional[str]            # id attribute
    dom_path:      str                      # "body > div.wrapper > div.main > div.specs"
    semantic_role: str                      # guessed role
    word_count:    int
    depth:         int                      # nesting depth from <body>
    child_tags:    List[str] = field(default_factory=list)   # immediate child tag names
    page_url:      str = ""
 
    def to_dict(self) -> dict:
        return asdict(self)

SECTION_TAGS = {"div", "section", "article", "main", "aside"}
MIN_TEXT_LENGTH = 40
def _build_dom_path(tag:Tag)->str:
    parts=[]
    current=tag
    while current and current.name and current.name != "[document]":
        selector = current.name
        if current.get("id"):
            selector += f"#{current['id']}"
        elif current.get("class"):
            selector += "." + ".".join(current["class"][:4])  # max 2 classes
        parts.append(selector)
        current = current.parent
    return " > ".join(reversed(parts))
def _has_child_divs(tag:Tag)-> bool:
    for child in tag.children:
        if isinstance(child,Tag) and child.name in SECTION_TAGS:
            return True
    return False

def _compute_depth(tag:Tag)->int:
    depth=0
    current=tag.parent
    while current and current.name and current.name!="[Document]":
        if current.name in SECTION_TAGS or current.name=="body":
            depth+=1
        current=current.parent
    return depth

def _make_chunk_id(html:str, dom_path:str)->str:
    raw=f"{dom_path}::{html[:500]}"
    return hashlib.md5(raw.encode()).hexdigest()[:12]

def chunk_html(html:str, page_url:str=" ")->List[HTMLChunk]:
    soup=BeautifulSoup(html,"lxml")
    for tag in soup(["script","style","noscript","svg","link","meta"]):
        tag.decompose()
    chunks:List[HTMLChunk]=[]

    def _recurse(tag:Tag):
        if not isinstance(tag,Tag):
            return
        if tag.name in SECTION_TAGS:
            if _has_child_divs(tag):
                for child in tag.children:
                    if isinstance(child,Tag):
                        _recurse(child)
            else:
                _create_chunk(tag)
        elif tag.name in ("table", "dl", "details", "ul", "ol", "form"):
            _create_chunk(tag)

    def _create_chunk(tag:Tag):
        inner_html=str(tag)
        text=tag.get_text(separator=" ",strip=True)
        if len(text)<MIN_TEXT_LENGTH:
            return
        dom_path=_build_dom_path(tag)
        child_tags = [c.name for c in tag.children if isinstance(c, Tag)]
        chunk = HTMLChunk(
            chunk_id=_make_chunk_id(inner_html, dom_path),
            html=inner_html,
            text=text,
            tag_name=tag.name,
            css_classes=tag.get("class", []),
            element_id=tag.get("id"),
            dom_path=dom_path,
            semantic_role=_guess_role(tag),
            word_count=len(text.split()),
            depth=_compute_depth(tag),
            child_tags=child_tags,
            page_url=page_url,
        )
        chunks.append(chunk)

    body=soup.find("body")
    if body:
        for child in body.children:
            if isinstance(child,Tag):
                _recurse(child)
    else:
        for child in soup.children:
            if isinstance(child, Tag):
                _recurse(child)
    return chunks

def print_chunk_summary(chunks: List[HTMLChunk]):
    
    print(f"\n{'='*60}")
    print(f"Total chunks: {len(chunks)}")
    print(f"{'='*60}")
    for i, c in enumerate(chunks):
        role_badge = f"[{c.semantic_role}]" if c.semantic_role != "unknown" else ""
        print(f"  {i+1:3d}. {c.chunk_id}  {c.tag_name:<8} {c.word_count:4d}w  "
              f"d={c.depth}  {role_badge:<16} "
              f"classes={c.css_classes[:2]}")
    print()
 
 