import os
import re
import json
import math
import time
import hashlib
import requests
from collections import Counter, OrderedDict
from decimal import Decimal
from django.conf import settings
from store.models import Product
from vendor.models import Vendor

# Path for persistent vector index cache
VECTOR_CACHE_PATH = os.path.join(settings.BASE_DIR, "store", "vector_cache.json")


def normalize_banglish(text: str) -> str:
    """Normalize common Banglish phonetic short forms, slang, and typos."""
    if not text:
        return ""
    t = text.lower().strip()
    replacements = [
        (r'\btmi\b', 'tumi'),
        (r'\bapnara\b', 'apni'),
        (r'\bkmn\b', 'kemon'),
        (r'\bkemn\b', 'kemon'),
        (r'\baco\b', 'acho'),
        (r'\baso\b', 'acho'),
        (r'\bacen\b', 'achen'),
        (r'\basen\b', 'achen'),
        (r'\bace\b', 'ache'),
        (r'\base\b', 'ache'),
        (r'\bkicu\b', 'kichu'),
        (r'\bkisu\b', 'kichu'),
        (r'\bheadphon\b', 'headphone'),
        (r'\bhedphon\b', 'headphone'),
        (r'\bhedphone\b', 'headphone'),
        (r'\bheadfone\b', 'headphone'),
        (r'\bphn\b', 'phone'),
        (r'\bfone\b', 'phone'),
        (r'\bmobl\b', 'mobile'),
        (r'\bmobail\b', 'mobile'),
        (r'\bwatc\b', 'watch'),
        (r'\bwath\b', 'watch'),
        (r'\bghori\b', 'watch'),
        (r'\bghuri\b', 'watch'),
        (r'\bshoo\b', 'shoe'),
        (r'\bshoos\b', 'shoes'),
        (r'\bsuno\b', 'shuno'),
        (r'\bbolba\b', 'bolun'),
        (r'\bbolben\b', 'bolun'),
        (r'\bparba\b', 'parben'),
        (r'\bkinte\b', 'kinte'),
        (r'\bkinbo\b', 'kinte'),
        (r'\bdaam\b', 'dam'),
        (r'\bdamm\b', 'dam'),
        (r'\bsomporke\b', 'somporke'),
        (r'\bshomporke\b', 'somporke'),
        (r'\bbistarito\b', 'details'),
        (r'\bkono\b', 'kono'),
        (r'\bkno\b', 'keno'),
        (r'\bpolicy\b', 'policy'),
        (r'\bpolici\b', 'policy'),
        (r'\bcomision\b', 'commission'),
        (r'\bkomison\b', 'commission'),
        (r'\bcomission\b', 'commission')
    ]
    for pattern, replacement in replacements:
        t = re.sub(pattern, replacement, t)
    return t


def _tokenize(text: str):
    """Tokenize and normalize text into clean words/tokens."""
    if not text:
        return []
    lower_text = normalize_banglish(text)
    lower_text = lower_text.replace("smartwatch", "smartwatch smart watch")
    lower_text = lower_text.replace("earbuds", "earbuds earbud earphone headphone")
    lower_text = lower_text.replace("earbud", "earbud earbuds earphone headphone")
    lower_text = lower_text.replace("sneakers", "sneakers sneaker shoe shoes")
    lower_text = lower_text.replace("sneaker", "sneaker sneakers shoe shoes")
    lower_text = lower_text.replace("sunglasses", "sunglasses sunglass glasses")
    lower_text = lower_text.replace("sunglass", "sunglass sunglasses glasses")

    # Lowercase and split on non-alphanumeric (preserves bengali unicode characters)
    cleaned = re.sub(r"[^\w\s\u0980-\u09FF]", " ", lower_text)
    words = cleaned.split()
    
    tokens = []
    for w in words:
        if len(w) >= 2:
            tokens.append(w)
            if w.endswith("s") and len(w) > 4:
                tokens.append(w[:-1])
    return tokens


# =====================================================================
# AUTHORITATIVE STORE POLICIES & MARKETPLACE KNOWLEDGE BASE
# =====================================================================
STORE_POLICIES_AND_INFO = [
    {
        "id": "policy_shipping",
        "doc_type": "policy",
        "policy_key": "shipping",
        "title": "Shipping and Delivery Policy",
        "summary": "Inside Dhaka: 24-48 hours (৳60). Outside Dhaka: 2-4 business days (৳120). Nationwide across all 64 districts.",
        "text": (
            "LuxeStore Shipping and Delivery Policy. "
            "Delivery Time: Inside Dhaka delivery takes 24 to 48 hours. Outside Dhaka across all 64 districts of Bangladesh delivery takes 2 to 4 business days. "
            "Delivery Fees: Inside Dhaka standard shipping charge is ৳60 BDT. Outside Dhaka nationwide shipping charge is ৳120 BDT. "
            "Free Shipping: Available on special promotional campaigns or orders over ৳5000. "
            "Tracking: Real-time SMS notifications and online order tracking on dispatch. Fast, insured doorstep delivery."
        ),
        "banglish_keywords": "shipping delivery charge fee koto kobe pabo koy din lagbe dhaka baire home delivery parcel courier"
    },
    {
        "id": "policy_payment",
        "doc_type": "policy",
        "policy_key": "payment",
        "title": "Payment Policy and Methods",
        "summary": "Cash on Delivery (COD), bKash, Nagad, Rocket, Credit/Debit Cards via 256-bit SSL encrypted checkout.",
        "text": (
            "LuxeStore Payment Policy and Accepted Payment Methods. "
            "Cash on Delivery (COD): Available nationwide across all cities and districts. Pay cash when package arrives at your doorstep. "
            "Mobile Banking: bKash, Nagad, Rocket instant secure payments. "
            "Cards & Net Banking: Visa, MasterCard, American Express credit and debit cards processed through secure SSLCommerz gateway. "
            "Security: 256-bit SSL bank-grade encryption. Zero hidden fees. Secure customer escrow protection."
        ),
        "banglish_keywords": "payment bkash nagad cod cash on delivery taka advance card credit debit ssl pay"
    },
    {
        "id": "policy_return_refund",
        "doc_type": "policy",
        "policy_key": "return_refund",
        "title": "7-Day Return, Replacement and Refund Policy",
        "summary": "7-Day hassle-free return/exchange guarantee for defective, damaged or mismatched items. Full refund in 3-5 business days.",
        "text": (
            "LuxeStore 7-Day Hassle-Free Return, Replacement, and Refund Policy. "
            "Return Window: Customers have a full 7 calendar days from the date of delivery to request an exchange, replacement, or full refund. "
            "Eligibility Conditions: Product is damaged during shipping, factory defective, wrong size or color, or does not match online product description. Item should retain original packaging and invoice. "
            "Refund Processing: Full refund is credited directly to customer's original payment method (bKash, Nagad, or Bank Account) within 3 to 5 business days after pickup inspection. "
            "Return Shipping: Free return pickup for damaged or erroneous deliveries."
        ),
        "banglish_keywords": "return refund replacement ferot ferot deya 7 days damage policy tk exchange problem nosto vul"
    },
    {
        "id": "policy_warranty_authenticity",
        "doc_type": "policy",
        "policy_key": "warranty_authenticity",
        "title": "100% Authenticity and Official Brand Warranty Policy",
        "summary": "100% original and verified authentic goods. 1 to 2 Years official warranty on electronics, gadgets and watches.",
        "text": (
            "LuxeStore Authenticity and Brand Warranty Policy. "
            "Authenticity Guarantee: 100% genuine and authentic products sourced directly from verified official vendors, manufacturers, and authorized brand distributors. Counterfeit or replica items are strictly banned. "
            "Official Warranty: All smart tech, audio gadgets, headphones, smartwatches, and electronics come with 1 to 2 Years official brand warranty. "
            "Claim Process: Hassle-free warranty servicing supported directly via LuxeStore customer care or official brand service centers nationwide."
        ),
        "banglish_keywords": "warranty guarantee authentic original ashol genuine nokol bhalo meyad koy bochor mash brand"
    },
    {
        "id": "policy_vendor_commission",
        "doc_type": "policy",
        "policy_key": "vendor_commission",
        "title": "Vendor Onboarding, Shop Registration and Commission Policy",
        "summary": "Flat 0.1% platform commission (vendor keeps 99.9%). Fast payouts via Bank/bKash in 24-48 hrs. Register via Vendor Portal.",
        "text": (
            "LuxeStore Vendor Onboarding and Commission Policy. "
            "Platform Commission: LuxeStore features an industry-disrupting lowest commission rate of only 0.1% platform fee. Vendors and merchants retain 99.9% of their sales revenue! "
            "Vendor Registration: Any legitimate business, artisan, or authorized brand distributor can apply to become a seller via the Vendor Portal (/vendor/register). Quick verification within 24 hours upon submitting Trade License or NID. "
            "Payouts & Settlements: Automated and fast payout requests directly to Vendor's Bank Account, bKash, or Nagad within 24 to 48 hours. "
            "Vendor Benefits: Dedicated vendor management dashboard, live inventory tracking, real-time sales reports, and direct order processing."
        ),
        "banglish_keywords": "vendor commission seller join registration kivabe dokan dokanwala fees 0.1 percent payout taka becha bikri"
    },
    {
        "id": "store_info_main",
        "doc_type": "store_info",
        "policy_key": "store_info",
        "title": "About LuxeStore Multi-Vendor Marketplace",
        "summary": "Bangladesh's premier luxury & tech multi-vendor marketplace with verified vendors, top brands, and escrow protection.",
        "text": (
            "About LuxeStore Multi-Vendor E-Commerce Marketplace. "
            "LuxeStore is Bangladesh's premier curated multi-vendor shopping platform combining luxury lifestyle, smart technology, audio gear, premium footwear, and timepieces. "
            "Marketplace Model: Connects verified top merchants and global brands directly with consumers, ensuring authentic products at competitive prices with escrow customer security. "
            "Admin & Quality Standards: Platform admin enforces strict authenticity checks, verified seller onboarding, 0.1% seller commission, and dedicated 24/7 customer care support. "
            "Key Collections: Smart Tech & Audio (Sony, Apple AirPods, Marshall, Bose), Luxury Footwear (Derby, Loafers, Oxfords, Sneakers), Designer Fashion & Apparel, and Premium Watches."
        ),
        "banglish_keywords": "store dokan shop details marketplace luxestore somporke ki boro info platform bangladesh"
    }
]


