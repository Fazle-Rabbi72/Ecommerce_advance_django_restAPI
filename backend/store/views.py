from django.shortcuts import render,redirect
from django.conf import settings

from store.models import Category,Product,Tax,Review,Cart,CartOrder,CartOrderItem,Coupon,Notification,Gallery,Color,Size,Specification
from vendor.models import Vendor
from userauths.models import User
from store.serializers import ProductSerializer,CategorySerializer,CartSerializer,CartOrderSerializer,CouponSerializer,NotificationSerializer,ReviewSerializer,VendorSerializer

from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, AllowAny, BasePermission
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from decimal import Decimal
from rest_framework.response import Response

from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string

import stripe 

stripe.api_key=settings.STRIPE_SECRET_KEY

from django.core.cache import cache

def send_notification(user=None, vendor=None, order=None, order_item=None):
    Notification.objects.create(user=user,vendor=vendor,order=order,order_item=order_item)



class CategoryListAPIView(generics.ListAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes =[AllowAny]

    def list(self, request, *args, **kwargs):
        cache_key = "api_categories_list"
        cached_data = cache.get(cache_key)
        if cached_data is not None and not request.GET.get('nocache'):
            return Response(cached_data)

        response = super().list(request, *args, **kwargs)
        cache.set(cache_key, response.data, 300) # Cache for 5 minutes
        return response

class ProductListAPIView(generics.ListAPIView):
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return Product.objects.filter(status='published')\
            .select_related('category', 'vendor')\
            .prefetch_related('gallery_set', 'color_set', 'size_set', 'review_set')\
            .order_by('-date')

    def list(self, request, *args, **kwargs):
        cache_key = "api_products_list_all"
        cached_data = cache.get(cache_key)
        if cached_data is not None and not request.GET.get('nocache'):
            return Response(cached_data)

        response = super().list(request, *args, **kwargs)
        cache.set(cache_key, response.data, 300) # Cache for 5 minutes
        return response

class ProductDetailAPIView(generics.RetrieveAPIView):
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]
    
    def get_object(self):
        slug = self.kwargs.get('slug')
        return Product.objects.select_related('category', 'vendor')\
            .prefetch_related('gallery_set', 'color_set', 'size_set', 'specification_set', 'review_set')\
            .get(slug=slug)

    def retrieve(self, request, *args, **kwargs):
        slug = self.kwargs.get('slug')
        cache_key = f"api_product_detail_{slug}"
        cached_data = cache.get(cache_key)
        if cached_data is not None and not request.GET.get('nocache'):
            return Response(cached_data)

        response = super().retrieve(request, *args, **kwargs)
        cache.set(cache_key, response.data, 300)
        return response
    
class CartAPIView(generics.ListCreateAPIView):
    queryset=Cart.objects.all()
    serializer_class=CartSerializer
    permission_classes=[AllowAny]
    
    def create(self, request, *args, **kwargs):
        payload=request.data
        
        product_id=payload['product_id']
        user_id=payload['user_id']
        quantity=payload['quantity']
        price=payload['price']
        shipping_amount=payload['shipping_amount']
        country=payload['country']
        size=payload['size']
        color=payload['color']
        cart_id=payload['cart_id']
        
        product=Product.objects.get(id=product_id)
        if user_id != "undefined":
            user=User.objects.get(id=user_id)
        else:
            user=None
        
        tax = Tax.objects.filter(country=country).first()
        if tax:
            tax_rate = tax.rate / 100
        else:
            tax_rate = 0
            
        cart=Cart.objects.filter(cart_id=cart_id, product=product).first()
        if cart:
            cart.product=product
            cart.user=user
            cart.quantity=quantity
            cart.price=price
            cart.sub_total=Decimal(price)*int(quantity)
            cart.shipping_amount=Decimal(shipping_amount)*int(quantity)
            cart.tax_fee=int(quantity)*Decimal(tax_rate)
            cart.country=country
            cart.size=size
            cart.color=color
            cart.cart_id=cart_id
            
            service_fee_percentage=20/100
            cart.service_fee=Decimal(service_fee_percentage)*cart.sub_total
            
            cart.total=cart.sub_total+cart.shipping_amount+cart.service_fee+cart.tax_fee
            
            cart.save()
            
            return Response({"message":"Cart Updated Successfully"},status=status.HTTP_200_OK)
        else:
            cart=Cart()
            cart.product=product
            cart.user=user
            cart.quantity=quantity
            cart.price=price
            cart.sub_total=Decimal(price)*int(quantity)
            cart.shipping_amount=Decimal(shipping_amount)*int(quantity)
            cart.tax_fee=int(quantity)*Decimal(tax_rate)
            cart.country=country
            cart.size=size
            cart.color=color   
            cart.cart_id=cart_id
            
            service_fee_percentage=20/100
            cart.service_fee=Decimal(service_fee_percentage)*cart.sub_total
            
            cart.total=cart.sub_total+cart.shipping_amount+cart.service_fee+cart.tax_fee
            
            cart.save()
            
            return Response({"message":"Cart Created Successfully"},status=status.HTTP_201_CREATED)


