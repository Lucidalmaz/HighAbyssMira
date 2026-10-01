# High Abyss Mira — Claude Code Project Instructions

## Project Identity

High Abyss Mira is an existing, actively developed game project.

The project is already substantially developed. Existing implementation, content, assets, systems, scenes, chapters, gameplay logic and previous work are valuable and must be treated as the foundation of the project.

The project should continuously move toward exceptionally high-quality, believable, immersive and professional game quality.

The quality target is AAA / high-end quality where technically and practically appropriate.

This is a quality standard, not permission to unnecessarily rebuild the project.

---

## Core Development Principles

The following principles apply to all work in this project:

- Preserve existing work.
- Prefer improving existing systems over replacing them.
- Prefer the smallest correct change over a large rewrite.
- Avoid unnecessary refactoring.
- Avoid unnecessary architecture changes.
- Avoid duplicate systems when an existing system can be extended.
- Do not remove working functionality without a concrete reason.
- Do not overwrite or discard existing work without understanding its purpose.
- Maintain consistency with the existing project.
- Fix root causes rather than hiding symptoms.
- Keep changes focused on the requested task.
- Do not introduce unrelated changes merely because they appear interesting or beneficial.

The project is developed incrementally.

Every change should leave the project at least as stable as before, preferably better.

---

## Quality Standard

High Abyss Mira should feel:

- believable
- immersive
- polished
- intentional
- coherent
- atmospheric
- responsive
- natural
- technically stable
- visually consistent
- professionally developed

Avoid generic or obviously artificial results.

Quality should come from the interaction of many small details rather than from unnecessary amounts of content.

Prefer:

- believable behavior
- natural transitions
- subtle environmental details
- convincing lighting
- appropriate materials
- convincing sound
- coherent animation
- meaningful interactions
- consistent visual language
- carefully chosen effects
- believable imperfections

Do not add detail merely for the sake of having more detail.

---

## Realism and Immersion

Realism should support the game's world and atmosphere.

Consider:

- scale
- lighting
- materials
- movement
- animation
- physics
- sound
- environmental reactions
- timing
- camera behavior
- transitions
- spatial relationships
- object placement
- wear and imperfections

Avoid:

- stiff movement
- unnecessary visual effects
- unnatural transitions
- repetitive behavior
- artificial-looking environments
- excessive polish that makes objects look sterile
- generic game conventions that do not fit the world

Subtle details are often more effective than obvious ones.

---

## Visual Consistency

All visual changes should respect the existing visual identity of the game.

Do not introduce assets, effects, lighting or materials that look disconnected from the rest of the project.

When improving visuals:

1. understand the existing style,
2. identify what is actually weak,
3. improve the existing result,
4. maintain consistency with surrounding content.

Avoid visual inconsistency caused by mixing unrelated styles or techniques.

---

## Characters and Story

Characters should behave and communicate naturally within the context of the game.

Avoid:

- unnecessary exposition
- repetitive dialogue
- artificial dialogue
- unnatural reactions
- characters explaining things they would already know
- dialogue existing only to deliver information to the player

Story, dialogue, animation and gameplay should support each other.

---

## Audio

Audio should contribute to immersion rather than simply fill silence.

Consider:

- spatial positioning
- environment
- distance
- intensity
- variation
- timing
- transitions
- silence
- context

Avoid excessive repetition and sounds that draw attention to the technical implementation.

---

## Performance

Quality and performance must be considered together.

Prefer solutions that provide strong visual or gameplay results without unnecessary technical cost.

Be aware of:

- CPU usage
- GPU usage
- memory
- loading times
- unnecessary calculations
- unnecessary updates
- draw calls
- asset duplication
- excessive effects
- unnecessary runtime processing

Do not perform broad optimization work unless it is relevant to the current problem.

Do not sacrifice meaningful quality for theoretical optimization without a concrete performance reason.

---

## Existing Systems and Architecture

Before creating a new system, determine whether the project already contains something suitable.

Extend existing functionality when practical.

A new implementation is justified when the existing implementation:

- cannot reasonably support the required behavior,
- is fundamentally unsuitable,
- would become significantly more complex to modify,
- or would create greater technical risk if extended.

