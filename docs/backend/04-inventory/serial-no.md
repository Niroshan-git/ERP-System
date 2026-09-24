# Serial No

## Future Backend Decoupling Strategy

The `Serial No` document tracks individual unit instances of an Item in inventory. Similar to Batch, it is a draftless Master Data record. In ERPNext, Serial Nos are primarily auto-created when a batched/serialized Stock Entry or Purchase Receipt is submitted. The manual creation path in the frontend is for registering legacy serialized stock. In a custom backend, this maps to an `InventorySerial` table.

## Field Mapping & Translation Table

| ERPNext Native Field | Frontend Usage (actions.ts) | Future Custom Backend (RDBMS) | Description & Notes |
| :--- | :--- | :--- | :--- |
| `name`, `serial_no` | `serial_no` | `id` (UUID / Primary Key) | The primary identifier. |
| `item_code` | `item_code` | `item_id` (UUID, FK) | Links to the Item/Product table. |
| `warehouse` | `warehouse` | `warehouse_id` (UUID, FK) | Current location of this serial number. |
| `status` | `status` | `status` (Enum) | e.g. 'Active', 'Delivered'. |
| `company` | `company` | `company_id` | Standard context field. |

## Document Flow & Lifecycle

The Serial No document is draftless. Once created, its ID cannot be changed.

```mermaid
stateDiagram-v2
    [*] --> Active: createDoc() (Manual)
    [*] --> Active: Auto-created via Receipt/Issue Submission
    Active --> Active: updateDoc() (Excludes serial_no)
```

## Entity Relationship Mapping

```mermaid
erDiagram
    Item ||--o{ SerialNo : "has many"
    Warehouse ||--o{ SerialNo : "stores"
    SerialNo ||--o{ SerialAndBatchBundle : "allocated in"
    
    SerialNo {
        string serial_no "Primary Key"
        string item_code "FK: Item.name"
        string warehouse "FK: Warehouse.name"
        string status
    }
```

## Error Handling & Admin Logging

*   **User-Facing Errors**: Exceptions (e.g., missing fields, duplicate names, validation rules) are caught and surfaced via `humanizeError(e)`, which translates HTTP 403 / 409 and extracts Frappe's native `_server_messages` into readable UI alerts.
*   **Admin Observability**: All network failures, HTTP non-200 responses, and ERPNext exceptions are wrapped in `ErpNextError` and forwarded asynchronously to the centralized Admin Observability center (`smart_factory.api.observability`).
*   **Traceability**: Every error log is tagged with a `correlationId` that is safe to display to the user for support ticketing, ensuring backend exceptions can be traced exactly to the frontend action that caused them.

## Cancellation Rules & Dependencies

Cancellation (`cancelDoc`) is proactively protected in the frontend to maintain strict data integrity.
*   Before cancelling, the module's `actions.ts` explicitly checks for linked downstream records using `getConnections()`.
*   If downstream submitted records exist, the cancellation is safely blocked.
*   The system then surfaces a specific error message naming the exact downstream document(s) that the user must cancel first, matching ERPNext's native strict-reversal requirements.
