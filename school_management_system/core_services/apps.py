from django.apps import AppConfig


class CoreServicesConfig(AppConfig):
    name = 'core_services'

    def ready(self):
        import core_services.signals
