# timely/settings.py
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
ALLOWED_HOSTS = [h.strip() for h in env("ALLOWED_HOSTS", default="127.0.0.1,localhost").split(",") if h.strip()]

# --- Apps ---
INSTALLED_APPS = [
    # Django
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    # 3rd-party
    "rest_framework",
    "rest_framework.authtoken",
    "django_filters",
    "drf_spectacular",
    "corsheaders",
    

    # First-party (Timely)
    "accounts",          # <- custom user lives here
    "venues",
    "events",
    "teams",
    "registrations",
    "fixtures",
    "tickets",
    "results",
    "notifications",
    "content.apps.ContentConfig",
    "gallery",
    'payments',
    "reports",
]

# --- Middleware ---
MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
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

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# --- Auth (custom user) ---
AUTH_USER_MODEL = "accounts.User"

# --- DRF / Filters / JWT / Schema ---
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticatedOrReadOnly",
    ],
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
}

# --- CORS (React/Vite defaults) ---
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
FRONTEND_ORIGIN = "http://localhost:5173"  # your React dev URL

DEFAULT_FROM_EMAIL = "no-reply@timely.local"


# DRF throttling (reuse what you already added)
REST_FRAMEWORK.setdefault("DEFAULT_THROTTLE_CLASSES", [
    "rest_framework.throttling.AnonRateThrottle",
    "rest_framework.throttling.UserRateThrottle",
])
REST_FRAMEWORK.setdefault("DEFAULT_THROTTLE_RATES", {
    "anon": "100/hour",
    "user": "1000/hour",
    "public_checkout": "10/minute",
})


REST_FRAMEWORK = {
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
        "rest_framework.authentication.SessionAuthentication",  # for browsable API
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_THROTTLE_RATES": {
        "public_checkout": "5/hour",
    },
}

SPECTACULAR_SETTINGS = {
    "TITLE": "Timely API",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
}

# Email (dev): console backend prints emails in runserver logs
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
DEFAULT_FROM_EMAIL = "no-reply@timely.local"

# Point to your React app for deep links (change later)
FRONTEND_URL = "http://localhost:5173"

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

# If you use CSRF-protected POSTs later:
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]


REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"] = {
    "public_checkout": "5/min",
    "anon": "60/min",
    "user": "120/min",
    "login": "10/min",
}

LOGIN_REDIRECT_URL = "/"
LOGOUT_REDIRECT_URL = "/"

