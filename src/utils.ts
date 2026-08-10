// Persian numbers and price formatter utility

export function toPersianDigits(num: number | string): string {
  const id = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return num.toString().replace(/[0-9]/g, function (w) {
    return id[+w];
  });
}

export function formatTomanToWords(amount: number): string {
  if (amount === 0) return "رایگان / هدیه معنوی";
  if (amount < 1000) return `${toPersianDigits(amount)} تومان`;

  const million = 1000000;
  const thousand = 1000;

  if (amount >= million) {
    const millions = Math.floor(amount / million);
    const remainder = amount % million;
    const thousands = Math.floor(remainder / thousand);

    if (thousands > 0) {
      return `${toPersianDigits(millions)} میلیون و ${toPersianDigits(thousands)} هزار تومان`;
    }
    return `${toPersianDigits(millions)} میلیون تومان`;
  } else {
    const thousands = Math.floor(amount / thousand);
    return `${toPersianDigits(thousands)} هزار تومان`;
  }
}
