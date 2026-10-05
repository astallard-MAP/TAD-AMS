# Workspace Rule: The Registry of Truth & Action Protocol

## Core Mandate: "IF IT'S NOT WRITTEN DOWN, IT DOESN'T EXIST"

1. **Canonical Master Record:**
   - The file `Registry_of_Truth.md` at the workspace root is the single source of truth for all architectural, configuration, operational, and development decisions.

2. **Mandatory Pre-Flight Protocol on Every Instruction:**
   Whenever the user issues any instruction or request, the assistant must:
   - **FIRST:** Update `Registry_of_Truth.md` by opening a new Phase in Section 4 ("Live Ledger: Plans of Action & Task Registers").
   - Define a clear **Plan of Action**.
   - Create an itemized **List of Tasks** using the mandatory status designations:
     - `[to be actioned]`
     - `[in progress]`
     - `[Completed]`
     - `[No longer Required]`
   - Update each task's status in `Registry_of_Truth.md` as work progresses.

3. **Build & Standards Compliance:**
   - All code, configuration, functions, and assets must adhere strictly to the master configuration settings and architectural laws defined in `Registry_of_Truth.md`.
   - Any modifications to root HTML/CSS/JS files must be followed by `npm run build` to keep `dist/` synchronized.
   - All Cloud Functions must reside in `europe-west4`.
