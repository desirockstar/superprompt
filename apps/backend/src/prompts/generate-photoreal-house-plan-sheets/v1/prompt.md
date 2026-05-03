---
title: "🩻 Generate Photoreal House Plan Sheets"
slug: "promptsgenerate-photoreal-house-plan-sheets"
---

{
  "project": "Photoreal House + Matching Floor Plan Sheet Same Design",
  "prompt_language": "English",
  "use_case": "Generate a single presentation image that contains (A) a photorealistic exterior render of the house on top and (B) a clean architectural floor plan drawing panel on the bottom, both representing the SAME building.",
  "inputs": {
    "house_style": "[HOUSE STYLE]",
    "site_context": "[SITE CONTEXT]",
    "levels": "[BUILDING SPEC]",
    "total_area": "[BUILDING SPEC]",
    "bed_bath": "[BUILDING SPEC]",
    "material_palette": "[MATERIAL PALETTE]",
    "key_features": [
      "[KEY FEATURE 1]",
      "[KEY FEATURE 2]",
      "[KEY FEATURE 3]"
    ],
    "floor_plan_requirements": {
      "plan_style": "clean black linework on white background",
      "labels_language": "English",
      "include_room_labels": true,
      "include_room_sizes": true,
      "units": "sq ft",
      "include_doors_swings": true,
      "include_windows": true,
      "include_stairs_if_needed": true
    },
    "layout_sheet": {
      "composition": "top: exterior render, bottom: two floor plans side-by-side if two levels; if one level then one plan centered",
      "margins": "generous white margins like an architecture presentation board",
      "caption_style": "minimal, no big logos, no watermark",
      "aspect_ratio": "4:5"
    },
    "render_settings": {
      "time_of_day": "golden hour / dusk",
      "lighting": "realistic soft sky + warm interior lights visible through glass",
      "camera": "slightly elevated 3/4 view, 28-35mm lens, straight verticals",
      "quality": "ultra photoreal, PBR materials, ray-traced reflections, high dynamic range"
    }
  },
  "main_prompt": "Create a single architectural presentation board image. TOP HALF: an ultra-photorealistic exterior visualization of a [HOUSE STYLE] with [BUILDING SPEC] levels, approx. [BUILDING SPEC], [BUILDING SPEC], in a [SITE CONTEXT]. Design language: rectilinear volumes with strong horizontal rooflines, deep window reveals, premium [MATERIAL PALETTE]. Include key features: [KEY FEATURE 1], [KEY FEATURE 2], [KEY FEATURE 3]. Add a calm landscaped yard and a refined courtyard/pool composition if specified. Realistic dusk/golden-hour lighting with warm interior glow through large black-framed glazing; crisp shadows; correct scale; no distortion; buildable structure; detailed facade joints.\n\nBOTTOM HALF: a clean architectural floor plan drawing panel that matches the SAME building exactly. If [BUILDING SPEC] is two levels, show TWO floor plans side-by-side Upper Floor right. If one level, show one plan centered. Use black linework on white background with consistent stroke weights, doors with swing arcs, windows, walls thickness, stairs where needed. Label every room in English and show room sizes in {units}. Keep the plan minimal and professional (like an architecture brochure). Ensure room arrangement is logically consistent with the exterior: double-height glazing corresponds to living room, courtyard/pool aligns with outdoor terrace, core placement matches.\n\nThe whole output must look like a real architecture presentation sheet: clean white margins, subtle small captions only. Do NOT add random text, fake logos, or unreadable typography. Everything must be sharp and readable.",
  "negative_prompt": [
    "two unrelated designs",
    "floor plan not matching the exterior",
    "warped lines, melted geometry",
    "unreadable room labels, gibberish text",
    "overly decorative plan style",
    "watermarks, big logos, mockup frames",
    "fisheye distortion, bent verticals",
    "cartoon or illustration style"
  ],
  "consistency_rules": {
    "must_match": [
      "exterior massing and interior plan layout correspond",
      "window locations roughly align with major rooms",
      "pool/courtyard position matches terrace edges in plan",
      "stairs/core placement consistent across plans and exterior"
    ],
    "sheet_readability": [
      "floor plan lines crisp and high contrast",
      "labels readable, not overlapping walls",
      "clean spacing, aligned grid"
    ]
  }
}

## How to use the prompt

Generates a single AI image presentation board showing a photorealistic house exterior render on top and matching architectural floor plans below. Creates both views of the same building design with consistent features, ensuring the floor plan layout matches the exterior massing and window positions. Produces a professional architecture sheet with clean margins, readable room labels, and realistic dusk lighting for the exterior render.

## Categories

Architecture, Residential Architecture

## Recommended tools

- Nano Banana
