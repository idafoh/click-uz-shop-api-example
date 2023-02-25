import 'dotenv/config';
import fastify from 'fastify';
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from 'fastify-type-provider-zod';
import { PrismaClient } from '@prisma/client';
import fastifyFormbody from '@fastify/formbody';
import qs from 'qs';

import { ENV_SCHEMA } from './schemas/env';
import {
  COMPLETE_REQUEST_SCHEMA,
  COMPLETE_RESPONSE_SCHEMA,
} from './schemas/complete';
import {
  PREPARE_REQUEST_SCHEMA,
  PREPARE_RESPONSE_SCHEMA,
} from './schemas/prepare';
import {
  TRANSACTION_REQUEST_SCHEMA,
  TRANSACTION_200_RESPONSE_SCHEMA,
  TRANSACTION_400_RESPONSE_SCHEMA,
} from './schemas/transaction';
import checkSign from './utils/checkSign';

const prisma = new PrismaClient();
const app = fastify({ logger: false });

app.register(fastifyFormbody, {
  parser: string => qs.parse(string, {
    decoder(str, decoder) {
      // Check if string is a number
      if (/^-?(\d+|\d*\.\d+)$/.test(str)) {
        return parseFloat(str);
      }

      return decoder(str);
    }
  }),
});

// @ts-nocheck
// app.addHook('onSend', (req, reply, payload, next) => {
//   console.log(payload);
//   next();
// });

// Add schema validator and serializer
app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

// Prepare route
app.withTypeProvider<ZodTypeProvider>().route({
  method: 'POST',
  url: '/prepare',
  schema: {
    body: PREPARE_REQUEST_SCHEMA,
    response: {
      200: PREPARE_RESPONSE_SCHEMA,
    },
  },
  handler: async (req, res) => {
    const { body } = req;

    const isValid = checkSign({
      click_trans_id: body.click_trans_id,
      service_id: body.service_id,
      secret_key: process.env.SECRET_KEY,
      merchant_trans_id: body.merchant_trans_id.toString(),
      amount: body.amount,
      action: 0,
      sign_time: body.sign_time,
    }, body.sign_string);

    if (!isValid) {
      return res.send({
        click_trans_id: 0,
        merchant_trans_id: '0',
        merchant_prepare_id: 0,
        error: -1,
        error_note: 'SIGN CHECK FAILED!',
      });
    }

    const transaction_id = typeof body.merchant_trans_id === 'number' ? body.merchant_trans_id : parseInt(body.merchant_trans_id);
    const transaction = await prisma.transaction.findUnique({
      where: { id: transaction_id },
      include: {
        product: {
          select: { price: true }
        },
      },
    });

    if (!transaction) {
      return res.send({
        click_trans_id: 0,
        merchant_trans_id: '0',
        merchant_prepare_id: 0,
        error: -6,
        error_note: 'Transaction does not exist',
      });
    }

    if (body.amount !== transaction.product.price) {
      return res.send({
        click_trans_id: 0,
        merchant_trans_id: '0',
        merchant_prepare_id: 0,
        error: -2,
        error_note: 'Incorrect parameter amount',
      });
    }

    try {
      await prisma.transaction.update({
        where: { id: transaction_id },
        data: {
          click_trans_id: body.click_trans_id,
          sign_time: body.sign_time,
          amount: body.amount,
        },
      });
    } catch (err) {
      return res.send({
        click_trans_id: 0,
        merchant_trans_id: '0',
        merchant_prepare_id: 0,
        error: -7,
        error_note: 'Failed to update transaction',
      });
    }

    return res.send({
      click_trans_id: body.click_trans_id,
      merchant_trans_id: body.merchant_trans_id.toString(),
      merchant_prepare_id: transaction.id,
      error: 0,
      error_note: 'Success',
    });
  },
});

