# Generated by Django 5.2 on 2025-04-28 02:37

import pgvector.django
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='chunk',
            name='embedding',
            field=pgvector.django.VectorField(dimensions=768, verbose_name=models.FloatField()),
        ),
    ]
