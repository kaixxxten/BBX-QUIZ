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
images/
  （自行建立子資料夾並放入題目圖或選項圖）

【題庫】
格式：
編號｜分類｜難度｜題目｜選項A｜選項B｜選項C｜選項D｜正確答案｜解說

編號只供管理查找，遊玩頁不顯示。
四份題庫的編號可以各自從 1 開始。

【圖片題】
既有純文字題庫格式完全相容，不需要轉換。新題目可使用以下延伸格式：

編號｜分類｜難度｜題型｜題目｜題目圖1｜題目圖1標籤｜題目圖2｜題目圖2標籤｜選項A文字｜選項A圖片｜選項B文字｜選項B圖片｜選項C文字｜選項C圖片｜選項D文字｜選項D圖片｜正確答案｜解說

「編號」仍可省略。其餘欄位位置固定，沒有內容的欄位也必須保留全形分隔符號「｜」。

題型：
- text-only：純文字題。建議沿用原有短格式；四個文字選項都必須填寫。
- image-prompt：填寫 1～2 張題目圖；A／B／C／D 維持文字選項，選項圖片欄留空。
- image-choice：填寫 2～4 個圖片選項；選項需由 A 開始連續填寫，每個使用中的選項圖片不可留空。選項文字可作為圖片小標籤，也可留空。

正確答案仍填 A、B、C 或 D。選項在遊戲中會隨機排列，但正解、玩家選擇與答題回顧會一起依新順序對應。

image-prompt 範例（1 張題目圖）：
1｜動畫｜簡單｜image-prompt｜圖中是哪一顆陀螺？｜images/prompts/sample.png｜題目圖｜｜｜DranSword｜｜HellsScythe｜｜WizardArrow｜｜KnightShield｜｜A｜圖中是 DranSword。

image-choice 範例（3 個圖片選項）：
2｜陀螺｜困難｜image-choice｜哪一張圖是正確零件？｜｜｜｜｜選項一｜images/choices/a.png｜選項二｜images/choices/b.png｜選項三｜images/choices/c.png｜｜｜B｜正確圖片是原始 B 選項。

圖片使用方式：
- 建議把圖片放在專案的 images/ 資料夾，TXT 內填寫相對於 index.html 的路徑，例如 images/prompts/sample.png。
- 支援瀏覽器可顯示的常見圖片格式；圖片會以 object-fit: contain 顯示，不會拉伸或裁切。
- 圖片載入失敗時會顯示「圖片載入失敗」佔位提示，題目仍可繼續作答。
- 路徑、標籤、題目、選項與解說文字內請勿使用全形分隔符號「｜」。
- 一張題目圖會置中，兩張會左右並排；兩個圖片選項左右並排，三至四個採兩欄排列。
- 建議圖片素材使用 800×450 px（16:9）；這只是素材建議，畫面會依桌機、平板或手機的實際可用空間自動縮放。
- 題目圖片位於深藍題目框下方的獨立圖片列；兩張圖片選項會等高、置中顯示，不會在桌機上撐滿整個剩餘高度。
- 一般 10 題、60 秒極限挑戰及極限挑戰答題回顧都共用同一套判分資料。

【版本號與 STAFF / CREDIT】
- App 右下角會持續顯示版本號，點擊後可開啟 STAFF / CREDIT 視窗。
- 版本號只需修改 index.html 內的 APP_VERSION。
- STAFF 名單集中在 index.html 內的 STAFF_INFO，可直接增加分類或在各分類陣列中增加姓名。
- 視窗可用右上角 ×、下方關閉按鈕、點擊遮罩或桌機 ESC 關閉。
- STAFF 視窗是覆蓋層，不會切換或重建遊戲畫面，也不會重置題目、分數、進度或 60 秒倒數。

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

【一般 10 題模式】
- 動畫／陀螺與簡單／困難四種組合，每局都從所選題庫隨機抽出 10 題
- 進度顯示為 1 / 10 到 10 / 10
- 答對 6 題以上為挑戰成功；答對 5 題以下為挑戰失敗
- 成功顯示彩帶效果，失敗顯示失敗效果

【60秒極限挑戰】
首頁提供 60 秒極限挑戰。
會從四份題庫（動畫/陀螺 × 簡單/困難）全部混合隨機出題。
答題後約 0.25 秒自動切到下一題，60 秒到立即結算。

首頁極限挑戰文字也可在 settings/page_text.txt 修改：
timeAttackTitle=
timeAttackSub=

【60秒極限挑戰稱號規則】
稱號必須同時達到「答對題數」與「正確率」兩個門檻：

