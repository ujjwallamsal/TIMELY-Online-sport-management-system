# timely/settings.py
import os
from pathlib import Path
import environ
from datetime import timedelta

# --- Paths / env ---
BASE_DIR = Path(__file__).resolve().parent.parent
env = environ.Env(
    DEBUG=(bool, False),
    ACCESS_TOKEN_LIFETIME_MIN=(int, 60),
    REFRESH_TOKEN_LIFETIME_DAYS=(int, 7),
)
environ.Env.read_env(BASE_DIR / ".env")

# --- Core ---
DEBUG = env.bool("DEBUG", default=True)
SECRET_KEY = env("SECRET_KEY", default="insecure-key")
ALLOWED_HOSTS = ["*"]

# --- Apps ---
INSTALLED_APPS = [
    # Django core (order matters for custom user model)
    "django.contrib.contenttypes",
    "django.contrib.auth",
    
    # First-party (Timely) - accounts must come before admin
    "accounts",          # <- custom user lives here
    
    # Django admin (depends on accounts.User)
    "django.contrib.admin",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    # 3rd-party
    "rest_framework",
    "rest_framework.authtoken",
    "django_filters",
    "drf_spectacular",
    "corsheaders",
    
    # First-party (Timely) - remaining apps
    "venues",
    "events",
    "teams",
    "registrations",
    "fixtures",
    "tickets",
    "reports",
    "results",
    "notifications",
    "content.apps.ContentConfig",
    "gallery",
    'payments',
    "public",
    "mediahub",
    "adminapi",
    "kyc",
    "audit",
    "settingshub",
    "privacy",
    "scheduler",
    "realtime",
]

# --- Middleware ---
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "common.middleware.PublicEndpointMiddleware",  # Add our custom middleware
    "common.security.SecurityHeadersMiddleware",  # Security headers
]

ROOT_URLCONF = "timely.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ]
        },
    }
]

WSGI_APPLICATION = "timely.wsgi.application"
ASGI_APPLICATION = "timely.asgi.application"

# --- Database (PostgreSQL via .env) ---
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": env("DB_NAME", default="timely_db"),
        "USER": env("DB_USER", default="postgres"),
        "PASSWORD": env("DB_PASSWORD", default="postgres"),
        "HOST": env("DB_HOST", default="localhost"),
        "PORT": env("DB_PORT", default="5432"),
        "CONN_MAX_AGE": 60,
    }
}

# --- Passwords ---
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator", "OPTIONS": {"min_length": 8}},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# --- I18N / TZ ---
LANGUAGE_CODE = "en-us"
TIME_ZONE = "Australia/Sydney"
USE_I18N = True
USE_TZ = True

# --- Static / Media ---
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_DIRS = [BASE_DIR / "static"] if (BASE_DIR / "static").exists() else []

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# Media Hub settings
MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10MB
MAX_VIDEO_SIZE = 100 * 1024 * 1024  # 100MB
MEDIA_THUMBNAIL_SIZE = (300, 300)
MEDIA_THUMBNAIL_QUALITY = 85

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# --- Auth (custom user) ---
AUTH_USER_MODEL = "accounts.User"

# Custom authentication backends
AUTHENTICATION_BACKENDS = [
    'accounts.backends.EmailOrUsernameModelBackend',
    'django.contrib.auth.backends.ModelBackend',
]

# --- DRF / Filters / JWT / Schema ---
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "accounts.auth.CookieJWTAuthentication",
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        # Remove global permission requirement - let each view handle its own
    ],
    "DEFAULT_PAGINATION_CLASS": "common.pagination.TimelyPageNumberPagination",
    "PAGE_SIZE": 12,
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "100/min",
        "user": "1000/min",
        "public_checkout": "10/min",
        "login": "10/min",
    },
}

SPECTACULAR_SETTINGS = {
    "TITLE": "Timely API",
    "DESCRIPTION": "Online Sports Events Management System API",
    "VERSION": "1.0.0",
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=env.int("ACCESS_TOKEN_LIFETIME_MIN", default=60)),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=env.int("REFRESH_TOKEN_LIFETIME_DAYS", default=7)),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": True,
    "AUTH_COOKIE": "access",
    "AUTH_COOKIE_REFRESH": "refresh",
    "AUTH_COOKIE_DOMAIN": None,
    "AUTH_COOKIE_SECURE": False,  # dev only; set True on HTTPS
    "AUTH_COOKIE_HTTP_ONLY": True,
    "AUTH_COOKIE_PATH": "/",
    "AUTH_COOKIE_SAMESITE": "Lax",
}

# Email verification settings
EMAIL_VERIFICATION_REQUIRED = True
EMAIL_VERIFICATION_TOKEN_EXPIRY = 24 * 60 * 60  # 24 hours in seconds

# --- CORS Configuration ---
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS = [
    "http://127.0.0.1:5173",
    "http://localhost:5173",
    "http://127.0.0.1:5174",
    "http://localhost:5174",
    "http://127.0.0.1:5175",
    "http://localhost:5175",
    "http://127.0.0.1:5176",
    "http://localhost:5176",
    "http://127.0.0.1:5177",
    "http://localhost:5177",
    "http://127.0.0.1:5178",
    "http://localhost:5178",
]

# CORS origin whitelist for compatibility
CORS_ORIGIN_WHITELIST = CORS_ALLOWED_ORIGINS

# Explicitly deny all other origins
CORS_ALLOW_ALL_ORIGINS = False

