import md5 from './md5';

interface Params {
  click_trans_id: number;
  service_id: number;
  secret_key: string;
  merchant_trans_id: string;
  merchant_prepare_id?: number;
  amount: number;
  action: 0 | 1;
  sign_time: string;
}

export default function checkSign(params: Params, sign: string) {
  // Order of params is important
  const toBeHashedString = `${params.click_trans_id}${params.service_id}${params.secret_key}${params.merchant_trans_id}${params.merchant_prepare_id ?? ''}${params.amount}${params.action}${params.sign_time}`;
  const hash = md5(toBeHashedString);

  return hash === sign;
}
