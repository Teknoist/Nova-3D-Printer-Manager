import re

with open('src/promax.css', 'r', encoding='utf-8') as f:
    css = f.read()

# 1. Fix the background scroll issue
css = css.replace('background-size: 200% 200% !important;', 'background-size: 200% 200% !important;\n  background-attachment: fixed !important;\n  min-height: 100vh !important;')
css = css.replace('#f8f9fa !important;', '#f8f9fa !important;\n  background-attachment: fixed !important;\n  min-height: 100vh !important;')

# 2. Fix dynamic colors. Replace hardcoded greens with CSS variables.
# The user's chosen color in settings.themeColor overwrites --mint globally in the original app.
# So we can replace #a9f4c7 -> var(--mint) and #4bc985 -> var(--mint-dark) and rgba(169, 244, 199 -> rgba(var(--mint-rgb)
# Actually, the original app might not have --mint-rgb. Let's just use var(--mint) and let opacity handle it if possible, or just replace the main ones.
css = css.replace('#a9f4c7', 'var(--mint)')
css = css.replace('#4bc985', 'var(--mint-dark)')
css = css.replace('#20ff8c', 'var(--mint)')

# 3. Fix the primary-button alignment on desktop
button_fix = '''
.primary-button {
  background: linear-gradient(135deg, var(--mint), var(--mint-dark)) !important;
  color: #000 !important;
  font-weight: 700 !important;
  border: none !important;
  border-radius: 12px !important;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2) !important;
  text-transform: uppercase !important;
  letter-spacing: 1px !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 8px !important;
}
'''
css = re.sub(r'\.primary-button\s*\{[^}]*\}', button_fix.strip(), css, count=1)

# 4. Fix the leaked mobile CSS in light mode
# Remove the broken block:
broken_block = '''body.theme-light 
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
  }'''
css = css.replace(broken_block, '')

with open('src/promax.css', 'w', encoding='utf-8') as f:
    f.write(css)

