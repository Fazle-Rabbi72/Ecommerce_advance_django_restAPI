from rest_framework import serializers
from vendor.models import Vendor, VendorRequest, Payout

class VendorRequestSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    user_phone = serializers.CharField(source='user.phone', read_only=True)
    name = serializers.CharField(source='shop_name', read_only=True)
    description = serializers.CharField(source='message', read_only=True)
    date = serializers.DateTimeField(source='created_at', read_only=True)
    status = serializers.SerializerMethodField()

    class Meta:
        model = VendorRequest
        fields = [
            'id', 'user', 'user_email', 'user_name', 'user_phone',
            'shop_name', 'name', 'mobile', 'message', 'description',
            'is_approved', 'status', 'created_at', 'date'
        ]
        read_only_fields = ['user', 'is_approved', 'created_at']

    def get_status(self, obj):
        return 'approved' if obj.is_approved else 'pending'

class PayoutSerializer(serializers.ModelSerializer):
    vendor_name = serializers.CharField(source='vendor.name', read_only=True)
    created_at_formatted = serializers.DateTimeField(source='created_at', format='%b %d, %Y %I:%M %p', read_only=True)

    class Meta:
        model = Payout
        fields = '__all__'
        read_only_fields = ['vendor', 'created_at', 'updated_at']

class VendorBankSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vendor
        fields = [
            'id', 'name', 'bank_name', 'account_number', 'account_name',
            'routing_number', 'mobile_banking_provider', 'mobile_banking_number'
        ]

