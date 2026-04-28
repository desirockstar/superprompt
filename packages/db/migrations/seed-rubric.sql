-- Seed default rubric using dollar quoting
INSERT INTO rubrics (category, criteria) 
VALUES ('general', $json$[{ "name": "clarity", "weight": 0.4 }, { "name": "specificity", "weight": 0.3 }, { "name": "usability", "weight": 0.3 }]$json$);