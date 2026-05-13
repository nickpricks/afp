# How to Prompt for Elite Code Quality (Brainstorming Skill)

This guide explains how to construct a prompt that triggers the `superpowers:brainstorming` skill to generate enterprise-grade specs and implementation plans, similar to the high-quality `feat/who-fueled-it` branch.

## The Elite Prompt Template

When you want to build a complex feature, use this structure to kick off the brainstorming session:

```markdown
**Role:** You are a Staff Engineer at AFP. We are implementing a specialized [Feature Name] within the [Module Name] module.

**Context:**
- **Project Pattern:** We use a "Storage Adapter" pattern (React 19, Firebase/LocalStorage).
- **Core Principle:** Data is narrative. We don't just log data; we track the lifecycle and derive insights.
- **Constraints:** No new top-level collections (piggyback on existing subcollections), no data migrations (archive in place), and zero-friction mobile entry.

**Phase 1: EXPLORE & DESIGN**
Please brainstorm a spec that covers:
1. **Data Model:** [e.g., A polymorphic `meta` field for different types of entries].
2. **Computed Logic:** [e.g., Two-of-three input math for auto-calculation, derived banners based on recent entries].
3. **Reactive UI:**
    - [e.g., Inline sub-forms within the main entry form].
    - [e.g., A dedicated tab with quick-add buttons and specialized row badges].
4. **Architecture:** [e.g., A pure math module separated from UI logic].

**Phase 2: DRAFT PLAN (The "Agentic" Standard)**
The implementation plan MUST be atomic and follow these **Mandatory Verification Rules**:
- **README First:** Every task must update the local subdirectory `README.md`.
- **Unit Testing:** 100% coverage for pure logic; smoke + conditional tests for UI components.
- **Backwards Compatibility:** Old data must render safely and offer a tap-to-upgrade path.
- **CI/CD Ready:** Include linting, formatting, and type-checking steps.

**Trigger Skill:** `superpowers:brainstorming`
```

---

## Deconstructing the Prompt: Why it Works

1. **Role & Context (The "Floor"):**
   By defining the role as a "Staff Engineer," you set expectations for architectural rigor. Stating constraints immediately (e.g., "no data migrations," "Storage Adapter pattern") prevents the agent from designing complex, non-compliant backend changes.

2. **Phase 1: Explore & Design (The "Meat"):**
   - **Data Model:** Asking for specific patterns (like a discriminated union) forces type-safe design.
   - **Computed Logic:** Mentioning "Two-of-three input math" or "derived banners" forces the agent to think about *how* data interacts, not just CRUD operations. This leads to features that feel "smart" rather than just a database viewer.
   - **Reactive UI:** Forcing the separation of "Inline forms" vs "Quick-add tabs" ensures a comprehensive UX strategy.
   - **Architecture:** Requesting a separate file for pure math (e.g., `fuel-math.ts`) enforces clean code boundaries, making testing easier.

3. **Phase 2: Draft Plan (The "Guardrails"):**
   - **Mandatory Verification Rules:** This is the secret sauce. By demanding README updates, 100% test coverage for pure logic, and specific handling for backwards compatibility, you guarantee the resulting plan won't be a sloppy MVP, but a production-ready blueprint.

---

## Seeding the Spec: Using Your Own Words

Often, you don't need to write the full technical spec yourself. You just need to provide a "seed" paragraph in your own natural language, and the AI will formalize it using the prompt above.

Here are a few examples of how you can write a "seed" in the initial `specs/YOUR_FEATURE.md` file or chat message:

### Sample 1: The "Messy Brain dump" (Good for starting)
> "Okay, I want to add car stuff to the budget. Basically, when I get gas, I want to enter liters and price, and it should figure out the total. Or if I enter total and liters, it figures out the price per liter. Also, I need to track when my next car service is due. If my current odometer goes past the 'next service' number, throw up a yellow warning banner on the screen. Let's make an 'Auto' tab for all this so it doesn't clutter the main expenses list."

### Sample 2: The "UX Focused" Seed
> "Let's build a new Travel tracker. I don't want to navigate away to a new page to add a trip. When I click 'Add Trip', a tiny form should just appear right there in the list. I need to log Origin and Destination. If an old expense from last year doesn't have this info, just show a gray 'incomplete' pill next to it. Tapping that pill should open the form so I can fill it in retroactively."

### Sample 3: The "Architecture Focused" Seed
> "I need to track recurring subscriptions. Let's put this under the Budget module. Do NOT create a new Firebase collection. Just add a `recurring` boolean to the existing Expense type. We need a pure function file, maybe `subscription-math.ts`, to calculate how much I'm spending per month on active subs. Make sure we have 100% test coverage on that math file before we touch any UI."

When you provide a natural language seed like the above *alongside* the Elite Prompt Template, the brainstorming skill bridges the gap between your intent and a rigorous, Staff-Engineer-level implementation plan.
