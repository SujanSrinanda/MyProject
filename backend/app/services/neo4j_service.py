from typing import Dict, Any, Tuple, Optional
from backend.app.providers.neo4j_client import neo4j_client

class Neo4jService:
    def get_status(self) -> Tuple[int, Dict[str, Any]]:
        return 200, {
            "configured": neo4j_client.is_configured(),
            "uri": neo4j_client._config.get("uri") or None,
            "database": neo4j_client._config.get("database", "neo4j"),
        }

    async def verify(self, config: Optional[Dict[str, Any]] = None) -> Tuple[int, Dict[str, Any]]:
        result = neo4j_client.verify_connection(config)
        return 200, result

    async def update_config(self, config: Dict[str, Any]) -> Tuple[int, Dict[str, Any]]:
        uri = config.get("uri")
        password = config.get("password")
        if not uri or not password:
            return 400, {"error": "NEO4J_URI and NEO4J_PASSWORD are required."}

        neo4j_client.update_credentials({
            "uri": uri,
            "username": config.get("username", "neo4j"),
            "password": password,
            "database": config.get("database", "neo4j"),
        })

        verify_res = neo4j_client.verify_connection()
        if verify_res.get("success"):
            return 200, {
                "success": True,
                "message": "Neo4j connection verified and saved for session!",
                "details": verify_res.get("details"),
            }
        else:
            return 400, {
                "success": False,
                "error": verify_res.get("message"),
            }

    async def get_graph(self, user_id: Optional[str] = None) -> Tuple[int, Dict[str, Any]]:
        graph_data = neo4j_client.get_graph_overview(user_id)
        return 200, graph_data

    async def get_logs(self) -> Tuple[int, Any]:
        return 200, neo4j_client.get_logs()

neo4j_service = Neo4jService()
