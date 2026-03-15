**Product Requirements Document**

Capacity Planning Tool — MVP

| Author | Danny |
| :---- | :---- |
| **Status** | Draft |
| **Version** | 0.1 |
| **Date** | March 2026 |
| **Audience** | Engineering, Product |

# **1\. Overview**

This document defines the requirements for an internal capacity planning tool that replaces the current Google Sheets-based approach for tracking engineering team composition, product assignments, and monthly capacity.

The MVP focuses exclusively on capacity visibility: modelling who is on which team, what product they are assigned to, and what that means for available capacity month-to-month. Future iterations will layer on features such as leave management, utilisation tracking, and project-level forecasting.

# **2\. Problem Statement**

The engineering organisation currently tracks workforce capacity in a shared Google Sheet. While this works at small scale, it introduces several pain points:

* Manual data entry is error-prone and tedious to maintain as people move between teams or products.

* Calculating capacity across multiple dimensions (team, product, role, month) requires complex spreadsheet formulas that are fragile and hard to audit.

* No single source of truth — copies diverge, and it’s unclear which version is current.

* Difficult to run what-if scenarios (e.g. “what happens if we move one engineer from Team A to Product X?”).

* Onboarding new leads to the spreadsheet requires walkthrough and tribal knowledge.

# **3\. Goals & Non-Goals**

## **3.1 Goals**

* Provide a clean, self-service interface for managing teams, products, and team members.

* Automatically calculate and display monthly capacity broken down by team and by product.

* Serve as the single source of truth for engineering workforce composition.

* Be simple enough that any engineering lead can use it without training.

## **3.2 Non-Goals (MVP)**

* Leave or absence management (holiday, sick, parental).

* Utilisation tracking or time logging.

* Project or sprint-level capacity allocation.

* Integration with HR systems or payroll.

* Contractor or vendor capacity tracking.

* Scenario modelling / what-if planning (future iteration).

# **4\. Data Model**

The MVP operates on four core entities:

| Entity | Fields | Notes |
| :---- | :---- | :---- |
| Team | Name | An organisational unit (e.g. MX Polymorphs, Talia, Walia, Deep Domain). |
| Product | Name | A product or workstream that engineers are assigned to. |
| Team Member | Name, Role, FTE | An individual contributor or lead. FTE defaults to 1.0 but can be set to reflect part-time (e.g. 0.8) or partial allocation. |
| Assignment | Team Member → Team, Team Member → Product | Each team member belongs to exactly one team and is assigned to exactly one product at any given time. |

Capacity is derived, not stored. It is calculated as the sum of FTE values for team members, grouped by the requested dimension (team or product) and month.

# **5\. User Stories**

| ID | Story | Acceptance Criteria |
| :---- | :---- | :---- |
| US-01 | As a director, I want to add a new team so that I can reflect organisational changes. | Team appears in team list and is available for assignment. |
| US-02 | As a director, I want to add a new product so that I can track capacity against it. | Product appears in product list and is available for assignment. |
| US-03 | As a director, I want to add a team member with their name, role, and FTE so that they are counted in capacity. | Member appears in roster; capacity recalculates. |
| US-04 | As a director, I want to assign a team member to a team and a product so that their capacity is attributed correctly. | Member’s capacity shows under selected team and product. |
| US-05 | As a director, I want to edit a team member’s assignment (team, product, role, FTE) so that changes are reflected immediately. | Capacity view updates in real-time after save. |
| US-06 | As a director, I want to view total capacity per team per month so that I can see how teams are staffed over time. | Grid/table shows teams as rows, months as columns, FTE totals in cells. |
| US-07 | As a director, I want to view total capacity per product per month so that I can understand product investment. | Grid/table shows products as rows, months as columns, FTE totals in cells. |
| US-08 | As a director, I want to remove a team member so that leavers no longer count toward capacity. | Member removed from roster; capacity recalculates. |
| US-09 | As a director, I want to edit or archive a team or product so that the system reflects current reality. | Archived items no longer appear in active views but historical data is preserved. |

# **6\. Functional Requirements**

## **6.1 Team Management**

* Create a team with a name.

* Edit a team’s name.

* Archive a team (soft delete). Archived teams are hidden from active views but remain in historical capacity data.

## **6.2 Product Management**

* Create a product with a name.

* Edit a product’s name.

