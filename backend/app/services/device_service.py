import time
from typing import Dict, Any, Tuple, List
from datetime import datetime
from backend.app.repositories.device_repo import device_repository, DeviceRepository

class DeviceService:
    def __init__(self, device_repo: DeviceRepository = device_repository):
        self.device_repo = device_repo

    async def get_devices(self, user_id: str) -> Tuple[int, List[Dict[str, Any]]]:
        devices = self.device_repo.find_by_user_id(user_id)
        return 200, devices

    async def register_device(self, user_id: str, user_agent: str, data: Dict[str, Any]) -> Tuple[int, Dict[str, Any]]:
        name = data.get("name")
        browser = data.get("browser")
        os_name = data.get("os")
        fingerprint = data.get("fingerprint")
        location = data.get("location")
        now_iso = datetime.utcnow().isoformat()

        # Mark existing current devices as not current
        existing_devices = self.device_repo.find_by_user_id(user_id)
        for d in existing_devices:
            if d.get("isCurrent"):
                self.device_repo.update(d["id"], {"isCurrent": False})

        device_name = name or f"{browser or ('Mobile' if 'Mobile' in user_agent else 'Desktop Browser')} on {os_name or 'Windows'}"
        current_dev = {
            "id": f"dev-{int(time.time() * 1000)}",
            "userId": user_id,
            "name": device_name,
            "browser": browser or "Chrome",
            "isCurrent": True,
            "isTrusted": True,
            "lastActive": now_iso,
            "location": location or "Bengaluru, KA, India",
            "fingerprint": fingerprint or f"fp-{int(time.time() * 1000)}",
        }

        self.device_repo.create(current_dev)
        all_devices = self.device_repo.find_by_user_id(user_id)

        return 200, {
            "success": True,
            "deviceId": current_dev["id"],
            "currentDevice": current_dev,
            "devices": all_devices,
        }

    async def delete_device(self, device_id: str, user_id: str) -> Tuple[int, Dict[str, Any]]:
        success = self.device_repo.delete(device_id, user_id)
        if not success:
            return 404, {"error": "Device not found or unauthorized."}
        return 200, {"success": True}

device_service = DeviceService()
