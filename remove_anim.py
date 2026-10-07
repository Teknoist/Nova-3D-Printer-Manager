import re

with open('src/promax.css', 'r', encoding='utf-8') as f:
    css = f.read()

css = re.sub(r'/\* 10\. Animations \*/.*?/\* 11\.', '/* 11.', css, flags=re.DOTALL)

with open('src/promax.css', 'w', encoding='utf-8') as f:
    f.write(css)
