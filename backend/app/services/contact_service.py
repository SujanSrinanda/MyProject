import time
from typing import Dict, Any, Tuple, List
from backend.app.repositories.contact_repo import contact_repository, ContactRepository

class ContactService:
    def __init__(self, contact_repo: ContactRepository = contact_repository):
        self.contact_repo = contact_repo

    async def get_contacts(self, user_id: str) -> Tuple[int, List[Dict[str, Any]]]:
        contacts = self.contact_repo.find_by_user_id(user_id)
        return 200, contacts

    async def create_contact(self, user_id: str, data: Dict[str, Any]) -> Tuple[int, Dict[str, Any]]:
        new_contact = {
            "id": f"c-{int(time.time() * 1000)}",
            "userId": user_id,
            "name": data.get("name") or "Contact",
            "phone": data.get("phone") or "",
            "email": data.get("email"),
            "isFavorite": bool(data.get("isFavorite", False)),
            "isNew": True,
        }
        self.contact_repo.create(new_contact)
        return 201, new_contact

    async def update_contact(self, contact_id: str, user_id: str, updates: Dict[str, Any]) -> Tuple[int, Dict[str, Any]]:
        success = self.contact_repo.update(contact_id, user_id, updates)
        if not success:
            return 404, {"error": "Contact not found or unauthorized."}
        return 200, {"success": True}

    async def delete_contact(self, contact_id: str, user_id: str) -> Tuple[int, Dict[str, Any]]:
        success = self.contact_repo.delete(contact_id, user_id)
        if not success:
            return 404, {"error": "Contact not found or unauthorized."}
        return 200, {"success": True}

contact_service = ContactService()
