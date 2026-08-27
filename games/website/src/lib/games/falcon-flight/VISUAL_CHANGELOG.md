# Falcon Flight Visual Changelog

This document tracks the visual-parameter changes introduced by the Presentation-layer refactor.

## Architecture

- **Before:** All scene, rendering, mesh, particle, and GUI code lived in `FalconFlightGame.ts` with hard-coded values.
- **After:** `FalconFlightGame.ts` is an orchestrator. `FalconFlightPresentation.ts` owns the scene/renderer, and `FalconFlightVisualConfig.ts` is the single source of truth for every visual parameter.

## Fog

| Parameter | Before | After |
|-----------|--------|-------|
| Mode | `FOGMODE_NONE` (disabled) | `FOGMODE_EXP2` |
| Density | n/a | `0.012` |
| Storm density | n/a | `0.024` |
| Color | n/a | `#f5d0a9` (warm sandy peach) |
| Gameplay band | Everything equally clear | Falcon, prey, hazards, power-ups, ground, ceiling line: `fogEnabled = false` |
| Mid-ground | n/a | Dunes/rocks/palms at Z `-8` to `-28`: light fog |
| Background | n/a | Forts/clouds at Z `-36` to `-68`: heavy fog + silhouette tint |

## Lighting

| Parameter | Before | After |
|-----------|--------|-------|
| Ambient intensity | `0.95` | `0.95` (config-driven) |
| Ambient diffuse | `#fff5e0` | `#fff5e0` |
| Ambient ground color | `#e8d2bc` | `#e6cfba` |
| Sun direction | `(-0.5, -1, 0.35)` | config-driven |
| Sun diffuse | `#ffe0a3` | `#ffe0a3` |
| Sun intensity | `1.25` | `1.25` |

## Post-processing (High tier)

| Parameter | Before | After |
|-----------|--------|-------|
| Tone mapping | ACES, exposure `1.15`, contrast `1.15` | ACES, exposure `1.15`, contrast `1.15` |
| FXAA | enabled | enabled |
| Bloom | threshold `0.88`, weight `0.06`, scale `0.25`, kernel `32` | config-driven, same defaults |
| Glow layer | intensity `0.25` | config-driven, same default |

## Quality Tiers

| Tier | Shadows | Bloom | AA | Hardware scale | Particles | Blob shadow |
|------|---------|-------|----|----------------|-----------|-------------|
| High | 2048 blur-ESM | on, full | MSAA 4x | `1.0` | 100% | no |
| Medium | 1024 blur-ESM | on, higher threshold/lower weight | FXAA | `1.25` | 50% | no |
| Low | disabled | off | FXAA | `1.5` | 25% | yes |

Fog density and color are **never** reduced by the quality watchdog.

## Depth Placement (new)

| Chunk type | Z range | Fog | Silhouette tint |
|------------|---------|-----|-----------------|
| Dune | `-18` to `-28` | yes | no |
| Rock | `-10` to `-18` | yes | no |
| Palms | `-8` to `-14` | yes | no |
| Fort | `-48` to `-68` | yes | yes |
| Cloud | `-36` to `-56` | yes | yes |

## Readability

- Falcon, prey, hazards, and power-ups use `fogEnabled = false` and the highest-saturation palette colors.
- Hazards (`cliff`, `vulture`) now have a subtle emissive edge.
- Ground and ceiling markers stay crystal clear.

## Performance Guard

- FPS watchdog steps from High → Medium → Low on sustained sub-30 FPS.
- Tier changes are logged to the console.
- Once Low is reached, the watchdog stops stepping down.

## Tuning

- Dev-only overlay available at `/?tune=1` when running `vite dev`.
- Sliders: fog density/storm density, fog color, bloom threshold/weight/scale, sun angle/intensity, ambient intensity.
- Palette swatches are clickable to copy hex values.
- "Copy VisualConfig diff" button exports changed values as JSON.
