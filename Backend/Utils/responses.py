from rest_framework.response import Response
from rest_framework import status

def api_response(message, status_type="success", http_status=status.HTTP_200_OK, data=None):
    payload = {
        "status": status_type,
        "message": message,
    }
    if data is not None:
        payload["data"] = data

    return Response(payload, status=http_status)
