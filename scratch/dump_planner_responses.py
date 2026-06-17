import json
import re

path = r"C:\Users\User\.gemini\antigravity-ide\brain\41130d26-f28b-4859-9de0-b1852ffd7ebe\.system_generated\logs\transcript.jsonl"

with open(path, "r", encoding="utf-8") as f:
    for line in f:
        try:
            data = json.loads(line)
            step = data.get("step_index")
            content = data.get("content", "")
            if ("Pentagon" in content or "CircleDot" in content or "selectionMode" in content) and data.get("type") in ("PLANNER_RESPONSE", "CODE_ACTION"):
                # Let's see if this contains replacement chunks or a markdown representation of the code
                print(f"=== Match at Step {step}, Type {data.get('type')} ===")
                # If there are any replacement content chunks or block of code in content
                # Let's print out the matches
                # We can find blocks with ```tsx or similar
                blocks = re.findall(r"```tsx.*?```", content, re.DOTALL)
                if blocks:
                    for idx, block in enumerate(blocks):
                        if "Pentagon" in block or "CircleDot" in block or "selectionMode" in block:
                            print(f"  Code block {idx}:")
                            print(block[:3000])
                            print("-" * 30)
                else:
                    # Print first 2000 chars of content
                    print(content[:2000])
                print("=" * 60)
        except Exception as e:
            pass
