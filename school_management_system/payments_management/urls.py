"""
URL configuration for Payments Management API.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    FeeStructureViewSet,
    FeeDiscountViewSet,
    StudentFeeViewSet,
    PaymentViewSet,
    PaymentReminderViewSet
)

router = DefaultRouter()
router.register(r'fee-structures', FeeStructureViewSet)
router.register(r'fee-discounts', FeeDiscountViewSet)
router.register(r'student-fees', StudentFeeViewSet)
router.register(r'payments', PaymentViewSet)
router.register(r'payment-reminders', PaymentReminderViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
