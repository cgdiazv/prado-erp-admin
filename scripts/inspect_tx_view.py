import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('app/page.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

start = -1
for i, line in enumerate(lines):
    if 'currentView === "transacciones" && (' in line:
        start = i
        break

print(f'Start: line {start+1}')
# find matching closing tag
depth = 0
end = -1
for i in range(start, len(lines)):
    depth += lines[i].count('(') - lines[i].count(')')
    if depth == 0 and i > start:
        end = i
        break

print(f'End: line {end+1}: {lines[end].strip()}')
print(f'Next line {end+2}: {lines[end+1].strip()}')
