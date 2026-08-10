with open('dist/server.cjs', 'r', encoding='utf-8') as f:
    js = f.read()

def find_block(name):
    pos = js.find(name)
    if pos == -1:
        return ""
    # find outer braces
    brace_start = js.find('{', pos)
    if brace_start == -1:
        return ""
    count = 1
    idx = brace_start + 1
    while idx < len(js) and count > 0:
        if js[idx] == '{':
            count += 1
        elif js[idx] == '}':
            count -= 1
        idx += 1
    return js[pos:idx]

advisor_code = find_block('app.post("/api/gift-advisor"')
local_code = "function " + find_block('getLocalResponse(')
chat_code = find_block('app.post("/api/assistant-chat"')

content = f"""// ==========================================
// RESTORED GIFT ADVISOR
// ==========================================
{advisor_code}

// ==========================================
// RESTORED GET LOCAL RESPONSE
// ==========================================
{local_code}

// ==========================================
// RESTORED ASSISTANT CHAT
// ==========================================
{chat_code}
"""

with open('restored_middle.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("Extraction successful! Saved to restored_middle.ts")
