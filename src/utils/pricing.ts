type GraphPriceInput = {
  days: number;
  pricePerDay: number;
  pricePerMonth?: number;
};

const roundToTenThousand = (value: number) => Math.round(value / 10000) * 10000;

export const calculateGraphDailyPrice = ({ days, pricePerDay, pricePerMonth }: GraphPriceInput) => {
  const basePriceMonth = pricePerMonth || pricePerDay * 0.55 * 30;
  const baseMonthlyDaily = basePriceMonth / 30;

  if (days < 8) {
    return roundToTenThousand(pricePerDay);
  }

  if (days >= 30) {
    return roundToTenThousand(baseMonthlyDaily);
  }

  const diff = pricePerDay - baseMonthlyDaily;
  let stepPct = 0.1;
  if (days >= 8 && days <= 9) stepPct = 0.15;
  else if (days >= 10 && days <= 14) stepPct = 0.30;
  else if (days >= 15 && days <= 19) stepPct = 0.45;
  else if (days >= 20 && days <= 24) stepPct = 0.60;
  else if (days >= 25 && days <= 29) stepPct = 0.75;

  return roundToTenThousand(pricePerDay - diff * stepPct);
};

export const calculateGraphTotalPrice = (input: GraphPriceInput) =>
  calculateGraphDailyPrice(input) * input.days;
