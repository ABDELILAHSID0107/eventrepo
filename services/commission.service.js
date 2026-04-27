/**
 * Commission Service
 * Calculates the different financial parts of a booking
 */


const calculate = (totalPrice) => {
  const DEPOSIT_RATE = 0.30;
  const COMMISSION_RATE = 0.07;
  
  const depositAmount = Math.round(totalPrice * DEPOSIT_RATE);
  const commissionAmount = Math.round(totalPrice * COMMISSION_RATE);
  const payoutAmount = totalPrice - commissionAmount;

  return {
    depositAmount,
    commissionAmount,
    payoutAmount
  };
};

module.exports = {
  calculate
};
