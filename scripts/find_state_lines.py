import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('app/page.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

terms = [
    'ACCOUNT_CATEGORIES',
    'DETAIL_TYPES_MAP',
    'newAccountForm',
    'editingAccountId',
    'handleOpenEditAccount',
    'handleSaveAccount',
    'handleDeleteAccount',
    'bankToastNotification',
    'connectBankForm',
    'connectBankLoading',
    'handleUpdateBank',
    'handleDeleteBank',
    'newRuleForm',
    'handleToggleRuleActive',
    'handleDeleteRule',
    'handleUpdateTransactionStatus',
    'bankSubTab',
    'selectedBankId',
    'bankSearch',
    'bankSyncing',
    'showConfigSidebar',
    'accountModalLoading',
    'accountModalError',
    'accountModalSuccess',
    'showSaveDropdown',
]

for t in terms:
    matches = [i+1 for i, l in enumerate(lines) if t in l]
    print(f"{t}: found on {len(matches)} lines: {matches[:10]}")
