# sports/admin.py
from django.contrib import admin
from .models import Sport


# Hide Sports from admin if not needed
def _unregister_sport():
    try:
        admin.site.unregister(Sport)
    except Exception:
        # Not registered or already unregistered
        pass

_unregister_sport()