from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import (
    Session, Class, Section, Subject, 
    CocurricularSubject, OptionalSubject, Teacher
)
from .cache_utils import invalidate_model_cache

@receiver(post_save, sender=Session)
@receiver(post_delete, sender=Session)
def invalidate_session_cache(sender, instance, **kwargs):
    invalidate_model_cache('session')

@receiver(post_save, sender=Class)
@receiver(post_delete, sender=Class)
def invalidate_class_cache(sender, instance, **kwargs):
    invalidate_model_cache('class')

@receiver(post_save, sender=Section)
@receiver(post_delete, sender=Section)
def invalidate_section_cache(sender, instance, **kwargs):
    invalidate_model_cache('section')

@receiver(post_save, sender=Subject)
@receiver(post_delete, sender=Subject)
def invalidate_subject_cache(sender, instance, **kwargs):
    invalidate_model_cache('subject')

@receiver(post_save, sender=CocurricularSubject)
@receiver(post_delete, sender=CocurricularSubject)
def invalidate_cocurricular_subject_cache(sender, instance, **kwargs):
    invalidate_model_cache('cocurricularsubject')

@receiver(post_save, sender=OptionalSubject)
@receiver(post_delete, sender=OptionalSubject)
def invalidate_optional_subject_cache(sender, instance, **kwargs):
    invalidate_model_cache('optionalsubject')

@receiver(post_save, sender=Teacher)
@receiver(post_delete, sender=Teacher)
def invalidate_teacher_cache(sender, instance, **kwargs):
    invalidate_model_cache('teacher')
