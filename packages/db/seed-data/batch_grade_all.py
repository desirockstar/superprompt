import json
import os
import random

seed_data_dir = r"C:\X\ARSENAL\_DEV_SPACE\@PROJECTS\SUPERPROMPT\packages\db\seed-data"

category_files = [
    "Business.json",
    "Education.json", 
    "Coding.json",
    "Productivity.json",
    "Human-Resources.json",
    "E-Commerce.json",
    "Finance.json",
    "Photography.json",
    "Design.json",
    "Customer-Service.json",
    "Art.json",
    "Lawyers.json",
    "Architecture.json",
    "SEO.json",
    "Solopreneurs.json",
    "Real-Estate.json",
    "Writing.json"
]

def grade_prompt(content, title):
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
    
    return round(min_score, 1)

for filename in category_files:
    filepath = os.path.join(seed_data_dir, filename)
    
    if not os.path.exists(filepath):
        print(f"Skipping {filename} - not found")
        continue
    
    print(f"Processing {filename}...")
    
    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    graded_count = 0
    skipped_count = 0
    
    for item in data:
        if "rating" in item:
            skipped_count += 1
            continue
        
        content = item.get("content", "")
        title = item.get("title", "")
        
        base = grade_prompt(content, title)
        
        item["rating"] = {
            "scores": {
                "overall_score": base
            },
            "overall": base,
            "tier": "Builder" if base > 5.0 else "Starter",
            "feedback": "Auto-graded based on content length and structure",
            "improvements": ["Review for completeness"]
        }
        
        graded_count += 1
    
    output_path = filepath
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"  Graded {graded_count} prompts, skipped {skipped_count}")

print("Complete!")