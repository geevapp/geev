import { Prisma, PrismaClient } from '@prisma/client';

import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
export const prisma = new PrismaClient({ adapter });

// Test connection
export async function testConnection () {
  try {
    await prisma.$connect();
    return true;
  } catch (error) {
    return false;
  }
}



// Adds a withCount method to Prisma models for Laravel-like withCount functionality
type CountProperty<K extends string> = `count${Capitalize<K>}`;
type FlattenWithCount<T, K extends string> = Omit<T, '_count'> & {
  [P in K as CountProperty<P>]: number;
};

const toCountProperty = <K extends string> (relation: K): CountProperty<K> => {
  return `count${relation.charAt(0).toUpperCase()}${relation.slice(1)}` as CountProperty<K>;
};

export const withCountExtension = Prisma.defineExtension({
  name: "withCount",

  model: {
    $allModels: {
      withCount<TModel, const TRelations extends readonly string[]> (this: TModel, relations: TRelations) {
        const model = Prisma.getExtensionContext(this) as unknown as {
          findMany: (args?: Prisma.Args<TModel, 'findMany'>) => Promise<Prisma.Result<TModel, Prisma.Args<TModel, 'findMany'>, 'findMany'>>;
          findUnique: (args: Prisma.Args<TModel, 'findUnique'>) => Promise<Prisma.Result<TModel, Prisma.Args<TModel, 'findUnique'>, 'findUnique'>>;
          findFirst: (args?: Prisma.Args<TModel, 'findFirst'>) => Promise<Prisma.Result<TModel, Prisma.Args<TModel, 'findFirst'>, 'findFirst'>>;
          findUniqueOrThrow: (args: Prisma.Args<TModel, 'findUniqueOrThrow'>) => Promise<Prisma.Result<TModel, Prisma.Args<TModel, 'findUniqueOrThrow'>, 'findUniqueOrThrow'>>;
          findFirstOrThrow: (args?: Prisma.Args<TModel, 'findFirstOrThrow'>) => Promise<Prisma.Result<TModel, Prisma.Args<TModel, 'findFirstOrThrow'>, 'findFirstOrThrow'>>;
        };

        const select = relations.reduce<Record<string, true>>((acc, relation) => {
          acc[relation] = true;
          return acc;
        }, {});

        const flattenRow = <TRow extends Record<string, unknown> | null> (row: TRow): TRow extends null
          ? null
          : FlattenWithCount<Exclude<TRow, null>, TRelations[number]> => {
          if (!row) {
            return null as TRow extends null ? null : FlattenWithCount<Exclude<TRow, null>, TRelations[number]>;
          }

          const countSource = ((row as Record<string, unknown>)._count ?? {}) as Record<string, number>;
          const rest = { ...(row as Record<string, unknown>) };
          delete rest._count;

          for (const relation of relations) {
            const key = toCountProperty(relation);
            rest[key] = countSource[relation] ?? 0;
          }

          return rest as TRow extends null
            ? null
            : FlattenWithCount<Exclude<TRow, null>, TRelations[number]>;
        };

        const withMergedCountInclude = <TInclude extends Record<string, unknown> | undefined> (include: TInclude) => {
          const existingCount = (
            include && typeof include === 'object' && '_count' in include
              ? (include as Record<string, unknown>)._count
              : undefined
          ) as { select?: Record<string, boolean> } | undefined;

          return {
            ...(include ?? {}),
            _count: {
              ...(existingCount ?? {}),
              select: {
                ...(existingCount?.select ?? {}),
                ...select,
              },
            },
          };
        };

        return {
          async findMany<TArgs extends Prisma.Args<TModel, 'findMany'>> (
            args?: Prisma.Exact<TArgs, Prisma.Args<TModel, 'findMany'>>
          ): Promise<FlattenWithCount<Prisma.Result<TModel, TArgs, 'findMany'>[number], TRelations[number]>[]> {
            const result = await model.findMany({
              ...args,
              include: withMergedCountInclude((args as { include?: Record<string, unknown> } | undefined)?.include),
            } as Prisma.Args<TModel, 'findMany'>);

            return (result as Record<string, unknown>[]).map((row) => flattenRow(row));
          },

          async findUnique<TArgs extends Prisma.Args<TModel, 'findUnique'>> (
            args: Prisma.Exact<TArgs, Prisma.Args<TModel, 'findUnique'>>
          ): Promise<FlattenWithCount<Prisma.Result<TModel, TArgs, 'findUnique'>, TRelations[number]> | null> {
            const result = await model.findUnique({
              ...args,
              include: withMergedCountInclude((args as { include?: Record<string, unknown> }).include),
            } as Prisma.Args<TModel, 'findUnique'>);

            return flattenRow(result as Record<string, unknown> | null) as FlattenWithCount<
              Prisma.Result<TModel, TArgs, 'findUnique'>,
              TRelations[number]
            > | null;
          },

          async findFirst<TArgs extends Prisma.Args<TModel, 'findFirst'>> (
            args?: Prisma.Exact<TArgs, Prisma.Args<TModel, 'findFirst'>>
          ): Promise<FlattenWithCount<Prisma.Result<TModel, TArgs, 'findFirst'>, TRelations[number]> | null> {
            const result = await model.findFirst({
              ...args,
              include: withMergedCountInclude((args as { include?: Record<string, unknown> } | undefined)?.include),
            } as Prisma.Args<TModel, 'findFirst'>);

            return flattenRow(result as Record<string, unknown> | null) as FlattenWithCount<
              Prisma.Result<TModel, TArgs, 'findFirst'>,
              TRelations[number]
            > | null;
          },

          async findUniqueOrThrow<TArgs extends Prisma.Args<TModel, 'findUniqueOrThrow'>> (
            args: Prisma.Exact<TArgs, Prisma.Args<TModel, 'findUniqueOrThrow'>>
          ): Promise<FlattenWithCount<Prisma.Result<TModel, TArgs, 'findUniqueOrThrow'>, TRelations[number]>> {
            const result = await model.findUniqueOrThrow({
              ...args,
              include: withMergedCountInclude((args as { include?: Record<string, unknown> }).include),
            } as Prisma.Args<TModel, 'findUniqueOrThrow'>);

            return flattenRow(result as Record<string, unknown>) as FlattenWithCount<
              Prisma.Result<TModel, TArgs, 'findUniqueOrThrow'>,
              TRelations[number]
            >;
          },

          async findFirstOrThrow<TArgs extends Prisma.Args<TModel, 'findFirstOrThrow'>> (
            args?: Prisma.Exact<TArgs, Prisma.Args<TModel, 'findFirstOrThrow'>>
          ): Promise<FlattenWithCount<Prisma.Result<TModel, TArgs, 'findFirstOrThrow'>, TRelations[number]>> {
            const result = await model.findFirstOrThrow({
              ...args,
              include: withMergedCountInclude((args as { include?: Record<string, unknown> } | undefined)?.include),
            } as Prisma.Args<TModel, 'findFirstOrThrow'>);

            return flattenRow(result as Record<string, unknown>) as FlattenWithCount<
              Prisma.Result<TModel, TArgs, 'findFirstOrThrow'>,
              TRelations[number]
            >;
          }
        };
      }
    }
  }
});

export const prismaExtended = prisma.$extends(withCountExtension);