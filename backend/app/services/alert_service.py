from typing import Dict, Any, Tuple, List
from backend.app.repositories.alert_repo import alert_repository, AlertRepository

class AlertService:
    def __init__(self, alert_repo: AlertRepository = alert_repository):
        self.alert_repo = alert_repo

    async def get_alerts(self, user_id: str) -> Tuple[int, List[Dict[str, Any]]]:
        alerts = self.alert_repo.find_by_user_id(user_id)
        return 200, alerts

    async def create_alert(self, user_id: str, payload: Dict[str, Any]) -> Tuple[int, Dict[str, Any]]:
        alert_data = {**payload, "userId": user_id}
        created = self.alert_repo.create(alert_data)
        return 201, created

    async def update_alert(self, alert_id: str, user_id: str, updates: Dict[str, Any]) -> Tuple[int, Dict[str, Any]]:
        success = self.alert_repo.update(alert_id, user_id, updates)
        if not success:
            return 404, {"error": "Alert not found or unauthorized."}
        return 200, {"success": True}

    async def clear_alerts(self, user_id: str) -> Tuple[int, Dict[str, Any]]:
        self.alert_repo.clear_by_user_id(user_id)
        return 200, {"success": True}

    async def delete_alert(self, alert_id: str, user_id: str) -> Tuple[int, Dict[str, Any]]:
        success = self.alert_repo.delete(alert_id, user_id)
        if not success:
            return 404, {"error": "Alert not found or unauthorized."}
        return 200, {"success": True}

alert_service = AlertService()