# =====================================================================
# HIGH-CONCURRENCY RESPONSE CACHE (SUB-MILLISECOND IN-MEMORY / REDIS READY)
# =====================================================================
class AIResponseCache:
    """
    Ultra-low latency in-memory LRU cache with TTL (Time-To-Live).
    Normalizes query strings to serve frequent customer questions in < 1ms.
    Eliminates redundant external API calls during high-concurrency traffic.
    """
    def __init__(self, max_size: int = 10000, ttl_seconds: int = 3600):
        self.max_size = max_size
        self.ttl = ttl_seconds
        self._cache = OrderedDict()
        self.hits = 0
        self.misses = 0

    def _normalize_key(self, text: str) -> str:
        if not text:
            return ""
        norm = normalize_banglish(text).lower().strip()
        cleaned = re.sub(r"[^\w\s\u0980-\u09FF]", " ", norm)
        collapsed = " ".join(cleaned.split())
        return hashlib.sha256(collapsed.encode("utf-8")).hexdigest()

    def get(self, text: str):
        key = self._normalize_key(text)
        if not key or key not in self._cache:
            self.misses += 1
            return None

        entry = self._cache[key]
        now = time.time()
        if now - entry["timestamp"] > self.ttl:
            del self._cache[key]
            self.misses += 1
            return None

        self._cache.move_to_end(key)
        self.hits += 1
        return entry["data"]

    def set(self, text: str, data: dict):
        key = self._normalize_key(text)
        if not key:
            return
        now = time.time()
        if key in self._cache:
            del self._cache[key]
        elif len(self._cache) >= self.max_size:
            self._cache.popitem(last=False)  # Evict oldest entry
        self._cache[key] = {
            "timestamp": now,
            "data": data
        }

    def clear(self):
        self._cache.clear()


ai_cache = AIResponseCache()


