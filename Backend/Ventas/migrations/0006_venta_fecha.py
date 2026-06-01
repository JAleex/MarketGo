from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('Ventas', '0005_venta_comprador_alter_venta_fk_usuario'),
    ]

    operations = [
        migrations.AddField(
            model_name='venta',
            name='fecha',
            field=models.DateTimeField(auto_now_add=True, null=True),
        ),
    ]
