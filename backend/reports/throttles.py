from rest_framework.throttling import ScopedRateThrottle


class ReportCreateThrottle(ScopedRateThrottle):
    scope = "report"
