import re

with open('src/promax.css', 'r', encoding='utf-8') as f:
    css = f.read()

# Fix the dangling mobile-nav at the end
css = css.replace('''  .mobile-nav {
  background: rgba(255, 255, 255, 0.9) !important;
  border-top: 1px solid rgba(0,0,0,0.1) !important;
}''', '''body.theme-light .mobile-nav {
  background: rgba(255, 255, 255, 0.9) !important;
  border-top: 1px solid rgba(0,0,0,0.1) !important;
}''')

with open('src/promax.css', 'w', encoding='utf-8') as f:
    f.write(css)
