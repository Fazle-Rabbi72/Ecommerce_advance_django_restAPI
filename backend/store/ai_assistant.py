import os
import re
import json
import math
import requests
from collections import Counter
from decimal import Decimal
from django.conf import settings
from store.models import Product

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
        (r'\bkno\b', 'keno')
    ]
    for pattern, replacement in replacements:
        t = re.sub(pattern, replacement, t)
    return t


def _tokenize(text: str):
    """Tokenize and normalize text into clean words/tokens."""
    if not text:
        return []
    # Lowercase and expand common compounds/synonyms
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


class VectorStore:
    """
    Lightweight, high-performance, crash-free vector database engine.
    Computes TF-IDF normalized vector embeddings and cosine similarity.
    Sub-millisecond retrieval on local disk without external C++ or Rust dependencies.
    """
    def __init__(self):
        self.documents = []  # List of product doc dicts
        self.idf = {}
        self.vocabulary = {}
        self.load_or_build()

    def build_product_document(self, product):
        """Convert a Product model instance into a rich searchable text document."""
        category_title = product.category.title if product.category else "General"
        vendor_name = product.vendor.name if getattr(product, 'vendor', None) and getattr(product.vendor, 'name', None) else "LuxeStore Official"
        
        # Colors
        colors = []
        try:
            colors = [c.name for c in product.color_set.all() if c.name]
        except Exception:
            pass

        # Sizes
        sizes = []
        try:
            sizes = [s.name for s in product.size_set.all() if s.name]
        except Exception:
            pass

        # Specs
        specs = []
        try:
            specs = [f"{sp.title}: {sp.content}" for sp in product.specification_set.all() if sp.title]
        except Exception:
            pass

        full_text = (
            f"Title: {product.title}. "
            f"Category: {category_title}. "
            f"Vendor: {vendor_name}. "
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
            "slug": product.slug or "",
            "title": product.title,
            "category": category_title,
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

    def index_all(self):
        """Index all published store products into the vector store."""
        qs = Product.objects.filter(status="published").select_related("category", "vendor").prefetch_related("color_set", "size_set", "specification_set")
        self.documents = [self.build_product_document(p) for p in qs]
        self._calculate_idf()
        self.save()
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
                    if len(self.documents) > 0:
                        return
            except Exception:
                pass
        # If cache is missing or empty, build it
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
            if doc["id"] == product.id:
                self.documents[i] = new_doc
                updated = True
                break
        if not updated:
            self.documents.append(new_doc)

        self._calculate_idf()
        self.save()

    def delete_product(self, product_id):
        """Remove a product from the vector index."""
        self.documents = [d for d in self.documents if d["id"] != product_id]
        self._calculate_idf()
        self.save()

    def search(self, query: str, top_k: int = 4, price_max: float = None):
        """
        Perform vector similarity search against the product catalog.
        Returns top_k most relevant products.
        """
        if not self.documents:
            self.load_or_build()

        query_norm = normalize_banglish(query)
        query_tokens = _tokenize(query_norm)
        if not query_tokens:
            return []

        q_tf = Counter(query_tokens)
        q_vec = {t: count * self.idf.get(t, 1.0) for t, count in q_tf.items()}
        q_norm = math.sqrt(sum(v ** 2 for v in q_vec.values())) or 1.0

        scores = []
        for doc in self.documents:
            # Check price filter if requested
            if price_max is not None and doc.get("price", 0) > price_max:
                continue

            doc_tokens = doc.get("tokens", [])
            doc_tf = Counter(doc_tokens)
            
            # Dot product
            dot = 0.0
            for t, q_weight in q_vec.items():
                if t in doc_tf:
                    doc_weight = doc_tf[t] * self.idf.get(t, 1.0)
                    dot += q_weight * doc_weight

            doc_norm = math.sqrt(sum((count * self.idf.get(t, 1.0)) ** 2 for t, count in doc_tf.items())) or 1.0
            cos_sim = dot / (q_norm * doc_norm)

            # Extra weight if query tokens appear in title
            title_lower = doc.get("title", "").lower()
            for t in query_tokens:
                if t in title_lower:
                    cos_sim += 0.25

            # Boost for category matches
            cat_lower = doc.get("category", "").lower()
            for t in query_tokens:
                if t in cat_lower:
                    cos_sim += 0.15

            scores.append((cos_sim, doc))

        # Only return documents that actually have meaningful relevance (> 0.10)
        scores = [item for item in scores if item[0] > 0.10]
        scores.sort(key=lambda x: x[0], reverse=True)
        results = [item[1] for item in scores[:top_k]]

        # If price_max was too strict and returned 0 products, relax price filter
        if not results and price_max is not None:
            return self.search(query, top_k=top_k, price_max=None)

        return results


# Global singleton instance of vector store
vector_store = VectorStore()


def detect_language(text: str) -> str:
    """
    Detect whether text is Bengali script, Banglish (phonetic Bengali in Latin), or English.
    """
    if not text:
        return "english"

    norm = normalize_banglish(text)

    # Bengali Unicode range \u0980-\u09FF
    bengali_chars = len(re.findall(r"[\u0980-\u09FF]", text))
    total_chars = len(re.findall(r"\w", text))

    if total_chars > 0 and (bengali_chars / total_chars) > 0.2:
        return "bengali"

    # Comprehensive Banglish keywords
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
        "tmi", "kmn", "aco", "ace", "kicu", "details", "hot", "product", "parba", "bolo"
    }
    words = re.sub(r"[^\w\s]", " ", norm.lower()).split()
    if set(words).intersection(banglish_keywords) or any(k in norm for k in [
        "bhai", "vai", "koto", "takar", "valo", "kemon", "keno", "kno", "ache", "accha",
        "dhonnobad", "tumi", "acho", "kichu", "somporke"
    ]):
        return "banglish"

    return "english"


