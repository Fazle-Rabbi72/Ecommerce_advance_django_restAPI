from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver

# Create your models here.
from userauths.models import User
from django.utils.text import slugify

class Vendor(models.Model):
    user=models.OneToOneField(User, on_delete=models.CASCADE)
    image=models.FileField(upload_to="vendor", default="vendor.jpg", null=True, blank=True, max_length=1000)
    name=models.CharField(max_length=100, help_text="Shop Name", null=True, blank=True)
    description=models.TextField(null=True, blank=True)
    mobile=models.CharField(max_length=100, help_text="Shop Mobile Number", null=True, blank=True)
    active=models.BooleanField(default=False)
    date=models.DateTimeField(auto_now_add=True)
    slug=models.SlugField(null=True,blank=True)
    
    # Payout & Bank Account Details
    bank_name=models.CharField(max_length=100, null=True, blank=True)
    account_number=models.CharField(max_length=100, null=True, blank=True)
    account_name=models.CharField(max_length=100, null=True, blank=True)
    routing_number=models.CharField(max_length=100, null=True, blank=True)
    mobile_banking_provider=models.CharField(max_length=50, null=True, blank=True, help_text="e.g. bKash, Nagad")
    mobile_banking_number=models.CharField(max_length=50, null=True, blank=True)
    
    class Meta:
        verbose_name_plural = 'Vendors'
        ordering = ['-date']
        
    def __str__(self):
        return str(self.name)
    
    def save(self, *args, **kwargs):
        if self.slug =="" or self.slug is None:
            self.slug=slugify(self.name)
        super(Vendor, self).save(*args, **kwargs)

class Payout(models.Model):
    STATUS=(
        ("pending","Pending"),
        ("processing","Processing"),
        ("paid","Paid"),
        ("rejected","Rejected"),
    )
    vendor=models.ForeignKey(Vendor, on_delete=models.CASCADE, related_name="payouts")
    amount=models.DecimalField(max_digits=12, decimal_places=2)
    status=models.CharField(max_length=20, choices=STATUS, default="pending")
    payout_method=models.CharField(max_length=50, default="Bank Transfer")
    account_details=models.TextField(null=True, blank=True)
    transaction_id=models.CharField(max_length=100, null=True, blank=True)
    notes=models.TextField(null=True, blank=True)
    created_at=models.DateTimeField(auto_now_add=True)
    updated_at=models.DateTimeField(auto_now=True)

    class Meta:
        ordering=['-created_at']

    def __str__(self):
        return f"{self.vendor.name} - ${self.amount} ({self.status})"


class VendorRequest(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    shop_name = models.CharField(max_length=150, null=True, blank=True)
    mobile = models.CharField(max_length=100, null=True, blank=True)
    message = models.TextField(null=True, blank=True)
    is_approved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.email} - {self.shop_name or 'Vendor Request'}"


@receiver(post_save, sender=VendorRequest)
def create_vendor_when_approved(sender, instance, **kwargs):
    if instance.is_approved:
        vendor, created = Vendor.objects.get_or_create(
            user=instance.user,
            defaults={
                'name': instance.shop_name or f"{instance.user.full_name or instance.user.username}'s Store",
                'mobile': instance.mobile or instance.user.phone or "",
                'description': instance.message or "",
                'active': True,
            }
        )
        if not created:
            vendor.active = True
            if instance.shop_name:
                vendor.name = instance.shop_name
            if instance.mobile:
                vendor.mobile = instance.mobile
            if instance.message:
                vendor.description = instance.message
            vendor.save()
           
