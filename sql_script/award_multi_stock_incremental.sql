-- 已部署 award 表的数据库须在发布多库存代码前执行。
ALTER TABLE `award` DROP CHECK `ck_award_stock_range`;
ALTER TABLE `award`
  ADD CONSTRAINT `ck_award_stock_range`
  CHECK (`total_stock` >= 1 AND `remaining_stock` BETWEEN 0 AND `total_stock`);
