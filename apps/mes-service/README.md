# mes-service

FastAPI service — the real-time "Smart" core (PLAN.md Week 5–6).

Subscribes to MQTT (simulated machine data first, real sensors later),
calculates OEE (Availability × Performance × Quality), writes events to
Postgres/TimescaleDB, and calls ERPNext's REST API to update Job
Card/Work Order status and log downtime. Talks to ERPNext only via API —
never touches core, never lives inside `smart_factory`.

## Suggested structure

```
mes-service/
├── src/
│   ├── main.py            # FastAPI app entrypoint
│   ├── mqtt_client.py      # subscribe to broker, handle incoming machine data
│   ├── oee.py               # OEE calculation logic
│   ├── erpnext_client.py    # thin REST client (shared shape with mcp-server's client)
│   └── db.py                 # Postgres/TimescaleDB models + writes
├── .env.example              # MQTT_*, DATABASE_URL, ERPNEXT_URL, ERPNEXT_API_KEY/SECRET
├── requirements.txt
└── README.md
```

## Not yet started

MQTT broker choice (HiveMQ Cloud free tier vs self-hosted Mosquitto),
Postgres/TimescaleDB schema, and the simulator for fake machine data are
all still open — see PLAN.md Week 5–6.
