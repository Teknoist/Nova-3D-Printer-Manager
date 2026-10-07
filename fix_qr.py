import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    app_ts = f.read()

app_ts = app_ts.replace(
    "<div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '16px' }}>",
    "<div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginTop: '24px', justifyContent: 'center' }}>"
)

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(app_ts)