// Complete route
app.withTypeProvider<ZodTypeProvider>().route({
  method: 'POST',
  url: '/complete',
  schema: {
    body: COMPLETE_REQUEST_SCHEMA,
    response: {
      200: COMPLETE_RESPONSE_SCHEMA,
    },
  },
  handler: async (req, res) => {
    const { body } = req;

    if (body.error < 0) {
      return res.send({
        click_trans_id: 0,
        merchant_trans_id: '0',
        merchant_confirm_id: 0,
        error: body.error === -1 ? -4 : -9,
        error_note: 'Click error',
      });
    }

    const isValid = checkSign({
      click_trans_id: body.click_trans_id,
      service_id: body.service_id,
      secret_key: process.env.SECRET_KEY,
      merchant_trans_id: body.merchant_trans_id.toString(),
      merchant_prepare_id: body.merchant_prepare_id,
      amount: body.amount,
      action: 1,
      sign_time: body.sign_time,
    }, body.sign_string);

    if (!isValid) {
      return res.send({
        click_trans_id: 0,
        merchant_trans_id: '0',
        merchant_confirm_id: 0,
        error: -1,
        error_note: 'SIGN CHECK FAILED!',
      });
    }

    const transaction_id = typeof body.merchant_trans_id === 'number' ? body.merchant_trans_id : parseInt(body.merchant_trans_id);;
    const transactionExists = await prisma.transaction.findUnique({
      where: { id: transaction_id },
      include: {
        product: {
          select: { price: true },
        },
      },
    });

    if (!transactionExists) {
      return res.send({
        click_trans_id: 0,
        merchant_trans_id: '0',
        merchant_confirm_id: 0,
        error: -6,
        error_note: 'Transaction does not exist',
      });
    }

    if (transactionExists.paid) {
      return res.send({
        click_trans_id: 0,
        merchant_trans_id: '0',
        merchant_confirm_id: 0,
        error: -4,
        error_note: 'Transaction already paid',
      });
    }

    if (body.amount !== transactionExists.product.price) {
      return res.send({
        click_trans_id: 0,
        merchant_trans_id: '0',
        merchant_confirm_id: 0,
        error: -2,
        error_note: 'Incorrect parameter amount',
      });
    }

    try {
      await prisma.transaction.update({
        where: { id: transaction_id },
        data: { paid: true },
      });
    } catch (err) {
      return res.send({
        click_trans_id: 0,
        merchant_trans_id: '0',
        merchant_confirm_id: 0,
        error: -7,
        error_note: 'Failed to update transaction',
      });
    }

    return res.send({
      click_trans_id: body.click_trans_id,
      merchant_trans_id: body.merchant_trans_id.toString(),
      merchant_confirm_id: 0,
      error: 0,
      error_note: 'Success',
    });
  },
});

// Transaction route
app.withTypeProvider<ZodTypeProvider>().route({
  method: 'POST',
  url: '/transactions',
  schema: {
    body: TRANSACTION_REQUEST_SCHEMA,
    response: {
      200: TRANSACTION_200_RESPONSE_SCHEMA,
      400: TRANSACTION_400_RESPONSE_SCHEMA,
    },
  },
  handler: async (req, res) => {
    const { body } = req;
    const product = await prisma.product.findUnique({
      where: { id: body.product_id },
      select: { id: true, price: true },
    });

    if (!product) {
      res.status(400).send({
        error: -1,
        error_note: 'Product not found',
      });
      return;
    }

    let user = await prisma.user.findUnique({
      where: { phone: body.phone },
      select: { id: true },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          first_name: body.first_name,
          last_name: body.last_name,
          phone: body.phone,
        },
        select: { id: true },
      });
    }

    const transaction = await prisma.transaction.create({
      data: {
        user_id: user.id,
        product_id: product.id,
      },
      select: { id: true },
    });

    return res.send({
      transaction_id: transaction.id,
      user_id: user.id,
      amount: product.price,
    });
  },
});

async function run() {
  await app.ready();
  await app.listen({ port: 8000 });

  ENV_SCHEMA.parse(process.env);

  console.log('🚀 Server ready at: http://localhost:8000');
}

run().catch(async (err) => {
  await prisma.$disconnect();
  console.error(err);
  process.exit(1);
});
