import os

def fix_imports(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    if 'datetime.now(timezone.utc)' in content and 'import timezone' not in content:
        content = 'from datetime import timezone\n' + content
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

for root, _, files in os.walk('c:/Users/Lenovo/OneDrive/Documents/GitHub/DirectHire/backend'):
    for file in files:
        if file.endswith('.py') and '.venv' not in root:
            fix_imports(os.path.join(root, file))
print("Fixed imports!")
