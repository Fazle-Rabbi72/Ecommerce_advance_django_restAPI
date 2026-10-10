from django.shortcuts import render,redirect
from django.db import models,transaction

from store.models import (
    Product, Review, CartOrder, CartOrderItem, Coupon, Notification,
    Category, Gallery, Color, Size, Specification
)
from userauths.models import Profile
from vendor.models import Vendor, VendorRequest, Payout
from store.serializers import (
    ProductSerializer, CartOrderSerializer, CouponSerializer, NotificationSerializer,
    ReviewSerializer, WishlistSerializer, SummarySerializer, CartOrderItemSerializer,
    EarningSerializer, CouponSummarySerializer, NotificationSummarySerializer,
    VendorSerializer, SpecificationSerializer, ColorSerializer, SizeSerializer,
    GallerySerializer, _clean_image_url
)
from userauths.serializer import ProfileSerializer

from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response

from vendor.serializers import VendorRequestSerializer, PayoutSerializer, VendorBankSerializer
from decimal import Decimal


import stripe 
import requests
from datetime import timedelta,datetime

from rest_framework.decorators import api_view
from django.db.models.functions import ExtractMonth


class DashboardStatsAPIView(generics.GenericAPIView):
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        vendor_id = self.kwargs['vendor_id']
        vendor = Vendor.objects.get(id=vendor_id)

        product_count = Product.objects.filter(vendor=vendor).count()
        order_count = CartOrder.objects.filter(vendor=vendor, payment_status="paid").count()

        items = CartOrderItem.objects.filter(vendor=vendor, order__payment_status="paid")
        gross_revenue = items.aggregate(total=models.Sum('sub_total'))['total'] or 0.00
        admin_commission = items.aggregate(comm=models.Sum('admin_commission'))['comm'] or 0.00
        if admin_commission == 0 and gross_revenue > 0:
            admin_commission = round(float(gross_revenue) * 0.001, 2)

        net_earnings = float(gross_revenue) - float(admin_commission)

        paid_payouts = Payout.objects.filter(vendor=vendor, status="paid").aggregate(tot=models.Sum('amount'))['tot'] or 0.00
        pending_payouts = Payout.objects.filter(vendor=vendor, status__in=["pending", "processing"]).aggregate(tot=models.Sum('amount'))['tot'] or 0.00
        available_balance = max(0.00, net_earnings - float(paid_payouts) - float(pending_payouts))

        return Response({
            'products': product_count,
            'orders': order_count,
            'gross_revenue': round(float(gross_revenue), 2),
            'admin_commission': round(float(admin_commission), 2),
            'commission_rate': '0.1%',
            'net_earnings': round(float(net_earnings), 2),
            'total_paid_out': round(float(paid_payouts), 2),
            'pending_payout': round(float(pending_payouts), 2),
            'available_balance': round(float(available_balance), 2),
            'vendor_name': vendor.name,
            'vendor_slug': vendor.slug,
            'bank_name': vendor.bank_name or '',
            'account_number': vendor.account_number or '',
            'account_name': vendor.account_name or '',
            'routing_number': vendor.routing_number or '',
            'mobile_banking_provider': vendor.mobile_banking_provider or '',
            'mobile_banking_number': vendor.mobile_banking_number or '',
        }, status=status.HTTP_200_OK)

@api_view(('GET',))
def MonthlyOrderChartAPIView(request, vendor_id):
    vendor=Vendor.objects.get(id=vendor_id)
    orders= CartOrder.objects.filter(vendor=vendor, payment_status="paid")
    orders_by_month =orders.annotate(month=ExtractMonth("date")).values("month").annotate(orders=models.Count("id")).order_by("month")
    return Response(orders_by_month)
@api_view(('GET',))
def MonthlyProductChartAPIView(request, vendor_id):
    vendor=Vendor.objects.get(id=vendor_id)
    products= Product.objects.filter(vendor=vendor)
    products_by_month =products.annotate(month=ExtractMonth("date")).values("month").annotate(products=models.Count("id")).order_by("month")
    return Response(products_by_month)

