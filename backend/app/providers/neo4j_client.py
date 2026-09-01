import os
import logging
from typing import Optional, Dict, Any, List
from backend.app.core.config import settings

logger = logging.getLogger("sentinelfin.neo4j")

class Neo4jClient:
    def __init__(self):
        self._driver = None
        self._logs: List[Dict[str, Any]] = []
        self._config = {
            "uri": settings.NEO4J_URI or os.environ.get("NEO4J_URI", ""),
            "username": settings.NEO4J_USERNAME or os.environ.get("NEO4J_USERNAME", "neo4j"),
            "password": settings.NEO4J_PASSWORD or os.environ.get("NEO4J_PASSWORD", ""),
            "database": settings.NEO4J_DATABASE or os.environ.get("NEO4J_DATABASE", "neo4j"),
        }

    def get_logs(self) -> List[Dict[str, Any]]:
        return list(reversed(self._logs[-50:]))

    def _log_query(self, query: str, params: Dict[str, Any], status: str, exec_time_ms: float = 0.0) -> None:
        from datetime import datetime
        self._logs.append({
            "query": query.strip(),
            "params": params,
            "timestamp": datetime.utcnow().isoformat(),
            "status": status,
            "executionTimeMs": round(exec_time_ms, 2)
        })
        if len(self._logs) > 100:
            self._logs = self._logs[-100:]

    def is_configured(self) -> bool:
        uri = self._config.get("uri") or settings.NEO4J_URI or os.environ.get("NEO4J_URI")
        password = self._config.get("password") or settings.NEO4J_PASSWORD or os.environ.get("NEO4J_PASSWORD")
        return bool(uri and uri.strip() and password and password.strip())

    def update_credentials(self, config: Dict[str, Any]) -> None:
        if "uri" in config and config["uri"] is not None:
            self._config["uri"] = config["uri"]
        if "username" in config and config["username"] is not None:
            self._config["username"] = config["username"]
        if "password" in config and config["password"] is not None:
            self._config["password"] = config["password"]
        if "database" in config and config["database"] is not None:
            self._config["database"] = config["database"]

        if self._driver:
            try:
                self._driver.close()
            except Exception:
                pass
            self._driver = None

    def get_driver(self):
        if self._driver:
            return self._driver

        uri = self._config.get("uri") or settings.NEO4J_URI or os.environ.get("NEO4J_URI")
        username = self._config.get("username") or settings.NEO4J_USERNAME or os.environ.get("NEO4J_USERNAME", "neo4j")
        password = self._config.get("password") or settings.NEO4J_PASSWORD or os.environ.get("NEO4J_PASSWORD")

        if not uri or not password:
            return None

        try:
            from neo4j import GraphDatabase
            self._driver = GraphDatabase.driver(
                uri,
                auth=(username, password),
                max_connection_lifetime=3 * 60,
                max_connection_pool_size=50,
                connection_acquisition_timeout=5.0
            )
            return self._driver
        except Exception as e:
            logger.error(f"Failed to create Neo4j driver: {e}")
            return None

    def verify_connection(self, custom_config: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        uri = (custom_config.get("uri") if custom_config else None) or self._config.get("uri") or os.environ.get("NEO4J_URI")
        username = (custom_config.get("username") if custom_config else None) or self._config.get("username") or os.environ.get("NEO4J_USERNAME", "neo4j")
        password = (custom_config.get("password") if custom_config else None) or self._config.get("password") or os.environ.get("NEO4J_PASSWORD")
        db_name = (custom_config.get("database") if custom_config else None) or self._config.get("database", "neo4j")

        if not uri or not password:
            return {
                "success": False,
                "message": "Neo4j connection credentials are incomplete. Please provide NEO4J_URI and NEO4J_PASSWORD."
            }

        test_driver = None
        try:
            from neo4j import GraphDatabase
            test_driver = GraphDatabase.driver(uri, auth=(username, password))
            with test_driver.session(database=db_name) as session:
                result = session.run("RETURN 1 as check")
                record = result.single()

            if custom_config:
                self.update_credentials(custom_config)

            return {
                "success": True,
                "message": "Successfully connected to Neo4j instance!",
                "details": {
                    "uri": uri,
                    "database": db_name,
                    "check": record["check"] if record else 1
                }
            }
        except Exception as e:
            logger.error(f"Neo4j verification error: {e}")
            return {
                "success": False,
                "message": f"Failed to connect to Neo4j: {str(e)}"
            }
        finally:
            if test_driver and custom_config:
                try:
                    test_driver.close()
                except Exception:
                    pass

    def init_constraints(self) -> bool:
        driver = self.get_driver()
        if not driver:
            return False

        db_name = self._config.get("database", "neo4j")
        try:
            with driver.session(database=db_name) as session:
                session.run("CREATE CONSTRAINT user_id_unique IF NOT EXISTS FOR (u:User) REQUIRE u.id IS UNIQUE")
                session.run("CREATE CONSTRAINT account_phone_unique IF NOT EXISTS FOR (a:Account) REQUIRE a.phone IS UNIQUE")
                session.run("CREATE CONSTRAINT tx_id_unique IF NOT EXISTS FOR (t:Transaction) REQUIRE t.id IS UNIQUE")
            return True
        except Exception as e:
            logger.warning(f"Neo4j constraint creation info: {e}")
            return False

    def store_transaction(self, tx: Dict[str, Any]) -> bool:
        driver = self.get_driver()
        if not driver:
            logger.info("[Neo4j] Driver not initialized - skipping Neo4j write.")
            return False

        db_name = self._config.get("database", "neo4j")
        try:
            sender_phone = tx.get("senderPhone") or f"user-{tx['userId']}"
            sender_name = tx.get("senderName") or f"Sender ({tx['userId']})"
            recipient_phone = tx.get("recipientPhone") or f"unknown-{int(os.times()[4] * 1000)}"
            recipient_name = tx.get("recipientName") or "Recipient"
            timestamp = tx.get("timestamp") or ""

            query = """
              MERGE (sender:Account {phone: $senderPhone})
              ON CREATE SET sender.name = $senderName, sender.created = datetime()
              ON MATCH SET sender.name = coalesce($senderName, sender.name)

              MERGE (recipient:Account {phone: $recipientPhone})
              ON CREATE SET recipient.name = $recipientName, recipient.created = datetime()
              ON MATCH SET recipient.name = coalesce($recipientName, recipient.name)

              MERGE (u:User {id: $userId})
              MERGE (u)-[:OWNS_ACCOUNT]->(sender)

              MERGE (t:Transaction {id: $txId})
              SET t.amount = $amount,
                  t.note = $note,
                  t.category = $category,
                  t.type = $type,
                  t.status = $status,
                  t.decision = $decision,
                  t.safetyScore = $safetyScore,
                  t.riskLevel = $riskLevel,
                  t.timestamp = $timestamp,
                  t.reasons = $reasons

              MERGE (sender)-[:INITIATED]->(t)
              MERGE (t)-[:PAYEE]->(recipient)

              CREATE (sender)-[r:TRANSFERRED_FUNDS {
                txId: $txId,
                amount: $amount,
                timestamp: $timestamp,
                riskLevel: $riskLevel,
                safetyScore: $safetyScore,
                decision: $decision
              }]->(recipient)
            """

            with driver.session(database=db_name) as session:
                session.run(
                    query,
                    txId=tx["id"],
                    userId=tx["userId"],
                    senderPhone=sender_phone,
                    senderName=sender_name,
                    recipientPhone=recipient_phone,
                    recipientName=recipient_name,
                    amount=float(tx.get("amount", 0)),
                    note=tx.get("note", ""),
                    category=tx.get("category", "Other"),
                    type=tx.get("type", "PAYMENT"),
                    status=tx.get("status", "COMPLETED"),
                    decision=tx.get("decision", "ALLOW"),
                    safetyScore=int(tx.get("safetyScore", 90)),
                    riskLevel=tx.get("riskLevel", "LOW"),
                    reasons=tx.get("reasons", []),
                    timestamp=timestamp,
                )

            logger.info(f"[Neo4j] Transaction {tx['id']} successfully recorded in graph!")
            return True
        except Exception as e:
            logger.error(f"Error storing transaction in Neo4j: {e}")
            return False

    def get_graph_overview(self, user_id: Optional[str] = None) -> Dict[str, Any]:
        driver = self.get_driver()
        if not driver:
            return {
                "nodes": [],
                "edges": [],
                "summary": {"totalAccounts": 0, "totalTransactions": 0, "totalHighRisk": 0, "connected": False}
            }

        db_name = self._config.get("database", "neo4j")
        try:
            query = """
              MATCH (a:Account)-[r:TRANSFERRED_FUNDS]->(b:Account)
              RETURN a.phone as srcPhone, a.name as srcName, 
                     b.phone as tgtPhone, b.name as tgtName,
                     r.txId as txId, r.amount as amount, r.riskLevel as riskLevel, r.safetyScore as safetyScore
              LIMIT 100
            """
            nodes_map = {}
            edges_list = []
            high_risk_count = 0

            with driver.session(database=db_name) as session:
                result = session.run(query)
                for record in result:
                    src_phone = record["srcPhone"]
                    src_name = record["srcName"] or src_phone
                    tgt_phone = record["tgtPhone"]
                    tgt_name = record["tgtName"] or tgt_phone
                    tx_id = record["txId"]
                    amount = float(record["amount"]) if record["amount"] is not None else 0.0
                    risk_level = record["riskLevel"] or "LOW"

                    if risk_level in ("HIGH", "CRITICAL"):
                        high_risk_count += 1

                    if src_phone not in nodes_map:
                        nodes_map[src_phone] = {
                            "id": src_phone,
                            "label": src_name,
                            "name": src_name,
                            "type": "Account",
                            "phone": src_phone
                        }

                    if tgt_phone not in nodes_map:
                        nodes_map[tgt_phone] = {
                            "id": tgt_phone,
                            "label": tgt_name,
                            "name": tgt_name,
                            "type": "Account",
                            "phone": tgt_phone
                        }

                    edges_list.append({
                        "id": tx_id or f"edge-{src_phone}-{tgt_phone}",
                        "source": src_phone,
                        "target": tgt_phone,
                        "label": f"₹{amount}",
                        "amount": amount,
                        "riskLevel": risk_level
                    })

            return {
                "nodes": list(nodes_map.values()),
                "edges": edges_list,
                "summary": {
                    "totalAccounts": len(nodes_map),
                    "totalTransactions": len(edges_list),
                    "totalHighRisk": high_risk_count,
                    "connected": True
                }
            }
        except Exception as e:
            logger.error(f"Error querying Neo4j graph overview: {e}")
            return {
                "nodes": [],
                "edges": [],
                "summary": {"totalAccounts": 0, "totalTransactions": 0, "totalHighRisk": 0, "connected": False}
            }

neo4j_client = Neo4jClient()
