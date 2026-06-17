import json

path = r"C:\Users\User\.gemini\antigravity-ide\brain\41130d26-f28b-4859-9de0-b1852ffd7ebe\.system_generated\logs\transcript.jsonl"

with open(path, "r", encoding="utf-8") as f:
    for line in f:
        if "MapBox.tsx" in line and ("Pentagon" in line or "CircleDot" in line or "selectionMode" in line) and "tool_calls" in line:
            try:
                data = json.loads(line)
                step = data.get("step_index")
                print(f"\n--- TOOL CALL AT STEP {step} ---")
                for tc in data.get("tool_calls", []):
                    # In some systems, it's tc["function"]["arguments"]
                    fn = tc.get("function", {})
                    args_data = fn.get("arguments", {})
                    if not args_data:
                        args_data = tc.get("arguments", {})
                    
                    if isinstance(args_data, str):
                        try:
                            args = json.loads(args_data)
                        except:
                            args = args_data
                    else:
                        args = args_data
                    
                    # Search within args
                    args_str = json.dumps(args, ensure_ascii=False)
                    if "Pentagon" in args_str or "CircleDot" in args_str or "selectionMode" in args_str:
                        print("Tool name:", tc.get("name"))
                        if isinstance(args, dict):
                            for k, v in args.items():
                                if k in ("ReplacementChunks", "ReplacementContent", "CodeContent"):
                                    val_str = json.dumps(v, ensure_ascii=False)
                                    if "Pentagon" in val_str or "CircleDot" in val_str or "selectionMode" in val_str:
                                        print(f"  Field '{k}':")
                                        if isinstance(v, list):
                                            for idx, item in enumerate(v):
                                                if "Pentagon" in str(item) or "CircleDot" in str(item) or "selectionMode" in str(item):
                                                    print(f"    Chunk {idx}:")
                                                    print(json.dumps(item, indent=2, ensure_ascii=False)[:3000])
                                        else:
                                            print(str(v)[:3000])
                        else:
                            print("Raw args:", str(args)[:2000])
            except Exception as e:
                print("Error parsing", e)
