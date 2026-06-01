/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
  // @TODO: Расчет выручки от операции
  const { sale_price, quantity, discount } = purchase;
  const discountDecimal = 1 - discount / 100;
  const price = sale_price * quantity;
  return price * discountDecimal;
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
  const { profit } = seller;

  if (index === 0) return profit * 0.15;
  if (index <= 2) return profit * 0.1;
  if (index === total - 1) return 0;
  return profit * 0.05;
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
  const { customers, products, sellers, purchase_records } = data;
  const { calculateRevenue, calculateBonus } = options;

  if (
    !data ||
    !Array.isArray(data.sellers) ||
    !Array.isArray(data.products) ||
    !Array.isArray(data.purchase_records) ||
    data.sellers.length === 0 ||
    data.products.length === 0 ||
    data.purchase_records.length === 0
  ) {
    throw new Error("Некорректные входные данные");
  }
  if (
    !options ||
    typeof options.calculateRevenue !== "function" ||
    typeof options.calculateBonus !== "function"
  ) {
    throw new Error("Некорректные опции");
  }
  const totalSellers = sellers.length;

  const sellerById = sellers.reduce((acc, seller) => {
    acc[seller.id] = seller;
    return acc;
  }, {});

  const productBySku = products.reduce((acc, product) => {
    acc[product.sku] = product;
    return acc;
  }, {});

  const stats = sellers.reduce((acc, seller) => {
    acc[seller.id] = {
      id: seller.id,
      name: `${seller.first_name} ${seller.last_name}`,
      revenue: 0,
      profit: 0,
      sales_count: 0,
      products_sold: {},
    };
    return acc;
  }, {});

  purchase_records.forEach((order) => {
    const seller = order.seller_id;

    stats[seller].sales_count += 1;

    order.items.forEach((item) => {
      const product = productBySku[item.sku];
      const revenue = calculateRevenue(item, product);
      const cost = product.purchase_price * item.quantity;

      stats[seller].revenue += revenue;
      stats[seller].profit += revenue - cost;
      stats[seller].products_sold[item.sku] =
        (stats[seller].products_sold[item.sku] || 0) + item.quantity;
    });
  });

  const rankedSellers = Object.entries(stats)
    .map(([id, data]) => ({
      seller_id: id,
      name: data.name,
      revenue: +data.revenue.toFixed(2),
      profit: +data.profit.toFixed(2),
      sales_count: data.sales_count,
      top_products: Object.entries(data.products_sold)
        .map(([sku, quantity]) => ({ sku, quantity }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10),
    }))
    .sort((a, b) => b.profit - a.profit)
    .map((seller, index) => ({
      ...seller,
      bonus: +calculateBonus(index, totalSellers, seller).toFixed(2),
    }));

  return rankedSellers;
}