# =====================================================================
# MULTI-ENTITY VECTOR STORE (PRODUCTS, VENDORS, POLICIES, STORE INFO)
# =====================================================================
class VectorStore:
    """
    Multi-entity lightweight vector database engine.
    Computes TF-IDF vector embeddings and cosine similarity.
    Indexes Products, Vendors/Brands, and Store Policies for RAG retrieval.
    """
    def __init__(self):
        self.documents = []  # List of multi-entity doc dicts
        self.idf = {}
        self.load_or_build()

    def build_product_document(self, product):
        """Convert a Product model instance into a searchable product document."""
        category_title = product.category.title if product.category else "General"
        vendor_name = product.vendor.name if getattr(product, 'vendor', None) and getattr(product.vendor, 'name', None) else "LuxeStore Official"
        vendor_id = product.vendor_id if getattr(product, 'vendor_id', None) else None

        colors = []
        try:
            colors = [c.name for c in product.color_set.all() if c.name]
        except Exception:
            pass

        sizes = []
        try:
            sizes = [s.name for s in product.size_set.all() if s.name]
        except Exception:
            pass

        specs = []
        try:
            specs = [f"{sp.title}: {sp.content}" for sp in product.specification_set.all() if sp.title]
        except Exception:
            pass

        full_text = (
            f"Product: {product.title}. "
            f"Category: {category_title}. "
            f"Vendor Brand: {vendor_name}. "
            f"Price: ${float(product.price):.2f}. "
            f"Old Price: ${float(product.old_price):.2f}. "
            f"Stock: {product.stock_qty} in stock. "
            f"Description: {product.description or ''}. "
            f"Available Colors: {', '.join(colors)}. "
            f"Available Sizes: {', '.join(sizes)}. "
            f"Specifications: {'; '.join(specs)}."
        )

        image_url = ""
        if product.image:
            try:
                image_url = product.image.url
            except Exception:
                image_url = str(product.image)

        return {
            "id": product.id,
            "pid": product.pid,
            "doc_type": "product",
            "slug": product.slug or "",
            "title": product.title,
            "category": category_title,
            "vendor": vendor_name,
            "vendor_id": vendor_id,
            "price": float(product.price),
            "old_price": float(product.old_price or 0.0),
            "stock_qty": product.stock_qty,
            "in_stock": product.stock_qty > 0,
            "status": product.status,
            "featured": product.featured,
            "image": image_url,
            "text": full_text,
            "tokens": _tokenize(full_text)
        }

    def build_vendor_document(self, vendor):
        """Convert a Vendor model instance into a rich searchable knowledge document."""
        prods = Product.objects.filter(vendor=vendor, status="published")
        prod_count = prods.count()
        cats = list(set([p.category.title for p in prods if p.category]))
        top_items = [p.title for p in prods[:5]]

        full_text = (
            f"Vendor Profile & Brand: {vendor.name}. "
            f"Shop Profile: {vendor.description or 'Premier verified seller on LuxeStore'}. "
            f"Contact Mobile: {vendor.mobile or 'Available on order invoice'}. "
            f"Active Catalog Size: {prod_count} products listed. "
            f"Specialized Categories: {', '.join(cats) if cats else 'Luxury Lifestyle & Tech'}. "
            f"Popular Items: {', '.join(top_items) if top_items else 'Full catalog online'}. "
            f"Status: Verified Authentic Merchant on LuxeStore with 100% guarantee."
        )

        image_url = ""
        if getattr(vendor, 'image', None):
            try:
                image_url = vendor.image.url
            except Exception:
                image_url = str(vendor.image)

        return {
            "id": f"vendor_{vendor.id}",
            "vendor_id": vendor.id,
            "doc_type": "vendor",
            "title": f"Vendor: {vendor.name}",
            "name": vendor.name,
            "slug": vendor.slug or "",
            "mobile": vendor.mobile or "",
            "description": vendor.description or "",
            "product_count": prod_count,
            "categories": cats,
            "top_items": top_items,
            "image": image_url,
            "text": full_text,
            "tokens": _tokenize(full_text)
        }

    def build_policy_document(self, policy_info: dict):
        """Convert a static policy knowledge dictionary into a searchable document."""
        full_text = f"Policy Document: {policy_info['title']}. Details: {policy_info['text']}. Keywords: {policy_info.get('banglish_keywords', '')}"
        return {
            "id": policy_info["id"],
            "doc_type": policy_info.get("doc_type", "policy"),
            "policy_key": policy_info.get("policy_key", ""),
            "title": policy_info["title"],
            "summary": policy_info.get("summary", ""),
            "details": policy_info["text"],
            "text": full_text,
            "tokens": _tokenize(full_text)
        }

    def index_all(self):
        """Index all products, vendors, and store policies into the vector store."""
        docs = []

        # 1. Published Products
        qs = Product.objects.filter(status="published").select_related("category", "vendor").prefetch_related("color_set", "size_set", "specification_set")
        for p in qs:
            docs.append(self.build_product_document(p))

        # 2. Active Vendors
        vendors = Vendor.objects.filter(active=True)
        for v in vendors:
            docs.append(self.build_vendor_document(v))

        # 3. Store Policies & Marketplace Knowledge
        for policy_item in STORE_POLICIES_AND_INFO:
            docs.append(self.build_policy_document(policy_item))

        self.documents = docs
        self._calculate_idf()
        self.save()
        ai_cache.clear()
        return len(self.documents)

    def _calculate_idf(self):
        """Compute Inverse Document Frequency across all indexed documents."""
        n_docs = len(self.documents)
        if n_docs == 0:
            self.idf = {}
            return

        doc_freq = Counter()
        for doc in self.documents:
            unique_tokens = set(doc.get("tokens", []))
            for t in unique_tokens:
                doc_freq[t] += 1

        self.idf = {}
        for token, count in doc_freq.items():
            self.idf[token] = math.log((n_docs + 1) / (count + 1)) + 1.0

    def save(self):
        """Save vector cache to disk."""
        try:
            os.makedirs(os.path.dirname(VECTOR_CACHE_PATH), exist_ok=True)
            with open(VECTOR_CACHE_PATH, "w", encoding="utf-8") as f:
                json.dump({
                    "documents": self.documents,
                    "idf": self.idf
                }, f, ensure_ascii=False)
        except Exception as e:
            print(f"Failed to persist vector cache: {e}")

    def load_or_build(self):
        """Load vector cache from disk, or index on the fly if not found."""
        if os.path.exists(VECTOR_CACHE_PATH):
            try:
                with open(VECTOR_CACHE_PATH, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self.documents = data.get("documents", [])
                    self.idf = data.get("idf", {})
                    # Ensure vendor & policy docs are loaded
                    has_vendor = any(d.get("doc_type") == "vendor" for d in self.documents)
                    if len(self.documents) > 0 and has_vendor:
                        return
            except Exception:
                pass
        try:
            self.index_all()
        except Exception:
            pass

    def upsert_product(self, product):
        """Add or update an individual product in the vector index."""
        if product.status != "published":
            self.delete_product(product.id)
            return

        new_doc = self.build_product_document(product)
        updated = False
        for i, doc in enumerate(self.documents):
            if doc.get("doc_type") == "product" and doc.get("id") == product.id:
                self.documents[i] = new_doc
                updated = True
                break
        if not updated:
            self.documents.append(new_doc)

        self._calculate_idf()
        self.save()
        ai_cache.clear()

    def delete_product(self, product_id):
        """Remove a product from the vector index."""
        self.documents = [d for d in self.documents if not (d.get("doc_type") == "product" and d.get("id") == product_id)]
        self._calculate_idf()
        self.save()
        ai_cache.clear()

    def upsert_vendor(self, vendor):
        """Add or update an individual vendor in the vector index."""
        doc_id = f"vendor_{vendor.id}"
        if not vendor.active:
            self.documents = [d for d in self.documents if d.get("id") != doc_id]
        else:
            new_doc = self.build_vendor_document(vendor)
            updated = False
            for i, doc in enumerate(self.documents):
                if doc.get("id") == doc_id:
                    self.documents[i] = new_doc
                    updated = True
                    break
            if not updated:
                self.documents.append(new_doc)

        self._calculate_idf()
        self.save()
        ai_cache.clear()

    def search(self, query: str, top_k: int = 4, price_max: float = None, vendor_id: int = None):
        """
        Perform vector similarity search against published products.
        Returns top_k most relevant products.
        """
        if not self.documents:
            self.load_or_build()

        query_norm = normalize_banglish(query)
        query_tokens = _tokenize(query_norm)
        if not query_tokens:
            return []

        product_docs = [d for d in self.documents if d.get("doc_type", "product") == "product"]
        if vendor_id is not None:
            product_docs = [d for d in product_docs if d.get("vendor_id") == vendor_id]

        q_tf = Counter(query_tokens)
        q_vec = {t: count * self.idf.get(t, 1.0) for t, count in q_tf.items()}
        q_norm = math.sqrt(sum(v ** 2 for v in q_vec.values())) or 1.0

        scores = []
        for doc in product_docs:
            if price_max is not None and doc.get("price", 0) > price_max:
                continue

            doc_tokens = doc.get("tokens", [])
            doc_tf = Counter(doc_tokens)
            dot = 0.0
            for t, q_weight in q_vec.items():
                if t in doc_tf:
                    dot += q_weight * doc_tf[t] * self.idf.get(t, 1.0)

            doc_norm = math.sqrt(sum((count * self.idf.get(t, 1.0)) ** 2 for t, count in doc_tf.items())) or 1.0
            cos_sim = dot / (q_norm * doc_norm)

            title_lower = doc.get("title", "").lower()
            for t in query_tokens:
                if t in title_lower:
                    cos_sim += 0.25

            cat_lower = doc.get("category", "").lower()
            for t in query_tokens:
                if t in cat_lower:
                    cos_sim += 0.15

            scores.append((cos_sim, doc))

        scores = [item for item in scores if item[0] > 0.10]
        scores.sort(key=lambda x: x[0], reverse=True)
        results = [item[1] for item in scores[:top_k]]

        if not results and price_max is not None:
            return self.search(query, top_k=top_k, price_max=None, vendor_id=vendor_id)

        return results

    def search_knowledge(self, query: str, top_k: int = 3, doc_types: list = None):
        """
        Search non-product knowledge documents (vendors, policies, store info).
        """
        if not self.documents:
            self.load_or_build()

        if doc_types is None:
            doc_types = ["vendor", "policy", "store_info"]

        knowledge_docs = [d for d in self.documents if d.get("doc_type") in doc_types]
        if not knowledge_docs:
            return []

        query_norm = normalize_banglish(query)
        query_tokens = _tokenize(query_norm)
        if not query_tokens:
            return knowledge_docs[:top_k]

        q_tf = Counter(query_tokens)
        q_vec = {t: count * self.idf.get(t, 1.0) for t, count in q_tf.items()}
        q_norm = math.sqrt(sum(v ** 2 for v in q_vec.values())) or 1.0

        scores = []
        for doc in knowledge_docs:
            doc_tokens = doc.get("tokens", [])
            doc_tf = Counter(doc_tokens)
            dot = 0.0
            for t, q_weight in q_vec.items():
                if t in doc_tf:
                    dot += q_weight * doc_tf[t] * self.idf.get(t, 1.0)
            doc_norm = math.sqrt(sum((count * self.idf.get(t, 1.0)) ** 2 for t, count in doc_tf.items())) or 1.0
            cos_sim = dot / (q_norm * doc_norm)

            doc_name_lower = (doc.get("name") or doc.get("title") or "").lower()
            for t in query_tokens:
                if t in doc_name_lower:
                    cos_sim += 0.40

            scores.append((cos_sim, doc))

        scores.sort(key=lambda x: x[0], reverse=True)
        return [item[1] for item in scores if item[0] > 0.05][:top_k]

    def search_vendors(self, query: str, top_k: int = 3):
        """Search vendors and brands exclusively."""
        return self.search_knowledge(query, top_k=top_k, doc_types=["vendor"])


# Global singleton instance of vector store
vector_store = VectorStore()


# =====================================================================
# INTENT & LANGUAGE CLASSIFIERS
# =====================================================================
def detect_language(text: str) -> str:
    """Detect whether text is Bengali script, Banglish, or English."""
    if not text:
        return "english"

    norm = normalize_banglish(text)
    bengali_chars = len(re.findall(r"[\u0980-\u09FF]", text))
    total_chars = len(re.findall(r"\w", text))

    if total_chars > 0 and (bengali_chars / total_chars) > 0.2:
        return "bengali"

    banglish_keywords = {
        "vai", "bhai", "kemon", "taka", "takar", "ache", "ase", "koto", "kotoo",
        "valo", "bhalo", "dam", "daam", "dekhaw", "dekhao", "kinte", "lagbe", "chai",
        "chacci", "apnader", "amar", "budget", "offer", "discount", "hobe", "delivery",
        "charge", "pabo", "kobe", "warranty", "ki", "kon", "konta", "shobcheye", "sobcheye",
        "ekhane", "dokan", "storer", "order", "korbo", "kivabe", "akto", "ekto", "achen",
        "acho", "tumi", "apni", "apnar", "tomar", "amra", "tora", "bolun", "shunen", "bujhlam",
        "kire", "bro", "apnake", "mon", "kharap", "shunchi", "bolte", "bolbo", "jani",
        "kichu", "na", "keno", "kno", "kortece", "tobuo", "jokhon", "somporke", "ask",
        "accha", "achha", "dhonnobad", "shukriya", "khoda", "allah", "shobar", "korun", "bolen",
        "tmi", "kmn", "aco", "ace", "kicu", "details", "hot", "product", "parba", "bolo",
        "vendor", "brand", "seller", "policy", "commission", "ferot", "ashol"
    }
    words = re.sub(r"[^\w\s]", " ", norm.lower()).split()
    if set(words).intersection(banglish_keywords) or any(k in norm for k in [
        "bhai", "vai", "koto", "takar", "valo", "kemon", "keno", "kno", "ache", "accha",
        "dhonnobad", "tumi", "acho", "kichu", "somporke", "kivabe", "ferot"
    ]):
        return "banglish"

    return "english"


def detect_intent(text: str) -> str:
    """
    Classify customer intent into specific actions:
    1. vendor_inquiry: Questions about vendors, brands, sellers (Axura, Zenith Audio, Luxe Atelier).
    2. policy_inquiry: Questions about shipping, return, warranty, payments, vendor commission.
    3. store_details: Questions about LuxeStore platform, identity, mission.
    4. hot_products: Trending / Best seller queries.
    5. product_query: Active shopping and product search.
    6. conversational / FAQs / small-talk / greetings.
    """
    t = normalize_banglish(text)

    # 1. Negative intent or feedback about product suggestions
    has_negative_product = bool(re.search(
        r'(product.*(chai\s*na|kono|kno|keno|bolini|lagbe\s*na|ask\s*kori\s*na|na\s*kori|suggest\s*kortece)|no\s*product|don\'?t\s*want\s*product|not\s*looking\s*for\s*product)',
        t
    ))
    if has_negative_product or any(k in t for k in [
        "product chai na", "product somporke ask na", "product suggest kortece",
        "product er dorkar nai", "ponno chai na", "kono product na"
    ]):
        return "feedback_meta"

    # 2. Human touch complaints
    if re.search(
        r'\b(human\s*er\s*mto|human\s*er\s*moto|robot\s*er\s*mto|robot\s*er\s*moto|bujho\s*na|bujhte\s*paro\s*na|bokami|faltu|vul\s*bolcho|stupid|bad\s*bot|manush\s*er\s*moto)\b',
        t
    ) or any(k in t for k in ["মানুষের মত", "মানুষের মতো না", "রোবট এর মত", "ভুল করছো"]):
        return "feedback_meta"

    # 3. Store Policies, Commission & Onboarding inquiries
    has_policy_mention = bool(re.search(
        r'\b(policy|policies|commission|comission|komison|rules|niyom|shortho|terms|condition|kivabe\s*vendor|seller\s*join|vendor\s*join|vendor\s*registration|seller\s*registration|warranty|warrantee|guarantee|return\s*policy|refund\s*policy|shipping\s*policy|delivery\s*policy|payment\s*policy|payout)\b',
        t
    ) or any(k in t for k in [
        "পলিসি", "কমিশন", "নিয়ম", "শর্ত", "ওয়ারেন্টি", "গ্যারান্টি", "রিটার্ন পলিসি", "রিফান্ড পলিসি",
        "ডেলিভারি পলিসি", "পেমেন্ট পলিসি", "vendor commission", "seller commission", "কমিশন কত",
        "ভেন্ডর কীভাবে", "সেলার রেজিস্ট্রেশন", "ভেন্ডর রেজিস্ট্রেশন"
    ]))
    if has_policy_mention:
        return "policy_inquiry"

    # 4. Vendor / Brand profile inquiries
    has_vendor_mention = bool(re.search(
        r'\b(axura|zenith|zenith\s*audio|luxe\s*atelier)\b',
        t
    ) or re.search(r'\b(vendor|vendors|brand|brands|seller|sellers|dokanwala)\s*(somporke|details|kemon|list|name|profile|ki|koyta|shob|sob)\b', t)
      or any(k in t for k in [
        "ভেন্ডর সম্পর্কে", "ব্র্যান্ড সম্পর্কে", "সেলার সম্পর্কে", "কয়টা ভেন্ডর", "ভেন্ডর লিস্ট"
    ]))
    if has_vendor_mention:
        return "vendor_inquiry"

    # 5. Store details / About LuxeStore
    if re.search(r'\b(store|dokan|shop|website|site|marketplace)\s*(somporke|details|ki|bistarito)\b', t) or re.search(r'\b(details|bistarito)\s*(bolte|bolo|bolun|jante)\b', t) or any(k in t for k in ["store somporke", "dokan somporke", "দোকান সম্পর্কে", "স্টোর সম্পর্কে", "স্টোরের বিস্তারিত"]):
        return "store_details"

    # 6. Hot / Trending products inquiry
    if re.search(r'\b(hot\s*product|trending|best\s*seller|popular\s*product|top\s*product|valo\s*product|valoo\s*product)\b', t) or any(k in t for k in ["হট প্রোডাক্ট", "সেরা প্রোডাক্ট", "জনপ্রিয় পণ্য", "ট্রেন্ডিং"]):
        return "hot_products"

    # 7. Explicit product shopping queries
    has_explicit_product = bool(re.search(
        r'\b(phone|mobile|smartphone|watch|smartwatch|shoe|shoes|sneaker|sneakers|boots|headphone|headphones|earbud|earbuds|earphone|earphones|laptop|bag|backpack|shirt|t-shirt|pant|pants|jeans|dress|jacket|hoodie|camera|tablet|speaker|charger|gadget|perfume|sunglasses|sunglass)\b',
        t
    ) or any(k in t for k in ["ঘড়ি", "ঘড়ি", "জুতো", "জুতা", "ফোন", "হেডফোন", "ল্যাপটপ", "ব্যাগ", "শার্ট", "পোশাক"]))

    has_shopping_action = bool(re.search(
        r'\b(kinte\s*chai|kinbo|lagbe|khujchi|khujtesi|dekhaw|dekhao|show\s*me|buy|purchase|order\s*korte\s*chai|need\s*to\s*buy|suggest|recommend|recommendation|konta\s*bhalo|konta\s*nibo|kon\s*ta\s*valo|dam\s*koto|price\s*koto|koto\s*taka|koto\s*dam|under\s*\d+|budget\s*\d+|\d+\s*takar\s*moddhe)\b',
        t
    ) or any(k in t for k in ["কিনতে চাই", "লাগবে", "খুঁজছি", "দেখান", "দাম কত", "কত দাম", "টাকার মধ্যে"]))

    if has_explicit_product:
        return "product_query"

    if has_shopping_action and not any(k in t for k in ["kemon", "tumi", "apni", "hi", "hello"]):
        return "product_query"

    # 8. Identity / Bot questions
    if re.search(
        r'\b(who\s*are\s*you|whats?\s*your\s*name|what\s*is\s*your\s*name|tumi\s*ke|apni\s*ke|apnar\s*nam\s*ki|tomar\s*nam\s*ki|ki\s*koro|(tumi|apni|are\s*you)\s*(ki\s*)?(a\s*)?(bot|ai|robot|human|manush))\b',
        t
    ) or any(k in t for k in ["তুমি কে", "আপনার নাম কি", "তোমার নাম কি", "আপনি কে", "মানুষ নাকি", "রোবট নাকি", "রোবট"]):
        return "identity"

    # 9. Store FAQs
    if re.search(r'\b(delivery|shipping|koto\s*din\s*lagbe|kobe\s*pabo|delivery\s*charge|shipping\s*cost|home\s*delivery)\b', t) or any(k in t for k in ["ডেলিভারি", "কত দিন লাগবে", "কবে পাব", "ডেলিভারি চার্জ"]):
        return "faq_delivery"

    if re.search(r'\b(payment|bkash|b-kash|nagad|rocket|cod|cash\s*on\s*delivery|advance\s*taka|credit\s*card|debit\s*card)\b', t) or any(k in t for k in ["পেমেন্ট", "বিকাশ", "নগদ", "ক্যাশ অন ডেলিভারি"]):
        return "faq_payment"

    if re.search(r'\b(return|refund|exchange|replacement|damage|warrantee|guarantee)\b', t) or any(k in t for k in ["রিটার্ন", "ফেরত", "রিফান্ড"]):
        return "faq_return"

    if re.search(r'\b(dokan\s*kothay|shop\s*kothay|location\s*kothay|address\s*kothay|showroom|outlet|branch)\b', t) or any(k in t for k in ["দোকান কোথায়", "ঠিকানা", "শোরুম"]):
        return "faq_location"

    # 10. Gratitude / Farewell
    if re.search(r'\b(thanks|thank\s*you|thx|dhonnobad|dhonobad|shukriya|bye|goodbye|tata|allah\s*hafez|khoda\s*hafez|take\s*care|see\s*you)\b', t) or any(k in t for k in ["ধন্যবাদ", "বিদায়", "আল্লাহ হাফেজ", "থ্যাঙ্কস"]):
        return "gratitude_farewell"

    # 11. Greetings & Well-being
    if re.search(r'\b(hi|hello|hey|helo|hy|hola|salam|assalamu\s*alaikum|asalamu\s*alaikum|slaam|kemon\s*acho|kemon\s*achen|ki\s*khobor|ki\s*obostha|good\s*morning|good\s*evening|good\s*afternoon|how\s*are\s*you|whats\s*up|sup|kire|vai|bhai|bro|brother|shuno|shunchen)\b', t) or any(k in t for k in ["কেমন আছেন", "কেমন আছো", "হাই", "হ্যালো", "সালাম", "আসসালামু আলাইকুম"]):
        return "greeting"

    # 12. Emotions / Empathy
    if re.search(r'\b(mon\s*kharap|valo\s*na|bhalo\s*na|sad|boring|bhalo\s*achi|valo\s*achi|alhamdulillah|fine)\b', t) or any(k in t for k in ["মন খারাপ", "ভালো না", "আলহামদুলিল্লাহ"]):
        return "empathy_mood"

    # 13. Small talk & Affirmation
    casual_words = {"hmm", "accha", "achha", "thik", "thik ache", "tai naki", "bujhlam", "ok", "okay", "cool", "nice", "wow", "humm", "are wah", "shundor"}
    if t in casual_words or any(t.startswith(cw) for cw in casual_words):
        return "smalltalk_affirmation"

    return "general_conversation"


# =====================================================================
# AI ASSISTANT SERVICE WITH ADVANCED RAG & MULTI-TIER CACHING
# =====================================================================
class AIAssistantService:
    """
    Production RAG Engine combining Multi-Entity VectorStore with Gemini 3.8.
    Features sub-millisecond query response caching to handle high traffic and low latency.
    """
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY", "").strip()
        self.cache = ai_cache

    def generate_response(self, user_message: str, conversation_history: list = None):
        """
        Process user query through conversational RAG pipeline with instant cache checks:
        1. Query Normalization & Cache Lookup (Sub-millisecond retrieval).
        2. Multi-Entity RAG (Products, Vendors, Policies, Store info).
        3. Intent Gatekeeping & Grounded LLM Response Generation.
        4. Cache Response for ultra-low latency on identical/recurring questions.
        """
        start_time = time.perf_counter()
        self.api_key = os.getenv("GEMINI_API_KEY", "").strip()

        # -------------------------------------------------------------
        # TIER 1: FAST RESPONSE CACHE (Sub-millisecond, < 1ms)
        # -------------------------------------------------------------
        cached_result = self.cache.get(user_message)
        if cached_result:
            elapsed_ms = (time.perf_counter() - start_time) * 1000
            res = dict(cached_result)
            res["latency_ms"] = round(elapsed_ms, 2)
            res["cached"] = True
            return res

        lang = detect_language(user_message)
        intent = detect_intent(user_message)

        # -------------------------------------------------------------
        # SCENARIO 1: Vendor / Brand Inquiry
        # -------------------------------------------------------------
        if intent == "vendor_inquiry":
            matched_vendors = vector_store.search_vendors(user_message, top_k=3)
            target_vendor = matched_vendors[0] if matched_vendors else None

            # Retrieve top products for this vendor if matched
            vendor_products = []
            if target_vendor and target_vendor.get("vendor_id"):
                v_id = target_vendor["vendor_id"]
                vendor_products = [
                    d for d in vector_store.documents
                    if d.get("doc_type") == "product" and d.get("vendor_id") == v_id
                ][:4]

            # Try Gemini 3 with grounded vendor context
            gemini_reply = self._call_gemini_vendor(user_message, target_vendor, vendor_products, lang, conversation_history)
            if not gemini_reply:
                gemini_reply = self._generate_vendor_reply(user_message, target_vendor, vendor_products, lang)

            result = {
                "reply": gemini_reply,
                "products": self._format_product_cards(vendor_products),
                "language": lang
            }
            self.cache.set(user_message, result)
            elapsed_ms = (time.perf_counter() - start_time) * 1000
            result["latency_ms"] = round(elapsed_ms, 2)
            result["cached"] = False
            return result

        # -------------------------------------------------------------
        # SCENARIO 2: Store Policy / Commission / Warranty Inquiry
        # -------------------------------------------------------------
        if intent in ["policy_inquiry", "faq_delivery", "faq_payment", "faq_return"]:
            matched_policies = vector_store.search_knowledge(user_message, top_k=2, doc_types=["policy", "store_info"])
            if not matched_policies:
                # Default to return/warranty/shipping policies
                matched_policies = [d for d in vector_store.documents if d.get("doc_type") == "policy"][:2]

            gemini_reply = self._call_gemini_policy(user_message, matched_policies, lang, conversation_history)
            if not gemini_reply:
                gemini_reply = self._generate_policy_reply(user_message, matched_policies, lang)

            result = {
                "reply": gemini_reply,
                "products": [],  # STRICTLY ZERO products for policy queries
                "language": lang
            }
            self.cache.set(user_message, result)
            elapsed_ms = (time.perf_counter() - start_time) * 1000
            result["latency_ms"] = round(elapsed_ms, 2)
            result["cached"] = False
            return result

        # -------------------------------------------------------------
        # SCENARIO 3: Store Details / About LuxeStore
        # -------------------------------------------------------------
        if intent == "store_details":
            store_docs = [d for d in vector_store.documents if d.get("id") == "store_info_main"]
            gemini_reply = self._call_gemini_conversational(user_message, lang, intent, conversation_history)
            if not gemini_reply:
                gemini_reply = self._generate_conversational_reply(user_message, intent, lang)

            result = {
                "reply": gemini_reply,
                "products": [],
                "language": lang
            }
            self.cache.set(user_message, result)
            elapsed_ms = (time.perf_counter() - start_time) * 1000
            result["latency_ms"] = round(elapsed_ms, 2)
            result["cached"] = False
            return result

        # -------------------------------------------------------------
        # SCENARIO 4: Hot / Trending products request
        # -------------------------------------------------------------
        if intent == "hot_products":
            featured = [d for d in vector_store.documents if d.get("doc_type") == "product" and d.get("featured")]
            matched_products = featured[:4] if featured else [d for d in vector_store.documents if d.get("doc_type") == "product"][:4]
            reply_text = self._generate_hot_products_reply(matched_products, lang)
            result = {
                "reply": reply_text,
                "products": self._format_product_cards(matched_products),
                "language": lang
            }
            self.cache.set(user_message, result)
            elapsed_ms = (time.perf_counter() - start_time) * 1000
            result["latency_ms"] = round(elapsed_ms, 2)
            result["cached"] = False
            return result

        # -------------------------------------------------------------
        # SCENARIO 5: Non-Product Conversational Small Talk / Feedback
        # -------------------------------------------------------------
        if intent != "product_query":
            gemini_reply = self._call_gemini_conversational(user_message, lang, intent, conversation_history)
            if not gemini_reply:
                gemini_reply = self._generate_conversational_reply(user_message, intent, lang)

            result = {
                "reply": gemini_reply,
                "products": [],  # STRICTLY ZERO products for general small talk
                "language": lang
            }
            self.cache.set(user_message, result)
            elapsed_ms = (time.perf_counter() - start_time) * 1000
            result["latency_ms"] = round(elapsed_ms, 2)
            result["cached"] = False
            return result

        # -------------------------------------------------------------
        # SCENARIO 6: Genuine Product Inquiry / Shopping Assistance
        # -------------------------------------------------------------
        price_max = None
        price_match = re.search(r'(?:under|below|budget|within|moddhe)?\s*\$?(\d+(?:\.\d+)?)\s*(?:taka|tk|\$)?', user_message.lower())
        if price_match:
            try:
                val = float(price_match.group(1))
                if val > 10:
                    if "taka" in user_message.lower() or "tk" in user_message.lower() or val > 500:
                        price_max = val / 110.0
                    else:
                        price_max = val
            except Exception:
                pass

        matched_products = vector_store.search(user_message, top_k=4, price_max=price_max)

        gemini_reply = self._call_gemini(user_message, matched_products, lang, conversation_history)
        if not gemini_reply:
            gemini_reply = self._generate_product_reply(user_message, matched_products, lang)

        result = {
            "reply": gemini_reply,
            "products": self._format_product_cards(matched_products),
            "language": lang
        }
        self.cache.set(user_message, result)
        elapsed_ms = (time.perf_counter() - start_time) * 1000
        result["latency_ms"] = round(elapsed_ms, 2)
        result["cached"] = False
        return result

    def _is_api_key_valid(self):
        """Check if GEMINI_API_KEY has a valid Google AI Studio key format."""
        key = (self.api_key or "").strip().lstrip("-")
        if not key or len(key) < 25:
            return False
        if key.startswith("AQ.") or key.startswith("AIzaSy"):
            return True
        return False

    def _invoke_gemini_api(self, system_instruction: str, user_message: str, history: list = None):
        """Invoke Google Gemini 3 / Gemini Flash via official Google REST endpoint."""
        if not self._is_api_key_valid():
            return None

        clean_key = self.api_key.strip().lstrip("-")
        contents = []
        if history:
            for item in history[-4:]:
                role = "user" if item.get("role") == "user" else "model"
                txt = item.get("content", "").strip()
                if txt:
                    contents.append({"role": role, "parts": [{"text": txt}]})
        contents.append({"role": "user", "parts": [{"text": user_message}]})

        payload = {
            "system_instruction": {
                "parts": [{"text": system_instruction}]
            },
            "contents": contents,
            "generationConfig": {
                "temperature": 0.7,
                "maxOutputTokens": 800
            }
        }

        # Prioritize high-availability, low-latency Flash-Lite & Flash models
        models_to_try = [
            "gemini-3.1-flash-lite",
            "gemini-3.5-flash-lite",
            "gemini-3.6-flash",
            "gemini-3.7-flash",
            "gemini-flash-lite-latest",
            "gemini-3.8-flash",
            "gemini-flash-latest"
        ]
        for model_name in models_to_try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={clean_key}"
            try:
                res = requests.post(url, json=payload, timeout=15)
                if res.status_code == 200:
                    data = res.json()
                    ans = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                    if ans:
                        return ans.strip()
            except Exception:
                continue

        return None

    def _call_gemini_vendor(self, user_message: str, vendor_doc: dict, vendor_products: list, lang: str, history: list):
        """Invoke Gemini to introduce or explain a specific vendor in a warm human manner."""
        if not vendor_doc:
            return None

        prod_summaries = []
        for p in vendor_products:
            prod_summaries.append(f"- {p.get('title')} (${p.get('price', 0):.2f})")
        prods_text = "\n".join(prod_summaries) if prod_summaries else "Various verified items."

        system_instruction = (
            "You are 'Luxe Assistant', an extraordinarily warm, polite, and helpful human sales advisor at LuxeStore in Bangladesh.\n"
            "The customer is asking about a vendor, brand, or shop in LuxeStore.\n\n"
            f"VENDOR CONTEXT:\n"
            f"- Vendor Name: {vendor_doc.get('name')}\n"
            f"- Description: {vendor_doc.get('description')}\n"
            f"- Mobile: {vendor_doc.get('mobile')}\n"
            f"- Items available:\n{prods_text}\n\n"
            "CRITICAL HUMAN PERSONALITY INSTRUCTIONS:\n"
            "1. Talk like an authentic, caring, friendly human store assistant or brother. NEVER sound like a robot or bot.\n"
            "2. DO NOT use stiff headers, lists, or robotic phrases like 'Shop Profile:' or 'Listed Products:'.\n"
            "3. If BANGLISH: Speak warm, natural, friendly Banglish (e.g. 'Arey bhai, Zenith Audio Labs amader onek trusted ekta vendor...', 'Tara besh bhalo headphones ar audio gear sell kore...').\n"
            "4. If BENGALI: Speak sweet, polite, natural Bengali.\n"
            "5. If ENGLISH: Speak friendly, elegant English.\n"
            "6. Keep it conversational (2-4 sentences) and ask a gentle follow-up question."
        )
        return self._invoke_gemini_api(system_instruction, user_message, history)

    def _call_gemini_policy(self, user_message: str, matched_policies: list, lang: str, history: list):
        """Invoke Gemini to explain store policies conversationally like a caring human."""
        policy_texts = "\n\n".join([f"[{p.get('title')}]: {p.get('details')}" for p in matched_policies])

        system_instruction = (
            "You are 'Luxe Assistant', a friendly, polite, empathetic human shopping assistant for LuxeStore in Bangladesh.\n"
            "The customer is asking about store policies (shipping, return, warranty, payments, or vendor commission).\n\n"
            f"OFFICIAL POLICIES:\n"
            f"{policy_texts}\n\n"
            "CRITICAL HUMAN PERSONALITY INSTRUCTIONS:\n"
            "1. Speak like a real caring human friend or store advisor, NOT a lawyer or robot!\n"
            "2. NEVER dump legal text, formal contracts, or bullet points.\n"
            "3. If BANGLISH: Speak sweet, conversational Banglish (e.g. 'Haa bhai! Amader delivery charge Dhaka-te matro ৳60...', 'Kono chinta korben na bhai, amader 7 diner return guarantee ache...').\n"
            "4. Accurate facts: Commission is flat 0.1% (vendor gets 99.9%), Inside Dhaka delivery 24-48h (৳60), Outside Dhaka 2-4 days (৳120), 7-day returns, 1-2 yr warranty.\n"
            "5. DO NOT recommend or attach specific product cards.\n"
            "6. Keep it brief, friendly, and reassuring (2-3 sentences max)."
        )
        return self._invoke_gemini_api(system_instruction, user_message, history)

    def _call_gemini_conversational(self, user_message: str, lang: str, intent: str, history: list):
        """Invoke Gemini strictly for conversational small talk or greetings."""
        system_instruction = (
            "You are 'Luxe Assistant', an extraordinarily warm, polite, empathetic human shopping companion at LuxeStore in Bangladesh.\n"
            "CRITICAL HUMAN PERSONALITY INSTRUCTIONS:\n"
            "1. Converse naturally like an authentic human friend. If greeted ('hi', 'kemon acho'), greet warmly back and ask how their day is going!\n"
            "2. If BANGLISH: Speak sweet, natural, friendly Banglish (e.g. 'Hello bhai! Alhamdulillah ami bhalo achi, apni kemon achen? Bolun ajke apnake kivabe help korte pari 😊').\n"
            "3. If BENGALI: Speak sweet, polite, natural Bengali.\n"
            "4. If ENGLISH: Speak warm, friendly, conversational English.\n"
            "5. DO NOT recommend or attach specific product cards.\n"
            "6. NEVER dump bullet lists or corporate text. Keep it warm, caring, and short (2-3 sentences max)."
        )
        return self._invoke_gemini_api(system_instruction, user_message, history)

    def _call_gemini(self, user_message: str, matched_products: list, lang: str, history: list):
        """Invoke Gemini for product recommendations grounded in catalog context."""
        context_blocks = []
        for p in matched_products:
            context_blocks.append(
                f"- Product: {p['title']}\n"
                f"  Category: {p['category']}\n"
                f"  Vendor: {p.get('vendor', 'LuxeStore Official')}\n"
                f"  Price: ${p['price']:.2f} (Old Price: ${p['old_price']:.2f})\n"
                f"  Stock: {p['stock_qty']} units ({'In Stock' if p['in_stock'] else 'Out of Stock'})\n"
            )
        context_text = "\n".join(context_blocks) if context_blocks else "No exact products matched."

        system_instruction = (
            "You are 'Luxe Assistant', a friendly, polite, empathetic human salesperson for LuxeStore in Bangladesh.\n"
            "STORE CATALOG CONTEXT:\n"
            f"{context_text}\n\n"
            "CRITICAL HUMAN PERSONALITY INSTRUCTIONS:\n"
            "1. Speak like a real caring human shop advisor chatting with a customer in a boutique. NEVER sound like a robot or template.\n"
            "2. If BANGLISH: Speak sweet, warm, natural Banglish (e.g. 'Haa bhai, amader kache darun kichu collection ache! Niche ami apnar pochondo moto koyekta option dekhiye dilam...').\n"
            "3. If BENGALI: Speak polite, natural Bengali.\n"
            "4. If ENGLISH: Speak elegant, friendly English.\n"
            "5. Mention 1 or 2 highlighted items naturally and ask what their budget or style preference is.\n"
            "6. DO NOT use robotic phrases like 'As per your request' or 'MSRP discount'."
        )
        return self._invoke_gemini_api(system_instruction, user_message, history)

    def _generate_vendor_reply(self, user_message: str, vendor_doc: dict, vendor_products: list, lang: str):
        """Fallback natural response for vendor / brand inquiries."""
        if not vendor_doc:
            if lang == "banglish":
                return "Amader LuxeStore-e besh koyekta trusted vendor o verified brands ache bhai, jara 100% authentic products sell kore। Apni kon brand ba shop somporke jante chan bolun? 😊"
            elif lang == "bengali":
                return "আমাদের LuxeStore-এ বেশ কয়েকটি ভেরিফায়েড ভেন্ডর ও ব্র্যান্ড রয়েছে যারা ১০০% আসল পণ্য বিক্রি করে। আপনি কোন ভেন্ডর সম্পর্কে জানতে চান বলুন? 😊"
            else:
                return "LuxeStore features top verified vendors guaranteeing 100% genuine products. Which seller or brand would you like to know about? 😊"

        name = vendor_doc.get("name", "")
        desc = vendor_doc.get("description", "verified seller")
        mobile = vendor_doc.get("mobile", "")
        contact_txt = f"Official mobile {mobile}." if mobile else ""

        if lang == "banglish":
            return (
                f"Arey bhai, **{name}** amader LuxeStore-er ekti verified o trusted vendor shop! {contact_txt} "
                f"Tara mulloto {desc} niye kaj kore ebong tader product gulo khub-i popular o authentic।\n\n"
                f"Niche ami tader featured kichu product dekhiye dilam, apni pochondo moto dekhe nite paren। "
                f"Kono nirdishto item khujchen ki bhai? Bolun, ami help korchi! 😊"
            )
        elif lang == "bengali":
            return (
                f"জী ভাই! **{name}** আমাদের LuxeStore-এর অত্যন্ত বিশ্বস্ত ও ভেরিফায়েড একটি ভেন্ডর শপ। {contact_txt} "
                f"তাঁরা মূলত {desc} নিয়ে কাজ করেন এবং ১০০% আসল পণ্য সরবরাহ করেন।\n\n"
                f"নিচে আমি তাঁদের সেরা কিছু পণ্য সাজিয়ে দিয়েছি, আপনি পছন্দমতো দেখে নিতে পারেন। কোনো নির্দিষ্ট পণ্য খুঁজছেন কি? বলুন, আমি সাহায্য করছি! 😊"
            )
        else:
            return (
                f"**{name}** is one of our premier verified vendors on LuxeStore! {contact_txt} "
                f"They specialize in {desc} and guarantee 100% authenticity with warranty.\n\n"
                f"I've attached their featured items below for you to browse. Let me know if you are looking for anything specific! 😊"
            )

    def _generate_policy_reply(self, user_message: str, matched_policies: list, lang: str):
        """Natural human-like response for store policies."""
        target_policy = matched_policies[0] if matched_policies else STORE_POLICIES_AND_INFO[0]
        pkey = target_policy.get("policy_key", "")

        if pkey == "vendor_commission":
            if lang == "banglish":
                return (
                    "Arey bhai, LuxeStore-e vendor hishabe join kora ekdom shohoj! Ar shobcheye boro kotha holo, amader platform commission matro **0.1%**—"
                    "mane apnar bikrir 99.9%-i apnar kache thakbe, jeta shara deshe shobcheye lowest!\n\n"
                    "Apni shudhu amader seller registration page (/vendor/register) theke Trade License ba NID diye apply korlei 24 ghontar moddhe shop live hoye jabe। "
                    "Ar bikrir taka 24-48 ghontar moddhe direct Bank ba bKash-e payout peye jaben। Apnar ki kono dokan ba product ache bhai? Bolun, ami guide korchi! 😊"
                )
            elif lang == "bengali":
                return (
                    "জী ভাই! LuxeStore-এ ভেন্ডর হিসেবে জয়েন করা অত্যন্ত সহজ। আর সবচেয়ে দারুণ বিষয় হলো, আমাদের প্ল্যাটফর্ম কমিশন মাত্র **০.১%**—"
                    "অর্থাৎ আপনার বিক্রির ৯৯.৯% অর্থই আপনার কাছে থাকবে, যা দেশে সবচেয়ে সর্বনিম্ন!\n\n"
                    "আমাদের ওয়েবসাইট থেকে সেলার রেজিস্ট্রেশন করে ট্রেড লাইসেন্স বা এনআইডি জমা দিলেই ২৪ ঘণ্টার মধ্যে শপ অ্যাপ্রুভ হয়ে যাবে। "
                    "আর বিক্রির টাকা ২৪-৪৮ ঘণ্টার মধ্যে সরাসরি ব্যাংক বা বিকাশে পে-আউট পেয়ে যাবেন। আপনার কি কোনো ব্যবসা বা শপ রয়েছে ভাই? বলুন, আমি সাহায্য করছি! 😊"
                )
            else:
                return (
                    "Joining LuxeStore as a vendor is super easy! Best of all, our platform commission is only **0.1%**—"
                    "meaning you keep 99.9% of your sales revenue, which is the lowest in the market!\n\n"
                    "Simply apply through our Vendor Portal (/vendor/register) with your NID or Trade License for approval within 24 hours. "
                    "Payouts are processed directly to your Bank or bKash within 24-48 hours. Do you have a store or products you'd like to sell? Let me know! 😊"
                )

        if pkey == "shipping":
            if lang == "banglish":
                return (
                    "Amader delivery charge khub-i kom bhai! Dhaka city-r bhitore hole matro **৳60** (24 theke 48 ghontar moddhe pouche jay), "
                    "ar Dhaka-r baire shara Bangladesh-er jekono jelay delivery charge matro **৳120** (2 theke 4 diner moddhe doorstep delivery hoy)। "
                    "Sathe live SMS tracking-o thakbe। Apni ki Dhaka-te thaken naki baire bhai? 😊"
                )
            elif lang == "bengali":
                return (
                    "আমাদের ডেলিভারি চার্জ অত্যন্ত সাশ্রয়ী ভাই! ঢাকা সিটির ভেতরে ডেলিভারি চার্জ মাত্র **৬০ টাকা** (২৪-৪৮ ঘণ্টার মধ্যে পেয়ে যাবেন), "
                    "আর ঢাকার বাইরে সারা বাংলাদেশে মাত্র **১২০ টাকা** (২-৪ কার্যদিবসের মধ্যে হোম ডেলিভারি)। "
                    "আপনি কি ঢাকার ভেতরে আছেন নাকি বাইরে ভাই? 😊"
                )
            else:
                return (
                    "Our delivery fees are very affordable! Inside Dhaka it is only **৳60** (delivered in 24-48 hours), "
                    "and anywhere outside Dhaka across Bangladesh it is **৳120** (delivered in 2-4 business days). "
                    "Are you located inside Dhaka or outside? 😊"
                )

        if pkey == "return_refund":
            if lang == "banglish":
                return (
                    "Kono chinta korben na bhai! Amader ekhane **7 diner hassle-free return o exchange policy** ache। "
                    "Delivery pawar por jodi dekhen kono defect, damage ba size-e milche na, tahole 7 diner moddhe janalei amra free pickup kore "
                    "notun product pathiye dei ba 3-5 diner moddhe bKash/Bank-e full taka refund kore dei। Apnar ki kono order niye somossya hoyeche bhai? Bolun, ami solve kore dicchi! 😊"
                )
            elif lang == "bengali":
                return (
                    "কোনো চিন্তা করবেন না ভাই! আমাদের স্টোরে **৭ দিনের সহজ রিটার্ন ও এক্সচেঞ্জ পলিসি** রয়েছে। "
                    "পণ্য পাওয়ার পর কোনো সমস্যা বা সাইজে অমিল থাকলে ৭ দিনের মধ্যে জানালেই আমরা ফ্রিতে রিটার্ন/এক্সচেঞ্জ করে দেই "
                    "অথবা ৩-৫ কার্যদিবসের মধ্যে সম্পূর্ণ টাকা রিফান্ড করে দেই। আপনার কি কোনো অর্ডার নিয়ে সমস্যা হয়েছে? বলুন, আমি সমাধান করে দিচ্ছি! 😊"
                )
            else:
                return (
                    "No worries at all! We offer a **7-day hassle-free return and replacement policy**. "
                    "If you receive a defective or mismatched product, notify us within 7 days and we'll arrange a free exchange or a full refund within 3-5 business days. "
                    "Are you having an issue with a recent order? Let me know! 😊"
                )

        if pkey == "warranty_authenticity":
            if lang == "banglish":
                return (
                    "Amader store-er shob product 100% authentic o original bhai! Nokol ba replica amra kokhono sell kori na। "
                    "Ar audio, gadgets o smart watch-e apni **1 theke 2 bochorer official brand warranty** paben। "
                    "Kono somossya hole amader support theke shorashori warranty claim korte parben। Kono product er warranty somporke jante chan? 😊"
                )
            elif lang == "bengali":
                return (
                    "আমাদের স্টোরের প্রতিটি পণ্য ১০০% খাঁটি ও আসল ভাই! কোনো নকল বা কপি পণ্য আমরা বিক্রি করি না। "
                    "আর ইলেকট্রনিক্স ও স্মার্ট গ্যাজেটে **১ থেকে ২ বছরের অফিসিয়াল ব্র্যান্ড ওয়ারেন্টি** পাবেন। "
                    "কোনো নির্দিষ্ট পণ্যের ওয়ারেন্টি সম্পর্কে জানতে চান কি? 😊"
                )
            else:
                return (
                    "All products on LuxeStore are 100% authentic and genuine! Counterfeits are strictly prohibited. "
                    "Electronics and smart gadgets come with **1 to 2 Years official brand warranty**. "
                    "Which product's warranty would you like to inquire about? 😊"
                )

        if pkey == "payment":
            if lang == "banglish":
                return (
                    "Amader ekhane Cash on Delivery (COD) available ache bhai, mane parcel hate peye taka dite parben। "
                    "Ebong bKash, Nagad ba jekono Debit/Credit card diyeo 100% securely payment korte parben। "
                    "Checkout-e apnar jeta subidha sheta select kore nite paren। Apni ki kono order korte chaccilen? 😊"
                )
            elif lang == "bengali":
                return (
                    "আমাদের এখানে ক্যাশ অন ডেলিভারি (COD) সুবিধা রয়েছে ভাই, অর্থাৎ পার্সেল হাতে পেয়ে মূল্য পরিশোধ করতে পারবেন। "
                    "এছাড়া বিকাশ, নগদ বা যেকোনো কার্ডের মাধ্যমেও নিরাপদে পেমেন্ট করতে পারবেন। আপনি কি কোনো অর্ডার করতে চাচ্ছেন? 😊"
                )
            else:
                return (
                    "We offer Cash on Delivery (COD) nationwide, as well as bKash, Nagad, and secure Card payments at checkout. "
                    "Are you looking to place an order? 😊"
                )

        # Default fallback
        if lang == "banglish":
            return (
                "Haa bhai! Amader store policy ekdom transparent o customer-friendly। "
                "Delivery, payment, 7-diner return ba warranty—jekono bisheye apnar proshno thakle shachonde bolun, ami bujhiye dicchi! 😊"
            )
        elif lang == "bengali":
            return (
                "জী ভাই! আমাদের নীতিমালা সম্পূর্ণ গ্রাহকবান্ধব। ডেলিভারি, রিটার্ন বা ওয়ারেন্টি নিয়ে যেকোনো প্রশ্ন থাকলে নির্দ্বিধায় বলুন, আমি সাহায্য করছি! 😊"
            )
        else:
            return (
                "Our store policies are completely customer-friendly! Feel free to ask about delivery, payments, returns, or warranty anytime. 😊"
            )

    def _generate_hot_products_reply(self, matched_products: list, lang: str):
        """Generate recommendation text for hot / trending products."""
        p_names = ", ".join([f"**{p['title']}**" for p in matched_products[:3]])
        if lang == "banglish":
            return (
                f"Haa bhai! Amader store er shobcheye hot o trending product gular moddhe ache {p_names}। "
                f"Egula currently top-rated ebong customer der moddhe beshi popular।\n\n"
                f"Niche ami card gulo diye dilam, apni details o offer price dekhe nite paren! 🔥"
            )
        elif lang == "bengali":
            return (
                f"জী ভাই! আমাদের স্টোরের সবচেয়ে হট ও জনপ্রিয় প্রোডাক্টগুলোর মধ্যে রয়েছে {p_names}। "
                f"এগুলো বর্তমানে সবচেয়ে বেশি ট্রেন্ডিং এবং গ্রাহকপ্রিয়।\n\n"
                f"নিচে আমি প্রোডাক্ট কার্ডগুলো যুক্ত করে দিয়েছি, আপনি অফার মূল্য ও বিবরণ দেখে নিতে পারেন! 🔥"
            )
        else:
            return (
                f"Here are our most popular and trending items right now: {p_names}.\n\n"
                f"I've attached their product cards below so you can check out current prices and reviews! 🔥"
            )

    def _generate_conversational_reply(self, user_message: str, intent: str, lang: str):
        """Generate human-like replies for small talk and store inquiries without pushing products."""
        if intent == "store_details":
            if lang == "banglish":
                return (
                    "Haa oboshoy bhai! LuxeStore hocche Bangladesh-er ekti premium online multi-vendor marketplace, "
                    "jekhane top verified sellers o brands der 100% authentic product pawa jay। "
                    "Ekhane smart tech, audio gadgets, premium footwear, fashion apparel o luxury watches er darun collection ache।\n\n"
                    "Amader Dhaka city-te 24-48 ghontay ৳60 ebong shara deshe 2-4 dine ৳120 home delivery kora hoy। "
                    "Sathe Cash on Delivery (COD) ebong 7-diner easy return policy-o paben! "
                    "Apni ki nirdishto kono category ba product khujchen bhai? Bolun, ami guide korchi! 😊"
                )
            elif lang == "bengali":
                return (
                    "জী অবশ্যই ভাই! LuxeStore হলো বাংলাদেশের একটি প্রিমিয়াম অনলাইন মাল্টি-ভেন্ডর মার্কেটপ্লেস, "
                    "যেখানে বিশ্বস্ত বিক্রেতাদের ১০০% আসল পণ্য পাওয়া যায়। এখানে স্মার্ট টেক, অডিও গ্যাজেটস, প্রিমিয়াম জুতো, "
                    "ফ্যাশন ও ঘড়ির দারুণ সব কালেকশন রয়েছে।\n\n"
                    "ঢাকায় মাত্র ২৪-৪৮ ঘণ্টায় ৬০ টাকা এবং সারাদেশে ২-৪ দিনে ১২০ টাকায় হোম ডেলিভারি দেওয়া হয়। "
                    "সাথে ক্যাশ অন ডেলিভারি ও ৭ দিনের সহজ রিটার্ন সুবিধা তো থাকছেই! আপনি কি কোনো নির্দিষ্ট পণ্য খুঁজছেন ভাই? বলুন, আমি সাহায্য করছি! 😊"
                )
            else:
                return (
                    "Certainly! LuxeStore is a premier multi-vendor e-commerce marketplace featuring 100% authentic products "
                    "from verified sellers and global brands. We offer curated tech gadgets, premium audio, footwear, luxury fashion, and timepieces.\n\n"
                    "We provide fast home delivery (24-48h in Dhaka, 2-4 days nationwide), Cash on Delivery, and a 7-day easy return guarantee. "
                    "Are you looking for something specific today? Let me know how I can help! 😊"
                )

        if intent == "feedback_meta":
            if lang == "banglish":
                return (
                    "Ami khub e dukkhito bhai! Amar vul hoye geche। Apni thik-i bolechen, apni jekhane product "
                    "somporke bolen-i, sekhane product suggest kora ekdom thik hoyni। Ekhon theke apni product na chaile "
                    "ami kono product card ba suggestion dibo na—shudhu ekjon manush er motoi apnar shathe kotha bolbo। "
                    "Bolun bhai, kemon achen apni? 😊"
                )
            elif lang == "bengali":
                return (
                    "আমি আন্তরিকভাবে দুঃখিত ভাই! আপনি একদম সঠিক বলেছেন। আপনি কোনো পণ্য সম্পর্কে না জানালে "
                    "অযথা প্রোডাক্ট কার্ড দেওয়া ঠিক হয়নি। এখন থেকে আপনি না চাইলে কোনো প্রোডাক্ট সাজেশন দেওয়া হবে না—"
                    "একজন মানুষের মতোই আপনার সাথে আন্তরিকভাবে কথা বলব। বলুন ভাই, কেমন আছেন আপনি? 😊"
                )
            else:
                return (
                    "I sincerely apologize! You are absolutely right. I shouldn't push product cards "
                    "when you haven't asked for them. From now on, I will converse with you naturally like a real human "
                    "without pushing shopping recommendations. How are you doing today? 😊"
                )

        if intent == "greeting":
            if lang == "banglish":
                return (
                    "Hello bhai! Alhamdulillah ami valo achi, apni kemon achen? "
                    "Bolun ajke apnar din kemon jache? Kono sahajjo lagle ba kichu jante chaile shachonde bolte paren 😊"
                )
            elif lang == "bengali":
                return (
                    "আসসালামু আলাইকুম / নমস্কার ভাই! আলহামদুলিল্লাহ আমি ভালো আছি, আপনি কেমন আছেন? "
                    "আজ আপনাকে কীভাবে সাহায্য করতে পারি বলুন? কোনো প্রশ্ন থাকলে নির্দ্বিধায় বলতে পারেন 😊"
                )
            else:
                return (
                    "Hello there! I'm doing great, thank you! How are you doing today? "
                    "Feel free to ask me anything or let me know how I can help you 😊"
                )

        if intent == "identity":
            if lang == "banglish":
                return (
                    "Ami LuxeStore er AI Shopping Assistant! Apnake shundor vabe guide kora, "
                    "store policy, vendors o products er jekono proshner uttor deyari amar kaj। "
                    "Apni chaile amar shathe shachonde kotha bolte paren! Kono proshno ache ki? 😊"
                )
            elif lang == "bengali":
                return (
                    "আমি LuxeStore-এর স্মার্ট শপিং অ্যাসিস্ট্যান্ট! একজন আন্তরিক বন্ধুর মতো আপনাকে প্রয়োজনীয় তথ্য "
                    "দিয়ে সহায়তা করাই আমার কাজ। আপনার কি কোনো বিষয়ে কিছু জানার আছে? 😊"
                )
            else:
                return (
                    "I am Luxe Assistant, your shopping and customer companion at LuxeStore. "
                    "I'm here to answer questions, guide you through store policies, vendors, or products whenever you need! 😊"
                )

        if intent == "empathy_mood":
            if lang == "banglish":
                return "Keno bhai, mon kharap keno? Shob thik hoye jabe inshaAllah! Kono kichu share korte chan? Ami shunchi ❤️"
            elif lang == "bengali":
                return "মন খারাপ কেন ভাই? ইনশাআল্লাহ সব ঠিক হয়ে যাবে! কোনো কিছু নিয়ে কথা বলতে চাইলে বলুন, আমি শুনছি ❤️"
            else:
                return "I'm sorry to hear that. Hope everything gets better soon! If you'd like to chat, I'm right here for you ❤️"

        if intent == "smalltalk_affirmation":
            if lang == "banglish":
                return "Ji bhai, bujhte perechi! Bolun ar ki khobor apnar? Kono kotha ba proshno thakle bolte paren 😊"
            elif lang == "bengali":
                return "জী ভাই, বুঝতে পেরেছি! আর কী খবর আপনার? কোনো বিষয়ে কথা বলতে চাইলে বলুন 😊"
            else:
                return "Understood! How is everything else going with you today? Feel free to ask anything 😊"

        if intent == "faq_delivery":
            if lang == "banglish":
                return (
                    "Amader delivery process khub e fast! Dhaka r moddhe 24-48 ghontar moddhe ebong Dhaka r baire shara Bangladesh e "
                    "2 theke 4 diner moddhe delivery kora hoy। Delivery charge matro ৳60 (Dhaka) ebong ৳120 (Dhaka r baire)। 🚚"
                )
            elif lang == "bengali":
                return (
                    "আমাদের ডেলিভারি সেবা অত্যন্ত দ্রুত ও নিরাপদ! ঢাকার ভেতরে ২৪-৪৮ ঘণ্টার মধ্যে এবং ঢাকার বাইরে সারা বাংলাদেশে "
                    "২-৪ কার্যদিবসের মধ্যে সরাসরি হোম ডেলিভারি দেওয়া হয়। ডেলিভারি চার্জ ঢাকার ভেতরে ৬০ টাকা এবং ঢাকার বাইরে ১২০ টাকা। 🚚"
                )
            else:
                return (
                    "We offer fast and reliable home delivery! Inside Dhaka it takes 24-48 hours, and across Bangladesh it takes 2-4 business days. "
                    "Delivery charges are ৳60 in Dhaka and ৳120 outside Dhaka. 🚚"
                )

        if intent == "faq_payment":
            if lang == "banglish":
                return (
                    "Amader ekhane Cash on Delivery (COD), bKash, Nagad, ebong Visa/Mastercard debit o credit card diye 100% secure payment korte parben। 💳"
                )
            elif lang == "bengali":
                return (
                    "আমাদের স্টোরে ক্যাশ অন ডেলিভারি (Cash on Delivery), বিকাশ, নগদ এবং যেকোনো ডেবিট/ক্রেডিট কার্ডের মাধ্যমে সম্পূর্ণ নিরাপদে পেমেন্ট করতে পারবেন। 💳"
                )
            else:
                return "We accept Cash on Delivery (COD), Mobile Banking (bKash, Nagad), and all major Debit/Credit Cards securely at checkout. 💳"

        if intent == "faq_return":
            if lang == "banglish":
                return (
                    "Amader 7-diner easy return and refund policy ache। Delivery pawar por product e kono somossya ba defect thakle "
                    "7 diner moddhe amader janale amra free return, exchange ba full refund kore di। 🔄"
                )
            elif lang == "bengali":
                return (
                    "আমাদের ৭ দিনের সহজ রিটার্ন ও রিফান্ড পলিসি রয়েছে। ডেলিভারি পাওয়ার পর পণ্যে কোনো সমস্যা থাকলে ৭ দিনের মধ্যে জানালে "
                    "সম্পূর্ণ ফ্রিতে রিটার্ন বা ফুল রিফান্ড পেতে পারেন। 🔄"
                )
            else:
                return "We have a 7-day hassle-free return policy! If you receive a defective item, you can request an easy exchange or full refund within 7 days. 🔄"

        if intent == "faq_location":
            if lang == "banglish":
                return "LuxeStore hocche ekti modern online multi-vendor marketplace! Direct website theke order korlei amra doorstep delivery kore dei। 🏢"
            elif lang == "bengali":
                return "LuxeStore একটি আধুনিক অনলাইন মাল্টি-ভেন্ডর মার্কেটপ্লেস! ওয়েবসাইট থেকে এক ক্লিকে অর্ডার করলেই পণ্য সরাসরি আপনার ঠিকানায় পৌঁছে দেওয়া হয়। 🏢"
            else:
                return "LuxeStore is a premier online marketplace! Simply place your order online and we deliver directly to your doorstep. 🏢"

        if intent == "gratitude_farewell":
            if lang == "banglish":
                return "Most welcome bhai! Apnake help korte pere valo laglo। Kono dorkar hole amake abar dakben। Have a wonderful day! ❤️"
            elif lang == "bengali":
                return "আপনাকে অনেক ধন্যবাদ! যেকোনো প্রয়োজনে আমাকে যেকোনো সময় ডাকবেন। ভালো থাকবেন! ❤️"
            else:
                return "You are very welcome! Feel free to reach out anytime if you need further help. Have a wonderful day! ❤️"

        # General conversation (Default human fallback - NO products)
        if lang == "banglish":
            return "Ji bhai, ami shunchi! Bolun apnake kivabe sahajjo korte pari? Kono proshno ba kotha thakle shachonde bolun 😊"
        elif lang == "bengali":
            return "জী ভাই, আমি শুনছি! বলুন আপনাকে কীভাবে সাহায্য করতে পারি? যেকোনো প্রশ্ন বা বিষয়ে নির্দ্বিধায় বলতে পারেন 😊"
        else:
            return "I'm listening! How can I assist you today? Feel free to ask me anything or let me know what's on your mind 😊"

    def _generate_product_reply(self, user_message: str, matched_products: list, lang: str):
        """Generate tailored sales recommendation when customer is asking about products."""
        has_prods = len(matched_products) > 0

        if not has_prods:
            if lang == "banglish":
                return (
                    "Bhai, apnar proshno ta bujhte perechi, tobe ei muhurte amader store e thik ei dhoroner product ta stock e nei। "
                    "Apni chaile amader onno categories (smartwatch, headphone, shoes, electronics) browse korte paren! 😊"
                )
            elif lang == "bengali":
                return (
                    "ভাই, আপনার অনুরোধটি বুঝতে পেরেছি। তবে এই মুহূর্তে আমাদের স্টোরে এই ধরনের সুনির্দিষ্ট পণ্যটি স্টকে নেই। "
                    "আপনি চাইলে আমাদের অন্যান্য জনপ্রিয় ক্যাটাগরিগুলো (যেমন: স্মার্টওয়াচ, হেডফোন, ফ্যাশন আইটেম) ঘুরে দেখতে পারেন! 😊"
                )
            else:
                return (
                    "I understand what you're looking for! However, we currently don't have that specific item in stock. "
                    "Feel free to explore our trending collections or ask me for recommendations in another category! 😊"
                )

        top_prod = matched_products[0]
        p_name = top_prod['title']
        p_price = f"${top_prod['price']:.2f}"
        old_p = f"${top_prod['old_price']:.2f}" if top_prod.get('old_price') and top_prod['old_price'] > top_prod['price'] else ""
        disc_text = f" (MSRP {old_p} theke discount e!)" if old_p else ""

        if lang == "banglish":
            return (
                f"Haa bhai! Apnar jonno amader store-er besh bhalo ekta option holo **{p_name}**। "
                f"Er offer price matro **{p_price}** ebong eta 100% verified stock-e ache।\n\n"
                f"Niche ami card diye dilam, apni details o picture dekhe nite paren। "
                f"Apnar ki nirdishto kono color ba budget pochondo? Bolle ami aro bhalo suggest korte parbo! 😊"
            )
        elif lang == "bengali":
            return (
                f"জী ভাই! আপনার পছন্দের সাথে মিল রেখে দারুণ একটি অপশন হলো **{p_name}**। "
                f"এর বর্তমান অফার মূল্য মাত্র **{p_price}** এবং এটি শতভাগ আসল পণ্যের গ্যারান্টিসহ রেডি স্টকে আছে।\n\n"
                f"নিচে আমি প্রোডাক্ট কার্ড যুক্ত করে দিয়েছি, আপনি বিস্তারিত দেখে নিতে পারেন। "
                f"কোনো নির্দিষ্ট বাজেট বা ফিচার খুঁজছেন কি ভাই? বলুন, আমি সাহায্য করছি! 😊"
            )
        else:
            return (
                f"Hello! A great option for you from our collection is the **{p_name}**. "
                f"It is currently available for **{p_price}** with verified brand warranty.\n\n"
                f"I've attached the product card below for you to check out. "
                f"Do you have a specific budget or brand preference in mind? Let me know so I can help! 😊"
            )

    def _format_product_cards(self, products: list):
        """Format matched product items into clean, clickable UI cards for React frontend."""
        formatted = []
        for p in products:
            formatted.append({
                "id": p.get("id"),
                "pid": p.get("pid"),
                "slug": p.get("slug"),
                "title": p.get("title"),
                "category": p.get("category"),
                "vendor": p.get("vendor", "LuxeStore Official"),
                "price": f"{p.get('price', 0):.2f}",
                "old_price": f"{p.get('old_price', 0):.2f}" if p.get('old_price') else "",
                "image": p.get("image") or "",
                "in_stock": p.get("in_stock", True)
            })
        return formatted


# Singleton Service
ai_service = AIAssistantService()
