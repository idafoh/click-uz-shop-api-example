import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

const productData: Prisma.ProductCreateInput[] = [
  {
    city: 'Tashkent',
    country: 'Uzbekistan',
    price: 500,
  },
  {
    city: 'New York',
    country: 'USA',
    price: 20_000_000,
  },
  {
    city: 'Paris',
    country: 'France',
    price: 12_000_000,
  },
  {
    city: 'Berlin',
    country: 'Germany',
    price: 9_000_000,
  },
];

const userData: Prisma.UserCreateInput[] = [
  {
    first_name: 'Alice',
    last_name: 'Smith',
    phone: '+998901234567',
  },
  {
    first_name: 'Bob',
    last_name: 'Smith',
    phone: '+998991234567',
  },
];

const transactionData: Prisma.TransactionCreateInput[] = [
  {
    product: {
      connect: { id: 1 },
    },
    user: {
      connect: { id: 1 },
    },
  },
];

async function main() {
  console.log(`Start seeding ...`);

  for (const u of userData) {
    const user = await prisma.user.create({ data: u });
    console.log(`Created user with id: ${user.id}`);
  }

  for (const p of productData) {
    const product = await prisma.product.create({ data: p });
    console.log(`Created product with id: ${product.id}`);
  }

  for (const t of transactionData) {
    const transaction = await prisma.transaction.create({ data: t });
    console.log(`Created transaction with id: ${transaction.id}`);
  }

  console.log(`Seeding finished.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
