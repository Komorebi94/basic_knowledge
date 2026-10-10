"""Build the public planning catalog from the approved design tables."""
import json
import re
from pathlib import Path

root = Path(__file__).resolve().parent.parent
design = root / "docs/design"


def table_rows(path):
    for line in path.read_text().splitlines():
        if line.startswith("| "):
            yield [cell.strip() for cell in line.strip("|").split("|")]


knowledge = []
for row in table_rows(design / "07-knowledge-map.md"):
    if re.fullmatch(r"K\d{2}-\d{2}", row[0]):
        knowledge.append({"id": row[0], "domainId": row[0].split("-")[0], "title": row[1], "summary": row[2]})

practice = []
for row in table_rows(design / "08-exercise-catalog.md"):
    if not re.fullmatch(r"E\d{2}", row[0]):
        continue
    parts = row[1].split(" / ")
    foundational = int(row[0][1:]) <= 24
    practice.append({
        "id": row[0], "title": parts[0], "summary": row[2], "boundaries": row[3],
        "environment": "JavaScript" if foundational else parts[1],
        "difficulty": parts[1] if foundational else None,
        "minutes": int(parts[2]) if foundational else None,
    })

ai = []
for row in table_rows(design / "09-ai-engineering.md"):
    if re.fullmatch(r"AI\d{2}", row[0]):
        ai.append({"id": row[0], "title": row[1], "summary": row[2], "deliverable": row[3]})

for name, entries, expected in [("knowledge", knowledge, 128), ("practice", practice, 40), ("ai", ai, 20)]:
    if len(entries) != expected or len({entry["id"] for entry in entries}) != expected:
        raise ValueError(f"{name}: expected {expected} unique entries, found {len(entries)}")

destination = root / "src/content/catalog.json"
destination.write_text(json.dumps({"knowledge": knowledge, "practice": practice, "ai": ai}, ensure_ascii=False, indent=2) + "\n")
print("Catalog synchronized: 128 knowledge topics, 40 exercises, 20 AI topics")
