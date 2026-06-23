import os
import re

files = ["Tester.html", "RPT.html", "Report/index.html", "index.html"]

prompt_replacement = """const PROMPT_CLOSED = `You are reading a screenshot from an LME metals trading platform.

IDENTIFY the screen type:

CLOSED TRADES → return type="trades":
• The screen shows "Mua & Bán" or "Purchase & Sales".
• Extract EVERY SINGLE ROW from the table as a separate JSON object, in the EXACT ORDER they appear from top to bottom.
• DO NOT pair them yourself. Return the raw rows.
• For each row, identify the contract it belongs to (found in a header above the rows, like "▼ 40 LALZ" or "AHDD15U26").
• For each row, extract:
  - date: the date text (e.g. "6/18/26" or "18/06/2026", leave empty if not present)
  - action: the exact text indicating size and side, e.g. "1L", "1S", "1 lot mua", "1 lot bán", "1B", "1S"
  - price: the numeric price
  - pl: the numeric P/L value (if the text is "n/a", return null)

OPEN POSITIONS → return type="positions":
• Any screen with M/L/B/S position labels and AVG/OTE keywords or compact price+OTE columns

Return ONLY valid JSON (absolutely no markdown, no text before or after the JSON):
{
  "type": "trades" or "positions",
  "raw_rows": [
    {
      "contract": "LALZ",
      "date": "6/18/26",
      "action": "1L",
      "price": 3400.00,
      "pl": null
    },
    {
      "contract": "LALZ",
      "date": "6/19/26",
      "action": "1S",
      "price": 3403.50,
      "pl": 87.50
    }
  ]
}

If type="positions", return raw_rows as []`;"""

logic_replacement_tester = """
    const rawRows = res.raw_rows || [];
    closedTr = [];
    for (let i = 0; i < rawRows.length; i += 2) {
      if (i + 1 >= rawRows.length) break;
      const r1 = rawRows[i];
      const r2 = rawRows[i+1];
      
      let openRow = r1;
      let closeRow = r2;
      
      const t1 = new Date(r1.date).getTime();
      const t2 = new Date(r2.date).getTime();
      
      if (t1 && t2 && t1 !== t2) {
         if (t1 > t2) { openRow = r2; closeRow = r1; }
      } else {
         if (r1.pl !== null && r2.pl === null) { openRow = r2; closeRow = r1; }
      }

      let side = 'Long';
      const openAct = (openRow.action || '').toUpperCase();
      if (openAct.includes('S') || openAct.includes('BÁN') || openAct.includes('B')) {
         side = 'Short';
      } else if (openAct.includes('L') || openAct.includes('MUA')) {
         side = 'Long';
      }

      const match = openAct.match(/\\d+/);
      const lots = match ? parseInt(match[0], 10) : 1;

      closedTr.push({
        contract: (openRow.contract || r1.contract || '').trim().toUpperCase(),
        openDate: openRow.date || '',
        closeDate: closeRow.date || '',
        maturityDate: typeof matDate !== 'undefined' ? matDate(openRow.contract || r1.contract || '') : (typeof maturityDateFromCode !== 'undefined' ? maturityDateFromCode(openRow.contract || r1.contract || '') : ''),
        side: side,
        openPrice: num(openRow.price),
        closePrice: num(closeRow.price),
        lots: lots
      });
    }
    
    closedTr = closedTr.filter(t=>t.contract&&t.openPrice!==null&&t.closePrice!==null);
"""

logic_replacement_index = logic_replacement_tester.replace("closedTr", "closedTrades").replace("res.raw_rows", "result.raw_rows")

for fname in files:
    if not os.path.exists(fname):
        print("Not found:", fname)
        continue
        
    with open(fname, 'r', encoding='utf-8') as f:
        content = f.read()

    content = re.sub(r'const\s+PROMPT_CLOSED\s*=\s*`.*?`;', lambda m: prompt_replacement, content, flags=re.DOTALL)

    if 'closedTrades = (' in content:
        content = re.sub(r'closedTrades\s*=\s*\(result\.trades.*?filter\(.*?\);', lambda m: logic_replacement_index.strip(), content, flags=re.DOTALL)
        print("Replaced index logic in", fname)
    elif 'closedTr = (' in content:
        content = re.sub(r'closedTr\s*=\s*\(res\.trades.*?filter\(.*?\);', lambda m: logic_replacement_tester.strip(), content, flags=re.DOTALL)
        print("Replaced tester logic in", fname)
        
    with open(fname, 'w', encoding='utf-8') as f:
        f.write(content)
        
print("Done")
