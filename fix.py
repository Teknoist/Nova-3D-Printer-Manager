with open('src/components/CommandPalette.tsx', 'r', encoding='utf-8') as f:
    text = f.read()
text = text.replace("className={cmd-item {i === selectedIndex ? 'selected' : ''}}", "className={`cmd-item ${i === selectedIndex ? 'selected' : ''}`}")
with open('src/components/CommandPalette.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
