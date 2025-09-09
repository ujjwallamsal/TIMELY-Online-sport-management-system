"""
Default pagination configuration for Timely API
"""
from rest_framework.pagination import PageNumberPagination


class TimelyPageNumberPagination(PageNumberPagination):
    """
    Default pagination for all list endpoints
    Page size of 12 for optimal performance on public lists
    """
    page_size = 12
    page_size_query_param = 'page_size'
    max_page_size = 100
