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

【30秒極限挑戰 V2 稱號規則】
稱號必須同時達到「答對題數」與「正確率」兩個門檻：

見習 BLADER：未達以下門檻
新星 BLADER：答對 ≥4 題 且 正確率 ≥50%
職業 BLADER：答對 ≥6 題 且 正確率 ≥60%
頂尖 BLADER：答對 ≥8 題 且 正確率 ≥70%
X塔級 BLADER：答對 ≥10 題 且 正確率 ≥80%
MASTER BLADER：答對 ≥12 題 且 正確率 ≥85%
LEGEND BLADER：答對 ≥15 題 且 正確率 ≥90%

結算頁會顯示星等。
例如：
1/1 = 100% 仍為見習 BLADER
10/11 = 91% 為 X塔級 BLADER
12/14 = 86% 為 MASTER BLADER
15/16 = 94% 為 LEGEND BLADER

【V3 HUD】
30秒極限挑戰的 HUD 改為：
左：COMBO
中：CORRECT
右：倒數秒數
倒數秒數加大，最後 5 秒維持紅色警示。

【V4 HUD】
極限挑戰上方 HUD 改為同一排三欄：
左：目前題型與難度（例：陀螺題・簡單）
中：CORRECT
右：大讀秒

COMBO 顯示與結算中的最高 COMBO 已移除。

【V5】
極限挑戰時隱藏原本題目頁的分類／難度兩顆 badge，
只保留最上方 HUD 左側的「動畫題・簡單」等組合標籤。
一般 5 題模式仍保留原本 badge。

【V6 結算特效】
LEGEND / MASTER：大量綵帶 + 星星 + 稱號發光 + EXCELLENT!
X塔級 / 頂尖：少量綵帶 + 星星 + GREAT!
職業 / 新星：少量星光 + GOOD!
見習：灰藍 SAD 落下效果 + TRY AGAIN...
特效只播放短時間，不會持續干擾畫面。

【V7】
1. 重新整理 30 秒極限挑戰答題畫面：
   - HUD 保持左／中／右同一排
   - 隱藏一般模式的 badge
   - 極限模式不再保留底部解說框
   - 題目與四個選項恢復正常高度，不再被壓扁或出現捲軸

2. TIME UP 結算新增「查看本次答題」：
   - 可逐題查看自己的答案
   - 顯示正確答案
   - 顯示完整解說
   - 上一題／下一題／返回結算

【V8 修正】
一般 5 題模式與 30 秒極限挑戰的 HUD 完全分離。

一般模式：
- 顯示原本分類 badge
- 顯示簡單／困難 badge
- 顯示 1/5 進度
- 不顯示 CORRECT / 倒數

極限模式：
- 隱藏原本兩顆 badge
- 顯示上方三欄 HUD
- 左：題型・難度
- 中：CORRECT
- 右：倒數

【V9 首頁特殊模式配色】
30秒極限挑戰改為：
- 深海軍藍底 #172B55
- 金色外框 #F4C430
- 「30秒」金字
- 「極限挑戰」白字
- 左右加入短金色速度線
- hover 時增加輕微金色光暈

【Responsive Layouts】
- 桌機／平板：1180×850 固定設計畫布，整體等比例縮放並置中
- 手機直式：隱藏遊戲畫面，只顯示「請轉成橫式遊玩」提示
- 手機橫式：直接使用實際可視區尺寸，採獨立版面，不使用 transform 縮放
- 橫式的 HUD、題目、四個選項與回饋區會依實際高度分配空間
- 667×375、844×390 為主要驗證尺寸
- 手機判斷依實際 viewport 尺寸，不依賴觸控裝置訊號
- CSS 使用 default／phone-portrait／mobile-landscape 三種版面狀態
- 長題目與長選項會在容器內自動縮字，避免互相重疊或被裁切

【手機全螢幕】
- 橫式手機右上角會顯示「全螢幕」按鈕
- 第一次選擇分類、難度或開始 30 秒極限挑戰時，也會嘗試自動進入全螢幕
- 手機直式提示頁可點「全螢幕並切換橫式」，支援的 Android 瀏覽器會同時嘗試鎖定橫向
- 瀏覽器安全規則不允許網站在載入時直接強制全螢幕，必須先由玩家點擊一次
- iPhone 或部分內建瀏覽器可能不支援網頁全螢幕／方向鎖定；遇到這種情況請手動旋轉，或從瀏覽器選單開啟全螢幕
