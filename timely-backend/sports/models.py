# sports/models.py
from django.db import models
from django.utils import timezone


class Sport(models.Model):
    """Sport model for the lean MVP"""
    name = models.CharField(max_length=100, unique=True, help_text="Sport name")
    description = models.TextField(blank=True, help_text="Sport description")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['created_at']),
        ]
        verbose_name = 'Sport'
        verbose_name_plural = 'Sports'
    
    def __str__(self):
        return self.name