* Archive a product (soft delete).

## **6.3 Team Member Management**

* Add a team member with: name, role (free text or dropdown), FTE (decimal, default 1.0), assigned team, assigned product.

* Edit any of the above fields.

* Remove a team member (soft delete).

* View a filterable roster of all active team members showing their team, product, role, and FTE.

## **6.4 Capacity View**

* Display a matrix view with a configurable time range (default: current month \+ 5 months ahead).

* Toggle between two grouping modes: by team and by product.

* Each cell shows the total FTE for that group in that month.

* A total row at the bottom sums all groups per month.

* Clicking a cell drills down to show the individual team members contributing to that number.

## **6.5 Roles**

Roles are descriptive labels attached to team members (e.g. Senior Engineer, QA Engineer, Engineering Lead, Staff Engineer). In the MVP, roles are stored as free text. A future iteration may introduce a managed list of roles with capacity breakdowns by role type.

# **7\. Capacity Calculation**

Capacity for a given group (team or product) in a given month is defined as:

*Capacity(group, month) \= Σ FTE of all active team members assigned to that group*

In the MVP, capacity is static — it does not account for leave, public holidays, or start/end dates within a month. The assumption is that a team member’s current assignment applies to all visible months.

Future iterations will introduce effective-dated assignments (allowing you to say “Jane moves from Team A to Team B on 1 April”) and leave deductions.

# **8\. UI Wireframe Guidance**

The application should consist of three primary views:

## **8.1 Roster View (default)**

* A table listing all active team members.

* Columns: Name, Role, Team, Product, FTE.

* Inline actions: Edit, Remove.

* Top-level actions: Add Team Member, Manage Teams, Manage Products.

* Filtering by team and product.

## **8.2 Capacity View**

* A matrix/heatmap with groups as rows and months as columns.

* Toggle between “By Team” and “By Product” grouping.

* Cells display FTE totals. Colour intensity could optionally indicate relative capacity.

* Clicking a cell opens a popover or panel showing the contributing team members.

## **8.3 Settings/Admin View**

* Manage teams: add, rename, archive.

* Manage products: add, rename, archive.

* View archived entities.

# **9\. Technical Considerations**

This PRD is intentionally technology-agnostic. The following are considerations rather than prescriptions:

* Persistence: the tool needs a persistent data store. Options include a lightweight database (SQLite/PostgreSQL) or a backend service with an API.

* Authentication: even a single-user tool should have basic auth if hosted. Consider SSO integration with the company’s identity provider if multi-user.

* Hosting: could be a simple internal web app, a self-hosted tool, or even a local-first application with sync.

* Data migration: provide a one-time import path from the existing Google Sheet to seed initial data.

* Export: capacity views should be exportable to CSV for reporting.

# **10\. Success Metrics**

* The Google Sheet is no longer the primary source of truth for capacity data within 4 weeks of launch.

* Time to answer “what’s our capacity on Product X next month?” drops from minutes to seconds.

* All engineering leads can independently update their team’s data without assistance.

# **11\. Open Questions**

| \# | Question | Impact | Answer |
| :---- | :---- | :---- |
| 1 | Should roles be free text or a managed list from day one? | Affects UI complexity and data consistency. | We can manage teams from the DB for now |
| 2 | Do we need multi-product assignment (one person split across two products)? | Changes data model from 1:1 to 1:many with percentage splits. | No |
| 3 | Should the capacity view show headcount alongside FTE? | Minor UI addition but useful for context. | Yes |
| 4 | Is this single-user (director only) or multi-user (leads can edit their own teams)? | Drives auth and permissions model. | Director only |
| 5 | Do we want effective-dated assignments in the MVP or defer to v2? | Significantly increases complexity if included. | Defer |

# **12\. Future Iterations**

The following are explicitly out of scope for the MVP but represent the likely roadmap:

* Effective-dated assignments — model team/product changes with a start date so capacity shifts are reflected in the correct month.

* Leave integration — deduct holiday, sick, and other absences from monthly capacity.

* Role-based capacity breakdowns — view capacity by role type (e.g. how many senior engineers are on each product).

* Scenario modelling — create draft plans to explore “what if” reorgs or hires before committing.

* Hiring pipeline — model planned hires with expected start dates to project future capacity.

* Reporting and export — scheduled reports, PDF export, and integration with planning tools.