見習 BLADER：未達以下門檻
新星 BLADER：答對 ≥8 題 且 正確率 ≥50%
職業 BLADER：答對 ≥12 題 且 正確率 ≥60%
頂尖 BLADER：答對 ≥16 題 且 正確率 ≥70%
X塔級 BLADER：答對 ≥20 題 且 正確率 ≥80%
MASTER BLADER：答對 ≥24 題 且 正確率 ≥85%
LEGEND BLADER：答對 ≥30 題 且 正確率 ≥90%

星級：
見習 BLADER：★☆☆☆☆
新星 BLADER：★★☆☆☆
職業 BLADER：★★☆☆☆
頂尖 BLADER：★★★☆☆
X塔級 BLADER：★★★★☆
MASTER BLADER：★★★★★
LEGEND BLADER：★★★★★＋

例如：
27/30 = 90% 為 MASTER BLADER（尚未答對 30 題）
25/30 = 83% 為 X塔級 BLADER
21/24 = 87.5% 為 X塔級 BLADER
15/15 = 100% 為職業 BLADER（答對題數未達更高門檻）

【V3 HUD】
60秒極限挑戰的 HUD 改為：
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
一般 10 題模式仍保留原本 badge。

【V6 結算特效】
LEGEND / MASTER：大量綵帶 + 星星 + 稱號發光 + EXCELLENT!
X塔級 / 頂尖：少量綵帶 + 星星 + GREAT!
職業 / 新星：少量星光 + GOOD!
見習：灰藍 SAD 落下效果 + TRY AGAIN...
特效只播放短時間，不會持續干擾畫面。

【V7】
1. 重新整理 60 秒極限挑戰答題畫面：
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
一般 10 題模式與 60 秒極限挑戰的 HUD 完全分離。

一般模式：
- 顯示原本分類 badge
- 顯示簡單／困難 badge
- 顯示 1/10 到 10/10 進度
- 不顯示 CORRECT / 倒數

極限模式：
- 隱藏原本兩顆 badge
- 顯示上方三欄 HUD
- 左：題型・難度
- 中：CORRECT
- 右：倒數

【V9 首頁特殊模式配色】
60秒極限挑戰改為：
- 深海軍藍底 #172B55
- 金色外框 #F4C430
- 「60秒」金字
- 「極限挑戰」白字
- 左右加入短金色速度線
- hover 時增加輕微金色光暈

【Responsive Layouts】
- 桌機／平板：1180×850 固定設計畫布，整體等比例縮放並置中
- 手機直式：隱藏遊戲畫面，只顯示「請轉成橫式遊玩」提示
- 手機橫式：採獨立版面，不沿用桌機畫布，也不使用 transform 整體縮放
- 尺寸優先讀取 visualViewport 的實際可用寬高；不支援時才使用 innerWidth／innerHeight
- 橫式版依目前可用畫面的比例與高度，在 normal／compact 兩種密度間切換，不綁定手機型號或固定解析度
- 工具列壓縮高度時，先縮減垂直留白、padding 與次要文字，保留題目、HUD、四個選項與主要按鈕
- 高度明顯不足時會顯示小型提示條；高度恢復後自動隱藏，提示條不覆蓋操作區
- CSS 使用 default／phone-portrait／mobile-landscape 三種版面狀態，compact 是 mobile-landscape 內的單一高度狀態
- 長題目與長選項會在合理下限內自動縮字；仍超出時可在各自容器捲動，不以 overflow:hidden 裁切
- resize、orientationchange 與 visualViewport resize 會合併到動畫幀更新；沒有監聽 visualViewport scroll

【手機全螢幕】
- 只有瀏覽器實際提供 Fullscreen API 時才顯示「全螢幕」按鈕
- 支援的 Android 瀏覽器保留原本按鈕、進入／離開全螢幕與橫向鎖定行為
- 第一次選擇分類、難度或開始 60 秒極限挑戰時，支援的瀏覽器仍會從該次玩家操作嘗試進入全螢幕
- 手機直式提示頁只在 Fullscreen API 可用時顯示「全螢幕並切換橫式」
- 瀏覽器安全規則不允許網站在載入時直接強制全螢幕，必須先由玩家點擊一次
- iPhone Safari／Chrome 若不支援一般網頁全螢幕，不顯示無效按鈕，也不會強制呼叫；轉成橫式後可直接使用一般瀏覽狀態遊玩

【平板全螢幕】
- 全螢幕能力與 responsive layout 分開判定；平板仍維持原本 default 版面
- Android 平板 Chrome、iPad Safari／Chrome 只要實際提供 requestFullscreen 或 WebKit 對應 API，就會顯示頂部「全螢幕」按鈕
- 點擊後呼叫真正的瀏覽器 Fullscreen API，不使用 CSS 模擬放大
- 退出時使用 exitFullscreen／webkitExitFullscreen，並在瀏覽器允許時解除方向鎖定
- 手機橫式的自動進入行為維持不變；平板由玩家點擊按鈕進入，不會因選擇分類而自動切換