class ProductAPIView(generics.ListAPIView):
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        vendor_id=self.kwargs['vendor_id']
        vendor= Vendor.objects.get(id=vendor_id)
        return Product.objects.filter(vendor=vendor).order_by('-id')
    
class OrderAPIView(generics.ListAPIView):
    serializer_class = CartOrderSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        vendor_id=self.kwargs['vendor_id']
        vendor= Vendor.objects.get(id=vendor_id)
        
        return CartOrder.objects.filter(vendor=vendor,payment_status="paid").order_by('-id')

class OrderDetailAPIView(generics.RetrieveAPIView):
    serializer_class= CartOrderSerializer
    permission_classes= [AllowAny]
    
    def get_queryset(self):
        vendor_id=self.kwargs['vendor_id']
        order_oid=self.kwargs['order_oid']
        vendor= Vendor.objects.get(id=vendor_id)
        
        return CartOrder.objects.get(vendor=vendor, oid= order_oid)
    


class FilterProductAPIView(generics.ListAPIView):
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        vendor_id=self.kwargs['vendor_id']
        vendor= Vendor.objects.get(id=vendor_id)
        
        filter=self.request.GET.get("filter")
        
        if filter == "published":
            products=Product.objects.filter( vendor=vendor, status="published")
        elif filter == "in_review":
            products=Product.objects.filter( vendor=vendor, status="in_review")
        elif filter == "draft":
            products=Product.objects.filter( vendor=vendor, status="draft")
        elif filter == "disabled":
            products=Product.objects.filter( vendor=vendor, status="disabled")
        else:
            products=Product.objects.filter(vendor=vendor) 
        
        return products  
class EarningAPIView(generics.ListAPIView):
    serializer_class= EarningSerializer
    permission_classes= [AllowAny]
    
    def get_queryset(self):
        vendor_id=self.kwargs['vendor_id']
        vendor= Vendor.objects.get(id=vendor_id)
        
        one_month_ago= datetime.today() - timedelta(days=28)
        monthly_revenue=CartOrderItem.objects.filter(vendor=vendor, order__payment_status="paid",date__gte=one_month_ago).aggregate(total_revenue=models.Sum(models.F('sub_total')+models.F('shipping_amount')))['total_revenue'] or 0
        total_revenue=CartOrderItem.objects.filter(vendor=vendor, order__payment_status="paid").aggregate(total_revenue=models.Sum(models.F('sub_total')+models.F('shipping_amount')))['total_revenue'] or 0
        
        return[{
            'monthly_revenue':monthly_revenue,
            'total_revenue':total_revenue,
        }]
        
    def list(self,*args, **kwargs):
        queryset=self.get_queryset()
        serializer= self.get_serializer(queryset, many=True)
        
        return Response(serializer.data)

@api_view(('GET',))
def MonthlyEarningTracker(request, vendor_id):
    vendor=Vendor.objects.get(id=vendor_id)
    monthly_earning_tracker=(
        CartOrderItem.objects.filter(vendor=vendor,order__payment_status="paid")
        .annotate(month=ExtractMonth("date"))
        .values("month")
        .annotate(sales_count=models.Sum("quantity"),total_earning=models.Sum(models.F('sub_total')+models.F('shipping_amount'))).order_by('-month')
    )
    return Response(monthly_earning_tracker)

class ReviewListAPIView(generics.ListAPIView):
    serializer_class=ReviewSerializer
    permission_classes=[AllowAny]
    
    def get_queryset(self):
        vendor_id=self.kwargs['vendor_id']
        vendor= Vendor.objects.get(id=vendor_id)
        
        return Review.objects.filter(product__vendor=vendor)

class ReviewDetailAPIView(generics.RetrieveAPIView):
    serializer_class= ReviewSerializer
    permission_classes= [AllowAny]
    
    def get_object(self):
        vendor_id=self.kwargs['vendor_id']
        review_id=self.kwargs['review_id']
        
        vendor= Vendor.objects.get(id=vendor_id)
        review= Review.objects.get(id=review_id,product__vendor=vendor)
        return review

