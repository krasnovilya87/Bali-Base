import json

path = r"C:\Users\User\.gemini\antigravity-ide\brain\41130d26-f28b-4859-9de0-b1852ffd7ebe\.system_generated\logs\transcript.jsonl"

with open(path, "r", encoding="utf-8") as f:
    for line in f:
        try:
            data = json.loads(line)
            step = data.get("step_index")
            # If step has Pentagon/CircleDot or selectionMode
            if "Pentagon" in line or "CircleDot" in line or "selectionMode" in line:
                print(f"Step {step}, Type {data.get('type')}")
                # Print keys
                print("Keys:", list(data.keys()))
                # If tool_calls, print tool_calls key and its type
                if "tool_calls" in data:
                    print("Tool calls type:", type(data["tool_calls"]))
                    print("Tool calls preview:", str(data["tool_calls"])[:500])
                break
        except Exception as e:
            pass
