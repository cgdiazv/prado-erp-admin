import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('app/page.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

def inspect_block(start_match):
    start = -1
    for i, line in enumerate(lines):
        if start_match in line:
            start = i
            break
    if start == -1:
        print(f"NOT FOUND: {start_match}")
        return
    depth = 0
    end = -1
    for i in range(start, len(lines)):
        depth += lines[i].count('(') - lines[i].count(')')
        if depth == 0 and i > start:
            end = i
            break
    print(f"Match: {start_match} -> Line {start+1} to {end+1}")
    return start, end

inspect_block('{editingBank && (')
inspect_block('{showNewAccountModal && (')
inspect_block('{showConfigSidebar && (')
inspect_block('{showConnectBankModal && (')
inspect_block('{showNewRuleModal && (')
