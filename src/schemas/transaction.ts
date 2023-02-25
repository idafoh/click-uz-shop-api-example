import z from 'zod';

export const TRANSACTION_REQUEST_SCHEMA = z.object({
  first_name: z.string().describe('First name of the customer'),
  last_name: z.string().describe('Last name of the customer'),
  phone: z.string().describe('Phone number of the customer'),
  product_id: z.number().int().describe('ID of the product'),
});

export const TRANSACTION_200_RESPONSE_SCHEMA = z.object({
  transaction_id: z.number().int().describe('ID of the transaction'),
  user_id: z.number().int().describe('ID of the user'),
  amount: z.number().describe('Amount of the transaction'),
});

export const TRANSACTION_400_RESPONSE_SCHEMA = z.object({
  error: z.number().int().negative().describe('Error code'),
  error_note: z.string().describe('Error note'),
});
