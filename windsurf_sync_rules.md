# Windsurf Plan Synchronization Rules

These rules ensure the workspace `plan.md` in this repository stays aligned with the active planning document maintained by Windsurf/Cascade.

1. **Single Source of Truth**  
   • The authoritative planning document is `plan.md` tracked by Windsurf.

2. **Automatic Propagation**  
   • Each time Windsurf updates its internal `plan.md`, it must immediately overwrite `city-generation-tool/plan.md` with the new content.

3. **Version Control**  
   • After overwriting, run `git add plan.md` followed by `git commit -m "Sync plan from Windsurf"`.
   • If there are no changes, skip committing.

4. **Conflict Handling**  
   • If local edits exist that are not yet in Windsurf’s plan, Windsurf must merge those changes first or warn the user before overwriting.

5. **Visibility**  
   • Windsurf should log a concise message in the chat whenever a sync occurs (e.g., "Plan synced to repository").

6. **Extensibility**  
   • Any new planning artifacts (roadmaps, timeline charts, etc.) introduced later must follow the same sync rule: canonical copy lives in Windsurf, mirror lives in repo.
