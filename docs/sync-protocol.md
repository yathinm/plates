# Plates sync protocol (4.4.1)

This document defines the **shared language** between the mobile client (WatermelonDB) and the API server (PostgreSQL / Prisma). Implementation details may evolve, but **names, envelopes, and timestamps** should stay stable.

---

## 1. Timestamp handshake

Every sync round is anchored to two wall-clock instants on the **server**:

| Symbol | Meaning |
|--------|--------|
| **T₁** | `last_pulled_at` — last time this device **successfully completed a pull** and persisted the server’s cursor. |
| **T₂** | `timestamp` in the pull response — **current server time** when that pull was generated (milliseconds since Unix epoch, UTC). |

### 1.1 Pull (client → server)

The client asks: *“What changed on the server since **T₁**?”*

- **Request** must include **`last_pulled_at`** (number \| `null`).
  - `null` (or omit on first sync): full snapshot policy is server-defined (e.g. cap window or paginate later).
  - Non-null: only rows whose server-side “changed at” is **> T₁** participate in **created** / **updated** (see §3).

### 1.2 Pull response (server → client)

The server answers with:

1. **`changes`** — the structured diff (§2).
2. **`timestamp`** — **T₂**; the client **must** persist this as the next **`last_pulled_at`** after it applies `changes` successfully.

### 1.3 Where T₁ is stored

- **Device-local** (e.g. Secure Store / Async Storage / MMKV), **not** a column on every row.
- Updated **only** after a pull is applied and committed locally.

---

## 2. Change envelope (push and pull)

Push and pull use the **same** top-level shape so tooling and tests can be shared:

```json
{
  "workouts": { "created": [], "updated": [], "deleted": [] },
  "sets": { "created": [], "updated": [], "deleted": [] },
  "exercises": { "created": [], "updated": [], "deleted": [] }
}
```

- Keys **`workouts`** and **`sets`** match WatermelonDB table names used on the client.
- **`exercises`** is the **catalog** (`Exercise` in PostgreSQL); not the same as Watermelon’s per-workout `exercises` join table.
- On the server, **`sets`** maps to **`workout_sets`** (Prisma model `WorkoutSet`); the wire name stays **`sets`** for consistency with the app.

### 2.1 Semantics

| Bucket | Meaning |
|--------|--------|
| **created** | New rows the receiver should insert. |
| **updated** | Existing rows identified by **stable id** (see §4). |
| **deleted** | Tombstones: **ids only** (strings), no full row bodies. |

---

## 3. Server ordering and time

- The server assigns a monotonic **per-row** “version” or uses **`updated_at`** (or equivalent) so pull can filter `> T₁`.
- **T₂** is **not** per-row; it is one clock reading for the whole response.

---

## 4. Record identity (ids)

- **Wire `id`** is the **server UUID** (string) once the row exists on the server.
- Before first push, the client may use Watermelon’s local id internally; the first successful exchange should **map** local ↔ server (see `server_id` on models).
- **Deleted** arrays contain **server ids** when the row was known to the server; local-only deletes before any server id are handled by a **pending-deletion queue** (future; see §6).

---

## 5. Payload shapes (normative fields)

Field names below are **JSON / wire** names (snake_case). TypeScript types live in `frontend/src/sync/protocol.ts`.

### 5.1 `workouts`

Aligns with Prisma `Workout` (composite id on server is `(id, started_at)`; wire carries at minimum):

- `id` (string, UUID)
- `user_id` (string, UUID) — set by server from auth on push; omitted or ignored on client-originated create if server fills it
- `name` (string \| null)
- `started_at` (number, ms epoch)
- `finished_at` (number \| null, ms epoch)
- `notes` (string \| null)
- `routine_id` (string \| null) — optional for v1 sync

### 5.2 `sets` (server: `workout_sets`)

- `id` (string, UUID)
- `workout_id` (string, UUID) — server workout id
- `exercise_id` (string, UUID) — **catalog** `Exercise.id` on the server (not the client’s local `exercises` row id)
- `set_number` (number)
- `weight_kg` (number \| null)
- `reps` (number \| null)
- `rpe` (number \| null)
- `performed_at` (number, ms epoch) — or server default

**Mapping note:** The client stores sets under Watermelon `exercises` (group) + `sets`. When building wire `sets`, the sync layer must resolve **catalog** `exercise_id` (server) for each set—either from cached server exercise ids or from a later sync phase. This protocol **does not** add `exercises` to the envelope yet; mapping is implementation work between phases.

---

## 6. Local changeset (WatermelonDB)

### 6.1 Dirty tracking

Each syncable row tracks:

| Column | Type | Meaning |
|--------|------|--------|
| **`server_id`** | string, optional | Server UUID when known; `null` until first successful push/pull mapping. |
| **`dirty`** | boolean, optional | `true` = local changes not yet successfully **pushed**; `false` = clean. **`null`** = legacy row before migration; treat as **needs sync** until pushed. |

**Rules:**

- On **local create** or **local update** that should eventually reach the server: set **`dirty = true`**.
- After a **successful push** acknowledgment for that row: set **`dirty = false`** and set **`server_id`** if the server returned one.
- **Pull** does not set `dirty` on applied server rows unless there is a conflict strategy (future).

### 6.2 Querying pending work

- Rows with **`dirty !== false`** are candidates for the next **push** (i.e. `true` or `null`).

### 6.3 Deletions

`destroyPermanently()` removes local rows and **drops** Watermelon ids. Until a **tombstone queue** or **soft delete** is implemented, long-press deletes may not produce a server **`deleted`** id. The protocol supports **`deleted`**; the app must eventually enqueue server ids for deleted sets/workouts.

---

## 7. HTTP API (backend)

All routes require **`Authorization: Bearer <jwt>`**.

| Route | Method | Query / body |
|-------|--------|----------------|
| `/sync/pull` | **GET** | Query: `last_pulled_at` (optional, ms epoch). Omit or `0` for full snapshot of changed rows. |
| `/sync/push` | **POST** | JSON: `{ "last_pulled_at": number \| null, "changes": { … } }`. Buckets may be omitted if empty. |

**Pull** returns `{ "changes": SyncChanges, "timestamp": T₂ }` where rows are filtered by **`updated_at > last_pulled_at`** on `workouts`, `workout_sets`, and `exercises` (see Prisma).

**Push** runs **`workouts` → `sets` → `exercises` (custom only)** inside a **single database transaction** so a failure rolls back the whole batch.

---

## 8. Reference implementation

- Types: `frontend/src/sync/protocol.ts`
- API: `backend/src/modules/sync/`
- Dirty fields: Watermelon schema `workouts` / `sets` (`server_id`, `dirty`)
