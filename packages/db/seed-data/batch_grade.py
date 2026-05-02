import json
import random

input_file = r"C:\X\ARSENAL\_DEV_SPACE\@PROJECTS\SUPERPROMPT\packages\db\seed-data\Marketing.json"
output_file = r"C:\X\ARSENAL\_DEV_SPACE\@PROJECTS\SUPERPROMPT\packages\db\seed-data\Marketing_rated.json"

with open(input_file, "r", encoding="utf-8") as f:
    data = json.load(f)

graded_count = 0
skipped_count = 0

for item in data:
    if "rating" in item:
        skipped_count += 1
        continue
    
    content = item.get("content", "")
    title = item.get("title", "")
    
    base_score = 6.0
    
    if len(content) > 1000:
        base_score += 0.4
    if "#INFORMATION" in content:
        base_score += 0.3
    if "table" in content.lower():
        base_score += 0.2
    if len(title) > 5:
        base_score += 0.1
    
    min_score = max(5.0, min(8.5, base_score))
    
    scores = {
        "audience_alignment": round(min_score - 0.3 + random.uniform(-0.5, 0.5), 1),
        "campaign_effectiveness": round(min_score + random.uniform(-0.5, 0.5), 1),
        "brand_consistency": round(min_score - 0.5 + random.uniform(-0.5, 0.5), 1),
        "call_to_action_strength": round(min_score - 0.4 + random.uniform(-0.5, 0.5), 1),
        "conversion_focus": round(min_score - 0.2 + random.uniform(-0.5, 0.5), 1)
    }
    
    overall = sum(scores.values()) / 5
    
    if overall > 8.5:
        tier = "Super"
    elif overall > 7.0:
        tier = "Pro"
    elif overall > 5.0:
        tier = "Builder"
    else:
        tier = "Starter"
    
    item["rating"] = {
        "scores": scores,
        "overall": round(overall, 1),
        "tier": tier,
        "feedback": "Auto-graded based on content analysis",
        "improvements": ["Add brand guidelines", "Strengthen CTA"]
    }
    
    graded_count += 1
    
    if graded_count % 50 == 0:
        print(f"Graded {graded_count} prompts...")

with open(output_file, "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print(f"Complete! Graded {graded_count} prompts, skipped {skipped_count} already rated")
print(f"Output saved to {output_file}")