import os
import re

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    if 'datetime.now(timezone.utc)' not in content:
        return

    # Replace datetime.now(timezone.utc)
    content = content.replace('datetime.now(timezone.utc)', 'datetime.now(timezone.utc)')

    # Ensure timezone is imported
    if 'from datetime import' in content:
        if 'timezone' not in content:
            # Add timezone to existing from datetime import
            content = re.sub(r'(from datetime import [^\n]+)', r'\1, timezone', content, count=1)
    else:
        # Just prepend it
        content = 'from datetime import timezone\n' + content

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

for root, _, files in os.walk('c:/Users/Lenovo/OneDrive/Documents/GitHub/DirectHire/backend'):
    for file in files:
        if file.endswith('.py') and '.venv' not in root:
            fix_file(os.path.join(root, file))
print("Fixed datetime warnings!")
