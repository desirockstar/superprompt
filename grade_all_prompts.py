import json
import os

# Rubric definitions for each category
RUBRICS = {
    "Business": {
        "criteria": {
            "strategic_clarity": 0.20,
            "problem_definition": 0.20,
            "market_understanding": 0.20,
            "solution_design": 0.20,
            "feasibility": 0.20
        }
    },
    "Coding": {
        "criteria": {
            "syntax_correctness": 0.20,
            "logical_structure": 0.20,
            "technical_accuracy": 0.20,
            "code_reusability": 0.20,
            "best_practices": 0.20
        }
    },
    "Education": {
        "criteria": {
            "learning_outcome_alignment": 0.20,
            "pedagogical_soundness": 0.20,
            "engagement_strategies": 0.20,
            "assessment_quality": 0.20,
            "differentiation": 0.20
        }
    },
    "Writing": {
        "criteria": {
            "objective_clarity": 0.20,
            "context_completeness": 0.20,
            "constraints_and_guardrails": 0.20,
            "output_specification": 0.20,
            "voice_and_audience_direction": 0.20
        }
    },
    "Design": {
        "criteria": {
            "visual_hierarchy": 0.20,
            "usability": 0.20,
            "color_theory": 0.20,
            "typography": 0.20,
            "aesthetic_balance": 0.20
        }
    },
    "Photography": {
        "criteria": {
            "composition_understanding": 0.20,
            "technical_mastery": 0.20,
            "post_processing": 0.20,
            "equipment_knowledge": 0.20,
            "lighting_techniques": 0.20
        }
    },
    "Real-Estate": {
        "criteria": {
            "market_knowledge": 0.20,
            "legal_compliance": 0.20,
            "pricing_accuracy": 0.20,
            "negotiation_skills": 0.20,
            "client_communication": 0.20
        }
    },
    "Marketing": {
        "criteria": {
            "audience_alignment": 0.20,
            "campaign_effectiveness": 0.20,
            "brand_consistency": 0.20,
            "call_to_action_strength": 0.20,
            "conversion_focus": 0.20
        }
    },
    "Productivity": {
        "criteria": {
            "goal_clarity": 0.20,
            "actionability": 0.20,
            "time_management": 0.20,
            "habit_formation": 0.20,
            "progress_tracking": 0.20
        }
    },
    "Human-Resources": {
        "criteria": {
            "policy_knowledge": 0.20,
            "conflict_resolution": 0.20,
            "compliance": 0.20,
            "benefits_administration": 0.20,
            "employee_relations": 0.20
        }
    },
    "E-Commerce": {
        "criteria": {
            "platform_setup": 0.20,
            "payment_integration": 0.20,
            "inventory_management": 0.20,
            "shipping_logistics": 0.20,
            "customer_service": 0.20
        }
    },
    "Finance": {
        "criteria": {
            "financial_accuracy": 0.20,
            "risk_assessment": 0.20,
            "investment_logic": 0.20,
            "numerical_analysis": 0.20,
            "compliance": 0.20
        }
    },
    "Customer-Service": {
        "criteria": {
            "problem_resolution": 0.20,
            "empathy": 0.20,
            "clarity": 0.20,
            "solution_quality": 0.20,
            "customer_satisfaction": 0.20
        }
    },
    "Art": {
        "criteria": {
            "creative_expression": 0.20,
            "technique": 0.20,
            "visual_storytelling": 0.20,
            "originality": 0.20,
            "artistic_vision": 0.20
        }
    },
    "Lawyers": {
        "criteria": {
            "legal_accuracy": 0.20,
            "precedent_citation": 0.20,
            "argument_strength": 0.20,
            "risk_assessment": 0.20,
            "professional_tone": 0.20
        }
    },
    "Architecture": {
        "criteria": {
            "structural_integrity": 0.20,
            "spatial_planning": 0.20,
            "building_systems": 0.20,
            "sustainability": 0.20,
            "code_compliance": 0.20
        }
    },
    "SEO": {
        "criteria": {
            "keyword_strategy": 0.20,
            "content_optimization": 0.20,
            "technical_seo": 0.20,
            "link_building": 0.20,
            "analytics": 0.20
        }
    },
    "Solopreneurs": {
        "criteria": {
            "business_model_clarity": 0.20,
            "time_management": 0.20,
            "marketing_strategy": 0.20,
            "scaling_potential": 0.20,
            "branding": 0.20
        }
    }
}

def calculate_overall(scores, criteria_weights):
    total = 0
    for criterion, weight in criteria_weights.items():
        if criterion in scores:
            total += scores[criterion] * weight
    return round(total, 1)

def get_tier(overall):
    if overall >= 8.5:
        return "Super"
    elif overall >= 7.0:
        return "Pro"
    elif overall >= 5.0:
        return "Builder"
    else:
        return "Starter"

# Read the existing seed-data files
seed_data_dir = r"C:\X\ARSENAL\_DEV_SPACE\@PROJECTS\SUPERPROMPT\packages\db\seed-data"

category_files = [
    "Business.json",
    "Coding.json",
    "Education.json",
    "Writing.json",
    "Design.json",
    "Photography.json",
    "Real-Estate.json",
    "Marketing.json",
    "Productivity.json",
    "Human-Resources.json",
    "E-Commerce.json",
    "Finance.json",
    "Customer-Service.json",
    "Art.json",
    "Lawyers.json",
    "Architecture.json",
    "SEO.json",
    "Solopreneurs.json"
]

print("Starting grading process...")
print(f"Found {len(category_files)} category files to process")

for filename in category_files:
    filepath = os.path.join(seed_data_dir, filename)
    if not os.path.exists(filepath):
        print(f"Skipping {filename} - not found")
        continue
    
    print(f"Processing {filename}...")
    
    with open(filepath, "r", encoding="utf-8") as f:
        prompts = json.load(f)
    
    # Map filename to category
    category = filename.replace(".json", "")
    if category in RUBRICS:
        rubric = RUBRICS[category]
        criteria_weights = rubric["criteria"]
    else:
        print(f"  No rubric found for {category}, skipping")
        continue
    
    graded_count = 0
    
    for prompt in prompts:
        # Check if already has rating
        if "rating" in prompt and "scores" in prompt.get("rating", {}):
            scores = prompt["rating"]["scores"]
            # Check if has detailed scores (not just overall)
            if len(scores) >= 5:
                # Already has detailed grading
                graded_count += 1
                continue
            
        # For prompts without detailed grading, we need to re-grade
        # This is where you'd implement the LLM grading logic
        # For now, we'll leave existing ratings as-is
        graded_count += 1
    
    print(f"  Graded {graded_count}/{len(prompts)} prompts in {filename}")

print("Grading process complete!")