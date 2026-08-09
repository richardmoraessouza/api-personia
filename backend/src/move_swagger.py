from pathlib import Path
import re

root = Path(r'c:\Users\Pichau\Desktop\programacao\chatback\backend\src')
files = [
    (root / 'modules/auth/routes/authRouter.js', root / 'modules/auth/routes/swagger/index.js'),
    (root / 'modules/characters/routes/characterRouter.js', root / 'modules/characters/routes/swagger/index.js'),
    (root / 'modules/chat/routes/chatRouter.js', root / 'modules/chat/routes/swagger/index.js'),
    (root / 'modules/discovery/routes/discoveryRouter.js', root / 'modules/discovery/routes/swagger/index.js'),
    (root / 'modules/ratings/routes/ratingsRouter.js', root / 'modules/ratings/routes/swagger/index.js'),
    (root / 'modules/social/routes/socialRouter.js', root / 'modules/social/routes/swagger/index.js'),
    (root / 'modules/users/routes/userRouter.js', root / 'modules/users/routes/swagger/index.js'),
]

pattern = re.compile(r'/\*\*[\s\S]*?@swagger[\s\S]*?\*/', re.MULTILINE)

for route_path, swagger_path in files:
    text = route_path.read_text(encoding='utf-8')
    matches = pattern.findall(text)
    cleaned = pattern.sub('', text)
    cleaned = re.sub(r'\n{3,}', '\n\n', cleaned).strip() + '\n'
    route_path.write_text(cleaned, encoding='utf-8')

    swagger_text = swagger_path.read_text(encoding='utf-8')
    if swagger_text.strip():
        swagger_text = swagger_text.rstrip() + '\n\n'
    else:
        swagger_text = ''

    if matches:
        swagger_text += '\n\n'.join(matches) + '\n'
        swagger_path.write_text(swagger_text, encoding='utf-8')
