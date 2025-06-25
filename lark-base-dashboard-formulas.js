// Lark Base Dashboard Formulas for YouTube CRM Analytics
// These formulas can be used in Lark Base calculated fields

// ===== 1. SALES PERFORMANCE METRICS =====

// Monthly Sales Total
const monthlySales = `
SUMIF(
  {成約日},
  AND(
    YEAR({成約日}) = YEAR(TODAY()),
    MONTH({成約日}) = MONTH(TODAY())
  ),
  {契約金額}
)`;

// Year-over-Year Growth
const yoyGrowth = `
(SUMIF({成約日}, YEAR({成約日}) = YEAR(TODAY()), {契約金額}) - 
 SUMIF({成約日}, YEAR({成約日}) = YEAR(TODAY()) - 1, {契約金額})) / 
 SUMIF({成約日}, YEAR({成約日}) = YEAR(TODAY()) - 1, {契約金額}) * 100`;

// Sales Target Achievement Rate
const targetAchievement = `
SUMIF({成約日}, MONTH({成約日}) = MONTH(TODAY()), {契約金額}) / 
{月次売上目標} * 100`;

// Average Deal Size
const avgDealSize = `
AVERAGEIF({ステータス}, "成約", {契約金額})`;

// Win Rate by Stage
const winRate = `
COUNTIF({ステータス}, "成約") / 
(COUNTIF({ステータス}, "成約") + COUNTIF({ステータス}, "失注")) * 100`;

// Sales Cycle Length
const salesCycle = `
AVERAGEIF({ステータス}, "成約", DAYS({成約日}, {初回接触日}))`;

// ===== 2. YOUTUBE CONTENT EFFECTIVENESS =====

// Video Effectiveness Score (1-5 scale)
const videoEffectScore = `
IF({視聴回数} > 0,
  ({成約貢献数} / {視聴回数} * 0.4 + 
   {平均視聴完了率} * 0.3 + 
   {顧客評価} / 5 * 0.3) * 5,
  0
)`;

// Video ROI Calculation
const videoROI = `
IF({動画制作コスト} > 0,
  ({動画経由売上} - {動画制作コスト}) / {動画制作コスト} * 100,
  0
)`;

// Video Conversion Rate
const videoConversion = `
IF({動画視聴者数} > 0,
  {動画経由成約数} / {動画視聴者数} * 100,
  0
)`;

// Content Engagement Score
const engagementScore = `
({いいね数} * 0.2 + {コメント数} * 0.3 + {共有数} * 0.5) / {視聴回数} * 100`;

// ===== 3. CUSTOMER ANALYTICS =====

// Customer Lifetime Value (CLV)
const customerLTV = `
{平均契約金額} * {平均契約期間（月）} * {契約更新率}`;

// Customer Acquisition Cost (CAC)
const customerCAC = `
({マーケティング費用} + {営業費用}) / {新規顧客数}`;

// Customer Health Score
const healthScore = `
({利用頻度スコア} * 0.3 + 
 {満足度スコア} * 0.4 + 
 {拡張可能性スコア} * 0.3) * 100`;

// Churn Risk Indicator
const churnRisk = `
IF(
  OR(
    DAYS(TODAY(), {最終活動日}) > 30,
    {満足度スコア} < 3,
    {利用頻度} < 50
  ),
  "高リスク",
  IF(
    OR(
      DAYS(TODAY(), {最終活動日}) > 14,
      {満足度スコア} < 4
    ),
    "中リスク",
    "低リスク"
  )
)`;

// ===== 4. KPI ALERT CONDITIONS =====

// Sales Alert Status
const salesAlert = `
IF({目標達成率} < 60, 
  "🔴 緊急対応必要", 
  IF({目標達成率} < 80, 
    "🟡 要注意", 
    "🟢 順調"
  )
)`;

// Deal Stagnation Alert
const dealAlert = `
IF(
  AND(
    {ステータス} != "成約",
    {ステータス} != "失注",
    DAYS(TODAY(), {最終活動日}) > 14
  ),
  "⚠️ " & DAYS(TODAY(), {最終活動日}) & "日間活動なし",
  ""
)`;

// Video Performance Alert
const videoAlert = `
IF({動画効果スコア} < 3.0, 
  "📺 効果改善必要", 
  IF({動画効果スコア} < 4.0, 
    "📊 効果向上余地あり", 
    "✨ 高効果"
  )
)`;

// Customer Risk Alert
const customerAlert = `
IF({顧客健全性スコア} < 60,
  "🚨 要フォロー",
  IF({顧客健全性スコア} < 80,
    "⚡ 注視必要",
    "💚 健全"
  )
)`;

// ===== 5. TREND CALCULATIONS =====

// Month-over-Month Growth
const momGrowth = `
(SUMIF({成約日}, MONTH({成約日}) = MONTH(TODAY()), {契約金額}) - 
 SUMIF({成約日}, MONTH({成約日}) = MONTH(TODAY()) - 1, {契約金額})) / 
 SUMIF({成約日}, MONTH({成約日}) = MONTH(TODAY()) - 1, {契約金額}) * 100`;

// Quarter Performance
const quarterPerformance = `
SUMIF(
  {成約日},
  AND(
    YEAR({成約日}) = YEAR(TODAY()),
    QUARTER({成約日}) = QUARTER(TODAY())
  ),
  {契約金額}
)`;

// Pipeline Value by Stage
const pipelineValue = `
SUMIF(
  {営業段階},
  OR(
    {営業段階} = "提案",
    {営業段階} = "交渉",
    {営業段階} = "最終確認"
  ),
  {予想契約金額} * {成約確率}
)`;

// ===== 6. ACTIVITY METRICS =====

// Sales Activity Efficiency
const activityEfficiency = `
COUNTIF({活動結果}, "成約") / COUNT({活動ID}) * 100`;

// Response Time Average
const avgResponseTime = `
AVERAGE(HOURS({初回返信時刻}, {問い合わせ時刻}))`;

// Meeting to Opportunity Conversion
const meetingConversion = `
COUNTIF({商談結果}, "案件化") / COUNT({商談ID}) * 100`;

// ===== 7. RANKING FORMULAS =====

// Sales Rep Ranking
const salesRepRank = `
RANK({個人売上合計}, {全営業売上リスト}, "DESC")`;

// Video Performance Ranking
const videoRank = `
RANK({動画効果スコア}, {全動画スコアリスト}, "DESC")`;

// Customer Value Ranking
const customerRank = `
RANK({顧客LTV}, {全顧客LTVリスト}, "DESC")`;

// ===== 8. SUMMARY STATISTICS =====

// Weekly Summary Stats
const weeklySummary = `
"新規リード: " & COUNTIF({作成日}, WEEKNUM({作成日}) = WEEKNUM(TODAY())) & 
" | 商談: " & COUNTIF({商談開始日}, WEEKNUM({商談開始日}) = WEEKNUM(TODAY())) &
" | 成約: " & COUNTIF({成約日}, WEEKNUM({成約日}) = WEEKNUM(TODAY()))`;

// Monthly Pipeline Summary
const pipelineSummary = `
"リード: " & COUNTIF({ステータス}, "リード") & 
" | 商談中: " & COUNTIF({ステータス}, "商談中") &
" | 見込み額: ¥" & TEXT(SUM({予想契約金額}), "#,##0")`;

// ===== IMPLEMENTATION NOTES =====
/*
1. Replace field names in {} with actual Lark Base field names
2. Test formulas with sample data before full deployment
3. Consider performance impact for large datasets
4. Use appropriate data types for each field
5. Set up proper field dependencies
6. Regular validation of formula results
7. Document any custom modifications
*/