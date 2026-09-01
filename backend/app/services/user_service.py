from typing import Dict, Any, Tuple
from backend.app.repositories.user_repo import user_repository, UserRepository
from backend.app.repositories.budget_repo import budget_repository, BudgetRepository

class UserService:
    def __init__(
        self,
        user_repo: UserRepository = user_repository,
        budget_repo: BudgetRepository = budget_repository,
    ):
        self.user_repo = user_repo
        self.budget_repo = budget_repo

    async def submit_onboarding(self, user: Dict[str, Any], payload: Dict[str, Any]) -> Tuple[int, Dict[str, Any]]:
        user_id = user["id"]
        personal_info = payload.get("personalInfo")
        financial_profile = payload.get("financialProfile")
        budget_setup = payload.get("budgetSetup")
        security_preferences = payload.get("securityPreferences")

        # Update user details
        if personal_info:
            updates = {}
            if "fullName" in personal_info and personal_info["fullName"]:
                updates["fullName"] = personal_info["fullName"]
            if "city" in personal_info and personal_info["city"]:
                updates["city"] = personal_info["city"]
            if "profilePhoto" in personal_info:
                updates["profilePhoto"] = personal_info["profilePhoto"]
            if updates:
                self.user_repo.update(user_id, updates)

        # Save Financial Profile
        if financial_profile:
            self.user_repo.set_financial_profile({
                "userId": user_id,
                "incomeRange": financial_profile.get("incomeRange", "₹50,000–₹1,00,000"),
                "spendingTarget": float(financial_profile.get("spendingTarget", 30000)),
                "savingsGoal": float(financial_profile.get("savingsGoal", 10000)),
                "currency": financial_profile.get("currency", "INR ₹"),
            })

        # Save Budget Setup
        if budget_setup:
            categories = [
                {
                    "id": f"cat-{user_id}-{i}",
                    "userId": user_id,
                    "category": c.get("category", f"Category {i + 1}"),
                    "limit": float(c.get("limit", 5000)),
                }
                for i, c in enumerate(budget_setup.get("categories", []))
            ]
            self.budget_repo.save({
                "userId": user_id,
                "monthlyLimit": float(budget_setup.get("monthlyLimit", 45000)),
                "categories": categories,
            })

        # Save Security Profile
        if security_preferences:
            self.user_repo.set_security_profile({
                "userId": user_id,
                "securityAlertsEnabled": security_preferences.get("securityAlertsEnabled", True),
                "newDeviceAlerts": security_preferences.get("newDeviceAlerts", True),
                "transactionAlerts": security_preferences.get("transactionAlerts", True),
                "protectionLevel": security_preferences.get("protectionLevel", "High Protection"),
            })

        # Mark onboarding completed
        self.user_repo.update(user_id, {"onboardingCompleted": True})

        updated_user = self.user_repo.find_by_id(user_id)
        return 200, {
            "success": True,
            "message": "Onboarding completed successfully!",
            "user": {
                "id": updated_user["id"],
                "fullName": updated_user["fullName"],
                "email": updated_user["email"],
                "phone": updated_user["phone"],
                "emailVerified": updated_user["emailVerified"],
                "phoneVerified": updated_user["phoneVerified"],
                "onboardingCompleted": updated_user["onboardingCompleted"],
                "city": updated_user.get("city"),
                "profilePhoto": updated_user.get("profilePhoto"),
            }
        }

    async def get_profile(self, user: Dict[str, Any]) -> Tuple[int, Dict[str, Any]]:
        user_id = user["id"]
        fin = self.user_repo.get_financial_profile(user_id)
        sec = self.user_repo.get_security_profile(user_id)

        return 200, {
            "uid": user["id"],
            "name": user["fullName"],
            "email": user["email"],
            "phone": user["phone"],
            "balance": float(user.get("balance", 45000.0)),
            "safetyScore": 94,
            "protectionLevel": sec["protectionLevel"] if sec else "High Protection",
            "notificationsEnabled": sec["securityAlertsEnabled"] if sec else True,
            "city": user.get("city") or "Bengaluru",
            "profilePhoto": user.get("profilePhoto"),
            "createdAt": user["createdAt"],
            "financialProfile": fin or None,
            "securityProfile": sec or None,
        }

    async def update_profile(self, user: Dict[str, Any], payload: Dict[str, Any]) -> Tuple[int, Dict[str, Any]]:
        user_id = user["id"]
        name = payload.get("name") or payload.get("fullName")
        phone = payload.get("phone")
        city = payload.get("city")
        profile_photo = payload.get("profilePhoto")

        user_updates = {}
        if name:
            user_updates["fullName"] = name
        if phone:
            user_updates["phone"] = phone
        if city is not None:
            user_updates["city"] = city
        if profile_photo is not None:
            user_updates["profilePhoto"] = profile_photo

        if user_updates:
            self.user_repo.update(user_id, user_updates)

        # Update Financial Profile
        existing_fin = self.user_repo.get_financial_profile(user_id) or {
            "userId": user_id,
            "incomeRange": "₹50,000–₹1,00,000",
            "spendingTarget": 30000.0,
            "savingsGoal": 10000.0,
            "currency": "INR ₹",
        }

        fin_data = payload.get("financialProfile") or {}
        fin_income = fin_data.get("incomeRange") or payload.get("incomeRange")
        fin_spending = fin_data.get("spendingTarget") if fin_data.get("spendingTarget") is not None else payload.get("spendingTarget")
        fin_savings = fin_data.get("savingsGoal") if fin_data.get("savingsGoal") is not None else payload.get("savingsGoal")
        fin_currency = fin_data.get("currency") or payload.get("currency")

        if any(x is not None for x in [fin_income, fin_spending, fin_savings, fin_currency]):
            updated_fin = {
                "userId": user_id,
                "incomeRange": fin_income or existing_fin["incomeRange"],
                "spendingTarget": float(fin_spending) if fin_spending is not None else existing_fin["spendingTarget"],
                "savingsGoal": float(fin_savings) if fin_savings is not None else existing_fin["savingsGoal"],
                "currency": fin_currency or existing_fin["currency"],
            }
            self.user_repo.set_financial_profile(updated_fin)

        # Update Security Profile
        existing_sec = self.user_repo.get_security_profile(user_id) or {
            "userId": user_id,
            "securityAlertsEnabled": True,
            "newDeviceAlerts": True,
            "transactionAlerts": True,
            "protectionLevel": "High Protection",
        }

        sec_data = payload.get("securityProfile") or {}
        target_prot = sec_data.get("protectionLevel") or payload.get("protectionLevel")
        target_sec_alerts = sec_data.get("securityAlertsEnabled") if sec_data.get("securityAlertsEnabled") is not None else (payload.get("securityAlertsEnabled") if payload.get("securityAlertsEnabled") is not None else payload.get("notificationsEnabled"))
        target_dev_alerts = sec_data.get("newDeviceAlerts") if sec_data.get("newDeviceAlerts") is not None else payload.get("newDeviceAlerts")
        target_tx_alerts = sec_data.get("transactionAlerts") if sec_data.get("transactionAlerts") is not None else payload.get("transactionAlerts")

        updated_sec = {
            "userId": user_id,
            "securityAlertsEnabled": target_sec_alerts if target_sec_alerts is not None else existing_sec["securityAlertsEnabled"],
            "newDeviceAlerts": target_dev_alerts if target_dev_alerts is not None else existing_sec["newDeviceAlerts"],
            "transactionAlerts": target_tx_alerts if target_tx_alerts is not None else existing_sec["transactionAlerts"],
            "protectionLevel": target_prot or existing_sec["protectionLevel"],
        }
        self.user_repo.set_security_profile(updated_sec)

        updated_user = self.user_repo.find_by_id(user_id)
        final_fin = self.user_repo.get_financial_profile(user_id)
        final_sec = self.user_repo.get_security_profile(user_id)

        return 200, {
            "success": True,
            "message": "Profile updated.",
            "profile": {
                "uid": updated_user["id"],
                "name": updated_user["fullName"],
                "email": updated_user["email"],
                "phone": updated_user["phone"],
                "city": updated_user.get("city"),
                "profilePhoto": updated_user.get("profilePhoto"),
                "protectionLevel": final_sec["protectionLevel"] if final_sec else "High Protection",
                "notificationsEnabled": final_sec["securityAlertsEnabled"] if final_sec else True,
                "financialProfile": final_fin or None,
                "securityProfile": final_sec or None,
            }
        }

user_service = UserService()
