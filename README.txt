BBX-QUIZ GitHub Pages 上傳包

請把以下「內容」全部上傳到 BBX-QUIZ repository 的最外層：

index.html
questions/
  anime_easy.txt
  anime_hard.txt
  bey_easy.txt
  bey_hard.txt
settings/
  page_text.txt

【題庫】
格式：
編號｜分類｜難度｜題目｜選項A｜選項B｜選項C｜選項D｜正確答案｜解說

編號只供管理查找，遊玩頁不顯示。
四份題庫的編號可以各自從 1 開始。

【頁面文字】
settings/page_text.txt
格式是一行一項：
homeTitle=321 GO SHOOT!!
homeSub=...
animeTitle=動畫題
...

之後改題庫或頁面文字，只需要修改 TXT 並重新上傳，不必修改 index.html。

注意：本版本使用 fetch() 讀 TXT，請從 GitHub Pages 網址開啟。
直接在電腦雙擊 index.html，瀏覽器可能因 file:// 安全限制無法讀取 TXT。

【30秒極限挑戰】
首頁新增 30 秒極限挑戰。
會從四份題庫（動畫/陀螺 × 簡單/困難）全部混合隨機出題。
答題後約 0.25 秒自動切到下一題，30 秒到立即結算。
稱號：
0–3 見習 BLADER
4–5 新星 BLADER
6–7 職業 BLADER
8–9 頂尖 BLADER
10–11 X塔級 BLADER
12–14 MASTER BLADER
15+ LEGEND BLADER

首頁極限挑戰文字也可在 settings/page_text.txt 修改：
timeAttackTitle=
timeAttackSub=
