import os

index_html_path = r'c:\Users\Admin\OneDrive\Pictures\OD\04 HTML\04 Stavian\index.html'
fix_txt_path = r'c:\Users\Admin\OneDrive\Pictures\OD\04 HTML\04 Stavian\fix.txt'

with open(index_html_path, 'r', encoding='utf-8') as f:
    index_html = f.read()

with open(fix_txt_path, 'r', encoding='utf-8') as f:
    fix_txt = f.read()

start_marker = "        pageSubtitle.textContent = 'Công cụ kiểm tra vị thế và hạch toán LME.';"
end_marker = "    function renderGenericTable(payload) {"

start_index = index_html.find(start_marker)
if start_index == -1:
    print("Could not find start marker")
    exit(1)

end_index = index_html.find(end_marker, start_index)
if end_index == -1:
    print("Could not find end marker")
    exit(1)

new_start_str = "        pageSubtitle.textContent = 'Công cụ kiểm tra vị thế và hạch toán LME.';\n        if (filtersBlock) filtersBlock.style.display = 'none';\n      }\n    }\n\n"

new_content = new_start_str + fix_txt + "\n\n" + end_marker

final_html = index_html[:start_index] + new_content + index_html[end_index + len(end_marker):]

with open(index_html_path, 'w', encoding='utf-8') as f:
    f.write(final_html)

print("Fixed index.html successfully!")