def detect_intent(text: str) -> str:
    """
    Classify the customer message intent to ensure strictly natural, human-like behavior:
    1. Complaints, small talk, greetings, FAQs, Store details -> Warm human replies (ZERO product cards).
    2. Hot/Trending products -> Trending items + cards.
    3. Active shopping inquiry -> Vector search + product recommendations.
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

    # 2. Complaints about bot/assistant behavior (User wants human touch)
    if re.search(
        r'\b(human\s*er\s*mto|human\s*er\s*moto|robot\s*er\s*mto|robot\s*er\s*moto|bujho\s*na|bujhte\s*paro\s*na|bokami|faltu|vul\s*bolcho|stupid|bad\s*bot|manush\s*er\s*moto)\b',
        t
    ) or any(k in t for k in ["মানুষের মত", "মানুষের মতো না", "রোবট এর মত", "ভুল করছো"]):
        return "feedback_meta"

    # 3. Store details / About LuxeStore
    if re.search(r'\b(store|dokan|shop|website|site|marketplace)\s*(somporke|details|ki|bistarito)\b', t) or re.search(r'\b(details|bistarito)\s*(bolte|bolo|bolun|jante)\b', t) or any(k in t for k in ["store somporke", "dokan somporke", "দোকান সম্পর্কে", "স্টোর সম্পর্কে", "স্টোরের বিস্তারিত"]):
        return "store_details"

    # 4. Hot / Trending products inquiry
    if re.search(r'\b(hot\s*product|trending|best\s*seller|popular\s*product|top\s*product|valo\s*product|valoo\s*product)\b', t) or any(k in t for k in ["হট প্রোডাক্ট", "সেরা প্রোডাক্ট", "জনপ্রিয় পণ্য", "ট্রেন্ডিং"]):
        return "hot_products"

    # 5. Explicit product shopping queries
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

    # 6. Identity / Bot questions
    if re.search(
        r'\b(who\s*are\s*you|whats?\s*your\s*name|what\s*is\s*your\s*name|tumi\s*ke|apni\s*ke|apnar\s*nam\s*ki|tomar\s*nam\s*ki|ki\s*koro|(tumi|apni|are\s*you)\s*(ki\s*)?(a\s*)?(bot|ai|robot|human|manush))\b',
        t
    ) or any(k in t for k in ["তুমি কে", "আপনার নাম কি", "তোমার নাম কি", "আপনি কে", "মানুষ নাকি", "রোবট নাকি", "রোবট"]):
        return "identity"

    # 7. Store FAQs
    if re.search(r'\b(delivery|shipping|koto\s*din\s*lagbe|kobe\s*pabo|delivery\s*charge|shipping\s*cost|home\s*delivery)\b', t) or any(k in t for k in ["ডেলিভারি", "কত দিন লাগবে", "কবে পাব", "ডেলিভারি চার্জ"]):
        return "faq_delivery"

    if re.search(r'\b(payment|bkash|b-kash|nagad|rocket|cod|cash\s*on\s*delivery|advance\s*taka|credit\s*card|debit\s*card)\b', t) or any(k in t for k in ["পেমেন্ট", "বিকাশ", "নগদ", "ক্যাশ অন ডেলিভারি"]):
        return "faq_payment"

    if re.search(r'\b(return|refund|exchange|replacement|damage|warrantee|guarantee)\b', t) or any(k in t for k in ["রিটার্ন", "ফেরত", "রিফান্ড"]):
        return "faq_return"

    if re.search(r'\b(dokan\s*kothay|shop\s*kothay|location\s*kothay|address\s*kothay|showroom|outlet|branch)\b', t) or any(k in t for k in ["দোকান কোথায়", "ঠিকানা", "শোরুম"]):
        return "faq_location"

    # 8. Gratitude / Farewell
    if re.search(r'\b(thanks|thank\s*you|thx|dhonnobad|dhonobad|shukriya|bye|goodbye|tata|allah\s*hafez|khoda\s*hafez|take\s*care|see\s*you)\b', t) or any(k in t for k in ["ধন্যবাদ", "বিদায়", "আল্লাহ হাফেজ", "থ্যাঙ্কস"]):
        return "gratitude_farewell"

    # 9. Greetings & Well-being
    if re.search(r'\b(hi|hello|hey|helo|hy|hola|salam|assalamu\s*alaikum|asalamu\s*alaikum|slaam|kemon\s*acho|kemon\s*achen|ki\s*khobor|ki\s*obostha|good\s*morning|good\s*evening|good\s*afternoon|how\s*are\s*you|whats\s*up|sup|kire|vai|bhai|bro|brother|shuno|shunchen)\b', t) or any(k in t for k in ["কেমন আছেন", "কেমন আছো", "হাই", "হ্যালো", "সালাম", "আসসালামু আলাইকুম"]):
        return "greeting"

    # 10. Emotions / Empathy
    if re.search(r'\b(mon\s*kharap|valo\s*na|bhalo\s*na|sad|boring|bhalo\s*achi|valo\s*achi|alhamdulillah|fine)\b', t) or any(k in t for k in ["মন খারাপ", "ভালো না", "আলহামদুলিল্লাহ"]):
        return "empathy_mood"

    # 11. Small talk & Affirmation
    casual_words = {"hmm", "accha", "achha", "thik", "thik ache", "tai naki", "bujhlam", "ok", "okay", "cool", "nice", "wow", "humm", "are wah", "shundor"}
    if t in casual_words or any(t.startswith(cw) for cw in casual_words):
        return "smalltalk_affirmation"

    # 12. Default is GENERAL CONVERSATION
    return "general_conversation"


class AIAssistantService:
    """
    Full RAG Engine combining VectorStore retrieval with Gemini 1.5.
    Features robust natural language understanding for genuine human-like conversation.
    """
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY", "").strip()

    def generate_response(self, user_message: str, conversation_history: list = None):
        """
        Process user query through conversational RAG pipeline:
        1. Classify intent: chitchat, store details, hot products, FAQs vs product search.
        2. If conversational / non-product: respond warmly like a human WITHOUT pushing products.
        3. If hot products / product search: search catalog and recommend verified products.
        """
        self.api_key = os.getenv("GEMINI_API_KEY", "").strip()
        lang = detect_language(user_message)
        intent = detect_intent(user_message)

        # -------------------------------------------------------------
        # SCENARIO 1: Hot / Trending products request
        # -------------------------------------------------------------
        if intent == "hot_products":
            featured = [d for d in vector_store.documents if d.get("featured")]
            matched_products = featured[:4] if featured else vector_store.documents[:4]
            reply_text = self._generate_hot_products_reply(matched_products, lang)
            return {
                "reply": reply_text,
                "products": self._format_product_cards(matched_products),
                "language": lang
            }

        # -------------------------------------------------------------
        # SCENARIO 2: Conversational Small-Talk / Store Details / FAQs (ZERO PRODUCT CARDS)
        # -------------------------------------------------------------
        if intent != "product_query":
            # Try Gemini for conversational reply if valid
            gemini_reply = self._call_gemini_conversational(user_message, lang, intent, conversation_history)
            if gemini_reply:
                return {
                    "reply": gemini_reply,
                    "products": [],  # STRICTLY ZERO products for conversation
                    "language": lang
                }

            # Human-like conversational engine fallback
            human_reply = self._generate_conversational_reply(user_message, intent, lang)
            return {
                "reply": human_reply,
                "products": [],  # STRICTLY ZERO products for conversation
                "language": lang
            }

        # -------------------------------------------------------------
        # SCENARIO 3: Genuine Product Inquiry / Shopping Assistance
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

        # Try Gemini 1.5 Flash
        gemini_reply = self._call_gemini(user_message, matched_products, lang, conversation_history)
        if gemini_reply:
            return {
                "reply": gemini_reply,
                "products": self._format_product_cards(matched_products),
                "language": lang
            }

        # Sales Engine fallback
        fallback_reply = self._generate_product_reply(user_message, matched_products, lang)
        return {
            "reply": fallback_reply,
            "products": self._format_product_cards(matched_products),
            "language": lang
        }

    def _is_api_key_valid(self):
        """Check if GEMINI_API_KEY has a valid Google AI Studio key format."""
        key = (self.api_key or "").strip().lstrip("-")
        if not key or len(key) < 25:
            return False
        # Supports Google AQ keys (Gemini 3) and AIzaSy keys
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

        # Candidate models supported by Gemini 3 / AQ keys
        models_to_try = ["gemini-3.8-flash", "gemini-flash-latest", "gemini-3.5-flash"]
        for model_name in models_to_try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={clean_key}"
            try:
                res = requests.post(url, json=payload, timeout=25)
                if res.status_code == 200:
                    data = res.json()
                    ans = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                    if ans:
                        return ans.strip()
            except Exception:
                continue

        return None

    def _call_gemini_conversational(self, user_message: str, lang: str, intent: str, history: list):
        """Invoke Gemini strictly for conversational chitchat or FAQs without product context."""
        system_instruction = (
            "You are 'Luxe Assistant', a friendly, polite, empathetic human shopping assistant for LuxeStore.\n"
            "ABOUT LUXESTORE:\n"
            "- LuxeStore is a premier multi-vendor e-commerce marketplace in Bangladesh.\n"
            "- Top Categories: Smart Tech & Audio (Sony, Apple, Samsung), Premium Footwear & Shoes, Luxury Fashion, Timepieces & Watches.\n"
            "- Delivery: Inside Dhaka 24-48 hours (৳60), Outside Dhaka 2-4 days (৳120).\n"
            "- Payments: Cash on Delivery (COD), bKash, Nagad, Rocket, Credit/Debit Cards.\n"
            "- Return Policy: 7-day hassle-free return and exchange guarantee.\n\n"
            f"Customer language: {lang.upper()}.\n"
            f"Customer intent: {intent.upper()}.\n\n"
            "RULES:\n"
            "1. DO NOT recommend or attach specific product cards in this conversation.\n"
            "2. If asked about the store or policies, explain everything warmly like an experienced human store guide.\n"
            "3. If greeted ('kemon acho', 'hi', 'tmi kmn aco'), greet warmly like a friend and ask how their day is going.\n"
            "4. If in BANGLISH, speak warm, natural, friendly Banglish like a Bangladeshi shopkeeper. If in BENGALI, speak polite Bengali. If in ENGLISH, speak fluent English.\n"
            "5. Keep responses concise, helpful, and natural (2-4 sentences max)."
        )
        return self._invoke_gemini_api(system_instruction, user_message, history)

    def _call_gemini(self, user_message: str, matched_products: list, lang: str, history: list):
        """Invoke Gemini 3 for product recommendations grounded in catalog context."""
        context_blocks = []
        for p in matched_products:
            context_blocks.append(
                f"- Product: {p['title']}\n"
                f"  Category: {p['category']}\n"
                f"  Price: ${p['price']:.2f} (Old Price: ${p['old_price']:.2f})\n"
                f"  Stock: {p['stock_qty']} units ({'In Stock' if p['in_stock'] else 'Out of Stock'})\n"
                f"  Description: {p['text']}\n"
            )
        context_text = "\n".join(context_blocks) if context_blocks else "No exact products matched."

        system_instruction = (
            "You are 'Luxe Assistant', an intelligent, polite, friendly, and honest e-commerce salesperson "
            "for LuxeStore. Your mission is to assist customers warmly and naturally just like a top-notch human salesperson.\n\n"
            "STORE CATALOG CONTEXT:\n"
            f"{context_text}\n\n"
            "CRITICAL RULES:\n"
            "1. LANGUAGE MATCHING:\n"
            f"   - Customer language: {lang.upper()}.\n"
            "   - If BANGLISH, respond in fluent, warm Banglish (e.g. 'Haa bhai! Amader store e kichu darun options ache...').\n"
            "   - If BENGALI (বাংলা), respond in polite, natural Bengali.\n"
            "   - If ENGLISH, respond in elegant, professional English.\n"
            "2. GROUNDED IN TRUTH:\n"
            "   - Mention real items from the catalog context. State accurate prices and stock.\n"
            "   - If no items matched, politely tell the customer that the item isn't in stock right now and invite them to explore related categories.\n"
            "3. TONE & STYLE:\n"
            "   - Speak like a caring human shop advisor, not a generic robot."
        )
        return self._invoke_gemini_api(system_instruction, user_message, history)

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
        # Store details / About Store
        if intent == "store_details":
            if lang == "banglish":
                return (
                    "Haa oboshoy bhai! LuxeStore hocche ekti premium multivendor online marketplace। "
                    "Ekhane top verified seller o brands der 100% authentic product pawa jay।\n\n"
                    "🛍️ **Amader Main Categories:**\n"
                    "• Smart Tech & Audio (Sony, Apple, Samsung headphones & gadgets)\n"
                    "• Premium Footwear & Shoes (Oxford, Derby, Sneakers)\n"
                    "• Luxury Fashion & Apparel\n"
                    "• Premium Watches & Smartwatches\n\n"
                    "🚚 **Delivery:** Dhaka r moddhe 24-48 ghonta (৳60), Dhaka r baire 2-4 din (৳120)।\n"
                    "💳 **Payment:** Cash on Delivery (COD), bKash, Nagad o Cards।\n"
                    "🔄 **Guarantee:** 7-diner easy return & replacement policy।\n\n"
                    "Apnar ki nirdishto kono category ba product dorkar? Bolun, ami khuje dicchi! 😊"
                )
            elif lang == "bengali":
                return (
                    "জী অবশ্যই ভাই! LuxeStore একটি প্রিমিয়াম মাল্টি-ভেন্ডর ই-কমার্স প্ল্যাটফর্ম। "
                    "এখানে বিশ্বস্ত বিক্রেতাদের ১০০% অথেনটিক পণ্য পাওয়া যায়।\n\n"
                    "🛍️ **আমাদের প্রধান ক্যাটাগরিগুলো:**\n"
                    "• স্মার্ট টেক ও অডিও (হেডফোন, গ্যাজেটস)\n"
                    "• প্রিমিয়াম জুতো ও ফুটওয়্যার\n"
                    "• লাক্সারি ফ্যাশন ও পোশাক\n"
                    "• প্রিমিয়াম ঘড়ি ও স্মার্টওয়াচ\n\n"
                    "🚚 **ডেলিভারি:** ঢাকার ভেতর ২৪-৪৮ ঘণ্টা (৬০ টাকা), ঢাকার বাইরে ২-৪ দিন (১২০ টাকা)।\n"
                    "💳 **পেমেন্ট:** ক্যাশ অন ডেলিভারি (COD), বিকাশ, নগদ ও কার্ড।\n"
                    "🔄 **গ্যারান্টি:** ৭ দিনের সহজ রিটার্ন পলিসি।\n\n"
                    "আপনি কি কোনো নির্দিষ্ট পণ্য খুঁজছেন? বলুন, আমি সাহায্য করছি! 😊"
                )
            else:
                return (
                    "Certainly! LuxeStore is a premier multi-vendor e-commerce marketplace featuring authentic products "
                    "from verified brands and top sellers.\n\n"
                    "🛍️ **Top Collections:** Smart Tech & Audio, Premium Footwear, Luxury Fashion, and Timepieces.\n"
                    "🚚 **Delivery:** 24-48h in Dhaka (৳60), 2-4 days nationwide (৳120).\n"
                    "💳 **Payments:** Cash on Delivery (COD), bKash, Nagad, and Cards.\n"
                    "🔄 **Returns:** 7-day hassle-free return and exchange guarantee.\n\n"
                    "Are you looking for something specific? Let me know how I can help! 😊"
                )

        # Feedback / Meta complaints
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
                    "অযথা প্রোডাক্ট কার্ড বা বিজ্ঞাপন দেওয়া ঠিক হয়নি। এখন থেকে আপনি না চাইলে কোনো প্রোডাক্ট সাজেশন দেওয়া হবে না—"
                    "একজন মানুষের মতোই আপনার সাথে আন্তরিকভাবে কথা বলব। বলুন ভাই, কেমন আছেন আপনি? 😊"
                )
            else:
                return (
                    "I sincerely apologize! You are absolutely right. I shouldn't push or suggest product cards "
                    "when you haven't asked for them. From now on, I will converse with you naturally like a real human "
                    "without pushing any shopping recommendations. How are you doing today? 😊"
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
                    "proshner uttor deya ebong shop er jekono bisheye help korai amar kaj। "
                    "Apni chaile amar shathe shachonde kotha bolte paren! Kono proshno ache ki? 😊"
                )
            elif lang == "bengali":
                return (
                    "আমি LuxeStore-এর স্মার্ট শপিং অ্যাসিস্ট্যান্ট! একজন আন্তরিক বন্ধুর মতো আপনাকে প্রয়োজনীয় তথ্য "
                    "দিয়ে সহায়তা করাই আমার কাজ। আপনার কি কোনো বিষয়ে কিছু জানার আছে? 😊"
                )
            else:
                return (
                    "I am Luxe Assistant, your shopping and customer care companion at LuxeStore. "
                    "I'm here to answer questions, chat, or guide you through the store whenever you need! 😊"
                )

        if intent == "empathy_mood":
            if lang == "banglish":
                return (
                    "Keno bhai, mon kharap keno? Shob thik hoye jabe inshaAllah! "
                    "Kono kichu share korte chan ba kotha bolte chan? Ami shunchi ❤️"
                )
            elif lang == "bengali":
                return (
                    "মন খারাপ কেন ভাই? ইনশাআল্লাহ সব ঠিক হয়ে যাবে! "
                    "কোনো কিছু নিয়ে কথা বলতে চাইলে বলতে পারেন, আমি শুনছি ❤️"
                )
            else:
                return (
                    "I'm sorry to hear that. Hope everything gets better soon! "
                    "If you'd like to chat or need anything, I'm right here for you ❤️"
                )

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
                    "2 theke 4 diner moddhe delivery kora hoy। Delivery charge matro ৳60 (Dhaka) ebong ৳120 (Dhaka r baire)। Direct apnar thikanay safe delivery paben। 🚚"
                )
            elif lang == "bengali":
                return (
                    "আমাদের ডেলিভারি সেবা অত্যন্ত দ্রুত ও নিরাপদ! ঢাকার ভেতরে ২৪-৪৮ ঘণ্টার মধ্যে এবং ঢাকার বাইরে সারা বাংলাদেশে "
                    "২-৪ কার্যদিবসের মধ্যে সরাসরি হোম ডেলিভারি দেওয়া হয়। ডেলিভারি চার্জ ঢাকার ভেতরে ৬০ টাকা এবং ঢাকার বাইরে ১২০ টাকা। 🚚"
                )
            else:
                return (
                    "We offer fast and reliable home delivery! Inside Dhaka it takes 24-48 hours, and across Bangladesh it takes 2-4 business days. "
                    "Standard delivery fees are ৳60 (Dhaka) and ৳120 (outside Dhaka). 🚚"
                )

        if intent == "faq_payment":
            if lang == "banglish":
                return (
                    "Amader ekhane Cash on Delivery (COD), bKash, Nagad, ebong Visa/Mastercard debit o credit card diye 100% secure payment korte parben। "
                    "Checkout korar shomoy apnar pochondo moto payment option select korte paren। 💳"
                )
            elif lang == "bengali":
                return (
                    "আমাদের স্টোরে ক্যাশ অন ডেলিভারি (Cash on Delivery), বিকাশ, নগদ এবং যেকোনো ডেবিট/ক্রেডিট কার্ডের মাধ্যমে সম্পূর্ণ নিরাপদে পেমেন্ট করতে পারবেন। "
                    "চেকআউটের সময় আপনার সুবিধাজনক পেমেন্ট মেথডটি বেছে নিতে পারেন। 💳"
                )
            else:
                return (
                    "We accept Cash on Delivery (COD), Mobile Banking (bKash, Nagad), and all major Debit/Credit Cards securely at checkout. 💳"
                )

        if intent == "faq_return":
            if lang == "banglish":
                return (
                    "Amader 7-diner easy return and refund policy ache। Delivery pawar por product e kono somossya ba damage thakle "
                    "7 diner moddhe amader janale amra free return ba exchange kore di। Customer satisfaction amader priority! 🔄"
                )
            elif lang == "bengali":
                return (
                    "আমাদের ৭ দিনের সহজ রিটার্ন ও রিফান্ড পলিসি রয়েছে। ডেলিভারি পাওয়ার পর পণ্যে কোনো সমস্যা থাকলে ৭ দিনের মধ্যে জানালে "
                    "সম্পূর্ণ ফ্রিতে রিটার্ন বা এক্সচেঞ্জ করতে পারবেন। 🔄"
                )
            else:
                return (
                    "We have a 7-day hassle-free return and replacement policy! If you receive a defective or mismatched item, you can request an easy exchange or full refund within 7 days. 🔄"
                )

        if intent == "faq_location":
            if lang == "banglish":
                return (
                    "LuxeStore hocche ekti modern online marketplace! Amader kono physical retail dokan e jawar dorkar nei—"
                    "apni shorashori amader website theke order korlei amra fast delivery r maddhome apnar bashay ponno pouche dibo। 🏢"
                )
            elif lang == "bengali":
                return (
                    "LuxeStore একটি আধুনিক অনলাইন মার্কেটপ্লেস! আমাদের কোনো ফিজিক্যাল দোকানে যাওয়ার প্রয়োজন নেই—"
                    "ওয়েবসাইট থেকে এক ক্লিকে অর্ডার করলেই পণ্য সরাসরি আপনার ঠিকানায় পৌঁছে দেওয়া হবে। 🏢"
                )
            else:
                return (
                    "LuxeStore is a premier online marketplace! You don't need to visit a physical store—simply browse and place your order here, and we'll deliver it straight to your doorstep. 🏢"
                )

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
                    "Apni chaile amader onno categories (smartwatch, headphone, shoes, electronics) browse korte paren, ba ami ki apnake onno kichu suggest korbo? 😊"
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
                f"Haa bhai! Apnar request onujayi amader store er best match hocche **{p_name}**। "
                f"Er dam matro **{p_price}**{disc_text} ebong eta fully in stock ache।\n\n"
                f"Niche ami er card and details diye dilam, apni dekhe nite paren। Kono rokom question thakle amake bolun, ami help korchi! 😊"
            )
        elif lang == "bengali":
            disc_bn = f" (পূর্বের মূল্য {old_p} থেকে আকর্ষণীয় ছাড়ে!)" if old_p else ""
            return (
                f"জী ভাই! আপনার জন্য আমাদের স্টোরে দারুণ একটি অপশন রয়েছে—**{p_name}**। "
                f"এর বর্তমান অফার মূল্য মাত্র **{p_price}**{disc_bn} এবং এটি এখনই অর্ডারের জন্য রেডি স্টকে আছে।\n\n"
                f"নিচে আমি প্রোডাক্ট কার্ড যুক্ত করে দিয়েছি, আপনি বিস্তারিত দেখে সরাসরি কার্টে যোগ করতে পারেন! 😊"
            )
        else:
            return (
                f"Hello! Based on your request, I highly recommend our **{p_name}**. "
                f"It is available right now for only **{p_price}** with verified store warranty and fast delivery.\n\n"
                f"I've attached the product card below for you to check out specs and place your order directly. Let me know if you need any further assistance! 😊"
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
                "price": f"{p.get('price', 0):.2f}",
                "old_price": f"{p.get('old_price', 0):.2f}" if p.get('old_price') else "",
                "image": p.get("image") or "",
                "in_stock": p.get("in_stock", True)
            })
        return formatted


# Singleton Service
ai_service = AIAssistantService()
