from django.core.management.base import BaseCommand
from store.ai_assistant import vector_store


class Command(BaseCommand):
    help = "Index all active store products into the Vector Database"

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Indexing products into Vector Database..."))
        count = vector_store.index_all()
        self.stdout.write(self.style.SUCCESS(f"Successfully indexed {count} products! Vector store is ready."))
