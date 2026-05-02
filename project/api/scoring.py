import re
from typing import Any

class AIScoringEngine:
    
    def __init__(self, crawl_data: dict):
        self.data     = crawl_data
        self.product  = crawl_data.get("product", {})
        self.content  = crawl_data.get("content", {})
        self.trust    = crawl_data.get("trust_signals", {})
        self.eeat=crawl_data.get("eeat_signals", {})
        self.media=crawl_data.get("media_richness", {})
        self.links=crawl_data.get("links", {})
        self.comparison=crawl_data.get("comparison_products", [])
        self.topical=crawl_data.get("topical_depth", {})
        self.clean_text=crawl_data.get("clean_text", "")
        self.schema   = crawl_data.get("schema_data", [])
        self.meta     = crawl_data.get("meta", {})
        raw_page = crawl_data.get("page_info", {})
        self.meta = {
            "title": raw_page.get("title"),
            "description": raw_page.get("meta_description"),
            "canonical": raw_page.get("canonical_url"),
            "hreflang": raw_page.get("hreflang"),
            "og_image": raw_page.get("og_image"),
            "og_title": raw_page.get("og_title"),
            "robots": raw_page.get("robots"),
        }

    def score_schema(self) -> dict:
        b = {}
 
        
        b["name"] = 3 if self.product.get("name") else 0
        b["price"] = 3 if self.product.get("price") else 0
        b["brand"] = 2 if self.product.get("brand") else 0
 
        
        price = str(self.product.get("price", ""))
        b["price_format"] = 1 if re.match(r"^\d+(\.\d{1,2})?$", price) else 0
 
       
        if self.schema:
            types = [s.get("@type", "") for s in self.schema if isinstance(s, dict)]
            b["schema_markup"] = 1 if types else 0
            b["product_schema"] = 2 if "Product" in types else 0
      
            has_offers = any(
                isinstance(s.get("offers"), (dict, list))
                for s in self.schema if isinstance(s, dict)
            )
            b["offers_in_schema"] = 1 if has_offers else 0
        else:
            b["schema_markup"] = 0
            b["product_schema"] = 0
            b["offers_in_schema"] = 0
 
        b["availability"] = 1 if self.product.get("availability") else 0
        b["currency"] = 1 if self.product.get("currency") else 0
 
        score = min(sum(b.values()), 15)
        return {"score": score, "max": 15, "breakdown": b}
 
    # ------------------------------------------------------------------ 
    #  Section 2 — Entity Clarity                         
    # ------------------------------------------------------------------ 
    def score_entity_clarity(self) -> dict:
        b={}

        b["name"] = 2 if self.product.get("name") else 0
        b["brand"] = 2 if self.product.get("brand") else 0
        b["sku"] = 1 if self.product.get("sku") else 0
        b["category"] = 1 if self.product.get("category") else 0
        b["gtin"] = 1 if self.product.get("gtin") else 0 

        
        name = self.product.get("name", "")
        wc = len(name.split()) if name else 0
        if wc >= 5:
            b["name_quality"] = 2
        elif wc >= 3:
            b["name_quality"] = 1
        else:
            b["name_quality"] = 0 
         # Product group context
        b["product_group"] = 1 if self.product.get("product_group") else 0
        score = min(sum(b.values()), 10)
        return {"score": score, "max": 10, "breakdown": b}

    # ------------------------------------------------------------------ 
    #  Section 3 — Content Depth                          
    # ------------------------------------------------------------------ 
    def score_content_depth(self) -> dict:
        b={}

 
        wc = self.content.get("word_count", 0)
        if wc > 2000:
            b["word_count"] = 6
        elif wc > 1000:
            b["word_count"] = 5
        elif wc > 500:
            b["word_count"] = 3
        elif wc > 200:
            b["word_count"] = 2
        else:
            b["word_count"] = 0
            
        headings = self.content.get("headings", [])
        if len(headings) >= 8:
            b["headings"] = 3
        elif len(headings) >= 4:
            b["headings"] = 2
        elif len(headings) >= 1:
            b["headings"] = 1
        else:
            b["headings"] = 0
    
        features = self.content.get("features", [])
        if len(features) >= 6:
            b["features"] = 3
        elif len(features) >= 3:
            b["features"] = 2
        elif len(features) >= 1:
            b["features"] = 1
        else:
            b["features"] = 0
        
        specs = self.content.get("specifications", {})
        if len(specs) >= 10:
            b["specifications"] = 4
        elif len(specs) >= 5:
            b["specifications"] = 3
        elif len(specs) >= 2:
            b["specifications"] = 2
        elif len(specs) >= 1:
            b["specifications"] = 1
        else:
            b["specifications"] = 0
        faq = self.content.get("faq", [])
        if isinstance(faq, list) and len(faq) >= 5:
            b["faq"] = 3
        elif isinstance(faq, list) and len(faq) >= 2:
            b["faq"] = 2
        elif faq:
            b["faq"] = 1
        else:
            b["faq"] = 0
     
        clean_len = len(self.clean_text)
        raw_len = self.content.get("raw_text_length", clean_len or 1)
        if raw_len > 0:
            clean_ratio = clean_len / raw_len
            b["content_signal_ratio"] = 1 if clean_ratio > 0.5 else 0
        else:
            b["content_signal_ratio"] = 0
 
        score = min(sum(b.values()), 20)
        return {"score": score, "max": 20, "breakdown": b}
    # ------------------------------------------------------------------ 
    #  Section 4 — Trust Signals                          
    # ------------------------------------------------------------------ 
    def score_trust_and_eeat(self) -> dict:
        b = {}
 

        trust_checks = {
            "has_return_policy": 2,
            "has_warranty_info": 1,
            "has_shipping_info": 1,
            "mentions_secure_payment": 1,
            "has_contact_page": 1,
            "uses_https": 1,
        }
        for signal, pts in trust_checks.items():
            b[signal] = pts if self.trust.get(signal) else 0
 
        # Reviews — graded, not binary (3 pts)
        review_count = 0
        rc_raw = self.trust.get("reviews_count", 0)
        if isinstance(rc_raw, (int, float)):
            review_count = int(rc_raw)
        elif isinstance(rc_raw, str) and rc_raw.isdigit():
            review_count = int(rc_raw)
 
        if review_count >= 50:
            b["reviews"] = 3
        elif review_count >= 10:
            b["reviews"] = 2
        elif review_count >= 1:
            b["reviews"] = 1
        elif self.trust.get("mentions_reviews"):
            b["reviews"] = 1
        else:
            b["reviews"] = 0
 
        
        b["eeat_experience"] = min(
            2,
            (1 if self.eeat.get("has_user_content") else 0)
            + (1 if self.eeat.get("has_first_person") else 0),
        )
        
        b["eeat_expertise"] = 1 if self.eeat.get("has_author_bio") or self.eeat.get("has_credentials") else 0
        
        b["eeat_authority"] = 1 if self.eeat.get("has_citations") or self.eeat.get("has_expert_links") else 0
        
        b["eeat_trust"] = 1 if self.eeat.get("has_about_page") or self.eeat.get("has_privacy_policy") else 0
 
        score = min(sum(b.values()), 15)
        return {"score": score, "max": 15, "breakdown": b}
    #  Section 5 — AI Extractability                       
    # ------------------------------------------------------------------ 
    def score_extractability(self) -> dict:
        b = {}
 
        # Schema present
        b["schema_present"] = 2 if self.schema else 0
 
        # Heading hierarchy
        headings = self.content.get("headings", [])
        h_types = [h.get("level") for h in headings if isinstance(h, dict)]
        if "h1" in h_types and "h2" in h_types:
            b["heading_hierarchy"] = 2
        elif headings:
            b["heading_hierarchy"] = 1
        else:
            b["heading_hierarchy"] = 0
 

        b["meta_title"] = 1 if self.meta.get("title") else 0
        b["meta_description"] = 1 if self.meta.get("description") else 0
        b["canonical_url"] = 1 if self.meta.get("canonical") else 0
        b["og_tags"] = 1 if self.meta.get("og_title") or self.meta.get("og_image") else 0
 

        b["hreflang"] = 1 if self.meta.get("hreflang") else 0
 

        robots = self.meta.get("robots", "")
        is_blocked = robots and ("noindex" in robots.lower() or "nosnippet" in robots.lower())
        b["not_blocked"] = 1 if not is_blocked else 0
 
        score = min(sum(b.values()), 10)
        return {"score": score, "max": 10, "breakdown": b}
    
    def score_media_richness(self) -> dict:
        b = {}
 
        # Images
        images_block = self.content.get("images", {})
        images_list = (
            images_block.get("images", [])
            if isinstance(images_block, dict)
            else images_block
        )
        img_count = len(images_list) if isinstance(images_list, list) else 0
        images_with_alt = [
            i for i in (images_list or [])
            if isinstance(i, dict) and i.get("alt")
        ]
 
        if img_count >= 5:
            b["image_count"] = 3
        elif img_count >= 2:
            b["image_count"] = 2
        elif img_count >= 1:
            b["image_count"] = 1
        else:
            b["image_count"] = 0
 

        if images_list:
            alt_ratio = len(images_with_alt) / len(images_list)
            b["alt_text_coverage"] = 2 if alt_ratio >= 0.8 else (1 if alt_ratio >= 0.4 else 0)
        else:
            b["alt_text_coverage"] = 0
 

        b["has_video"] = 2 if self.media.get("has_video") else 0
 

        media_types = self.media.get("media_types", [])
        if len(media_types) >= 3:
            b["media_diversity"] = 3
        elif len(media_types) >= 2:
            b["media_diversity"] = 2
        elif len(media_types) >= 1:
            b["media_diversity"] = 1
        else:
            
            b["media_diversity"] = 1 if img_count > 0 else 0
 
        score = min(sum(b.values()), 10)
        return {"score": score, "max": 10, "breakdown": b}
    
    def score_links(self) -> dict:
        b = {}
 
        internal = self.links.get("internal", [])
        external = self.links.get("external", [])
 
        if len(internal) >= 10:
            b["internal_links"] = 3
        elif len(internal) >= 5:
            b["internal_links"] = 2
        elif len(internal) >= 1:
            b["internal_links"] = 1
        else:
            b["internal_links"] = 0
   
        if len(external) >= 3:
            b["external_links"] = 2
        elif len(external) >= 1:
            b["external_links"] = 1
        else:
            b["external_links"] = 0
 
        
        all_links = internal + external
        descriptive = [
            lnk for lnk in all_links
            if isinstance(lnk, dict)
            and lnk.get("anchor_text")
            and len(lnk["anchor_text"].split()) >= 2
            and lnk["anchor_text"].lower() not in ("click here", "read more", "learn more", "here")
        ]
        if len(descriptive) >= 5:
            b["anchor_quality"] = 3
        elif len(descriptive) >= 2:
            b["anchor_quality"] = 2
        elif len(descriptive) >= 1:
            b["anchor_quality"] = 1
        else:
            b["anchor_quality"] = 0
 
      
        broken = self.links.get("broken", [])
        b["no_broken_links"] = 2 if not broken else 0
 
        score = min(sum(b.values()), 10)
        return {"score": score, "max": 10, "breakdown": b}
    
    def score_comparisons(self) -> dict:
        b = {}
 
        comps = self.comparison if isinstance(self.comparison, list) else []
 
        if len(comps) >= 3:
            b["comparison_products"] = 3
        elif len(comps) >= 1:
            b["comparison_products"] = 2
        else:
            b["comparison_products"] = 0
 
        has_comp_table = any(
            isinstance(c, dict) and c.get("has_structured_comparison")
            for c in comps
        )
        b["structured_comparison"] = 2 if has_comp_table else 0
 
        score = min(sum(b.values()), 5)
        return {"score": score, "max": 5, "breakdown": b}
    
    def score_topical_depth(self) -> dict:
        b = {}
 
        
        topics = self.topical.get("topics_covered", [])
        if len(topics) >= 5:
            b["topic_breadth"] = 2
        elif len(topics) >= 2:
            b["topic_breadth"] = 1
        else:
            b["topic_breadth"] = 0
 
        
        entities = self.topical.get("entities_mentioned", [])
        if len(entities) >= 8:
            b["entity_density"] = 2
        elif len(entities) >= 3:
            b["entity_density"] = 1
        else:
            b["entity_density"] = 0
 
        
        b["has_explanatory_content"] = 1 if self.topical.get("has_explanatory_content") else 0
 
        score = min(sum(b.values()), 5)
        return {"score": score, "max": 5, "breakdown": b}
    
    
    def _compute_penalties(self) -> dict:
        penalties = {}
 
        if not self.product.get("price"):
            penalties["missing_price"] = -5
 
        if not self.product.get("name"):
            penalties["missing_product_name"] = -8
 
        if not self.schema:
            penalties["no_schema_markup"] = -5
 
        wc = self.content.get("word_count", 0)
        if wc < 100:
            penalties["thin_content"] = -8
 
 
        robots = self.meta.get("robots", "")
        if robots and "noindex" in robots.lower():
            penalties["noindex_blocked"] = -10
 
        
        if not self.meta.get("canonical"):
            penalties["missing_canonical"] = -2
 
        
        images_block = self.content.get("images", {})
        images_list = (
            images_block.get("images", [])
            if isinstance(images_block, dict)
            else images_block
        )
        if not images_list:
            penalties["no_images"] = -3
 
        
        clean_len = len(self.clean_text)
        raw_len = self.content.get("raw_text_length", clean_len or 1)
        if raw_len > 200 and clean_len / raw_len < 0.3:
            penalties["excessive_boilerplate"] = -4
 
        return penalties
    @staticmethod
    def _readiness_band(pct: float) -> str:
        if pct >= 85:
            return "Excellent — AI/GEO Ready"
        if pct >= 70:
            return "Good — Minor Gaps"
        if pct >= 50:
            return "Fair — Needs Improvement"
        if pct >= 30:
            return "Poor — Significant Issues"
        return "Critical — Not AI-Ready"

    
    def compute_score(self) -> dict:
        schema = self.score_schema()
        entity = self.score_entity_clarity()
        content = self.score_content_depth()
        trust_eeat = self.score_trust_and_eeat()
        extract = self.score_extractability()
        media = self.score_media_richness()
        links = self.score_links()
        comparisons = self.score_comparisons()
        topical = self.score_topical_depth()
        penalties = self._compute_penalties()
 
        sections = [schema, entity, content, trust_eeat, extract, media, links, comparisons, topical]
        raw_total = sum(s["score"] for s in sections)
        max_score = sum(s["max"] for s in sections)  # 100
        penalty_total = sum(penalties.values())
 
        final_score = max(0, raw_total + penalty_total)
        percentage = round((final_score / max_score) * 100, 2)
 
        results = {
         
            "schema_score": schema["score"],
            "entity_score": entity["score"],
            "content_score": content["score"],
            "trust_eeat_score": trust_eeat["score"],
            "extractability_score": extract["score"],
            "media_score": media["score"],
            "links_score": links["score"],
            "comparison_score": comparisons["score"],
            "topical_score": topical["score"],
            
            "section_maxes": {
                "schema": schema["max"],
                "entity": entity["max"],
                "content": content["max"],
                "trust_eeat": trust_eeat["max"],
                "extractability": extract["max"],
                "media": media["max"],
                "links": links["max"],
                "comparison": comparisons["max"],
                "topical": topical["max"],
            },
            # Penalties
            "penalties": penalties,
            "penalty_total": penalty_total,
            # Totals
            "raw_score": raw_total,
            "final_score": final_score,
            "max_possible": max_score,
            "ai_readiness_pct": percentage,
            "readiness_band": self._readiness_band(percentage),
            # Detailed breakdowns
            "breakdowns": {
                "schema": schema["breakdown"],
                "entity": entity["breakdown"],
                "content": content["breakdown"],
                "trust_eeat": trust_eeat["breakdown"],
                "extractability": extract["breakdown"],
                "media": media["breakdown"],
                "links": links["breakdown"],
                "comparison": comparisons["breakdown"],
                "topical": topical["breakdown"],
            },
        }
 
        return results
 