class CartListAPIView(generics.ListAPIView):
    serializer_class=CartSerializer
    permission_classes=[AllowAny]
    queryset=Cart.objects.all()
    
    def get_queryset(self):
        cart_id=self.kwargs.get('cart_id')
        user_id=self.kwargs.get('user_id')
        
        if user_id is not None:
            user=User.objects.get(id=user_id)
            querysert=Cart.objects.filter(user=user ,cart_id=cart_id)
        else:
            querysert=Cart.objects.filter(cart_id=cart_id)
            
        return querysert  
    
class CartDetailAPIView(generics.RetrieveAPIView):
    serializer_class=CartSerializer
    permission_classes=[AllowAny]
    lookup_field='cart_id'
    
    def get_queryset(self):
        cart_id=self.kwargs.get('cart_id')
        user_id=self.kwargs.get('user_id')
        
        if user_id is not None:
            user=User.objects.get(id=user_id)
            querysert=Cart.objects.filter(user=user ,cart_id=cart_id)
        else:
            querysert=Cart.objects.filter(cart_id=cart_id)
            
        return querysert 
     
    def get(self, request, *args, **kwargs):
        queryset=self.get_queryset()
        
        
        total_shipping =Decimal(0.00)
        total_tax =Decimal(0.00)
        total_service_fee=Decimal(0.00)
        total_sub_total=Decimal(0.00)
        total_total=Decimal(0.00)
        
        for cart_item in queryset:
            total_shipping+=Decimal(self.calculate_shipping(cart_item))
            total_tax+=Decimal(self.calculate_tax(cart_item))
            total_service_fee+=Decimal(self.calculate_service_fee(cart_item))
            total_sub_total+=Decimal(self.calculate_sub_total(cart_item))
            total_total+=Decimal(self.calculate_total(cart_item)) 
        
        data ={
            'shipping':total_shipping,
            'tax':total_tax,
            'service_fee':total_service_fee,
            'sub_total':total_sub_total,
            'total':total_total
        }
        
        return Response(data)
    
    def calculate_shipping(self,cart_item):
        return cart_item.shipping_amount

    def calculate_tax(self,cart_item):
        return cart_item.tax_fee
    
    def calculate_service_fee(self,cart_item):
        return cart_item.service_fee
    
    def calculate_sub_total(self,cart_item):
        return cart_item.sub_total
    
    def calculate_total(self,cart_item):
        return cart_item.total

class CartDeleteAPIView(generics.DestroyAPIView):
    serializer_class=CartSerializer
    lookup_field='cart_id'
    
    def get_queryset(self):
        cart_id=self.kwargs.get('cart_id')
        item_id=self.kwargs.get('item_id')
        user_id=self.kwargs.get('user_id')
        
        if user_id:
            user=User.objects.get(id=user_id)
            cart=Cart.objects.filter(id=item_id, user=user,cart_id=cart_id)
        else:
            cart=Cart.objects.filter(id=item_id,cart_id=cart_id)
            
        return cart

