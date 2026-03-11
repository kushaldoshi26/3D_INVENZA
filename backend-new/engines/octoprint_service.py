import requests
from typing import Dict, Any, Optional
import os

class OctoPrintService:
    def __init__(self):
        self.timeout = 5 # seconds

    def _get_headers(self, api_key: str) -> Dict[str, str]:
        return {"X-Api-Key": api_key}

    def check_connection(self, api_url: str, api_key: str) -> Dict[str, Any]:
        """Check connection to OctoPrint instance"""
        try:
            url = f"{api_url}/version"
            response = requests.get(url, headers=self._get_headers(api_key), timeout=self.timeout)
            if response.status_code == 200:
                return {"connected": True, "version": response.json().get("text")}
            return {"connected": False, "error": f"Status code {response.status_code}"}
        except Exception as e:
            return {"connected": False, "error": str(e)}

    def get_printer_status(self, api_url: str, api_key: str) -> Dict[str, Any]:
        """Get current printer operational status"""
        try:
            url = f"{api_url}/printer" # Full state
            # Usually /api/printer returns current temperatures and state
            response = requests.get(url, headers=self._get_headers(api_key), timeout=self.timeout)
            
            if response.status_code == 200:
                data = response.json()
                state = data.get("state", {})
                temps = data.get("temperature", {})
                
                return {
                    "online": True,
                    "state": state.get("text", "Unknown"),
                    "flags": state.get("flags", {}),
                    "temperatures": {
                        "tool0": temps.get("tool0", {}),
                        "bed": temps.get("bed", {})
                    }
                }
            elif response.status_code == 409:
                return {"online": True, "state": "Printer is not operational"}
            
            return {"online": False, "error": f"Status {response.status_code}"}
        except Exception as e:
            return {"online": False, "error": str(e)}

    def upload_file(self, api_url: str, api_key: str, file_path: str, print_after_upload: bool = False) -> Dict[str, Any]:
        """Upload G-code file to OctoPrint"""
        try:
            url = f"{api_url}/files/local"
            
            if not os.path.exists(file_path):
                return {"success": False, "error": "File not found locally"}

            files = {'file': open(file_path, 'rb')}
            data = {'print': 'true'} if print_after_upload else {}
            
            response = requests.post(url, headers=self._get_headers(api_key), files=files, data=data, timeout=30)
            
            if response.status_code in [201, 200]:
                return {"success": True, "details": response.json()}
            
            return {"success": False, "error": f"Upload failed: {response.text}"}
            
        except Exception as e:
            return {"success": False, "error": str(e)}

    def start_job(self, api_url: str, api_key: str) -> Dict[str, Any]:
        """Start selected job"""
        try:
            url = f"{api_url}/job"
            data = {"command": "start"}
            response = requests.post(url, headers=self._get_headers(api_key), json=data, timeout=self.timeout)
            
            if response.status_code == 204:
                return {"success": True}
            return {"success": False, "error": response.text}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def cancel_job(self, api_url: str, api_key: str) -> Dict[str, Any]:
        """Cancel current job"""
        try:
            url = f"{api_url}/job"
            data = {"command": "cancel"}
            response = requests.post(url, headers=self._get_headers(api_key), json=data, timeout=self.timeout)
            
            if response.status_code == 204:
                return {"success": True}
            return {"success": False, "error": response.text}
        except Exception as e:
            return {"success": False, "error": str(e)}

# Global instance
octoprint_service = OctoPrintService()
