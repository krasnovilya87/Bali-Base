import json

path = r"C:\Users\User\.gemini\antigravity-ide\brain\41130d26-f28b-4859-9de0-b1852ffd7ebe\.system_generated\logs\transcript.jsonl"

with open(path, "r", encoding="utf-8") as f:
    for line in f:
        try:
            data = json.loads(line)
            step = data.get("step_index")
            # Step 23, 25 or 27 are VIEW_FILE steps
            if step in (23, 25, 27) and data.get("type") == "VIEW_FILE":
                print(f"=== Found Step {step} VIEW_FILE ===")
                # The file viewed is MapBox.tsx
                # Check output or content
                content = data.get("content", "")
                print("Content length:", len(content))
                # Let's search if it contains MapPolygon or Pentagon or CircleDot
                if "MapPolygon" in content or "Pentagon" in content:
                    print("Contains MapPolygon/Pentagon!")
                    # Let's save this content to a separate scratch file for us to read
                    out_path = rf"C:\Users\User\.gemini\antigravity-ide\brain\41130d26-f28b-4859-9de0-b1852ffd7ebe\scratch\original_mapbox_step_{step}.tsx"
                    with open(out_path, "w", encoding="utf-8") as out_f:
                        out_f.write(content)
                    print(f"Saved to {out_path}")
        except Exception as e:
            print("Error parsing line", e)
