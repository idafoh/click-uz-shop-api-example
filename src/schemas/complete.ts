import z from 'zod';

export const COMPLETE_REQUEST_SCHEMA = z.object({
  click_trans_id: z.number().describe('ID платежа в системе CLICK.'),
  service_id: z.number().int().describe('ID сервиса'),
  click_paydoc_id: z.number().describe('Номер платежа в системе CLICK. Отображается в СМС у клиента при оплате.'),
  merchant_trans_id: z.string().or(z.number()).describe('ID заказа(для Интернет магазинов)/лицевого счета/логина в биллинге поставщика'),
  merchant_prepare_id: z.number().int().describe('ID платежа в биллинг системе поставщика для подтверждения, полученный при запросе «Prepare»'),
  amount: z.number().describe('Сумма оплаты (в сумах)'),
  action: z.number().int().positive().lte(1).describe('Выполняемое действие. Должно быт 1'),
  error: z.number().int().nonpositive().describe('Код статуса завершения платежа. 0 – успешно. В случае ошибки возвращается код ошибки.'),
  error_note: z.string().describe('Описание кода завершения платежа.'),
  sign_time: z.string().describe('Дата платежа. Формат «YYYY-MM-DD HH:mm:ss»'),
  sign_string: z.string().describe('Проверочная строка, подтверждающая подлинность отправляемого запроса. ХЭШ MD5.'),
});

export const COMPLETE_RESPONSE_SCHEMA = z.object({
  click_trans_id: z.number().describe('ID платежа в системе CLICK.'),
  merchant_trans_id: z.string().describe('ID заказа(для Интернет магазинов)/лицевого счета/логина в биллинге поставщика'),
  merchant_confirm_id: z.number().describe('ID транзакции завершения платежа в биллинг системе (может быть NULL)').nullable(),
  error: z.number().int().nonpositive().describe('Код статуса запроса. 0 – успешно. В случае ошибки возвращается код ошибки.'),
  error_note: z.string().describe('Описание кода завершения платежа.'),
});
