import json
import re

transcript_path = r"C:\Users\User\.gemini\antigravity-ide\brain\41130d26-f28b-4859-9de0-b1852ffd7ebe\.system_generated\logs\transcript.jsonl"

with open(transcript_path, 'r', encoding='utf-8') as f:
    for line_idx, line in enumerate(f):
        if line_idx == 422:
            print("--- STEP 422 ---")
            diff_match = re.search(r'"content":"(.*)"', line)
            if diff_match:
                content = diff_match.group(1)
                # Split by literal '\r\n' or '\\n'
                lines = re.split(r'\\r\\n|\\n', content)
                print(f"Total diff lines: {len(lines)}")
                for i, l in enumerate(lines):
                    if "Pentagon" in l or "CircleDot" in l or "selectionMode" in l or "right-4" in l:
                        # Print surrounding lines
                        start = max(0, i-5)
                        end = min(len(lines), i+6)
                        print(f"\n--- Match at index {i} ---")
                        for idx in range(start, end):
                            print(f"{idx}: {lines[idx]}")
