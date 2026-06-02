import json
import os

log_path = r"C:\Users\saich\.gemini\antigravity\brain\7f28cec7-133c-4584-a58b-3b3d02ed936a\.system_generated\logs\transcript.jsonl"
out_path = r"c:\Users\saich\OneDrive\Desktop\AI_Navigator\backend\extracted_prompt.txt"

if os.path.exists(log_path):
    print("Log file exists. Searching...")
    matches = []
    with open(log_path, 'r', encoding='utf-8') as f:
        for i, line in enumerate(f):
            try:
                data = json.loads(line)
                if data.get("source") == "USER_EXPLICIT":
                    content = data.get("content", "")
                    if "AI Tool Intelligence Platform" in content or "following is the current complete workflow" in content:
                        print(f"Found match on line {i}")
                        matches.append(content)
            except Exception as e:
                pass
    if matches:
        # Save the longest/most complete match
        longest_match = max(matches, key=len)
        with open(out_path, 'w', encoding='utf-8') as out_f:
            out_f.write(longest_match)
        print(f"Saved longest match ({len(longest_match)} chars) to {out_path}")
    else:
        print("No matches found from USER_EXPLICIT.")
else:
    print("Log file not found.")
