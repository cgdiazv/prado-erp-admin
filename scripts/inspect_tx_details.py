import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('app/page.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i in range(4079, 4677):
    line = lines[i]
    if 'bankSubTab ===' in line or 'bankSubTab =' in line or ('<button' in line and 'bankSubTab' in line):
        print(f'{i+1}: {line.strip()[:80]}')
    elif 'onClick=' in line and any(k in line for k in ['handle', 'setBank', 'setShowConnect', 'setShowNewRule', 'setEditingBank', 'setCurrentView']):
        print(f'{i+1}: {line.strip()[:80]}')