CSRF_TRUSTED_ORIGINS = [
    "http://127.0.0.1:5173",
    "http://localhost:5173",
    "http://127.0.0.1:5174",
    "http://localhost:5174",
    "http://127.0.0.1:5175",
    "http://localhost:5175",
    "http://127.0.0.1:5176",
    "http://localhost:5176",
    "http://127.0.0.1:5177",
    "http://localhost:5177",
    "http://127.0.0.1:5178",
    "http://localhost:5178",
]

# Email configuration
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
FRONTEND_ORIGIN = "http://localhost:5173"
DEFAULT_FROM_EMAIL = "no-reply@timely.local"

# Point to your React app for deep links (change later)
FRONTEND_URL = "http://localhost:5173"

# Redirect URLs
LOGIN_REDIRECT_URL = "/"
LOGOUT_REDIRECT_URL = "/"

# --- Security Settings ---
# Session and Cookie Security
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"
SESSION_COOKIE_SECURE = not DEBUG  # True in production
SESSION_COOKIE_AGE = 1209600  # 2 weeks
SESSION_EXPIRE_AT_BROWSER_CLOSE = False

# CSRF Security
CSRF_COOKIE_HTTPONLY = True
CSRF_COOKIE_SAMESITE = "Lax"
CSRF_COOKIE_SECURE = not DEBUG  # True in production
CSRF_USE_SESSIONS = False
CSRF_COOKIE_NAME = "csrftoken"

# Password Security
# Django uses PBKDF2 by default (recommended)
# For bcrypt: pip install bcrypt and uncomment below
# PASSWORD_HASHERS = [
#     'django.contrib.auth.hashers.BCryptSHA256PasswordHasher',
#     'django.contrib.auth.hashers.PBKDF2PasswordHasher',
#     'django.contrib.auth.hashers.PBKDF2SHA1PasswordHasher',
#     'django.contrib.auth.hashers.Argon2PasswordHasher',
#     'django.contrib.auth.hashers.ScryptPasswordHasher',
# ]

# Security Headers
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# Channels configuration: use Redis only if REDIS_URL is set; otherwise in-memory for dev
if os.environ.get("REDIS_URL"):
    CHANNEL_LAYERS = {
        'default': {
            'BACKEND': 'channels_redis.core.RedisChannelLayer',
            'CONFIG': {
                'hosts': [os.environ.get('REDIS_URL')],
            },
        },
    }
else:
    CHANNEL_LAYERS = {
        'default': {
            'BACKEND': 'channels.layers.InMemoryChannelLayer',
        },
    }

# Real-time Configuration
REALTIME_CONFIG = {
    'ENABLE_WEBSOCKETS': True,
    'NOTIFICATION_INTERVAL': 5,  # seconds
    'MATCH_UPDATE_INTERVAL': 10,  # seconds
    'LEADERBOARD_UPDATE_INTERVAL': 30,  # seconds
}

# Stripe Configuration
STRIPE_PUBLISHABLE_KEY = os.environ.get('STRIPE_PUBLISHABLE_KEY', 'pk_test_your_test_key_here')
STRIPE_SECRET_KEY = os.environ.get('STRIPE_SECRET_KEY', 'sk_test_your_test_key_here')
STRIPE_WEBHOOK_SECRET = os.environ.get('STRIPE_WEBHOOK_SECRET', 'whsec_your_webhook_secret_here')

# Enhanced Email Configuration for Payment Confirmations
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'  # Console for development
EMAIL_HOST = 'localhost'
EMAIL_PORT = 1025
EMAIL_USE_TLS = False

# Admin branding - will be set in apps.py to avoid "Apps aren't loaded yet" error

# Admin hardening (dev defaults; enable in production)
SECURE_SSL_REDIRECT = False  # True in prod

# Cache Configuration
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'unique-snowflake',
        'TIMEOUT': 300,  # 5 minutes default
        'OPTIONS': {
            'MAX_ENTRIES': 1000,
        }
    }
}

# Logging Configuration
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
        'query': {
            'format': '{asctime} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': BASE_DIR / 'security.log',
            'formatter': 'verbose',
        },
        'console': {
            'level': 'DEBUG' if DEBUG else 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
        'query_file': {
            'level': 'DEBUG',
            'class': 'logging.FileHandler',
            'filename': BASE_DIR / 'slow_queries.log',
            'formatter': 'query',
        },
    },
    'loggers': {
        'django.security': {
            'handlers': ['file', 'console'],
            'level': 'INFO',
            'propagate': True,
        },
        'common.security': {
            'handlers': ['file', 'console'],
            'level': 'INFO',
            'propagate': True,
        },
        'django.db.backends': {
            'handlers': ['query_file'] if DEBUG else [],
            'level': 'DEBUG',
            'propagate': False,
        },
    },
}

# Query logging for slow queries (>200ms)
if DEBUG:
    LOGGING['loggers']['django.db.backends']['handlers'] = ['query_file']
    LOGGING['loggers']['django.db.backends']['level'] = 'DEBUG'

# Optional: IP allowlist for admin (example)
# ADMIN_IP_ALLOWLIST = {"127.0.0.1", "::1"}
# In middleware or a custom AdminSite, enforce request.META['REMOTE_ADDR'] in allowlist.

# Optional 2FA: django-otp integration (stub)
# INSTALLED_APPS += ["django_otp", "django_otp.plugins.otp_totp"]
# MIDDLEWARE.insert(0, "django_otp.middleware.OTPMiddleware")

