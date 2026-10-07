import re

with open('src/promax.css', 'r', encoding='utf-8') as f:
    css = f.read()

# Replace body { with body:not(.theme-light) {
css = css.replace('body {', 'body:not(.theme-light) {')

# Find other selectors and wrap them or prepend body:not(.theme-light)
# Actually, the easiest way is to just append a light mode override section!
light_overrides = '''
/* 14. LIGHT MODE SUPPORT */
body.theme-light {
  background: 
    radial-gradient(circle at 15% 50%, rgba(20, 255, 140, 0.1), transparent 30%),
    radial-gradient(circle at 85% 30%, rgba(20, 140, 255, 0.1), transparent 30%),
    #f8f9fa !important;
  color: #111 !important;
}

body.theme-light .sidebar, 
body.theme-light .topbar, 
body.theme-light .panel, 
body.theme-light .printer-card, 
body.theme-light .metric, 
body.theme-light .network-card, 
body.theme-light .active-job, 
body.theme-light .modal, 
body.theme-light .toast, 
body.theme-light .job-row-card {
  background: rgba(255, 255, 255, 0.6) !important;
  border: 1px solid rgba(0, 0, 0, 0.05) !important;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05) !important;
}

body.theme-light .secondary-button, 
body.theme-light .icon-button {
  background: rgba(0, 0, 0, 0.03) !important;
  border: 1px solid rgba(0, 0, 0, 0.05) !important;
  color: #333 !important;
}

body.theme-light .topbar h1 {
  background: linear-gradient(90deg, #111, #1a7a42);
  -webkit-background-clip: text !important;
  -webkit-text-fill-color: transparent !important;
}

body.theme-light td {
  color: #444 !important;
}
body.theme-light th {
  color: #1a7a42 !important;
  border-bottom: 1px solid rgba(0,0,0,0.1) !important;
}
body.theme-light tr:hover td {
  background: rgba(0, 0, 0, 0.02) !important;
}

body.theme-light .mobile-nav {
  background: rgba(255, 255, 255, 0.9) !important;
  border-top: 1px solid rgba(0,0,0,0.1) !important;
}
'''

if '14. LIGHT MODE SUPPORT' not in css:
    css += light_overrides

with open('src/promax.css', 'w', encoding='utf-8') as f:
    f.write(css)

