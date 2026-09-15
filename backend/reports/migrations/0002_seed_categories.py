from django.db import migrations


def seed_categories(apps, schema_editor):
    category = apps.get_model("reports", "Category")
    for name in (
        "Descarte irregular de resíduos",
        "Desmatamento",
        "Poluição da água",
        "Poluição do ar",
        "Queimada",
        "Outros impactos ambientais",
    ):
        category.objects.using(schema_editor.connection.alias).get_or_create(name=name)


class Migration(migrations.Migration):
    dependencies = [("reports", "0001_initial")]
    operations = [migrations.RunPython(seed_categories, migrations.RunPython.noop)]
