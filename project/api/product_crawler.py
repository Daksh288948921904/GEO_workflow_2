from datetime import datetime
import requests
import re
import json
from bs4 import BeautifulSoup
import extruct
import time
from urllib.parse import urljoin, urlparse
from readability import Document
import random

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
]

class ProductCrawler:
    def __init__(self, url: str):
        self.url = url
        self.response = None
        self.html = None
        self.soup = None
        self._status_code = 200
        self._final_url = url

    def fetch(self):
        start = time.time()
        headers = {
            "User-Agent": random.choice(USER_AGENTS),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Accept-Encoding": "gzip, deflate, br",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1",
        }
        try:
            self.response = requests.get(self.url, headers=headers, timeout=15)
            self.html = self.response.text
            self.soup = BeautifulSoup(self.html, "lxml")
            word_count = len(self.soup.get_text().split())
            if word_count < 300 or not self.soup.find("h1"):
                return self._fetch_with_playwright(start)
            return int((time.time() - start) * 1000)
        except Exception:
            return self._fetch_with_playwright(start)

    def _fetch_with_playwright(self, start):
        from playwright.sync_api import sync_playwright, TimeoutError as PWTimeout
        from playwright_stealth import Stealth

        with sync_playwright() as p:
            browser = p.chromium.launch(
                headless=False,
                args=[
                    "--no-sandbox",
                    "--disable-blink-features=AutomationControlled",
                    "--disable-dev-shm-usage",
                    "--disable-web-security",
                    "--disable-features=IsolateOrigins,site-per-process",
                ]
            )
            context = browser.new_context(
                user_agent=random.choice(USER_AGENTS),
                viewport={"width": 1920, "height": 1080},
                locale="en-US",
                extra_http_headers={
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                    "Accept-Language": "en-US,en;q=0.9",
                }
            )
            page = context.new_page()

            try:
                Stealth().apply_stealth_sync(page)
            except Exception:
                pass  

            
            page.route(
                "**/*.{mp4,webm,ogg,mp3,avi,mov}",
                lambda route: route.abort()
            )

            self._status_code = 200
            self._final_url = self.url

            def handle_response(response):
                try:
                    if response.url.split("?")[0] == self.url.split("?")[0]:
                        self._status_code = response.status
                except Exception:
                    pass

            page.on("response", handle_response)

            time.sleep(random.uniform(0.5, 1.5))
            loaded = False

            
            try:
                page.goto(self.url, wait_until="domcontentloaded", timeout=60000)
                loaded = True
            except PWTimeout:
                pass
            except Exception:
                pass

            
            if not loaded:
                try:
                    page.goto(self.url, wait_until="commit", timeout=45000)
                    page.wait_for_timeout(5000)  
                    loaded = True
                except Exception:
                    pass

            # Attempt 3: grab whatever loaded — even partial HTML is useful
            if not loaded:
                try:
                    content_check = page.content()
                    if len(content_check) > 3000:
                        loaded = True
                except Exception:
                    pass

            if not loaded:
                browser.close()
                raise Exception(
                    f"Could not load {self.url} after three attempts. "
                    "The site may be blocking automated browsers or is very slow."
                )

            # Wait for meaningful content
            try:
                page.wait_for_selector("h1", timeout=8000)
            except Exception:
                pass

            # Scroll to trigger lazy-loaded content
            try:
                page.evaluate("window.scrollTo(0, document.body.scrollHeight / 2)")
                page.wait_for_timeout(1000)
                page.evaluate("window.scrollTo(0, 0)")
            except Exception:
                pass
            for selector in [
                  '[data-tab="specs"]', 'button:has-text("Specifications")',
                '#spec-tab', '.tab-specifications',
                'button:has-text("FAQ")', '[data-tab="faq"]',
            ]:
                try:
                    page.click(selector, timeout=2000)
                    page.wait_for_timeout(1500)
                except Exception:
                    pass 

            self.html = page.content()
            self.soup = BeautifulSoup(self.html, "lxml")
            self._final_url = page.url
            browser.close()

        return int((time.time() - start) * 1000)

    def extract_metadata(self):
        title = self.soup.title.string.strip() if self.soup.title else ""
        meta_desc = ""
        meta_tag = self.soup.find("meta", attrs={"name": "description"})
        if meta_tag:
            meta_desc = meta_tag.get("content", "")
        canonical = ""
        canonical_tag = self.soup.find("link", rel="canonical")
        if canonical_tag:
            canonical = canonical_tag.get("href", "")
        return title, meta_desc, canonical

    def extract_schema(self):
        data = extruct.extract(self.html, base_url=self.url)
        return data.get("json-ld", [])

    def parse_product_schema(self, schema_data):
        product_data = {
            "name": "", "brand": "", "sku": "", "gtin": "",
            "price": None, "currency": "", "availability": "",
            "rating": None, "review_count": None, "category": ""
        }

        def find_product(item):
            if not isinstance(item, dict):
                return None
            t = item.get("@type", "")
            if isinstance(t, list):
                if "Product" in t:
                    return item
            elif t == "Product":
                return item
            for v in item.values():
                if isinstance(v, dict):
                    result = find_product(v)
                    if result:
                        return result
                elif isinstance(v, list):
                    for i in v:
                        result = find_product(i)
                        if result:
                            return result
            return None

        def find_product_group(item):
            if not isinstance(item, dict):
                return None
            if item.get("@type") == "ProductGroup":
                return item
            return None

        for item in schema_data:
            group = find_product_group(item)
            if group:
                product_data["name"] = group.get("name", "")
                product_data["category"] = group.get("category", "")
                product_data["sku"] = group.get("productGroupID", "")
                product_data["gtin"] = (group.get("gtin13") or group.get("gtin12") or group.get("gtin") or "")
                brand = group.get("brand")
                if isinstance(brand, dict):
                    product_data["brand"] = brand.get("name", "")
                elif isinstance(brand, str):
                    product_data["brand"] = brand
                variants = group.get("hasVariant", [])
                if variants and isinstance(variants, list):
                    first = variants[0]
                    offers = first.get("offers", {})
                    if isinstance(offers, dict):
                        product_data["price"] = offers.get("price")
                        product_data["currency"] = offers.get("priceCurrency", "")
                        product_data["availability"] = offers.get("availability", "")
                rating = group.get("aggregateRating", {})
                if isinstance(rating, dict):
                    product_data["rating"] = rating.get("ratingValue")
                    product_data["review_count"] = rating.get("reviewCount")
                break

            product = find_product(item)
            if product:
                name = product.get("name", "")
                name = re.sub(r'\s*-\s*[A-Z0-9]{1,5}$', '', name).strip()
                product_data["name"] = name
                product_data["sku"] = product.get("sku", "")
                product_data["gtin"] = (product.get("gtin13") or product.get("gtin12") or product.get("gtin") or "")
                product_data["category"] = product.get("category", "")
                brand = product.get("brand")
                if isinstance(brand, dict):
                    product_data["brand"] = brand.get("name", "")
                elif isinstance(brand, str):
                    product_data["brand"] = brand
                offers = product.get("offers", {})
                if isinstance(offers, list):
                    offers = offers[0] if offers else {}
                if isinstance(offers, dict):
                    product_data["price"] = offers.get("price")
                    product_data["currency"] = offers.get("priceCurrency", "")
                    product_data["availability"] = offers.get("availability", "")
                rating = product.get("aggregateRating", {})
                if isinstance(rating, dict):
                    product_data["rating"] = rating.get("ratingValue")
                    product_data["review_count"] = rating.get("reviewCount")
                break

        return product_data

    def score_schema_completeness(self, schema_data):
        CORE_PROPS    = ["name", "description", "image", "brand", "offers", "aggregateRating"]
        OFFERS_PROPS  = ["url", "price", "priceCurrency", "availability"]
        REVIEW_PROPS  = ["review"]

        def _find_product(item):
            if not isinstance(item, dict):
                return None
            t = item.get("@type", "")
            types = t if isinstance(t, list) else [t]
            if "Product" in types:
                return item
            for v in item.values():
                if isinstance(v, dict):
                    r = _find_product(v)
                    if r:
                        return r
                elif isinstance(v, list):
                    for i in v:
                        r = _find_product(i)
                        if r:
                            return r
            return None

        product = None
        for item in schema_data:
            product = _find_product(item)
            if product:
                break

        if not product:
            all_props = CORE_PROPS + [f"offers.{p}" for p in OFFERS_PROPS] + REVIEW_PROPS
            return {"score": 0, "present": [], "missing": all_props, "has_product_schema": False}

        present, missing = [], []
        for prop in CORE_PROPS:
            (present if product.get(prop) else missing).append(prop)

        offers = product.get("offers", {})
        if isinstance(offers, list):
            offers = offers[0] if offers else {}
        for prop in OFFERS_PROPS:
            key = f"offers.{prop}"
            (present if offers.get(prop) else missing).append(key)

        for prop in REVIEW_PROPS:
            key = f"reviews.{prop}" if prop == "review" else prop
            (present if product.get(prop) else missing).append(key)

        total = len(CORE_PROPS) + len(OFFERS_PROPS) + len(REVIEW_PROPS)
        return {
            "score": round(len(present) / total * 100),
            "present": present,
            "missing": missing,
            "has_product_schema": True,
        }

    def extract_price_fallback(self, text):
        price_patterns = [
            r"(₹|Rs\.?|INR)\s?\d{1,3}(?:,\d{3})*(?:\.\d+)?",
            r"(\$|USD)\s?\d{1,3}(?:,\d{3})*(?:\.\d+)?",
            r"(€|EUR)\s?\d{1,3}(?:,\d{3})*(?:\.\d+)?",
            r"(£|GBP)\s?\d{1,3}(?:,\d{3})*(?:\.\d+)?",
            r"\d{1,3}(?:,\d{3})*(?:\.\d+)?\s?(₹|\$|€|£)",
        ]
        for pattern in price_patterns:
            match = re.search(pattern, text)
            if match:
                return match.group().strip()
        return None

    def extract_headings(self):
        headings = []
        for level in range(1, 7):
            tag = f"h{level}"
            for h in self.soup.find_all(tag):
                headings.append({"level": tag, "text": h.get_text(strip=True)})
        return headings

    def extract_features(self):
        features = []
        skip_texts = ["home", "contact", "search"]
        for ul in self.soup.find_all("ul"):
            if ul.find_parent(["nav", "footer", "header", "aside"]):
                continue
            if ul.find_parent(attrs={"class": lambda c: c and any(
                x in " ".join(c) for x in ["card", "grid", "recently", "recommended", "menu"]
            )}):
                continue
            items = []
            for li in ul.find_all("li", recursive=False):
                text = li.get_text(strip=True)
                if (len(text) > 15 and len(text) < 200 and
                        not re.search(r'Rs\.|₹|\$|€|£', text) and
                        not any(skip in text.lower() for skip in skip_texts)):
                    items.append(text)
            if 2 <= len(items) <= 15:
                features.extend(items)
        seen = set()
        clean_features = []
        for f in features:
            if f not in seen:
                seen.add(f)
                clean_features.append(f)
        return clean_features[:20]

    def extract_specifications(self):
       
        specs = {}

        # ── 1. HTML <table> ──────────────────────────────────────────────────
        for table in self.soup.find_all("table"):
            if table.find_parent(["nav", "footer", "header"]):
                continue
            for row in table.find_all("tr"):
                cols = row.find_all(["td", "th"])
                if len(cols) == 2:
                    k = cols[0].get_text(strip=True)
                    v = cols[1].get_text(strip=True)
                    if 2 <= len(k) <= 80 and 1 <= len(v) <= 300 and k.lower() != v.lower():
                        specs[k] = v
        if specs:
            return specs

        # ── 2. <dl>/<dt>/<dd> definition lists ──────────────────────────────
        for dl in self.soup.find_all("dl"):
            dts = dl.find_all("dt")
            dds = dl.find_all("dd")
            for dt, dd in zip(dts, dds):
                k = dt.get_text(strip=True)
                v = dd.get_text(strip=True)
                if 2 <= len(k) <= 80 and 1 <= len(v) <= 300:
                    specs[k] = v
        if specs:
            return specs

        spec_section=None
        for tag in self.soup.find_all(["section","div","article"]):
            cls=" ".join(tag.get("class",[]))
            tag_id=tag.get("id","")
            aria=tag.get("aria-lable","")
            data_sec=tag.get("data-section","") or tag.get("data-tab","")
            searchable= f"{cls} {tag_id} {aria} {data_sec}"
            if re.search(r'spec|technical|detail|feature|attribute|param|config|pdp-spec|product-info', searchable, re.I):
                # Skip tiny containers — real spec sections have multiple children
                if len(tag.find_all(True)) > 2:
                    spec_section = tag
                    break
            if not spec_section:
                for h in self.soup.find_all(["h1","h2","h3","h4"]):
                    if re.search(r'spec|technical|detail|feature|key info|product info',h.get_text(),re.I):
                        spec_section = h.find_parent()
                        break
        search_root = spec_section if spec_section else self.soup

        for container in search_root.find_all(True):
            children = [
                c for c in container.children
                if hasattr(c, "get_text") and c.get_text(strip=True)
            ]
            if len(children) == 2:
                k = children[0].get_text(strip=True)
                v = children[1].get_text(strip=True)
                if (2 <= len(k) <= 60 and 1 <= len(v) <= 300
                        and k != v
                        and not k[0].isdigit()
                        and len(k.split()) <= 5):
                    specs[k] = v
            if len(specs) >= 30:
                break
        if specs:
            return specs

        SKIP_KEYS = {
            "home", "search", "menu", "navigate", "share", "follow", "login",
            "sign in", "sign up", "register", "cart", "wishlist", "account",
            "copyright", "privacy", "terms", "sitemap", "subscribe", "filter",
        }
        SKIP_KEY_PATTERNS = re.compile(
            r'^\d{1,2}[:/]\d{2}'       
            r'|^https?://'              # URLs that slipped through
            r'|^\d+\s*(comments?|likes?|shares?|views?)'  # social metrics
            r'|^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s',  # dates
            re.I
        )
        clean_text=self.soup.get_text(separator="\n",strip=True)
        for line in re.split(r'[\n;]',clean_text):
            line=line.strip()
            if ":" not in line or len(line)>400:
                continue
            k,_,v=line.partition(":")
            k,v=k.strip(),v.strip()
            if(k and v and 1 <= len(k.split()) <= 6
               and len(k)<=60
               and 2<=len(v)<=300
               and not k[0].isdigit()
               and "http" not in k.lower()
               and k.lower not in SKIP_KEYS
               and not SKIP_KEY_PATTERNS.match(k)):
                specs[k]=v
               
        
        return specs

    def extract_faq(self):
        """
        Four-strategy FAQ extraction:
        1. JSON-LD FAQPage schema (most reliable)
        2. HTML <details>/<summary> accordion elements
        3. "Q." prefix inline text pattern (boAt-style)
        4. "Q:" / "A:" prefix style
        """
        faqs = []
        seen_questions = set()

        # ── Strategy 1: JSON-LD FAQPage ─────────────────────────────────────
        for item in self.soup.find_all("script", type="application/ld+json"):
            try:
                data = json.loads(item.string)
                if isinstance(data, dict) and data.get("@type") == "FAQPage":
                    for q in data.get("mainEntity", []):
                        question = q.get("name", "").strip()
                        answer   = q.get("acceptedAnswer", {}).get("text", "").strip()
                        if question and answer and question not in seen_questions:
                            faqs.append({"question": question, "answer": answer})
                            seen_questions.add(question)
            except Exception:
                pass

        # ── Strategy 2: <details>/<summary> accordion ───────────────────────
        if not faqs:
            for details in self.soup.find_all("details"):
                if details.find_parent(["nav", "header", "footer"]):
                    continue
                summary = details.find("summary")
                if not summary:
                    continue
                q_text = summary.get_text(strip=True)
                if len(q_text) < 10 or " " not in q_text:
                    continue
                a_text = details.get_text(strip=True).replace(q_text, "", 1).strip()
                if len(a_text) >= 20 and q_text not in seen_questions:
                    faqs.append({"question": q_text, "answer": a_text[:500]})
                    seen_questions.add(q_text)

        # ── Strategy 3: "Q." prefix inline text (boAt-style) ────────────────
        if not faqs:
            clean_text = self.soup.get_text(separator=" ", strip=True)

            # Isolate the FAQ section if possible
            faq_section = re.search(
                r'(?:FAQs?|Frequently Asked Questions?)\s+(.+?)(?:Notes?:|Back to top|$)',
                clean_text, re.IGNORECASE | re.DOTALL
            )
            faq_block = faq_section.group(1) if faq_section else clean_text

            # Split on "Q. " token boundaries
            chunks = re.split(r'(?=Q\.\s+)', faq_block)
            for chunk in chunks:
                chunk = chunk.strip()
                if not chunk.startswith("Q."):
                    continue
                # Question ends at the first "?"
                q_match = re.match(r'Q\.\s+(.+?\?)\s*(.*)', chunk, re.DOTALL)
                if not q_match:
                    continue
                question = q_match.group(1).strip()
                answer   = q_match.group(2).strip()
                # Guard against answer containing a trailing Q. bleed-in
                answer = re.split(r'\s+Q\.\s+', answer)[0].strip()
                if question and len(answer) >= 10 and question not in seen_questions:
                    faqs.append({"question": question, "answer": answer[:500]})
                    seen_questions.add(question)

        # ── Strategy 4: "Q:" / "A:" prefix style ────────────────────────────
        if not faqs:
            clean_text = self.soup.get_text(separator=" ", strip=True)
            qa_pairs = re.findall(
                r'Q:\s*(.+?)\s*A:\s*(.+?)(?=Q:|$)', clean_text, re.DOTALL
            )
            for question, answer in qa_pairs:
                question = question.strip()
                answer   = answer.strip()[:500]
                if question and answer and question not in seen_questions:
                    faqs.append({"question": question, "answer": answer})
                    seen_questions.add(question)

        # ── Strategy 5: class-name accordion/collapse containers ─────────────
        if not faqs:
            for container in self.soup.find_all(
                attrs={"class": re.compile(r'faq|accordion|collaps', re.I)}
            ):
                if container.find_parent(["nav", "header", "footer"]):
                    continue
                q_el = container.find(
                    attrs={"class": re.compile(r'question|title|header|trigger|label|heading', re.I)}
                )
                a_el = container.find(
                    attrs={"class": re.compile(r'answer|content|body|panel|text|desc', re.I)}
                )
                # Fallback: if no labelled answer element, grab all remaining text
                if q_el and not a_el:
                    q_text = q_el.get_text(strip=True)
                    a_text = container.get_text(strip=True).replace(q_text, "", 1).strip()
                    if len(q_text) > 10 and len(a_text) > 15 and q_text not in seen_questions:
                        faqs.append({"question": q_text, "answer": a_text[:500]})
                        seen_questions.add(q_text)
                elif q_el and a_el:
                    q_text = q_el.get_text(strip=True)
                    a_text = a_el.get_text(strip=True)
                    if len(q_text) > 10 and len(a_text) > 15 and q_text not in seen_questions:
                        faqs.append({"question": q_text, "answer": a_text[:500]})
                        seen_questions.add(q_text)

        # ── Strategy 6: h2/h3/h4 ending with "?" + next sibling text ─────────
        if not faqs:
            for h in self.soup.find_all(["h2", "h3", "h4"]):
                if h.find_parent(["nav", "header", "footer"]):
                    continue
                q_text = h.get_text(strip=True)
                if not q_text.endswith("?") or len(q_text) < 15:
                    continue
                # Try multiple sibling types in priority order
                for tag in ["p", "div", "ul", "span"]:
                    sibling = h.find_next_sibling(tag)
                    if sibling:
                        a_text = sibling.get_text(strip=True)
                        # Skip if the sibling looks like another heading/question
                        if len(a_text) > 15 and not a_text.endswith("?") and q_text not in seen_questions:
                            faqs.append({"question": q_text, "answer": a_text[:500]})
                            seen_questions.add(q_text)
                        break

        return faqs[:10]

    def extract_image_data(self):
        images = []
        for img in self.soup.find_all("img"):
            src = img.get("src", "") or img.get("data-src", "")
            alt = img.get("alt", "").strip()
            if src and len(src) > 5:
                images.append({
                    "src": urljoin(self.url, src),
                    "alt": alt,
                    "has_alt": bool(alt)
                })
        total    = len(images)
        with_alt = sum(1 for i in images if i["has_alt"])
        return {
            "total_images": total,
            "images_with_alt": with_alt,
            "alt_text_coverage_pct": round((with_alt / total) * 100) if total else 0,
            "images": images[:10]
        }

    def extract_links(self):
        internal = []
        external = []
        base_domain   = urlparse(self.url).netloc
        seen_internal = set()
        seen_external = set()
        for a in self.soup.find_all("a", href=True):
            href = a["href"].strip()
            if href.startswith(("#", "javascript", "mailto:", "tel:")):
                continue
            link   = urljoin(self.url, href)
            parsed = urlparse(link)
            if not parsed.scheme.startswith("http"):
                continue
            domain      = parsed.netloc
            anchor_text = a.get_text(strip=True)
            link_data   = {"url": link, "anchor_text": anchor_text}
            if domain == base_domain or domain.endswith("." + base_domain):
                if link not in seen_internal:
                    internal.append(link_data)
                    seen_internal.add(link)
            else:
                if link not in seen_external:
                    external.append(link_data)
                    seen_external.add(link)
        return internal, external

    def detect_trust_signal(self):
        text  = self.soup.get_text(" ", strip=True).lower()
        links = [a.get_text(strip=True).lower() for a in self.soup.find_all("a")]

        def contains_keywords(source, keywords):
            return any(keyword in source for keyword in keywords)

        return {
            "has_return_policy":       contains_keywords(text, ["return policy", "returns"]),
            "has_refund_policy":       contains_keywords(text, ["refund policy", "refunds"]),
            "has_warranty_info":       contains_keywords(text, ["warranty"]),
            "has_shipping_info":       contains_keywords(text, ["shipping", "delivery"]),
            "has_cancellation_policy": contains_keywords(text, ["cancellation"]),
            "uses_https":              self.url.startswith("https"),
            "mentions_secure_payment": contains_keywords(text, ["secure payment", "100% secure", "ssl"]),
            "has_cod_option":          contains_keywords(text, ["cash on delivery", "cod"]),
            "has_contact_page":        any("contact" in link for link in links),
            "has_about_page":          any(
                kw in link for link in links
                for kw in ["about", "our story", "our-story", "who we are"]
            ),
            "mentions_phone":          bool(re.search(r"\+?\d[\d\s-]{8,}", text)),
            "mentions_email":          bool(re.search(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", text)),
            "mentions_reviews":        contains_keywords(text, ["review", "ratings"]),
            "mentions_testimonials":   contains_keywords(text, ["testimonial"]),
            "official_store_claim":    contains_keywords(text, ["official store", "authorized seller"])
        }

    def extract_clean_text(self):
        soup = BeautifulSoup(self.html, "lxml")
        for tag in soup(["script", "style", "noscript"]):
            tag.decompose()
        raw_text      = soup.get_text(separator=" ", strip=True)
        doc           = Document(self.html)
        readable_html = doc.summary()
        readable_soup = BeautifulSoup(readable_html, "lxml")
        readable_text = readable_soup.get_text(separator=" ", strip=True)
        if len(readable_text) > len(raw_text) * 0.6:
            final_text = readable_text
        else:
            final_text = raw_text
        final_text = " ".join(final_text.split())
        return final_text, len(final_text.split())

    def extract_topical_depth(self, clean_text):
        words = clean_text.split()
        total_words = len(words)
        if total_words == 0:
            return {"topical_depth_ratio": 0, "unique_entities": 0, "total_words": 0}

        entity_pattern = re.compile(
            r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b'             # multi-word proper nouns
            r'|\b[A-Z]{2,}\b'                                  # acronyms
            r'|\b\d+(?:\.\d+)?\s*'
            r'(?:mm|cm|km|kg|mg|lb|oz|W|V|mAh|GB|MB|TB|Hz|GHz|MHz|dB|fps|MP|mp)\b'  # measurements
            r'|\b[A-Z][a-zA-Z0-9]*-[a-zA-Z0-9]+\b'            # hyphenated product names
        )
        entities = entity_pattern.findall(clean_text)
        unique_entities = len(set(e.strip() for e in entities))
        return {
            "topical_depth_ratio": round(unique_entities / total_words, 4),
            "unique_entities": unique_entities,
            "total_words": total_words,
        }

    def extract_eeat_signals(self):
        signals = {
            "has_author": False,
            "author_name": None,
            "has_reviewed_by": False,
            "reviewer_name": None,
            "date_published": None,
            "date_modified": None,
            "has_citations": False,
            "citation_count": 0,
            "citation_links": [],
        }

        # JSON-LD: author, datePublished, dateModified
        for script in self.soup.find_all("script", type="application/ld+json"):
            try:
                data = json.loads(script.string)
                if not isinstance(data, dict):
                    continue
                author = data.get("author")
                if author and not signals["has_author"]:
                    signals["has_author"] = True
                    signals["author_name"] = (author.get("name") if isinstance(author, dict) else str(author))[:80]
                if data.get("datePublished") and not signals["date_published"]:
                    signals["date_published"] = data["datePublished"]
                if data.get("dateModified") and not signals["date_modified"]:
                    signals["date_modified"] = data["dateModified"]
            except Exception:
                pass

        # Meta tags for dates
        DATE_META = {
            "article:published_time": "date_published",
            "datePublished": "date_published",
            "DC.date": "date_published",
            "article:modified_time": "date_modified",
            "dateModified": "date_modified",
        }
        for meta in self.soup.find_all("meta"):
            prop = meta.get("property", "") or meta.get("name", "")
            if prop in DATE_META:
                key = DATE_META[prop]
                if not signals[key]:
                    signals[key] = meta.get("content")

        # HTML author/byline elements
        if not signals["has_author"]:
            for el in self.soup.find_all(attrs={"class": re.compile(r'\bauthor\b|\bbyline\b', re.I)}):
                text = el.get_text(strip=True)
                if text and len(text) < 120:
                    signals["has_author"] = True
                    signals["author_name"] = text[:80]
                    break
            for el in self.soup.find_all(rel="author"):
                text = el.get_text(strip=True)
                if text:
                    signals["has_author"] = True
                    signals["author_name"] = text[:80]
                    break

        # "Reviewed by" / "Fact-checked by" badge
        reviewed_re = re.compile(r'reviewed\s+by|fact.?checked\s+by|verified\s+by', re.I)
        for node in self.soup.find_all(string=reviewed_re):
            signals["has_reviewed_by"] = True
            parent_text = node.parent.get_text(strip=True) if node.parent else ""
            signals["reviewer_name"] = parent_text[:100]
            break

        # Citation links (.edu / .gov / .org / DOI / PubMed)
        CITE_RE = re.compile(r'\.(edu|gov|org)[/\b]|doi\.org|pubmed|ncbi\.nlm', re.I)
        for a in self.soup.find_all("a", href=True):
            if CITE_RE.search(a["href"]):
                signals["citation_links"].append({"url": a["href"], "text": a.get_text(strip=True)[:80]})
        signals["citation_count"] = len(signals["citation_links"])
        signals["has_citations"] = signals["citation_count"] > 0
        signals["citation_links"] = signals["citation_links"][:5]

        return signals

    def extract_comparative_signals(self, clean_text):
        COMPARISON_RE = re.compile(
            r'\bvs\.?\b|\bversus\b|\bcompared\s+to\b|\bcompare\b'
            r'|\balternative\b|\bbetter\s+than\b|\bworse\s+than\b'
            r'|\bunlike\b|\binstead\s+of\b|\bover\s+(?:other|competitor)',
            re.I,
        )
        matches = COMPARISON_RE.findall(clean_text)

        # Named entities appearing right after comparison keywords
        COMP_ENTITY_RE = re.compile(
            r'(?:vs\.?|versus|compared\s+to|alternative\s+to|better\s+than)\s+'
            r'([A-Z][a-zA-Z0-9]*(?:\s+[A-Z][a-zA-Z0-9]*){0,3})',
        )
        competitors = list({m.strip() for m in COMP_ENTITY_RE.findall(clean_text)})

        return {
            "has_comparisons": len(matches) > 0,
            "comparison_mention_count": len(matches),
            "competitor_mentions": competitors[:10],
        }

    def extract_media_richness(self):
        videos = []

        # Native <video> tags
        for video in self.soup.find_all("video"):
            src = video.get("src", "")
            if not src:
                source = video.find("source")
                if source:
                    src = source.get("src", "")
            videos.append({
                "type": "native",
                "src": urljoin(self.url, src) if src else "",
                "poster": video.get("poster", ""),
            })

        # <iframe> video embeds
        VIDEO_HOST_RE = re.compile(
            r'youtube\.com|youtu\.be|vimeo\.com|dailymotion\.com|wistia\.com|loom\.com|brightcove',
            re.I,
        )
        for iframe in self.soup.find_all("iframe"):
            src = iframe.get("src", "") or iframe.get("data-src", "")
            if src and VIDEO_HOST_RE.search(src):
                videos.append({"type": "embed", "src": src})

        return {
            "has_video": len(videos) > 0,
            "video_count": len(videos),
            "videos": videos[:5],
        }

    def build(self):
        try:
            load_time = self.fetch()
        except Exception as e:
            return {"error": f"Failed to fetch: {str(e)}", "url": self.url}

        status    = self.response.status_code if self.response else self._status_code
        final_url = str(self.response.url) if self.response else self._final_url

        if status != 200:
            return {"error": f"Status code: {status}", "url": self.url}

        page_title    = self.soup.title.string.strip() if self.soup.title else ""
        block_signals = ["access denied", "robot", "captcha", "blocked",
                         "403 forbidden", "just a moment", "checking your browser"]
        if any(signal in page_title.lower() for signal in block_signals):
            return {
                "error": f"Bot protection detected: '{page_title}'.",
                "url": self.url,
                "blocked": True
            }

        title, meta_desc, canonical = self.extract_metadata()
        schema_data       = self.extract_schema()
        product_data      = self.parse_product_schema(schema_data)
        schema_score      = self.score_schema_completeness(schema_data)
        headings          = self.extract_headings()
        feature_data      = self.extract_features()
        specs_data        = self.extract_specifications()
        faq_data          = self.extract_faq()
        internal_links, external_links = self.extract_links()
        trust             = self.detect_trust_signal()
        clean_text, word_count = self.extract_clean_text()
        image_data        = self.extract_image_data()
        media_data        = self.extract_media_richness()
        topical_depth     = self.extract_topical_depth(clean_text)
        eeat              = self.extract_eeat_signals()
        comparative       = self.extract_comparative_signals(clean_text)

        if not product_data.get("price"):
            product_data["price"] = self.extract_price_fallback(clean_text)

        page_type = "PRODUCT" if product_data.get("name") else "UNKNOWN"

        return {
            "page_info": {
                "url":              self.url,
                "final_url":        final_url,
                "status_code":      status,
                "canonical_url":    canonical,
                "title":            title,
                "meta_description": meta_desc,
                "https":            self.url.startswith("https"),
                "load_time_ms":     load_time,
                "page_type":        page_type,
                "crawl_timestamp":  datetime.utcnow().isoformat()
            },
            "product": product_data,
            "content": {
                "headings":       headings,
                "features":       feature_data,
                "specifications": specs_data,
                "word_count":     word_count,
                "faq":            faq_data,
                "images":         image_data,
                "topical_depth":  topical_depth,
            },
            "schema_data":        schema_data,
            "schema_completeness": schema_score,
            "media_richness":     media_data,
            "eeat_signals":       eeat,
            "comparative":        comparative,
            "links": {
                "internal": internal_links,
                "external": external_links
            },
            "trust_signals": trust,
            "clean_text":    clean_text
        }