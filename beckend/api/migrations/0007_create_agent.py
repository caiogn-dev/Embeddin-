from django.db import migrations, models
import pgvector.django

class Migration(migrations.Migration):

    dependencies = [
        ('api', '0006_document_token_count'),
    ]

    operations = [
        migrations.CreateModel(
            name='Agent',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255)),
                ('description', models.TextField(blank=True)),
                ('prompt', models.TextField()),
                ('embedding', pgvector.django.VectorField(dimensions=768)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={'ordering': ['-created_at']},
        ),
    ]