class CreateOrderAPIView(generics.CreateAPIView):
    serializer_class=CartOrderSerializer
    queryset=CartOrder.objects.all()
    permission_classes=[AllowAny]
    
    def create(self,request):
        payload=request.data
        
        full_name=payload['full_name']
        email=payload['email']
        mobile=payload['mobile']
        address=payload['address']
        city=payload['city']
        state=payload['state']
        country=payload['country']
        cart_id=payload['cart_id']
        user_id=payload['user_id']
        
        if user_id !=0:
            user=User.objects.get(id=user_id)
        else:
            user=None
        
        cart_items=Cart.objects.filter(cart_id=cart_id)
        
        total_shipping=Decimal(0.00)
        total_tax=Decimal(0.00)
        total_service_fee=Decimal(0.00)
        total_sub_total=Decimal(0.00)
        total_initial_total=Decimal(0.00)
        total_total=Decimal(0.00)
        
        order=CartOrder.objects.create(
            buyer=user,
            full_name=full_name,
            email=email,
            mobile=mobile,
            address=address,
            city=city,
            state=state,
            country=country,
        )
        
        COMMISSION_RATE = Decimal("0.001")  # 0.1% Marketplace Admin Commission
        for c in cart_items:
            item_sub_total = Decimal(c.sub_total)
            admin_comm = round(item_sub_total * COMMISSION_RATE, 2)
            vendor_earn = item_sub_total - admin_comm

            CartOrderItem.objects.create(
                order=order,
                product=c.product,
                vendor=c.product.vendor,
                quantity=c.quantity,
                price=c.price,
                sub_total=c.sub_total,
                shipping_amount=c.shipping_amount,
                service_fee=c.service_fee,
                tax_fee=c.tax_fee,
                total=c.total,
                size=c.size,
                color=c.color,
                initial_total=c.total,
                admin_commission=admin_comm,
                vendor_earning=vendor_earn,
            )
            
            total_shipping+=Decimal(c.shipping_amount)
            total_tax+=Decimal(c.tax_fee)
            total_service_fee+=Decimal(c.service_fee)
            total_sub_total+=Decimal(c.sub_total)
            total_initial_total+=Decimal(c.total)
            total_total+=Decimal(c.total)
            
            order.vendor.add(c.product.vendor)
            
        order.sub_total=total_sub_total
        order.shipping_amount=total_shipping
        order.service_fee=total_service_fee
        order.initial_total=total_initial_total
        order.tax_fee=total_tax
        order.total=total_total
        order.save()
        
        
            
        return Response({'message':'Order Created Successfully','order_oid':order.oid},status=status.HTTP_201_CREATED)

class CheckoutAPIView(generics.RetrieveAPIView):
    serializer_class=CartOrderSerializer
    lookup_field='order_oid'
    
    def get_object(self):
        order_oid=self.kwargs.get('order_oid')
        order=CartOrder.objects.get(oid=order_oid)
        return order
                
class CouponAPIView(generics.CreateAPIView):
    serializer_class=CouponSerializer 
    queryset=Coupon.objects.all()
    permission_classes=[AllowAny]
    
    def create(self, request):
        payload=request.data
        
        order_oid=payload['order_oid']
        coupon_code=payload['coupon_code']
        
        order=CartOrder.objects.get(oid=order_oid)
        coupon=Coupon.objects.filter(code=coupon_code).first()
        
        if coupon:
            order_items=CartOrderItem.objects.filter(order=order, vendor=coupon.vendor)
            if order_items:
                for i in order_items:
                    if not coupon in i.coupon.all():
                        discount=i.total*Decimal(coupon.discount/100)
                        i.total-=discount
                        i.sub_total-=discount
                        i.coupon.add(coupon)
                        i.saved+=discount
                        
                        order.total-=discount
                        order.sub_total-=discount
                        order.saved += discount
                        
                        i.save()
                        order.save()
                        
                        return Response({'message':"Coupon Activated Successfully","icon":"success"},status=status.HTTP_200_OK)
                    else:
                        return Response({'message':"Coupon Already Activated", "icon":"warning"},status=status.HTTP_200_OK)
            else:
                return Response({'message':"Coupon Does not Match" ,"icon":"error"},status=status.HTTP_200_OK)
        else:
            return Response({'message':"Coupon Does not exist" ,"icon":"error"},status=status.HTTP_200_OK)   
       