class CouponListCreateAPIView(generics.ListCreateAPIView):
    serializer_class=CouponSerializer
    permission_classes=[AllowAny]
    
    def get_queryset(self):
        vendor_id=self.kwargs['vendor_id']
        vendor= Vendor.objects.get(id=vendor_id)
        
        return Coupon.objects.filter(vendor=vendor)
    def create(self, request, *args, **kwargs):
        payload=request.data
        vendor_id =payload['vendor_id']
        code =payload['code']
        discount=payload['discount']
        active= payload['active']
        
        vendor= Vendor.objects.get(id=vendor_id)
        Coupon.objects.create(
            vendor=vendor,
            code=code,
            discount=discount,
            active=(active.lower()=="true")
        )
        return Response({"message":"Coupon created successfully"},status=status.HTTP_201_CREATED)


class CouponDetailAPIView(generics.RetrieveUpdateAPIView):
    serializer_class=CouponSerializer
    permission_classes=[AllowAny]
    
    def get_object(self):
        vendor_id=self.kwargs['vendor_id']
        coupon_id=self.kwargs['coupon_id']
        
        vendor=Vendor.objects.get(id=vendor_id)
        return Coupon.objects.get(vendor=vendor, id=coupon_id)

class CouponStatsAPIView(generics.ListAPIView):
    serializer_class=CouponSummarySerializer
    permission_classes=[AllowAny]
    
    def get_queryset(self):
        vendor_id=self.kwargs['vendor_id']
        vendor= Vendor.objects.get(id=vendor_id)
        
        total_coupons=Coupon.objects.filter(vendor=vendor).count()
        active_coupons = Coupon.objects.filter(vendor=vendor, active=True).count()
        
        return[{
            'total_coupons':total_coupons,
            'active_coupons':active_coupons,
        }]
    def list(self,*args, **kwargs):
        queryset=self.get_queryset()
        serializer= self.get_serializer(queryset, many=True)
        
        return Response(serializer.data)


class NotificationUnseenAPIView(generics.ListAPIView):
    serializer_class=NotificationSerializer
    permission_classes=[AllowAny]
    
    def get_queryset(self):
        vendor_id=self.kwargs['vendor_id']
        vendor=Vendor.objects.get(id=vendor_id)
        return Notification.objects.filter(vendor=vendor, seen=False).order_by('-id')
class NotificationSeenAPIView(generics.ListAPIView):
    serializer_class=NotificationSerializer
    permission_classes=[AllowAny]
    
    def get_queryset(self):
        vendor_id=self.kwargs['vendor_id']
        vendor=Vendor.objects.get(id=vendor_id)
        return Notification.objects.filter(vendor=vendor, seen=True).order_by('-id')
class NotificationSummaryAPIView(generics.ListAPIView):
    serializer_class=NotificationSummarySerializer
    permission_classes=[AllowAny]
    
    def get_queryset(self):
        vendor_id=self.kwargs['vendor_id']
        vendor=Vendor.objects.get(id=vendor_id)
        
        un_read_noti=Notification.objects.filter(vendor=vendor, seen=False).count()
        read_noti=Notification.objects.filter(vendor=vendor, seen=True).count()  
        all_noti=Notification.objects.filter(vendor=vendor).count()
        
        return[{
            "un_read_noti":un_read_noti,
            "read_noti":read_noti,
            "all_noti":all_noti,
        }]
    def list(self,*args, **kwargs):
        queryset=self.get_queryset()
        serializer= self.get_serializer(queryset, many=True)
        
        return Response(serializer.data)
class NotificationVendorMarkAsSeen(generics.RetrieveAPIView):
    serializer_class=NotificationSerializer
    permission_classes=[AllowAny]
    
    
    def get_object(self):
        vendor_id=self.kwargs['vendor_id']
        noti_id=self.kwargs['noti_id']
        
        vendor=Vendor.objects.get(id=vendor_id)
        noti=Notification.objects.get(vendor=vendor ,id=noti_id)
        
        noti.seen== True
        noti.save()
        return noti
