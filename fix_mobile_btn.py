import re

with open('src/promax.css', 'r', encoding='utf-8') as f:
    css = f.read()

mobile_fixes = '''
  .top-actions .primary-button {
    width: 42px !important;
    height: 42px !important;
    padding: 0 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
  }
  .top-actions .primary-button svg {
    margin: 0 !important;
  }
'''

css = css.replace('.mobile-nav {', mobile_fixes + '\n  .mobile-nav {')

with open('src/promax.css', 'w', encoding='utf-8') as f:
    f.write(css)