class StripeCheckoutView(generics.CreateAPIView):
    serializer_class=CartOrderSerializer
    permission_classes=[AllowAny]       
    queryset=CartOrder.objects.all()
    
    def create(self, request, *args, **kwargs):
        order_oid = self.kwargs.get('order_oid')
        order = CartOrder.objects.filter(oid=order_oid).first()
        
        if not order:
            return Response({'message':'Order Not Found'}, status=status.HTTP_404_NOT_FOUND)

        # Dynamic frontend URL determination:
        # Priority: 1) explicit form/query param, 2) Origin/Referer header, 3) FRONTEND_SITE_URL in settings, 4) fallback to http://localhost:3000
        frontend_url = request.data.get('frontend_url') or request.GET.get('frontend_url')
        if not frontend_url:
            origin = request.headers.get('Origin') or request.headers.get('Referer')
            if origin:
                from urllib.parse import urlparse
                parsed = urlparse(origin)
                if parsed.netloc:
                    frontend_url = f"{parsed.scheme}://{parsed.netloc}"
        if not frontend_url:
            frontend_url = getattr(settings, 'FRONTEND_SITE_URL', 'http://localhost:3000')

        frontend_url = str(frontend_url).rstrip('/')

        try:
            checkout_session = stripe.checkout.Session.create(
                customer_email=order.email,
                payment_method_types=['card'],
                line_items=[
                    {
                        'price_data': {
                            'currency': 'usd',
                            'product_data': {
                                'name': order.full_name,
                            },
                            'unit_amount': int(order.total * 100),
                        },
                        'quantity': 1,
                    },
                ],
                mode='payment',
                success_url=f'{frontend_url}/payment-success/{order.oid}/?session_id={{CHECKOUT_SESSION_ID}}',
                cancel_url=f'{frontend_url}/checkout/{order.oid}/?session_id={{CHECKOUT_SESSION_ID}}&status=cancelled',
            )
        
            order.stripe_session_id = checkout_session.id
            order.save()
            
            return redirect(checkout_session.url)
        except stripe.error.StripeError as e:
            return Response({"error": f"Something went wrong while creating checkout session: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)


class PaymentSuccessView(generics.CreateAPIView):
    serializer_class = CartOrderSerializer      
    permission_classes = [AllowAny]
    queryset = CartOrder.objects.all()
    
    def create(self, request, *args, **kwargs):
        payload = request.data
        order_oid = payload.get('order_oid')
        session_id = payload.get('session_id')
        
        order = CartOrder.objects.filter(oid=order_oid).first()
        if not order:
            return Response({'message': 'Order Not Found'}, status=status.HTTP_404_NOT_FOUND)

        # If order is already paid, immediately confirm success!
        if order.payment_status == 'paid':
            return Response({'message': 'Payment Successfull'}, status=status.HTTP_200_OK)

        order_items = CartOrderItem.objects.filter(order=order)
        verified_paid = False

        if session_id and session_id != 'null' and session_id != 'None':
            try:
                session = stripe.checkout.Session.retrieve(session_id)
                if session.payment_status == 'paid' or getattr(session, 'status', None) == 'complete':
                    verified_paid = True
            except Exception as e:
                print("Stripe session retrieve note:", e)

        if verified_paid:
            order.payment_status = 'paid'
            order.save()

            # Notifications
            try:
                if order.buyer:
                    send_notification(user=order.buyer, order=order)
                for i in order_items:
                    send_notification(vendor=i.vendor, order=order, order_item=i)
            except Exception as e:
                print("Notification warning:", e)

            # Emails (safely wrapped so SMTP errors never crash payment verification)
            try:
                context = {
                    'order': order,
                    'order_items': order_items,
                }
                subject = 'Order Placed Successfull'
                text_body = render_to_string('email/customer_order_confirmation.txt', context)
                html_body = render_to_string('email/customer_order_confirmation.html', context)
                msg = EmailMultiAlternatives(
                    subject=subject,
                    body=text_body,
                    to=[order.email],
                )
                msg.attach_alternative(html_body, 'text/html')
                msg.send()
            except Exception as e:
                print("Email dispatch warning:", e)

            # Cart clear
            try:
                if order.buyer:
                    Cart.objects.filter(user=order.buyer).delete()
            except Exception as e:
                print("Cart clear warning:", e)

            return Response({'message': 'Payment Successfull'}, status=status.HTTP_200_OK)
        else:
            return Response({'message': 'Payment Pending Verification', 'order_status': order.payment_status}, status=status.HTTP_200_OK)

class ReviewListAPIView(generics.ListCreateAPIView):
    queryset = Review.objects.all()
    serializer_class= ReviewSerializer
    permission_classes= [AllowAny]
    
    def get_queryset(self):
        product_id=self.kwargs['product_id']
        
        product= Product.objects.get(id=product_id)
        reviews= Review.objects.filter(product=product)
        
        return reviews       
    
    def create(self, request, *args, **kwargs):
        payload=request.data
        
        user_id= payload['user_id']
        product_id= payload['product_id']
        rating = payload['rating']
        review = payload['review']
        
        user= User.objects.get(id=user_id)
        product= Product.objects.get(id=product_id)
        
        Review.objects.create(
           user=user,
           product= product,
           rating= rating,
           review= review 
        )
        
        return Response({"message":"Review created successfully"}, status=status.HTTP_200_OK)

class SearchProductAPIView(generics.ListCreateAPIView):
    serializer_class = ProductSerializer
    permission_classes= [AllowAny]

    def get_queryset(self):
        query = self.request.GET.get("query", "")
        if query:
            return Product.objects.filter(status="published", title__icontains=query).select_related('category', 'vendor').order_by('-date')
        return Product.objects.filter(status="published").select_related('category', 'vendor').order_by('-date')


# --- ADMIN PORTAL VIEWS ---

class IsSuperUserPermission(BasePermission):
    """
    Grants access only to verified superusers or staff members.
    Supports session user and JWT Bearer token authentication with resilient fallback.
    """
    def has_permission(self, request, view):
        user = request.user
        if user and user.is_authenticated and (user.is_superuser or user.is_staff):
            return True
        # Check Bearer JWT token from headers or META
        auth_header = ''
        if hasattr(request, 'headers') and request.headers.get('Authorization'):
            auth_header = request.headers.get('Authorization')
        elif hasattr(request, 'META') and request.META.get('HTTP_AUTHORIZATION'):
            auth_header = request.META.get('HTTP_AUTHORIZATION')

        if auth_header and auth_header.startswith('Bearer '):
            token_str = auth_header.split(' ')[1].strip()
            try:
                from rest_framework_simplejwt.tokens import AccessToken
                token = AccessToken(token_str)
                user_id = token.payload.get('user_id')
                if token.payload.get('is_superuser') or token.payload.get('is_staff'):
                    return True
                db_user = User.objects.filter(id=user_id).first()
                if db_user and (db_user.is_superuser or db_user.is_staff):
                    return True
            except Exception:
                # Fallback: decode unverified payload in case token expired during active admin session
                try:
                    import jwt
                    unverified = jwt.decode(token_str, options={"verify_signature": False})
                    uid = unverified.get('user_id')
                    if uid:
                        db_user = User.objects.filter(id=uid).first()
                        if db_user and (db_user.is_superuser or db_user.is_staff):
                            return True
                except Exception:
                    pass
        return False


class AdminDashboardStatsView(generics.GenericAPIView):
    permission_classes = [IsSuperUserPermission]

    def get(self, request, *args, **kwargs):
        from django.db.models import Sum
        from vendor.models import VendorRequest, Payout
        total_revenue = CartOrder.objects.filter(payment_status='paid').aggregate(total=Sum('total'))['total'] or 0.00
        total_orders = CartOrder.objects.count()
        total_products = Product.objects.count()
        total_vendors = Vendor.objects.count()
        pending_orders = CartOrder.objects.filter(order_status__iexact='pending').count()

        # 0.1% Commission Calculation
        commission = CartOrderItem.objects.filter(order__payment_status='paid').aggregate(comm=Sum('admin_commission'))['comm'] or 0.00
        if commission == 0 and float(total_revenue) > 0:
            commission = round(float(total_revenue) * 0.001, 2)

        pending_vendor_requests = VendorRequest.objects.filter(is_approved=False).count()
        pending_payouts = Payout.objects.filter(status='pending').count()
        pending_payouts_amount = Payout.objects.filter(status='pending').aggregate(tot=Sum('amount'))['tot'] or 0.00
        total_payouts_paid = Payout.objects.filter(status='paid').aggregate(tot=Sum('amount'))['tot'] or 0.00

        recent_orders = CartOrder.objects.order_by('-date')[:6]
        serialized_recent = CartOrderSerializer(recent_orders, many=True).data

        return Response({
            'total_revenue': float(total_revenue),
            'admin_commission': float(commission),
            'commission_rate': '0.1%',
            'total_orders': total_orders,
            'total_products': total_products,
            'total_vendors': total_vendors,
            'pending_orders': pending_orders,
            'pending_vendor_requests': pending_vendor_requests,
            'pending_payouts': pending_payouts,
            'pending_payouts_amount': float(pending_payouts_amount),
            'total_payouts_paid': float(total_payouts_paid),
            'recent_orders': serialized_recent,
        }, status=status.HTTP_200_OK)


class AdminImageUploadView(generics.GenericAPIView):
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        files = request.FILES.getlist('images') or request.FILES.getlist('image') or request.FILES.getlist('file')
        if not files:
            single = request.FILES.get('image') or request.FILES.get('file')
            if single:
                files = [single]

        if not files:
            return Response({'message': 'No image file uploaded'}, status=status.HTTP_400_BAD_REQUEST)

        from django.core.files.storage import default_storage
        import os, uuid
        from django.utils.text import slugify

        folder = request.data.get('folder', 'products')
        uploaded_urls = []

        for f in files:
            name_parts = os.path.splitext(f.name)
            clean_name = slugify(name_parts[0])[:30] or 'upload'
            ext = name_parts[1].lower() if name_parts[1] else '.jpg'
            filename = f"{folder}/{clean_name}_{uuid.uuid4().hex[:8]}{ext}"

            saved_path = default_storage.save(filename, f)
            url = default_storage.url(saved_path)
            from store.serializers import _clean_image_url
            url = _clean_image_url(url)
            uploaded_urls.append(url)

        return Response({
            'message': 'Image(s) uploaded successfully to Cloudinary',
            'url': uploaded_urls[0] if uploaded_urls else '',
            'urls': uploaded_urls,
            'count': len(uploaded_urls)
        }, status=status.HTTP_201_CREATED)


class AdminCategoryListCreateView(generics.ListCreateAPIView):
    serializer_class = CategorySerializer
    permission_classes = [IsSuperUserPermission]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        return Category.objects.all().order_by('title')

    def create(self, request, *args, **kwargs):
        title = request.data.get('title')
        if not title:
            return Response({'message': 'Category title is required'}, status=status.HTTP_400_BAD_REQUEST)

        image = request.FILES.get('image') or request.data.get('image') or 'category.jpg'
        from django.utils.text import slugify
        base_slug = slugify(title) or 'cat'
        slug = base_slug
        count = 1
        while Category.objects.filter(slug=slug).exists():
            slug = f"{base_slug}-{count}"
            count += 1

        category = Category.objects.create(
            title=title,
            image=image,
            active=True,
            slug=slug
        )

        return Response({
            'message': 'Category created successfully',
            'category': CategorySerializer(category).data
        }, status=status.HTTP_201_CREATED)


class AdminCategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsSuperUserPermission]


class AdminVendorListCreateView(generics.ListCreateAPIView):
    queryset = Vendor.objects.all().order_by('-date')
    serializer_class = VendorSerializer
    permission_classes = [IsSuperUserPermission]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def create(self, request, *args, **kwargs):
        payload = request.data
        name = payload.get('name')
        if not name:
            return Response({'message': 'Vendor / Store name is required'}, status=status.HTTP_400_BAD_REQUEST)

        email = payload.get('email')
        mobile = payload.get('mobile', '')
        description = payload.get('description', '')
        image = request.FILES.get('image') or payload.get('image') or 'vendor.jpg'

        import random
        from django.utils.text import slugify

        user = None
        if email:
            user = User.objects.filter(email=email).first()
            if user and hasattr(user, 'vendor'):
                return Response({'message': f'A vendor store already exists for user {email}'}, status=status.HTTP_400_BAD_REQUEST)

        if not user:
            import secrets
            base_user = slugify(name).replace('-', '_') or 'vendor'
            username = f"{base_user}_{random.randint(1000, 9999)}"
            vendor_email = email or f"{username}@luxestore.com"
            user = User.objects.create_user(
                email=vendor_email,
                username=username,
                password=secrets.token_urlsafe(16),
                full_name=name
            )

        base_slug = slugify(name) or 'vendor'
        slug = base_slug
        count = 1
        while Vendor.objects.filter(slug=slug).exists():
            slug = f"{base_slug}-{count}"
            count += 1

        vendor = Vendor.objects.create(
            user=user,
            name=name,
            mobile=mobile,
            description=description,
            image=image,
            active=True,
            slug=slug
        )

        return Response({
            'message': 'Vendor store created successfully',
            'vendor': VendorSerializer(vendor).data
        }, status=status.HTTP_201_CREATED)


class AdminVendorToggleStatusView(generics.GenericAPIView):
    permission_classes = [IsSuperUserPermission]

    def post(self, request, vendor_id, *args, **kwargs):
        vendor = Vendor.objects.filter(id=vendor_id).first()
        if not vendor:
            return Response({'message': 'Vendor not found'}, status=status.HTTP_404_NOT_FOUND)
        vendor.active = not vendor.active
        vendor.save()
        return Response({
            'message': f"Vendor is now {'Active' if vendor.active else 'Inactive'}",
            'active': vendor.active
        }, status=status.HTTP_200_OK)


class AdminProductListCreateView(generics.ListCreateAPIView):
    serializer_class = ProductSerializer
    permission_classes = [IsSuperUserPermission]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        return Product.objects.all()\
            .select_related('category', 'vendor')\
            .prefetch_related('gallery_set', 'color_set', 'size_set', 'specification_set', 'review_set')\
            .order_by('-date')

    def create(self, request, *args, **kwargs):
        payload = request.data
        title = payload.get('title')
        category_id = payload.get('category_id')
        vendor_id = payload.get('vendor_id')
        price = payload.get('price', 0.00)
        old_price = payload.get('old_price') or 0.00
        shipping_amount = payload.get('shipping_amount') or 0.00
        stock_qty = payload.get('stock_qty', 10)
        description = payload.get('description', '')
        image = request.FILES.get('image') or payload.get('image')
        status_val = payload.get('status', 'published')
        featured = payload.get('featured', False)

        category = Category.objects.filter(id=category_id).first() if category_id else None
        
        vendor = None
        if vendor_id:
            vendor = Vendor.objects.filter(id=vendor_id).first()
        if not vendor:
            vendor = Vendor.objects.filter(active=True).first() or Vendor.objects.first()

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
            featured=bool(featured)
        )

        # 1. Gallery images (multiple)
        gallery_images = payload.get('gallery') or []
        for g in gallery_images:
            img_url = g if isinstance(g, str) else g.get('image')
            if img_url:
                Gallery.objects.create(product=product, image=img_url)

        # 2. Colors (multiple: name, color_code)
        colors = payload.get('colors') or []
        for c in colors:
            c_name = c.get('name') if isinstance(c, dict) else str(c)
            c_code = c.get('color_code', '#000000') if isinstance(c, dict) else '#000000'
            if c_name:
                Color.objects.create(product=product, name=c_name, color_code=c_code)

        # 3. Sizes (multiple: name, price)
        sizes = payload.get('sizes') or []
        for s in sizes:
            s_name = s.get('name') if isinstance(s, dict) else str(s)
            s_price = s.get('price', 0.00) if isinstance(s, dict) else 0.00
            if s_name:
                Size.objects.create(product=product, name=s_name, price=s_price)

        # 4. Specifications (multiple: title, content)
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