class VendorProfileUpdateView(generics.RetrieveUpdateAPIView):
    queryset=Profile.objects.all()
    serializer_class=ProfileSerializer
    permission_class=[AllowAny]
class ShopUpdateView(generics.RetrieveUpdateAPIView):
    queryset=Vendor.objects.all()
    serializer_class=VendorSerializer
    permission_classes=[AllowAny]

class ShopAPIView(generics.RetrieveAPIView):
    serializer_class=VendorSerializer
    permission_classes=[AllowAny]
    
    def get_object(self):
        vendor_slug=self.kwargs['vendor_slug']
        return Vendor.objects.get(slug=vendor_slug)
class ShopProductAPIView(generics.ListAPIView):
    serializer_class=ProductSerializer
    permission_classes=[AllowAny]
    
    def get_queryset(self):
        vendor_slug=self.kwargs['vendor_slug']
        vendor=Vendor.objects.get(slug=vendor_slug)
        
        return Product.objects.filter(vendor=vendor)
class ProductCreateView(generics.CreateAPIView):
    serializer_class = ProductSerializer
    queryset = Product.objects.all()
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        payload = request.data
        user = request.user
        vendor = Vendor.objects.filter(user=user).first()
        if not vendor:
            v_id = payload.get('vendor_id')
            if v_id:
                vendor = Vendor.objects.filter(id=v_id).first()
        if not vendor:
            return Response({'message': 'Vendor profile not found for this user.'}, status=status.HTTP_400_BAD_REQUEST)

        title = payload.get('title')
        if not title:
            return Response({'message': 'Product title is required.'}, status=status.HTTP_400_BAD_REQUEST)

        cat_id = payload.get('category_id') or payload.get('category')
        category = Category.objects.filter(id=cat_id).first() if cat_id else None

        price = Decimal(str(payload.get('price', 0.00)))
        old_price = Decimal(str(payload.get('old_price') or 0.00))
        shipping_amount = Decimal(str(payload.get('shipping_amount') or 0.00))
        stock_qty = int(payload.get('stock_qty', 10))
        description = payload.get('description', '')
        image = request.FILES.get('image') or payload.get('image')
        status_val = payload.get('status', 'published')
        featured = bool(payload.get('featured', False))

        product = Product.objects.create(
            title=title,
            category=category,
            vendor=vendor,
            price=price,
            old_price=old_price,
            shipping_amount=shipping_amount,
            stock_qty=stock_qty,
            description=description,
            image=image,
            status=status_val,
            featured=featured
        )

        # 1. Gallery images
        gallery_images = payload.get('gallery') or []
        for g in gallery_images:
            img_url = g if isinstance(g, str) else (g.get('image') if isinstance(g, dict) else None)
            if img_url:
                Gallery.objects.create(product=product, image=img_url)

        # 2. Colors
        colors = payload.get('colors') or []
        for c in colors:
            c_name = c.get('name') if isinstance(c, dict) else str(c)
            c_code = c.get('color_code', '#000000') if isinstance(c, dict) else '#000000'
            if c_name:
                Color.objects.create(product=product, name=c_name, color_code=c_code)

        # 3. Sizes
        sizes = payload.get('sizes') or []
        for s in sizes:
            s_name = s.get('name') if isinstance(s, dict) else str(s)
            s_price = s.get('price', 0.00) if isinstance(s, dict) else 0.00
            if s_name:
                Size.objects.create(product=product, name=s_name, price=s_price)

        # 4. Specifications
        specifications = payload.get('specifications') or []
        for sp in specifications:
            if isinstance(sp, dict):
                sp_title = sp.get('title')
                sp_content = sp.get('content')
                if sp_title:
                    Specification.objects.create(product=product, title=sp_title, content=sp_content or '')

        return Response({
            'message': 'Product created successfully with all variations',
            'product': ProductSerializer(product).data
        }, status=status.HTTP_201_CREATED)


