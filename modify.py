import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

code = code.replace('</article>\n  );\n}\n\nfunction Printers', '</motion.article>\n  );\n}\n\nfunction Printers')

code = code.replace('<div className="metric">', '<motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="metric">')

# Wait, Metric return ends with </div>.
code = code.replace('</div>\n  );\n}\n\nfunction PrinterCard', '</motion.div>\n  );\n}\n\nfunction PrinterCard')

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
print('Done!')