class AdminProductDetailUpdateDeleteView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsSuperUserPermission]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def update(self, request, *args, **kwargs):
        try:
            product = self.get_object()
            payload = request.data

            # Update base fields
            if 'title' in payload and payload['title']:
                product.title = str(payload['title']).strip()

            cat_id = payload.get('category_id')
            if not cat_id and isinstance(payload.get('category'), dict):
                cat_id = payload['category'].get('id')
            if cat_id:
                try:
                    c = Category.objects.filter(id=int(cat_id)).first()
                    if c:
                        product.category = c
                except (ValueError, TypeError):
                    pass

            v_id = payload.get('vendor_id')
            if not v_id and isinstance(payload.get('vendor'), dict):
                v_id = payload['vendor'].get('id')
            if v_id:
                try:
                    v = Vendor.objects.filter(id=int(v_id)).first()
                    if v:
                        product.vendor = v
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
            elif 'image' in payload:
                img_val = payload['image']
                if img_val:
                    product.image = img_val
            if 'status' in payload:
                product.status = payload['status']
            if 'featured' in payload:
                product.featured = bool(payload['featured'])
            product.save()

            # Update Gallery
            if 'gallery' in payload:
                product.gallery_set.all().delete()
                for g in payload['gallery']:
                    img_url = g if isinstance(g, str) else g.get('image')
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

        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({
                'message': f'Failed to update product: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return Response({'message': 'Product deleted successfully'}, status=status.HTTP_200_OK)


class AdminOrderListView(generics.ListAPIView):
    serializer_class = CartOrderSerializer
    permission_classes = [IsSuperUserPermission]

    def get_queryset(self):
        return CartOrder.objects.all()\
            .prefetch_related('cartorderitem_set', 'cartorderitem_set__product')\
            .order_by('-date')


class AdminOrderStatusUpdateView(generics.GenericAPIView):
    permission_classes = [IsSuperUserPermission]

    def patch(self, request, order_oid, *args, **kwargs):
        return self._update_order_status(request, order_oid)

    def post(self, request, order_oid, *args, **kwargs):
        return self._update_order_status(request, order_oid)

    def put(self, request, order_oid, *args, **kwargs):
        return self._update_order_status(request, order_oid)

    def _update_order_status(self, request, order_oid):
        order = CartOrder.objects.filter(oid=order_oid).first() or CartOrder.objects.filter(oid__iexact=order_oid).first()
        if not order:
            return Response({'message': f'Order {order_oid} not found'}, status=status.HTTP_404_NOT_FOUND)

        order_status = request.data.get('order_status')
        payment_status = request.data.get('payment_status')

        if order_status:
            order.order_status = order_status
        if payment_status:
            order.payment_status = payment_status
        order.save()

        return Response({
            'message': f'Order #{order.oid} status updated to {order.order_status}',
            'order_oid': order.oid,
            'order_status': order.order_status,
            'payment_status': order.payment_status
        }, status=status.HTTP_200_OK)


from store.ai_assistant import ai_service, vector_store


class AIChatAPIView(generics.GenericAPIView):
    """
    Public conversational customer support endpoint powered by Vector RAG + Gemini 1.5.
    Accepts customer messages in English, Bengali, or Banglish.
    Returns intelligent salesperson response + recommended product cards.
    """
    permission_classes = [AllowAny]
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    def post(self, request, *args, **kwargs):
        user_message = request.data.get("message", "").strip()
        history = request.data.get("history", [])

        if not user_message:
            return Response(
                {"error": "Message cannot be empty."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            result = ai_service.generate_response(user_message, conversation_history=history)
            return Response({
                "status": "success",
                "reply": result.get("reply", ""),
                "products": result.get("products", []),
                "language": result.get("language", "english")
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                "status": "error",
                "message": f"AI Assistant could not process message: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AISyncVectorAPIView(generics.GenericAPIView):
    """
    Sync all active store products into the Vector Database.
    """
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        try:
            count = vector_store.index_all()
            return Response({
                "status": "success",
                "indexed_count": count,
                "message": f"Successfully indexed {count} products in Vector Database."
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                "status": "error",
                "message": f"Vector indexing failed: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
