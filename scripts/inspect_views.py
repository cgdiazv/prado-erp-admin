with open('app/page.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'AccountingBooksModule' in line:
        print(f'{i+1}: {line.strip()[:100]}')
    if 'currentView ===' in line and any(k in line for k in ['transacciones', 'cuentas', 'libros', 'bancos']):
        print(f'{i+1}: {line.strip()[:100]}')
    if 'showNewAccountModal' in line:
        print(f'showNewAccountModal {i+1}: {line.strip()[:100]}')
    if 'showConnectBankModal' in line:
        print(f'showConnectBankModal {i+1}: {line.strip()[:100]}')
    if 'showNewRuleModal' in line:
        print(f'showNewRuleModal {i+1}: {line.strip()[:100]}')
    if 'editingBank' in line:
        print(f'editingBank {i+1}: {line.strip()[:100]}')