Do not replace functioning systems simply because a different implementation appears cleaner.

---

## Bug Fixing

When fixing a bug, prefer identifying and correcting the underlying cause.

Do not merely hide symptoms.

Before changing code, understand enough of the affected system to avoid creating secondary problems.

Changes should be as localized as reasonably possible.

After a change, perform an appropriate technical sanity check when necessary.

---

## Testing Responsibility

Claude is responsible for targeted technical verification.

The user is responsible for actual gameplay testing and game-direction feedback.

Claude should perform short tests when necessary to verify things such as:

- startup
- crashes
- critical errors
- the specific functionality that was changed
- critical transitions
- obvious regressions caused by the current change

Claude should not unnecessarily perform:

- full playthroughs
- complete chapter testing
- long gameplay sessions
- broad exploratory testing
- large test campaigns

The user's gameplay testing is the primary source of feedback about:

- game feel
- atmosphere
- immersion
- realism
- pacing
- presentation
- player experience
- what should be improved next

Do not duplicate the user's testing unnecessarily.

---

## Scope Control

The current user request defines the active scope.

Do not automatically expand a task into a larger project.

If unrelated problems are discovered:

- do not silently fix them,
- do not start additional large tasks,
- note them when relevant,
- return to the requested task.

Potential improvements may be documented for later.

---

## Incomplete Work

Existing incomplete work must be preserved.

If previous work, agent work or partially completed implementation exists:

- inspect the current state,
- determine what has already been completed,
- preserve valid changes,
- identify what remains,
- continue from the existing state where appropriate.

Do not restart completed or partially completed work without a reason.

Never assume that unfinished means unusable.

---

## Session Continuity

A new Claude Code session must treat the existing project as an ongoing project, not as a new project.

Before making significant changes in a new session:

- read this file,
- inspect relevant project documentation,
- inspect the current state of the requested system,
- understand existing implementation,
- continue from the current state.

Do not unnecessarily re-analyze the entire project.

Use existing documentation and status information whenever available.

---

## Documentation

Important project state should remain understandable across sessions.

When appropriate, maintain concise project documentation such as:

- current status
- known issues
- unfinished work
- important architectural information
- relevant implementation notes

Documentation should be concise and useful.

Do not create large documentation purely for the sake of documentation.

---

## Efficiency

Claude Code usage should be treated as a limited development resource.

Prefer:

- focused investigation
- targeted file inspection
- concise reasoning
- small implementation steps
- targeted verification
- reuse of existing systems
- minimal necessary context

Avoid:

- unnecessary full-project scans
- repeated inspection of the same information
- unnecessary long explanations
- unnecessary refactoring
- unnecessary testing
- solving unrelated problems
- rebuilding systems that already work

Efficiency must not reduce the quality of the actual implementation.

The goal is:

*high-quality result with the smallest reasonable amount of work.*

---

## Change Safety

Before significant changes, consider:

- What currently works?
- What depends on this?
- Is there a smaller solution?
- Could this affect another chapter or system?
- Could this affect performance?
- Could this affect save/load behavior?
- Could this affect existing content?
- Can the change be isolated?

When uncertainty is high, investigate before modifying.

Do not make large speculative changes.

---

## Priority

When several issues compete for attention, generally prioritize:

1. crashes and critical technical failures
2. blocked progression
3. serious gameplay bugs
4. save/load problems
5. stability
6. performance problems
7. major visual problems
8. audio and atmosphere
9. polish
10. optional detail improvements

The explicit current user request remains the primary scope.

---

## Development Philosophy

High Abyss Mira should improve through deliberate iteration.

Do not chase quantity.

Do not chase complexity.

Do not change things merely to make them different.

Do not assume that more systems automatically mean a better game.

The objective is a coherent, believable and highly polished experience.

The guiding principle is:

*Make the existing game better, not merely bigger.*

---

## Final Rule

The project should always be treated as existing professional work in progress.

Protect what already works.

Understand before changing.

Improve rather than replace.

Fix causes rather than symptoms.

Keep changes focused.

Use testing efficiently.

Preserve unfinished work.

Maintain continuity between sessions.

And always aim for the highest practical quality that the existing project can support.
