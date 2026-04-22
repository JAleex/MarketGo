import base64
import logging
from django.conf import settings
import msal
from config.settings import *
import re


logger = logging.getLogger(__name__)

class GraphEmailSender:
    """Alternativa usando Graph API para enviar correos"""
    
    def __init__(self):
        # Obtener credenciales desde settings (que lee del .env)
        self.tenant_id = settings.AZURE_TENANT_ID
        self.client_id = settings.AZURE_CLIENT_ID
        self.client_secret = settings.AZURE_CLIENT_SECRET
        self.from_email = settings.DEFAULT_FROM_EMAIL
        
        # Extraer solo el email de DEFAULT_FROM_EMAIL
        from_email_raw = settings.DEFAULT_FROM_EMAIL
        self.from_email = self._extract_email_address(from_email_raw)
        self.from_name = self._extract_display_name(from_email_raw)
        
        authority = f"https://login.microsoftonline.com/{self.tenant_id}"
        
        self.msal_app = msal.ConfidentialClientApplication(
            client_id=self.client_id,
            authority=authority,
            client_credential=self.client_secret,
        )
        self.scopes = ["https://graph.microsoft.com/.default"]
    


    def _extract_email_address(self, email_string):
        match = re.search(r'<([^>]+)>', email_string)
        if match:
            return match.group(1).strip()
        
        return email_string.strip()
    
    def _extract_display_name(self, email_string):

        match = re.search(r'^([^<]+)<', email_string)
        if match:
            return match.group(1).strip()
        return None
    
    def _prepare_from_field(self):
        """Preparar el campo from con nombre y email"""
        if self.from_name:
            return {
                "emailAddress": {
                    "name": self.from_name,
                    "address": self.from_email
                }
            }
        else:
            return {
                "emailAddress": {
                    "address": self.from_email
                }
            }
            

    def send_email(self, to_email, subject, html_content):
        """Enviar email básico usando Graph API"""
        import requests
        
        print(f"Enviando email de {self.from_email} a {to_email}")
        
        # Obtener token
        result = self.msal_app.acquire_token_for_client(scopes=self.scopes)
        
        if "access_token" not in result:
            error_msg = f"Error obteniendo token: {result}"
            print(error_msg)
            raise Exception(error_msg)
        
        print("Token obtenido exitosamente")
        
        # Preparar el email
        email_data = {
            "message": {
                "subject": subject,
                "body": {
                    "contentType": "HTML",
                    "content": html_content
                },
                "toRecipients": [
                    {
                        "emailAddress": {
                            "address": to_email
                        }
                    }
                ]
            }
        }
        
        # Enviar via Graph API
        headers = {
            'Authorization': f"Bearer {result['access_token']}",
            'Content-Type': 'application/json'
        }
        
        # Usar el email configurado en .env
        graph_url = f"https://graph.microsoft.com/v1.0/users/{self.from_email}/sendMail"
        
        print(f"Enviando a Graph API: {graph_url}")
        
        response = requests.post(graph_url, json=email_data, headers=headers)
        
        if response.status_code == 202:
            print("✅ Email enviado exitosamente via Graph API")
            return True
        else:
            error_msg = f"❌ Error enviando email: {response.status_code} - {response.text}"
            print(error_msg)
            return False

    def send_email_with_attachment(self, to_email, subject, html_content, attachment_data, attachment_filename, attachment_content_type='application/octet-stream'):
        """Enviar email con adjunto usando Graph API"""
        import requests
        
        print(f"Enviando email con adjunto de {self.from_email} a {to_email}")
        print(f"Adjunto: {attachment_filename} ({len(attachment_data)} bytes)")
        
        # Obtener token
        result = self.msal_app.acquire_token_for_client(scopes=self.scopes)
        
        if "access_token" not in result:
            error_msg = f"Error obteniendo token: {result}"
            print(error_msg)
            raise Exception(error_msg)
        
        print("Token obtenido exitosamente")
        
        # Codificar el adjunto en base64
        attachment_base64 = base64.b64encode(attachment_data).decode('utf-8')
        
        # Preparar el email con adjunto
        email_data = {
            "message": {
                "subject": subject,
                "body": {
                    "contentType": "HTML",
                    "content": html_content
                },
                "toRecipients": [
                    {
                        "emailAddress": {
                            "address": to_email
                        }
                    }
                ],
                "attachments": [
                    {
                        "@odata.type": "#microsoft.graph.fileAttachment",
                        "name": attachment_filename,
                        "contentType": attachment_content_type,
                        "contentBytes": attachment_base64
                    }
                ]
            }
        }
        
        # Enviar via Graph API
        headers = {
            'Authorization': f"Bearer {result['access_token']}",
            'Content-Type': 'application/json'
        }
        
        # Usar el email configurado en .env
        graph_url = f"https://graph.microsoft.com/v1.0/users/{self.from_email}/sendMail"
        
        print(f"Enviando a Graph API: {graph_url}")
        
        response = requests.post(graph_url, json=email_data, headers=headers)
        
        if response.status_code == 202:
            print("✅ Email con adjunto enviado exitosamente via Graph API")
            return True
        else:
            error_msg = f"❌ Error enviando email: {response.status_code} - {response.text}"
            print(error_msg)
            return False

    def send_email_with_inline_image(self, to_email, subject, html_content, image_data, image_filename, content_id='qr_code'):
        """Enviar email con imagen incrustada (inline) usando Graph API"""
        import requests
        
        print(f"Enviando email con imagen inline de {self.from_email} a {to_email}")
        print(f"Imagen: {image_filename} ({len(image_data)} bytes)")
        
        # Obtener token
        result = self.msal_app.acquire_token_for_client(scopes=self.scopes)
        
        if "access_token" not in result:
            error_msg = f"Error obteniendo token: {result}"
            print(error_msg)
            raise Exception(error_msg)
        
        print("Token obtenido exitosamente")
        
        # Codificar la imagen en base64
        image_base64 = base64.b64encode(image_data).decode('utf-8')
        
        # Modificar el HTML para usar la imagen inline
        html_with_image = html_content.replace(
            'src="cid:qr_code"',
            f'src="cid:{content_id}" style="width: 300px; height: auto; display: block; margin: 0 auto;"'
        )
        
        # Preparar el email con imagen inline
        email_data = {
            "message": {
                "subject": subject,
                "body": {
                    "contentType": "HTML",
                    "content": html_with_image
                },
                "toRecipients": [
                    {
                        "emailAddress": {
                            "address": to_email
                        }
                    }
                ],
                "attachments": [
                    {
                        "@odata.type": "#microsoft.graph.fileAttachment",
                        "name": image_filename,
                        "contentType": "image/png",
                        "contentBytes": image_base64,
                        "contentId": content_id,
                        "isInline": True
                    },
                    {
                        "@odata.type": "#microsoft.graph.fileAttachment",
                        "name": image_filename,
                        "contentType": "image/png", 
                        "contentBytes": image_base64,
                        "isInline": False
                    }
                ]
            }
        }
        
        # Enviar via Graph API
        headers = {
            'Authorization': f"Bearer {result['access_token']}",
            'Content-Type': 'application/json'
        }
        
        # Usar el email configurado en .env
        graph_url = f"https://graph.microsoft.com/v1.0/users/{self.from_email}/sendMail"
        
        print(f"Enviando a Graph API: {graph_url}")
        
        response = requests.post(graph_url, json=email_data, headers=headers)
        
        if response.status_code == 202:
            print("✅ Email con imagen inline enviado exitosamente via Graph API")
            return True
        else:
            error_msg = f"❌ Error enviando email: {response.status_code} - {response.text}"
            print(error_msg)
            return False