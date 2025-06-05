from django.db import migrations
import pgvector.django

class Migration(migrations.Migration):

    dependencies = [
        ('api', '0007_create_agent'),
    ]

    operations = [
        migrations.AlterField(
            model_name='agent',
            name='embedding',
            field=pgvector.django.VectorField(dimensions=768, null=True, blank=True),
        ),
    ]

