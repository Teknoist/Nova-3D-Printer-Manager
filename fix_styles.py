import re

with open('src/styles.css', 'r', encoding='utf-8') as f:
    css = f.read()

# Add tailwind
css = '@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n' + css

# Add some global Pro Max CSS
pro_max = '''
/* PRO MAX UI ENHANCEMENTS */
.panel, .printer-card, .metric, .network-card, .active-job, .modal, .toast {
    box-shadow: 0 10px 30px rgba(0,0,0,0.2) !important;
    border-radius: 16px !important;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
}
.printer-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 15px 35px rgba(var(--mint), 0.1) !important;
    border-color: var(--mint) !important;
}
.primary-button, .secondary-button, .icon-button {
    transition: all 0.2s ease !important;
    border-radius: 12px !important;
}
.primary-button:hover {
    transform: scale(1.03);
    box-shadow: 0 0 15px var(--mint-dark);
}
.topbar {
    background: rgba(var(--bg), 0.8) !important;
    backdrop-filter: blur(12px) !important;
}
.modal {
    animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.modal-backdrop {
    animation: fadeIn 0.2s ease;
    backdrop-filter: blur(6px);
}
@keyframes slideUp { from { opacity: 0; transform: translateY(30px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

/* COMMAND PALETTE CSS */
.cmd-backdrop {
  position: fixed; inset: 0; z-index: 999;
  background: rgba(0,0,0,0.5); backdrop-filter: blur(12px);
  display: flex; justify-content: center; align-items: flex-start;
  padding-top: 12vh;
  animation: fadeIn 0.15s ease-out;
}
.cmd-palette {
  width: 100%; max-width: 640px;
  background: var(--panel); border: 1px solid var(--line);
  border-radius: 18px; overflow: hidden;
  box-shadow: 0 25px 80px rgba(0,0,0,0.5);
  animation: slideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.cmd-header {
  display: flex; align-items: center; padding: 0 20px;
  border-bottom: 1px solid var(--line);
}
.cmd-search-icon { color: var(--muted); }
.cmd-header input {
  flex: 1; border: none; background: transparent; box-shadow: none;
  font-size: 18px; padding: 24px 16px; color: #fff;
  outline: none;
}
.theme-light .cmd-header input { color: #000; }
.cmd-list { max-height: 450px; overflow-y: auto; padding: 12px; }
.cmd-item {
  display: flex; align-items: center; gap: 14px; padding: 16px 20px;
  color: var(--soft); border-radius: 12px; cursor: pointer;
  font-weight: 500; transition: background 0.15s;
}
.cmd-item.selected {
  background: var(--mint-dark); color: var(--mint);
}
.cmd-empty { padding: 40px; text-align: center; color: var(--muted); }
'''

with open('src/styles.css', 'w', encoding='utf-8') as f:
    f.write(css + '\n' + pro_max)
