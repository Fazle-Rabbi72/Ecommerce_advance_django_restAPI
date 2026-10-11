from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from store.models import Product
from vendor.models import Vendor
from store.ai_assistant import vector_store


@receiver(post_save, sender=Product)
def sync_product_on_save(sender, instance, created, **kwargs):
    """Automatically update vector database when a product is created or updated."""
    try:
        vector_store.upsert_product(instance)
    except Exception as e:
        print(f"Vector sync on save error: {e}")


@receiver(post_delete, sender=Product)
def sync_product_on_delete(sender, instance, **kwargs):
    """Automatically remove product from vector database when deleted."""
    try:
        vector_store.delete_product(instance.id)
    except Exception as e:
        print(f"Vector sync on delete error: {e}")


@receiver(post_save, sender=Vendor)
def sync_vendor_on_save(sender, instance, created, **kwargs):
    """Automatically update vector database when a vendor is updated."""
    try:
        vector_store.upsert_vendor(instance)
    except Exception as e:
        print(f"Vector sync on vendor save error: {e}")