class ProducUpdateView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ProductSerializer
    queryset = Product.objects.all()
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def delete(self, request, *args, **kwargs):
        product = self.get_object()
        if product:
            product.delete()
            return Response({'message': 'Product deleted successfully'}, status=status.HTTP_200_OK)
        return Response({'message': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

    def get_object(self):
        vendor_id = self.kwargs.get('vendor_id')
        product_pid = self.kwargs.get('product_pid')
        product = Product.objects.filter(pid=product_pid).first()
        if not product and str(product_pid).isdigit():
            product = Product.objects.filter(id=int(product_pid)).first()
        return product

    @transaction.atomic
    def update(self, request, *args, **kwargs):
        product = self.get_object()
        if not product:
            return Response({'message': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

        payload = request.data

        if 'title' in payload and payload['title']:
            product.title = str(payload['title']).strip()

        cat_id = payload.get('category_id') or payload.get('category')
        if cat_id:
            try:
                c = Category.objects.filter(id=int(cat_id)).first()
                if c:
                    product.category = c
            except (ValueError, TypeError):
                pass

        if 'price' in payload and payload['price'] not in [None, '']:
            product.price = Decimal(str(payload['price']))
        if 'old_price' in payload:
            val = payload['old_price']
            product.old_price = Decimal(str(val)) if val not in [None, ''] else Decimal('0.00')
        if 'shipping_amount' in payload:
            val = payload['shipping_amount']
            product.shipping_amount = Decimal(str(val)) if val not in [None, ''] else Decimal('0.00')
        if 'stock_qty' in payload and payload['stock_qty'] not in [None, '']:
            product.stock_qty = int(payload['stock_qty'])
        if 'description' in payload:
            product.description = payload['description']
        if 'image' in request.FILES:
            product.image = request.FILES['image']
        elif 'image' in payload and payload['image']:
            product.image = payload['image']
        if 'status' in payload:
            product.status = payload['status']
        if 'featured' in payload:
            product.featured = bool(payload['featured'])
        product.save()

        # Update Gallery
        if 'gallery' in payload:
            product.gallery_set.all().delete()
            for g in payload['gallery']:
                img_url = g if isinstance(g, str) else (g.get('image') if isinstance(g, dict) else None)
                if img_url:
                    Gallery.objects.create(product=product, image=img_url)

        # Update Colors
        if 'colors' in payload:
            product.color_set.all().delete()
            for c in payload['colors']:
                c_name = c.get('name') if isinstance(c, dict) else str(c)
                c_code = c.get('color_code', '#000000') if isinstance(c, dict) else '#000000'
                if c_name:
                    Color.objects.create(product=product, name=c_name, color_code=c_code)

        # Update Sizes
        if 'sizes' in payload:
            product.size_set.all().delete()
            for s in payload['sizes']:
                s_name = s.get('name') if isinstance(s, dict) else str(s)
                s_price = s.get('price', 0.00) if isinstance(s, dict) else 0.00
                if s_name:
                    Size.objects.create(product=product, name=s_name, price=s_price)

        # Update Specifications
        if 'specifications' in payload:
            product.specification_set.all().delete()
            for sp in payload['specifications']:
                if isinstance(sp, dict):
                    sp_title = sp.get('title')
                    sp_content = sp.get('content')
                    if sp_title:
                        Specification.objects.create(product=product, title=sp_title, content=sp_content or '')

        return Response({
            'message': 'Product updated successfully with variations',
            'product': ProductSerializer(product).data
        }, status=status.HTTP_200_OK)


class ProductDeleteAPIView(generics.DestroyAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]

    def delete(self, request, *args, **kwargs):
        vendor_id = self.kwargs.get('vendor_id') or request.data.get('vendor_id')
        product_pid = self.kwargs.get('product_pid') or request.data.get('product_pid') or request.data.get('pid')
        product = Product.objects.filter(pid=product_pid).first()
        if not product and product_pid and str(product_pid).isdigit():
            product = Product.objects.filter(id=int(product_pid)).first()
        if product:
            product.delete()
            return Response({'message': 'Product deleted successfully'}, status=status.HTTP_200_OK)
        return Response({'message': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)    
    



#  1. Vendor Request Create
class VendorRequestCreateView(generics.CreateAPIView):
    queryset = VendorRequest.objects.all()
    serializer_class = VendorRequestSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        user = request.user

        # If already an active vendor
        if Vendor.objects.filter(user=user, active=True).exists():
            vendor = Vendor.objects.get(user=user)
            return Response(
                {"message": "You are already a registered vendor.", "is_vendor": True, "vendor_id": vendor.id},
                status=status.HTTP_200_OK
            )

        existing_req = VendorRequest.objects.filter(user=user).first()
        if existing_req:
            serializer = self.get_serializer(existing_req, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(
                {"message": "Vendor request updated successfully.", "data": serializer.data},
                status=status.HTTP_200_OK
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=user)
        return Response(
            {"message": "Vendor request submitted successfully.", "data": serializer.data},
            status=status.HTTP_201_CREATED
        )


#  2. Get current user's vendor request
class MyVendorRequestView(generics.RetrieveAPIView):
    serializer_class = VendorRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return VendorRequest.objects.get(user=self.request.user)


#  3. Admin – List all vendor requests
class VendorRequestListView(generics.ListAPIView):
    serializer_class = VendorRequestSerializer
    queryset = VendorRequest.objects.all()
    permission_classes = [IsAdminUser]


# 🔵 4. Admin – Approve vendor request
class ApproveVendorRequestView(generics.UpdateAPIView):
    serializer_class = VendorRequestSerializer
    queryset = VendorRequest.objects.all()
    permission_classes = [IsAdminUser]

    def patch(self, request, *args, **kwargs):
        vendor_request = self.get_object()

        if vendor_request.is_approved:
            return Response({"message": "This request is already approved."})

        vendor_request.is_approved = True
        vendor_request.save()

        # Signal trigger → Vendor created automatically
        return Response({"message": "Vendor request approved, vendor account created."})


class RejectVendorRequestView(generics.UpdateAPIView):
    serializer_class = VendorRequestSerializer
    queryset = VendorRequest.objects.all()
    permission_classes = [IsAdminUser]

    def patch(self, request, *args, **kwargs):
        vendor_request = self.get_object()
        vendor_request.delete()
        return Response({"message": "Vendor request rejected and removed."})


# 5. Check Logged-in User's Vendor Status
class MyVendorProfileView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        vendor = Vendor.objects.filter(user=user).first()
        if vendor:
            return Response({
                'is_vendor': True,
                'vendor_id': vendor.id,
                'vendor_name': vendor.name,
                'vendor_slug': vendor.slug,
                'active': vendor.active,
            })

        pending_req = VendorRequest.objects.filter(user=user, is_approved=False).first()
        return Response({
            'is_vendor': False,
            'has_pending_request': pending_req is not None,
            'request_date': pending_req.created_at if pending_req else None,
            'request_data': VendorRequestSerializer(pending_req).data if pending_req else None,
        })


# 6. Vendor Orders with Item Earnings & Commission breakdown
class VendorOrdersListView(generics.GenericAPIView):
    permission_classes = [AllowAny]

    def get(self, request, vendor_id):
        vendor = Vendor.objects.get(id=vendor_id)
        items = CartOrderItem.objects.filter(vendor=vendor).select_related('order', 'product').order_by('-id')
        
        results = []
        for item in items:
            results.append({
                'id': item.id,
                'order_oid': item.order.oid,
                'date': item.order.date,
                'buyer_name': item.order.full_name or (item.order.buyer.username if item.order.buyer else 'Guest'),
                'buyer_email': item.order.email or '',
                'product_title': item.product.title if item.product else 'Unknown',
                'product_image': _clean_image_url(str(item.product.image.url)) if item.product and item.product.image else '',
                'quantity': item.quantity,
                'price': float(item.price),
                'sub_total': float(item.sub_total),
                'admin_commission': float(item.admin_commission) if item.admin_commission else round(float(item.sub_total) * 0.001, 2),
                'vendor_earning': float(item.vendor_earning) if item.vendor_earning else round(float(item.sub_total) * 0.999, 2),
                'payment_status': item.order.payment_status,
                'order_status': item.order.order_status,
            })
        return Response(results)


# 7. Vendor Payouts List & Create
class VendorPayoutListCreateView(generics.GenericAPIView):
    permission_classes = [AllowAny]

    def get(self, request, vendor_id):
        vendor = Vendor.objects.get(id=vendor_id)
        payouts = Payout.objects.filter(vendor=vendor).order_by('-created_at')
        return Response(PayoutSerializer(payouts, many=True).data)

    def post(self, request, vendor_id):
        vendor = Vendor.objects.get(id=vendor_id)
        amount = Decimal(str(request.data.get('amount', 0)))
        payout_method = request.data.get('payout_method', 'Bank Transfer')
        account_details = request.data.get('account_details', '')

        # Calculate Available Balance
        items = CartOrderItem.objects.filter(vendor=vendor, order__payment_status="paid")
        gross = items.aggregate(total=models.Sum('sub_total'))['total'] or 0.00
        comm = items.aggregate(comm=models.Sum('admin_commission'))['comm'] or 0.00
        if comm == 0 and gross > 0:
            comm = round(float(gross) * 0.001, 2)
        net = float(gross) - float(comm)
        paid = Payout.objects.filter(vendor=vendor, status="paid").aggregate(tot=models.Sum('amount'))['tot'] or 0.00
        pending = Payout.objects.filter(vendor=vendor, status__in=["pending", "processing"]).aggregate(tot=models.Sum('amount'))['tot'] or 0.00
        available = max(0.00, net - float(paid) - float(pending))

        if amount <= 0:
            return Response({'message': 'Please enter a valid withdrawal amount.'}, status=status.HTTP_400_BAD_REQUEST)
        if float(amount) > available:
            return Response({'message': f'Insufficient balance! Available for withdrawal: ${available:.2f}'}, status=status.HTTP_400_BAD_REQUEST)

        payout = Payout.objects.create(
            vendor=vendor,
            amount=amount,
            payout_method=payout_method,
            account_details=account_details or f"{vendor.bank_name} {vendor.account_number} ({vendor.account_name})",
            status='pending'
        )
        return Response(PayoutSerializer(payout).data, status=status.HTTP_201_CREATED)


# 8. Vendor Bank Settings Update
class VendorBankUpdateView(generics.GenericAPIView):
    permission_classes = [AllowAny]

    def patch(self, request, vendor_id):
        vendor = Vendor.objects.get(id=vendor_id)
        vendor.bank_name = request.data.get('bank_name', vendor.bank_name)
        vendor.account_number = request.data.get('account_number', vendor.account_number)
        vendor.account_name = request.data.get('account_name', vendor.account_name)
        vendor.routing_number = request.data.get('routing_number', vendor.routing_number)
        vendor.mobile_banking_provider = request.data.get('mobile_banking_provider', vendor.mobile_banking_provider)
        vendor.mobile_banking_number = request.data.get('mobile_banking_number', vendor.mobile_banking_number)
        vendor.save()
        return Response(VendorBankSerializer(vendor).data)


# 9. Admin Payouts List & Update
class AdminPayoutListView(generics.GenericAPIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        payouts = Payout.objects.all().order_by('-created_at')
        return Response(PayoutSerializer(payouts, many=True).data)


class AdminPayoutStatusUpdateView(generics.GenericAPIView):
    permission_classes = [IsAdminUser]

    def patch(self, request, pk):
        payout = Payout.objects.get(id=pk)
        new_status = request.data.get('status')
        transaction_id = request.data.get('transaction_id')
        notes = request.data.get('notes')

        if new_status in ['pending', 'processing', 'paid', 'rejected']:
            payout.status = new_status
        if transaction_id:
            payout.transaction_id = transaction_id
        if notes:
            payout.notes = notes
        payout.save()
        return Response(PayoutSerializer(payout).data)

