---
title: "🩻 Generate Axonometric Architecture Diagrams"
source: godofprompt.ai
slug: "promptsgenerate-axonometric-architecture-diagrams"
---

{
  "project": {
    "title": "Exploded Axonometric [BUILDING TYPE] — System Diagram",
    "goal": "Create a high-precision exploded 3D axonometric architectural diagram of an original contemporary [BUILDING TYPE], showing structure, envelope, partitions, and roof layers clearly and cleanly",
    "language": "en"
  },

  "subject": {
    "type": "exploded_axonometric_architecture",
    "building": "[BUILDING TYPE]",
    "description": "A contemporary two-level [BUILDING TYPE] presented as an exploded axonometric drawing with separated layers and wall panels, similar to a technical assembly diagram",
    "scale": "[BUILDING SCALE]",
    "consistency_rules": [
      "true axonometric projection (no perspective)",
      "all elements aligned to a single vertical axis",
      "consistent exploded spacing between layers",
      "clean technical linework and legible hierarchy",
      "no photoreal rendering, no textures, no shadows"
    ]
  },

  "design_language": {
    "aesthetic": "architectural assembly diagram",
    "keywords": [
      "exploded axonometric",
      "[BUILDING TYPE] system diagram",
      "technical line drawing",
      "clean construction logic",
      "publication-ready"
    ]
  },

  "villa_concept": {
    "layout_logic": {
      "primary_space": "[PRIMARY SPACE DESCRIPTION]",
      "secondary_spaces": "[SECONDARY SPACES DESCRIPTION]",
      "outdoor_relation": "[OUTDOOR RELATIONSHIP DESCRIPTION]"
    },
    "circulation": {
      "vertical": "[VERTICAL CIRCULATION DESCRIPTION]",
      "horizontal": "[HORIZONTAL CIRCULATION DESCRIPTION]"
    }
  },

  "exploded_layers": [
    {
      "index": 1,
      "name": "Roof Assembly",
      "elements": [
        "simple pitched or mono-slope roof plane",
        "roof deck panels",
        "thin roof overhang edges",
        "roof ridge/edge beams"
      ]
    },
    {
      "index": 2,
      "name": "Upper Floor Plate",
      "elements": [
        "upper floor structural deck",
        "primary beams and joists",
        "opening cutout for double-height living space"
      ]
    },
    {
      "index": 3,
      "name": "Upper Partitions (Panels)",
      "elements": [
        "bedroom partition panels",
        "bathroom core panels",
        "corridor / gallery guardrail panels"
      ],
      "panel_behavior": "panels float outward in exploded fashion to show assembly"
    },
    {
      "index": 4,
      "name": "Facade / Envelope Panels",
      "elements": [
        "large sliding glass wall panels",
        "solid insulated wall panels",
        "sun-shading screen panels (optional)"
      ],
      "arrangement": "panels explode outward on both sides, left and right, in symmetrical layout"
    },
    {
      "index": 5,
      "name": "Ground Floor Plate",
      "elements": [
        "ground floor structural deck",
        "edge beams",
        "terrace connection plate"
      ]
    },
    {
      "index": 6,
      "name": "Interior Core + Stair",
      "elements": [
        "stair volume",
        "service core (kitchen/back-of-house plumbing wall)",
        "minimal interior built-ins for scale"
      ]
    },
    {
      "index": 7,
      "name": "Structural Skeleton",
      "elements": [
        "primary columns",
        "ring beams / perimeter beams",
        "selected bracing frames",
        "cantilever edge supports for terrace"
      ]
    },
    {
      "index": 8,
      "name": "Foundation + Site Platform",
      "elements": [
        "pier footings or shallow foundation pads",
        "raised platform plinth",
        "steps to entry terrace"
      ]
    }
  ],

  "drawing_style": {
    "projection": "axonometric",
    "linework": {
      "type": "precise CAD-like line drawing",
      "hierarchy": [
        "structure lines slightly heavier",
        "envelope lines medium",
        "interior partition lines light",
        "dashed guide lines for exploded alignment"
      ]
    },
    "color": {
      "palette": "single ink color ([INK COLOR])",
      "background": "pure white"
    },
    "transparency": {
      "use": "subtle transparency for glazing panels only",
      "avoid": "no heavy shading"
    }
  },

  "composition": {
    "layout": "vertical exploded stack with outward-fanned wall panels",
    "alignment_guides": [
      "thin dashed vertical guide lines connecting layers",
      "small numeric labels near each layer (1–8)"
    ],
    "clarity_rules": [
      "generous whitespace around the diagram",
      "no cluttered annotations",
      "clean separation distances"
    ]
  },

  "output": {
    "format": "publication-ready architectural diagram",
    "aspect_ratio": "1:1",
    "resolution": "very high",
    "style": "exploded axonometric linework",
    "no_ai_artifacts": true
  },

  "negative_prompt": [
    "perspective view",
    "photoreal rendering",
    "material textures",
    "heavy shadows",
    "dramatic lighting",
    "hand-drawn sketchiness",
    "messy linework",
    "random shapes",
    "text paragraphs",
    "logos",
    "watermarks"
  ]
}

## How to use the prompt

Generates an exploded axonometric AI image that separates a building into eight distinct layers showing structure, walls, floors, and roof. Creates a technical architectural diagram with clean line work that displays how building components assemble vertically along a central axis. Produces a publication-ready AI image prompt output using precise CAD-style lines without shadows, textures, or perspective distortion.

## Categories

Architecture, 3D Axonometric Graphics

## Recommended tools

- Nano Banana
